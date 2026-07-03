const fetch = require('node-fetch'); // Required for older Vercel Node envs or implicitly available

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Falta orderId' });

    const FIREBASE_DB_URL = 'https://accesplay-8bf5d-default-rtdb.firebaseio.com';
    
    // 1. Fetch order
    const orderRes = await fetch(`${FIREBASE_DB_URL}/orders/${orderId}.json`);
    const order = await orderRes.json();
    
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (order.roulettePlayed) return res.status(400).json({ error: 'La ruleta ya fue girada para este pedido' });

    // 2. Marcar como jugado en el servidor ANTES de hacer el sorteo
    await fetch(`${FIREBASE_DB_URL}/orders/${orderId}/roulettePlayed.json`, {
      method: 'PUT',
      body: JSON.stringify(true)
    });

    // 3. Fetch configuration para probabilidad (si no existe, usa 2%)
    let winProbability = 0.02;
    const settingsRes = await fetch(`${FIREBASE_DB_URL}/settings.json`);
    const settings = await settingsRes.json();
    if (settings && typeof settings.rouletteWinProbability !== 'undefined') {
      winProbability = parseFloat(settings.rouletteWinProbability) / 100;
    }

    const isWinner = Math.random() < winProbability;

    if (isWinner) {
      // 4. Generate Prize Order
      const productsRes = await fetch(`${FIREBASE_DB_URL}/products.json`);
      const products = await productsRes.json();
      const product = products.find(p => p && p.id === order.productId);
      
      if (product && product.packages && product.packages.length > 0) {
        const cheapestPackage = [...product.packages].sort((a,b) => a.priceUsd - b.priceUsd)[0];
        
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
          timestamp: new Date().toISOString()
        };

        await fetch(`${FIREBASE_DB_URL}/orders/${prizeOrderId}.json`, {
          method: 'PUT',
          body: JSON.stringify(freeOrder)
        });
      }
    }

    return res.status(200).json({ success: true, isWinner });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
