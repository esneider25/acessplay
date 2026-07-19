export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
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
  const providedSecret = req.headers['x-api-secret'] || req.body?.apiSecret;
  if (apiSecret && providedSecret !== apiSecret) {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  try {
    const { type, text, inlineKeyboard, photoBase64 } = req.body;
    
    // El token (primero intenta variables de entorno, luego el body)
    const botToken = process.env.TELEGRAM_BOT_TOKEN || req.body?.botToken;
    const chatId = process.env.TELEGRAM_CHAT_ID || req.body?.chatId;

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
      const body = {
        chat_id: chatId,
        text: text,
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
      // Use native Node 18+ FormData
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('caption', text || '');
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
