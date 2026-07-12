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
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
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
    
    const uid = decodedToken.uid;
    const { action, amount, cost } = req.body;
    
    if (!action) return res.status(400).json({ error: 'Falta action' });

    // Validación CRÍTICA contra números negativos (Evita exploit de restar negativos para sumar)
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({ error: 'El monto debe ser un número positivo mayor a 0' });
    }
    if (cost !== undefined && (typeof cost !== 'number' || cost <= 0)) {
      return res.status(400).json({ error: 'El costo debe ser un número positivo mayor a 0' });
    }

    const userRef = admin.database().ref(`users/${uid}`);
    
    // Transacción atómica para evitar condiciones de carrera
    await userRef.transaction((user) => {
      if (user === null) return null;
      
      let wallet = user.wallet || 0;
      let points = user.points || 0;
      
      if (action === 'purchase') {
        if (wallet < amount) {
          throw new Error('Saldo insuficiente');
        }
        user.wallet = wallet - amount;
      } 
      else if (action === 'redeem') {
        if (points < cost) {
          throw new Error('Puntos insuficientes');
        }
        user.points = points - cost;
        user.wallet = wallet + amount;
      }
      else if (action === 'cashback') {
        user.wallet = wallet + amount;
      }
      else if (action === 'cashout') {
        if (points < amount) {
          throw new Error('Puntos insuficientes para retirar');
        }
        user.points = points - amount;
      }
      else {
        throw new Error('Acción inválida');
      }
      
      return user;
    });

    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error("Wallet API Error:", error);
    if (error.message === 'Saldo insuficiente' || error.message === 'Puntos insuficientes') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error procesando la transacción financiera' });
  }
}
