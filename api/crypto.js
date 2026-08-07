import admin from 'firebase-admin';
import crypto from 'crypto';

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

// Ensure you set ORDER_PASSWORD_SECRET in Vercel to a 32-byte hex string (64 characters)
const getSecretKey = () => {
  const secret = process.env.ORDER_PASSWORD_SECRET || '12345678901234567890123456789012'; // Fallback for dev ONLY.
  // Ensure the secret is exactly 32 bytes for AES-256
  if (secret.length === 32) return Buffer.from(secret, 'utf-8');
  if (secret.length === 64) return Buffer.from(secret, 'hex');
  
  // Hash to 32 bytes if it doesn't match
  return crypto.createHash('sha256').update(secret).digest();
};

const ENCRYPTION_KEY = getSecretKey();
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length < 2) return text; // Not encrypted with our scheme
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error("Decryption failed:", e.message);
    return text; // Return original if decryption fails (e.g. not encrypted)
  }
}

export default async function handler(req, res) {
  // CORS
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
    const { action, payload } = req.body;
    
    if (action === 'encrypt') {
      // Anyone can encrypt a password to place an order
      const encrypted = encrypt(payload);
      return res.status(200).json({ result: encrypted });
    } 
    
    if (action === 'decrypt') {
      // ONLY ADMIN can decrypt
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Falta Token de Autenticación' });
      }
      
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userSnap = await admin.database().ref(`users/${decodedToken.uid}`).once('value');
      const userData = userSnap.val() || {};

      if (decodedToken.email !== 'admin@accesplay.com' && userData.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
      
      const decrypted = decrypt(payload);
      return res.status(200).json({ result: decrypted });
    }

    return res.status(400).json({ error: 'Invalid action' });
    
  } catch (error) {
    console.error("Crypto API Error:", error);
    return res.status(500).json({ error: 'Error procesando solicitud' });
  }
}
