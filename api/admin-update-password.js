import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://accesplay-8bf5d-default-rtdb.firebaseio.com"
    });
  } catch (error) {
    console.error("Firebase Admin Error:", error);
  }
}

export default async function handler(req, res) {
  // Rate Limiting
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  if (!global.rateLimitAdminUpdate) global.rateLimitAdminUpdate = new Map();
  const rateLimit = global.rateLimitAdminUpdate;
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

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Falta Token de Autenticación' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Verify Admin rights
    const callerEmail = decodedToken.email || '';
    const userSnap = await admin.database().ref(`users/${decodedToken.uid}`).once('value');
    const userData = userSnap.val() || {};

    const isAdmin = callerEmail === 'admin@accesplay.com' || userData.role === 'admin';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Acceso denegado: Requiere permisos de administrador' });
    }

    const { targetUid, newPassword } = req.body;
    if (!targetUid || typeof targetUid !== 'string') {
      return res.status(400).json({ error: 'ID de usuario (targetUid) requerido' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // 1. Update Firebase Authentication password
    await admin.auth().updateUser(targetUid, {
      password: newPassword
    });

    // (Password is intentionally NOT saved in Realtime Database for security reasons)

    return res.status(200).json({ success: true, message: 'Contraseña actualizada con éxito' });

  } catch (error) {
    console.error("Admin Update Password Error:", error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'El usuario no fue encontrado en Firebase Authentication.' });
    }
    return res.status(500).json({ error: error.message || 'Error al actualizar la contraseña' });
  }
}
