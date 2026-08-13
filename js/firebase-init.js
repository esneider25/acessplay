const firebaseConfig = {
  apiKey: "AIzaSyDnGILkwajivJyhaqP8r2rXH0KJ82pEVo8",
  authDomain: "accesplay-8bf5d.firebaseapp.com",
  databaseURL: "https://accesplay-8bf5d-default-rtdb.firebaseio.com",
  projectId: "accesplay-8bf5d",
  storageBucket: "accesplay-8bf5d.firebasestorage.app",
  messagingSenderId: "869705275895",
  appId: "1:869705275895:web:651b9d1203af65fae3f6f2",
  measurementId: "G-NBN8MXTH90"
};

// Initialize Firebase using the Compat SDK
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let storage;
try {
  if (typeof firebase.storage === 'function') {
    storage = firebase.storage();
  }
} catch (e) {
  console.warn('Firebase Storage no inicializado en esta página.');
}
