export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { type, text, inlineKeyboard, photoBase64, botToken, chatId } = req.body;
    
    if (!botToken || !chatId) {
      return res.status(400).json({ error: "Faltan credenciales de Telegram." });
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
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
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

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    }
    
    return res.status(400).json({ error: "Tipo de mensaje no soportado." });

  } catch (error) {
    console.error("Telegram proxy error:", error);
    return res.status(500).json({ error: "Error interno procesando envío a Telegram." });
  }
}
