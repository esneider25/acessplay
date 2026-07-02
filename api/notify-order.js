export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order, screenshotBase64, siteOrigin } = req.body;

    if (!order || !order.id) {
      return res.status(400).json({ error: 'Datos de orden inválidos.' });
    }

    // ── Fetch Telegram config from Firebase ──
    const FIREBASE_DB_URL = 'https://accesplay-8bf5d-default-rtdb.firebaseio.com';
    
    const configRes = await fetch(`${FIREBASE_DB_URL}/telegram_config.json`);
    const telegramConfig = await configRes.json();

    if (!telegramConfig || !telegramConfig.enabled || !telegramConfig.botToken || !telegramConfig.chatId) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'Telegram disabled or not configured' });
    }

    const { botToken, chatId } = telegramConfig;

    // ── Build Telegram message (server-side replica of buildOrderTelegramMessage) ──
    const msgText = buildMessage(order);
    const adminOrigin = siteOrigin || 'https://admin.accesplay.com';
    const keyboard = buildKeyboard(order.id, adminOrigin);

    // ── Send notification with retries ──
    let sent = false;
    let lastError = null;

    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        if (screenshotBase64) {
          sent = await sendPhoto(botToken, chatId, screenshotBase64, msgText, keyboard);
        } else {
          sent = await sendMessage(botToken, chatId, msgText, keyboard);
        }

        if (sent) break;
      } catch (e) {
        lastError = e;
        console.error(`Telegram attempt ${attempt}/10 failed:`, e.message);
        // Wait before retry with incremental delay, capped at 5s
        if (attempt < 10) {
          await sleep(Math.min(attempt * 1000, 5000));
        }
      }
    }

    if (!sent) {
      console.error('All Telegram retry attempts failed for order:', order.id, lastError?.message);
      // Still return 200 — the order is already saved in Firebase
      return res.status(200).json({ ok: false, error: 'Telegram delivery failed after retries', orderId: order.id });
    }

    return res.status(200).json({ ok: true, orderId: order.id });

  } catch (error) {
    console.error('notify-order error:', error);
    return res.status(500).json({ error: 'Error interno procesando notificación.' });
  }
}

// ── Helper Functions ──

const sleep = ms => new Promise(r => setTimeout(r, ms));

function formatBs(amount) {
  return parseFloat(amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildMessage(order) {
  let msg = `🤖 <b>NUEVO PEDIDO — ${order.id}</b>\n`;
  msg += `👤 <b>Jugador:</b> ${order.playerName || 'ㅤ'}\n`;
  msg += `🆔 <b>ID:</b> <code>${order.gameId || order.accountEmail || 'N/A'}</code>\n`;
  msg += `🔥 <b>Producto:</b> ${order.productName} (${order.packageLabel})\n`;
  msg += `💰 <b>Monto:</b> $${parseFloat(order.priceUsd).toFixed(2)} USD | Bs. ${formatBs(order.priceBs)}\n`;

  if (order.discountCode) {
    const discountStr = order.discountType === 'percentage'
      ? `${order.discountValue}%`
      : `$${parseFloat(order.discountValue).toFixed(2)} USD`;
    msg += `🎁 <b>Descuento:</b> ${order.discountCode} (-${discountStr})\n`;
  }

  const refNumbers = (order.ocrNumbers && order.ocrNumbers.length > 0) ? order.ocrNumbers.join(', ') : 'Ver comprobante adjunto';
  msg += `🔢 <b>Ref:</b> <code>${refNumbers}</code>\n`;

  msg += `🏦 <b>metodo de pago:</b> ${order.paymentMethodName}\n`;
  msg += `📱 <b>contacto:</b> ${order.customerContact || 'N/A'}\n`;
  return msg;
}

function buildKeyboard(orderId, origin) {
  return [
    [
      { text: '✅ Aprobar', url: `${origin}/admin.html?action=approve&order=${orderId}` },
      { text: '❌ Rechazar', url: `${origin}/admin.html?action=reject&order=${orderId}` }
    ],
    [
      { text: '🔍 Ver en Panel Admin', url: `${origin}/admin.html` }
    ]
  ];
}

async function sendMessage(botToken, chatId, text, inlineKeyboard) {
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };
  if (inlineKeyboard) {
    body.reply_markup = { inline_keyboard: inlineKeyboard };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  // Handle 429 rate limit
  if (response.status === 429) {
    const retryAfter = (data.parameters && data.parameters.retry_after) ? data.parameters.retry_after * 1000 : 3000;
    if (retryAfter <= 7000) {
      await sleep(retryAfter + 100);
      const retryRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const retryData = await retryRes.json();
      return retryData.ok === true;
    }
  }

  return data.ok === true;
}

async function sendPhoto(botToken, chatId, photoBase64, caption, inlineKeyboard) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('caption', caption || '');
  formData.append('parse_mode', 'HTML');

  if (inlineKeyboard) {
    formData.append('reply_markup', JSON.stringify({ inline_keyboard: inlineKeyboard }));
  }

  const buffer = Buffer.from(photoBase64, 'base64');
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  formData.append('photo', blob, 'comprobante.jpg');

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  // Handle 429 rate limit
  if (response.status === 429) {
    const retryAfter = (data.parameters && data.parameters.retry_after) ? data.parameters.retry_after * 1000 : 3000;
    if (retryAfter <= 7000) {
      await sleep(retryAfter + 100);
      const retryFormData = new FormData();
      retryFormData.append('chat_id', chatId);
      retryFormData.append('caption', caption || '');
      retryFormData.append('parse_mode', 'HTML');
      if (inlineKeyboard) {
        retryFormData.append('reply_markup', JSON.stringify({ inline_keyboard: inlineKeyboard }));
      }
      const retryBuffer = Buffer.from(photoBase64, 'base64');
      const retryBlob = new Blob([retryBuffer], { type: 'image/jpeg' });
      retryFormData.append('photo', retryBlob, 'comprobante.jpg');

      const retryRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: retryFormData
      });
      const retryData = await retryRes.json();
      return retryData.ok === true;
    }
  }

  return data.ok === true;
}
