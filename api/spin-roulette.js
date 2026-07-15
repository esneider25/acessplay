import admin from 'firebase-admin';

// Initialize Firebase Admin securely
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
    // ── AUTENTICACIÓN: Verificar token del usuario ──
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Se requiere autenticación' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Falta orderId' });

    const db = admin.database();

    // 1. Fetch order using Admin SDK (secure server-side access)
    const orderSnap = await db.ref(`orders/${orderId}`).once('value');
    const order = orderSnap.val();

    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (order.roulettePlayed) return res.status(400).json({ error: 'La ruleta ya fue girada para este pedido' });

    // ── Verificar que el pedido pertenece al usuario autenticado ──
    if (order.userId && order.userId !== decodedToken.uid) {
      return res.status(403).json({ error: 'No tienes permiso para girar esta ruleta' });
    }

    // ── Verificar que el pedido está completado ──
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Solo puedes girar la ruleta en pedidos completados' });
    }

    // 2. Marcar como jugado en el servidor ANTES de hacer el sorteo (transacción atómica)
    const playedRef = db.ref(`orders/${orderId}/roulettePlayed`);
    const txResult = await playedRef.transaction((current) => {
      if (current === true) return; // Abort if already played (another concurrent request)
      return true;
    });

    // Si la transacción fue abortada, alguien más ya la jugó
    if (!txResult.committed) {
      return res.status(400).json({ error: 'La ruleta ya fue girada para este pedido' });
    }

    // 3. Fetch configuration para probabilidad (si no existe, usa 2%)
    let winProbability = 0.02;
    const settingsSnap = await db.ref('settings').once('value');
    const settings = settingsSnap.val();
    if (settings && typeof settings.rouletteWinProbability !== 'undefined') {
      winProbability = parseFloat(settings.rouletteWinProbability) / 100;
    }

    const isWinner = Math.random() < winProbability;

    if (isWinner) {
      // 4. Generate Prize Order
      const productsSnap = await db.ref('products').once('value');
      const productsData = productsSnap.val();
      const products = Array.isArray(productsData) ? productsData.filter(Boolean) : Object.values(productsData || {});
      const product = products.find(p => p && p.id === order.productId);

      if (product && product.packages && product.packages.length > 0) {
        const pkgArray = Array.isArray(product.packages) ? product.packages : Object.values(product.packages);
        const cheapestPackage = [...pkgArray].filter(Boolean).sort((a, b) => a.priceUsd - b.priceUsd)[0];

        const prizeOrderId = 'AP-' + Math.floor(10000 + Math.random() * 90000);
        const freeOrder = {
          id: prizeOrderId,
          userId: order.userId || null,
          userName: order.userName || null,
          productId: product.id,
          productName: product.name,
          packageLabel: cheapestPackage.name,
          apiProductId: cheapestPackage.apiProductId,
          apiProvider: product.apiProvider,
          priceUsd: 0,
          priceBs: 0,
          paymentMethodId: 'roulette',
          paymentMethodName: 'Premio Ruleta',
          customerContact: order.customerContact || null,
          gameId: order.gameId || null,
          playerName: order.playerName || null,
          accountEmail: order.accountEmail || null,
          status: 'pending',
          adminNote: "🎁 PREMIO RULETA (Ganado de la orden " + orderId + ")",
          createdAt: new Date().toISOString(),
          timestamp: new Date().toISOString()
        };

        await db.ref(`orders/${prizeOrderId}`).set(freeOrder);
      }
    }

    return res.status(200).json({ success: true, isWinner });
  } catch (err) {
    console.error("Roulette API Error:", err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
