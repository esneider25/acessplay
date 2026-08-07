import admin from 'firebase-admin';
import crypto from 'crypto';

// Initialize Firebase Admin securely
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "accesplay-8bf5d.firebasestorage.app"
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

export default async function handler(req, res) {
  // Rate Limiting
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  if (!global.rateLimitUpload) global.rateLimitUpload = new Map();
  const rateLimit = global.rateLimitUpload;
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional Auth Verification (allow guests but verify if token provided)
  const authHeader = req.headers.authorization;
  let decodedToken = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.warn("Invalid token in upload", error);
      // We don't fail here because we want to allow guest uploads anyway
      // return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  }

  try {
    const { imageBase64, path } = req.body;
    if (!imageBase64 || !path) {
      return res.status(400).json({ error: 'Faltan datos de la imagen.' });
    }

    if (imageBase64.length > 5 * 1024 * 1024) { // Roughly 5MB in base64
      return res.status(400).json({ error: 'La imagen es demasiado grande.' });
    }

    if (!path.startsWith('orders_screenshots/') && !path.startsWith('settings/')) {
      return res.status(400).json({ error: 'Ruta de subida no permitida.' });
    }

    if (!admin.apps.length) {
      return res.status(500).json({ error: "Firebase Admin no configurado en Vercel." });
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(path);

    // Limpiar el encabezado Base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const downloadToken = crypto.randomUUID();

    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken
        }
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

    return res.status(200).json({ url: publicUrl });

  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
