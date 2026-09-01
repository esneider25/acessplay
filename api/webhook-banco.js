import admin from 'firebase-admin';

// Initialize Firebase Admin securely (shared with other api/ files)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://accesplay-8bf5d-default-rtdb.firebaseio.com"
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export default async function handler(req, res) {
  // ── Rate Limiting ──
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  if (!global.rateLimitBanco) global.rateLimitBanco = new Map();
  const rateLimit = global.rateLimitBanco;
  const RATE_LIMIT_WINDOW = 60000;
  const MAX_REQUESTS = 30;

  if (rateLimit.has(ip)) {
    const data = rateLimit.get(ip);
    if (now - data.startTime > RATE_LIMIT_WINDOW) {
      rateLimit.set(ip, { count: 1, startTime: now });
    } else {
      data.count++;
      if (data.count > MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests' });
      }
      rateLimit.set(ip, data);
    }
  } else {
    rateLimit.set(ip, { count: 1, startTime: now });
  }

  // Cleanup old entries occasionally
  if (Math.random() < 0.05) {
    for (const [key, value] of rateLimit.entries()) {
      if (now - value.startTime > RATE_LIMIT_WINDOW) rateLimit.delete(key);
    }
  }

  // ── CORS ──
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

    const { title, text, secret } = bodyObj || {};

    // ── Validate secret ──
    const expectedSecret = process.env.WEBHOOK_BANCO_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    if (!text) {
      return res.status(400).json({ error: 'Falta el campo "text"' });
    }

    // ── Write to Firebase for robot_tiendas to pick up ──
    const db = admin.database();
    const ref = db.ref('bank_notifications').push();
    await ref.set({
      title: title || '',
      text: text || '',
      receivedAt: now,
      processed: false
    });

    console.log(`✅ Bank notification saved: ${ref.key}`);
    return res.status(200).json({ ok: true, id: ref.key });

  } catch (error) {
    console.error('webhook-banco error:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}
