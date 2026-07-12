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
    let bodyObj = req.body;
    if (typeof bodyObj === 'string') {
      try { bodyObj = JSON.parse(bodyObj); } catch (e) {}
    }

    let { order, screenshotBase64, siteOrigin } = bodyObj || {};

    if (!order || !order.id) {
      return res.status(400).json({ error: 'Datos de orden inválidos.' });
    }

    // Leemos el token desde las variables de entorno seguras de Vercel
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'Telegram disabled or not configured' });
    }

    // ── Build Telegram message (server-side replica of buildOrderTelegramMessage) ──
    const msgText = buildMessage(order);
    const adminOrigin = siteOrigin || 'https://admin.accesplay.com';
    const keyboard = buildKeyboard(order.id, adminOrigin);

    // ── Send notification with retries ──
    let sent = false;
    let lastError = null;

    // Vercel Hobby plan = 10s timeout. 3 intentos rápidos caben perfecto.
    // Intento 1: inmediato (~1-2s)
    // Intento 2: espera 1s + envío (~2-3s)  
    // Intento 3: espera 2s + envío (~3-4s)
    // Total peor caso: ~8s (dentro del límite de 10s)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (screenshotBase64) {
          sent = await sendPhoto(botToken, chatId, screenshotBase64, msgText, keyboard);
        } else {
          sent = await sendMessage(botToken, chatId, msgText, keyboard);
        }

        if (sent) break;
      } catch (e) {
        lastError = e;
        console.error(`Telegram attempt ${attempt}/3 failed:`, e.message);
        if (attempt < 3) {
          await sleep(attempt * 1000);
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

function escapeHtml(text) {
  if (typeof text !== 'string') return text || '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMessage(order) {
  let msg = `🤖 <b>NUEVO PEDIDO — ${order.id}</b>\n`;
  msg += `👤 <b>Jugador:</b> ${escapeHtml(order.playerName) || 'ㅤ'}\n`;
  msg += `🆔 <b>ID:</b> <code>${escapeHtml(order.gameId) || escapeHtml(order.accountEmail) || 'N/A'}</code>\n`;
  msg += `🔥 <b>Producto:</b> ${escapeHtml(order.productName)} (${escapeHtml(order.packageLabel)})\n`;
  msg += `💰 <b>Monto:</b> $${parseFloat(order.priceUsd).toFixed(2)} USD | Bs. ${formatBs(order.priceBs)}\n`;

  if (order.discountCode) {
    const discountStr = order.discountType === 'percentage'
      ? `${order.discountValue}%`
      : `$${parseFloat(order.discountValue).toFixed(2)} USD`;
    msg += `🎁 <b>Descuento:</b> ${escapeHtml(order.discountCode)} (-${discountStr})\n`;
  }

  const refNumbers = (order.ocrNumbers && order.ocrNumbers.length > 0) ? order.ocrNumbers.join(', ') : 'Ver comprobante adjunto';
  msg += `🔢 <b>Ref:</b> <code>${escapeHtml(refNumbers)}</code>\n`;

  msg += `🏦 <b>metodo de pago:</b> ${escapeHtml(order.paymentMethodName)}\n`;
  msg += `📱 <b>contacto:</b> ${escapeHtml(order.customerContact) || 'N/A'}\n`;
  return msg;
}

function buildKeyboard(orderId, origin) {
  return [
    [
      { text: '✅ Aprobar', callback_data: `approve_${orderId}` },
      { text: '❌ Rechazar', callback_data: `reject_${orderId}` }
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
