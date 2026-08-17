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
  if (!global.rateLimitWallet) global.rateLimitWallet = new Map();
  const rateLimit = global.rateLimitWallet;
  const RATE_LIMIT_WINDOW = 60000;
  const MAX_REQUESTS = 5;
  
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
      else if (action === 'tournament_entry') {
        // Secure tournament wallet payment - validates balance atomically
        const walletBalance = (user.wallet && typeof user.wallet === 'object') ? (user.wallet.balance || 0) : (typeof user.wallet === 'number' ? user.wallet : 0);
        if (walletBalance < amount) {
          throw new Error('Saldo insuficiente en billetera');
        }
        if (typeof user.wallet === 'object') {
          user.wallet.balance = walletBalance - amount;
        } else {
          user.wallet = walletBalance - amount;
        }
      }
      else if (action === 'tournament_cashout') {
        user.withdrawnTournamentEarnings = (user.withdrawnTournamentEarnings || 0) + amount;
      }
      else {
        throw new Error('Acción inválida');
      }
      
      return user;
    });

    // For tournament_entry, record the transaction after the atomic balance deduction
    if (action === 'tournament_entry') {
      const { tournamentId, tournamentTitle } = req.body;
      const txId = 'tx_' + Date.now();
      await admin.database().ref(`users/${uid}/wallet/transactions/${txId}`).set({
        type: 'tournament_fee',
        amount: -amount,
        description: 'Inscripción a ' + (tournamentTitle || 'Torneo'),
        timestamp: new Date().toISOString()
      });
    }

    // For tournament_cashout, validate actual earnings server-side
    if (action === 'tournament_cashout') {
      const [tournamentsSnap, participantsSnap, userSnap] = await Promise.all([
        admin.database().ref('tournaments').once('value'),
        admin.database().ref('tournament_participants').once('value'),
        admin.database().ref(`users/${uid}`).once('value')
      ]);
      const allTournaments = tournamentsSnap.val() || {};
      const allParticipants = participantsSnap.val() || {};
      const userData = userSnap.val() || {};
      
      let totalEarnings = 0;
      Object.keys(allTournaments).forEach(key => {
        const t = allTournaments[key];
        if (!t || (t.status !== 'completed' && t.status !== 'completado')) return;
        if (!t.leaderboard) return;
        
        const myEntry = allParticipants[key] ? allParticipants[key][uid] : null;
        if (!myEntry || myEntry.paymentStatus === 'rejected') return;
        
        const myGameName = (myEntry.gameName || myEntry.name || '').trim().toLowerCase();
        let totalTeamKills = 0;
        let myPosition = 0;
        
        const lbLider = t.leaderboard.find(l => (l.playerName || '').trim().toLowerCase() === myGameName);
        if (lbLider) {
          totalTeamKills += (parseInt(lbLider.kills) || 0);
          myPosition = lbLider.position || 0;
        }
        
        if (myEntry.teamMembers && myEntry.teamMembers.length > 0) {
          myEntry.teamMembers.forEach(tm => {
            const tmName = (tm.gameName || '').trim().toLowerCase();
            const lbTm = t.leaderboard.find(l => (l.playerName || '').trim().toLowerCase() === tmName);
            if (lbTm) {
              totalTeamKills += (parseInt(lbTm.kills) || 0);
              if (myPosition === 0) myPosition = lbTm.position || 0;
            }
          });
        }
        
        if (t.pricePerKill) {
          totalEarnings += totalTeamKills * (parseFloat(t.pricePerKill) || 0);
        }
        
        if (myPosition > 0 && t.prizes && t.prizes[myPosition - 1]) {
          const prizeObj = t.prizes[myPosition - 1];
          if (prizeObj.cashReward) {
             totalEarnings += parseFloat(prizeObj.cashReward);
          }
        }
      });
      
      const refundedEarnings = userData.refundedTournamentEarnings || 0;
      const archivedEarnings = userData.archivedTournamentEarnings || 0;
      const withdrawnEarnings = userData.withdrawnTournamentEarnings || 0;
      const realAvailable = Math.max(0, (totalEarnings + refundedEarnings + archivedEarnings) - withdrawnEarnings);
      
      // The withdrawal was already recorded in the transaction above, so check if it exceeds real earnings
      // withdrawnEarnings now includes the current 'amount' (added in the transaction above)
      // So realAvailable already accounts for it. If realAvailable < 0, rollback.
      if (realAvailable < 0) {
        // Rollback the withdrawal
        await admin.database().ref(`users/${uid}`).transaction(u => {
          if (!u) return u;
          u.withdrawnTournamentEarnings = (u.withdrawnTournamentEarnings || 0) - amount;
          return u;
        });
        return res.status(400).json({ error: 'El monto excede tus ganancias reales de torneos' });
      }
    }

    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error("Wallet API Error:", error);
    if (error.message === 'Saldo insuficiente' || error.message === 'Puntos insuficientes' || error.message === 'Saldo insuficiente en billetera' || error.message === 'Puntos insuficientes para retirar') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error procesando la transacción financiera' });
  }
}
