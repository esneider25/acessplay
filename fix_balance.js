import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://accesplay-8bf5d-default-rtdb.firebaseio.com"
    });
  } catch (error) {
    console.error("Firebase Admin Error:", error);
    process.exit(1);
  }
}

async function fixBalance() {
  const db = admin.database();
  // We need to find the user by email: esneiderbencomo@gmail.com
  const usersRef = db.ref('users');
  const snapshot = await usersRef.orderByChild('email').equalTo('esneiderbencomo@gmail.com').once('value');
  
  if (!snapshot.exists()) {
    console.log("User not found.");
    process.exit(1);
  }

  const users = snapshot.val();
  const uid = Object.keys(users)[0];
  const user = users[uid];
  
  console.log(`Found user: ${user.name} (${uid})`);
  const currentWithdrawn = parseFloat(user.withdrawnTournamentEarnings) || 0;
  console.log(`Current withdrawnTournamentEarnings: $${currentWithdrawn}`);
  
  const amountToRefund = 4;
  const newWithdrawn = Math.max(0, currentWithdrawn - amountToRefund);
  
  console.log(`Refunding $${amountToRefund}. New withdrawnTournamentEarnings will be: $${newWithdrawn}`);
  
  await db.ref(`users/${uid}`).update({
    withdrawnTournamentEarnings: newWithdrawn
  });
  
  console.log("Balance fixed successfully!");
  process.exit(0);
}

fixBalance();
