export default async function handler(req, res) {
  // Rate Limiting
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  if (!global.rateLimitTelegram) global.rateLimitTelegram = new Map();
  const rateLimit = global.rateLimitTelegram;
  const RATE_LIMIT_WINDOW = 60000;
  const MAX_REQUESTS = 10;
  
  if (rateLimit.has(ip)) {
    const data = rateLimit.get(ip);
    if (now - data.startTime > RATE_LIMIT_WINDOW) {
      rateLimit.set(ip, { count: 1, startTime: now });
    } else {
      data.count++;
      if (data.count > MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
      }
      rateLimit.set(ip, data);
    }
  } else {
    rateLimit.set(ip, { count: 1, startTime: now });
  }

  // Cleanup old entries
  if (Math.random() < 0.05) {
    for (const [key, value] of rateLimit.entries()) {
      if (now - value.startTime > RATE_LIMIT_WINDOW) rateLimit.delete(key);
    }
  }

  // Allow CORS securely
  res.setHeader('Access-Control-Allow-Credentials', true);
  const origin = req.headers.origin;
  const allowedOrigins = ['https://accesplay.com', 'https://admin.accesplay.com', 'http://localhost:3000', 'http://127.0.0.1:3000'];
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://accesplay.com');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-API-Secret'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Verificar clave secreta de API para evitar spam externo ──
  const apiSecret = process.env.TELEGRAM_API_SECRET;
  const providedSecret = req.headers['x-api-secret'] || (req.body && req.body.apiSecret);
  // Ensure we always require the secret if we want to be secure, or at least if it's set.
  if (apiSecret && providedSecret !== apiSecret) {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  try {
    const { type, text, inlineKeyboard, photoBase64 } = req.body;
    
    // Only use environment variables for tokens to prevent exploitation
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({ error: "Credenciales de Telegram no configuradas en el servidor." });
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    async function fetchWithRetry(url, options) {
      let response = await fetch(url, options);
      let data = await response.json();

      // Handle Telegram 429 Rate Limit
      if (response.status === 429) {
        const retryAfter = (data.parameters && data.parameters.retry_after) ? data.parameters.retry_after * 1000 : 3000;
        console.warn(`Telegram 429: Retrying after ${retryAfter}ms`);
        // We wait up to 7 seconds max to avoid Vercel Function timeouts
        if (retryAfter <= 7000) {
          await sleep(retryAfter + 100);
          response = await fetch(url, options);
          data = await response.json();
        }
      }
      return { response, data };
    }

    if (type === 'message') {
      // Fix para Telegram HTML: Telegram no soporta &#39; ni &quot; en el parse_mode HTML
      let safeText = text ? text.replace(/&#39;/g, "'").replace(/&quot;/g, '"') : '';
      
      const body = {
        chat_id: chatId,
        text: safeText,
        parse_mode: 'HTML'
      };
      if (inlineKeyboard) {
        body.reply_markup = { inline_keyboard: inlineKeyboard };
      }

      const { response, data } = await fetchWithRetry(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return res.status(response.status).json(data);
    }

    else if (type === 'photo') {
      // Fix para Telegram HTML: Telegram no soporta &#39; ni &quot; en el parse_mode HTML
      let safeCaption = text ? text.replace(/&#39;/g, "'").replace(/&quot;/g, '"') : '';
      
      // Use native Node 18+ FormData
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('caption', safeCaption);
      formData.append('parse_mode', 'HTML');

      if (inlineKeyboard) {
        formData.append('reply_markup', JSON.stringify({ inline_keyboard: inlineKeyboard }));
      }

      if (photoBase64) {
        const buffer = Buffer.from(photoBase64, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        formData.append('photo', blob, 'comprobante.jpg');
      }

      const { response, data } = await fetchWithRetry(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: formData
      });
      return res.status(response.status).json(data);
    }

    return res.status(400).json({ error: "Tipo de mensaje no soportado." });

  } catch (error) {
    console.error("Telegram proxy error:", error);
    return res.status(500).json({ error: "Error interno procesando envío a Telegram." });
  }
}
