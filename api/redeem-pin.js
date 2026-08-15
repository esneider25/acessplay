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

function generateOrderRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'AP-';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req, res) {
  // Rate Limiting
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  if (!global.rateLimitPins) global.rateLimitPins = new Map();
  const rateLimit = global.rateLimitPins;
  const RATE_LIMIT_WINDOW = 60000;
  const MAX_REQUESTS = 5; // 5 attempts per minute per IP
  
  if (rateLimit.has(ip)) {
    const data = rateLimit.get(ip);
    if (now - data.startTime > RATE_LIMIT_WINDOW) {
      rateLimit.set(ip, { count: 1, startTime: now });
    } else {
      data.count++;
      if (data.count > MAX_REQUESTS) {
        return res.status(429).json({ error: 'Demasiados intentos, por favor espera un minuto.' });
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
    
    const uid = decodedToken.uid;
    const userRecord = await admin.auth().getUser(uid);
    const userName = userRecord.displayName || userRecord.email || uid;
    
    const { pinCode, gameId, zoneId, playerName, accountEmail, accountPassword } = req.body;
    
    if (!pinCode) return res.status(400).json({ error: 'Falta el código PIN' });

    const codeToSearch = pinCode.trim().toUpperCase();

    const db = admin.database();
    const pinRef = db.ref(`pins/${codeToSearch}`);
    
    // Transacción atómica para canjear el PIN (evita race conditions de canje múltiple)
    let pinDataSnapshot = null;
    let orderId = generateOrderRef();

    const result = await pinRef.transaction((currentData) => {
      if (currentData === null) {
        return undefined; // Abortar transacción si el PIN no existe
      }
      
      if (currentData.status !== 'available') {
        return undefined; // Abortar transacción si ya fue canjeado o está deshabilitado
      }

      // Marcar como canjeado
      currentData.status = 'redeemed';
      currentData.redeemedAt = new Date().toISOString();
      currentData.redeemedBy = userName;
      currentData.redeemerUid = uid;
      currentData.redemptionOrderId = orderId;
      
      pinDataSnapshot = currentData;
      return currentData;
    });

    if (!result.committed) {
      // Determinar la razón por la que no se comprometió
      const snap = await pinRef.once('value');
      const val = snap.val();
      if (!val) {
        return res.status(404).json({ error: 'PIN inválido o no encontrado.' });
      }
      if (val.status === 'redeemed') {
        return res.status(400).json({ error: 'Este PIN ya ha sido canjeado anteriormente.' });
      }
      if (val.status === 'disabled') {
        return res.status(400).json({ error: 'Este PIN se encuentra deshabilitado.' });
      }
      return res.status(500).json({ error: 'Error al procesar el PIN.' });
    }

    const pinData = result.snapshot.val() || pinDataSnapshot;

    // Crear la orden
    const fullGameId = zoneId ? `${gameId}(${zoneId})` : gameId;
    
    const newOrder = {
      id: orderId,
      userId: uid,
      userName: userName,
      productId: pinData.productId,
      productName: pinData.productName,
      productType: pinData.productType,
      packageLabel: pinData.packageLabel,
      apiProductId: pinData.apiProductId || null,
      apiProvider: pinData.apiProvider || null,
      priceUsd: pinData.priceUsd,
      priceBs: 0, // Regalo
      costUsd: 0, // Contablemente ya fue pagado/asumido al crearlo
      paymentMethodId: 'pin-redemption',
      paymentMethodName: 'Pin de Regalo',
      paymentCurrency: 'usd',
      customerContact: userRecord.email || '',
      gameId: fullGameId || '',
      playerName: playerName || null,
      accountEmail: accountEmail || '',
      accountPassword: accountPassword || '',
      status: 'pending',
      adminNote: `Canje de PIN: ${codeToSearch}`,
      statusHistory: [
        { status: 'pending', timestamp: new Date().toISOString(), note: `Pedido creado via PIN de regalo (${codeToSearch})` }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Guardar la orden
    await db.ref(`orders/${orderId}`).set(newOrder);
    
    // Indexar orden en el perfil del usuario
    await db.ref(`users/${uid}/orders/${orderId}`).set(true);

    // Registro de canje en pin_redemptions (para tracking del admin y robot_tiendas)
    await db.ref(`pin_redemptions/${orderId}`).set({
      pinCode: codeToSearch,
      orderId: orderId,
      userId: uid,
      userName: userName,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({ 
      success: true, 
      orderId: orderId,
      productName: pinData.productName,
      packageLabel: pinData.packageLabel,
      message: 'PIN canjeado exitosamente. Tu pedido está en proceso.' 
    });

  } catch (error) {
    console.error('Redeem PIN API Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
}
