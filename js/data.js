// ============================================================
// AccessPlay — Data Layer: Products, Categories, APIs & Config
// ============================================================

// ── Categories ──
let CATEGORIES = [];

// ── Exchange Rate ──
let EXCHANGE_RATE = {
  usdToBs: 58.50,
  lastUpdated: new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
};

// ── Site Settings ──
let SITE_SETTINGS = {
  whatsapp: '+584120000000',
  instagram: 'https://instagram.com/recargaaccessplay',
  telegram: 'https://t.me/recargaaccessplay',
  schedule: 'Lunes a Domingo 8:00 AM – 11:00 PM',
  announcementEnabled: false,
  announcementMessage: '¡Bienvenido a AccessPlay! Estamos procesando pedidos con normalidad.',
  termsAndConditions: [
    { 
      title: 'Aceptación del Servicio', 
      titleColor: '#0ea5e9', 
      desc: 'Al utilizar AccessPlay, registrarte o realizar un pedido, aceptas estar de acuerdo con todos los términos aquí descritos. Nos reservamos el derecho de modificar estos términos en cualquier momento.', 
      descColor: '#e2e8f0' 
    },
    { 
      title: 'Responsabilidad de Datos (IDs y Cuentas)', 
      titleColor: '#facc15', 
      desc: 'El cliente es el único responsable de proporcionar correctamente su ID de jugador, Zona o datos de cuenta. AccessPlay no se hace responsable por recargas enviadas a cuentas equivocadas debido a errores tipográficos por parte del usuario.', 
      descColor: '#e2e8f0' 
    },
    { 
      title: 'Tiempos de Procesamiento y Entrega', 
      titleColor: '#60a5fa', 
      desc: 'Las recargas automatizadas toman de 1 a 5 minutos una vez confirmado el pago. Las recargas manuales (internas) o envíos de códigos pueden tardar entre 10 a 30 minutos dentro de nuestro horario de atención. En caso de fallas con los servidores del juego, el tiempo puede extenderse.', 
      descColor: '#e2e8f0' 
    },
    { 
      title: 'Política de Reembolsos', 
      titleColor: '#ef4444', 
      desc: 'Una vez que una recarga o código digital ha sido procesado y entregado con éxito, NO hay devoluciones ni reembolsos bajo ninguna circunstancia. Solo se emitirán reembolsos (a su saldo de Monedero o cuenta bancaria) si el producto no pudo ser entregado por falta de stock o error de nuestra plataforma.', 
      descColor: '#e2e8f0' 
    },
    { 
      title: 'Uso del Monedero y Revendedores', 
      titleColor: '#0ea5e9', 
      desc: 'El saldo cargado al Monedero (Wallet) no puede ser retirado en efectivo, solo puede ser utilizado para compras dentro de la tienda. Los usuarios con rol de "Revendedor" gozan de descuentos exclusivos, pero están sujetos a las mismas políticas de no-reembolso por errores de tipeo de IDs.', 
      descColor: '#e2e8f0' 
    },
    { 
      title: 'Prevención de Fraude y Bloqueos', 
      titleColor: '#ef4444', 
      desc: 'Contamos con sistemas Anti-Spam. Cualquier intento de enviar comprobantes falsos, comprobantes reciclados, o hacer múltiples pedidos falsos resultará en el BLOQUEO PERMANENTE de la IP, número de WhatsApp y cuenta del usuario, perdiendo acceso a su Monedero sin derecho a reclamo.', 
      descColor: '#e2e8f0' 
    }
  ]
};

// ── Landing Page Config ──
let LANDING_CONFIG = {
  heroStats: [
    { value: '15000', label: 'Recargas realizadas' },
    { value: '3200', label: 'Clientes satisfechos' },
    { value: '25+', label: 'Productos disponibles' },
    { value: '4', label: 'Categorías' }
  ],
  howItWorks: [
    { title: 'Elige tu Producto', desc: 'Selecciona el juego, gift card, streaming o billetera que deseas recargar y elige el paquete.', icon: '🛒' },
    { title: 'Realiza el Pago', desc: 'Paga con Pago Móvil, transferencia bancaria o Binance Pay. Envía el comprobante.', icon: '💳' },
    { title: 'Recibe tu Recarga', desc: 'Procesaremos tu pedido en minutos y recibirás tus diamantes, saldo o código directo en tu cuenta.', icon: '⚡' }
  ],
  features: [
    { title: 'Entrega Inmediata', desc: 'Recibe tu recarga en minutos después de confirmar el pago. Sin esperas innecesarias.', icon: '⚡' },
    { title: '100% Seguro', desc: 'Tus datos están protegidos. Proceso transparente y confiable con cada transacción.', icon: '🔒' },
    { title: 'Soporte 24/7', desc: 'Atención personalizada por WhatsApp. Estamos disponibles para resolver cualquier duda.', icon: '💬' },
    { title: 'Mejores Precios', desc: 'Tasas competitivas actualizadas diariamente. Precios justos para todos.', icon: '💰' },
    { title: 'Rastreo en Vivo', desc: 'Sigue el estado de tu pedido en tiempo real. Sabrás exactamente cuándo estará lista tu recarga.', icon: '📡' },
    { title: 'Cobertura Total', desc: 'Servicio para toda Venezuela con pagos en bolívares, dólares y criptomonedas.', icon: '🌎' }
  ],
  faq: [
    { q: '⏱️ ¿Cuánto tiempo tarda en llegar mi recarga?', a: 'Por lo general, las recargas se procesan en un tiempo de <strong>5 a 15 minutos</strong> una vez que tu pago ha sido confirmado. En algunos casos excepcionales o durante mantenimientos del juego, puede demorar un poco más.' },
    { q: '⚠️ ¿Qué pasa si me equivoco al poner mi ID del juego?', a: 'Si notas un error en tu ID, contáctanos inmediatamente a través de nuestro botón de soporte en WhatsApp o Telegram. Si la recarga <strong>aún no ha sido procesada</strong>, podemos corregirlo. Si ya fue enviada al ID erróneo, lamentablemente no podemos revertir la transacción.' },
    { q: '💳 ¿Cuáles son los métodos de pago aceptados?', a: 'Aceptamos pagos a través de <strong>Pago Móvil</strong>, <strong>Transferencia Bancaria Nacional</strong> y también criptomonedas como USDT a través de <strong>Binance Pay</strong>.' },
    { q: '✅ ¿Cómo sé si mi pedido fue exitoso?', a: 'Al finalizar tu compra, recibirás un número de referencia (Ej: RS-1234). Puedes ingresar ese código en la sección de <strong>"🔍 Mis Pedidos"</strong> en el menú superior para ver el estado en tiempo real.' }
  ],
  footer: {
    disclaimer: 'AccessPlay no está afiliado con Garena, Tencent, Roblox Corporation, miHoYo ni ninguna otra empresa mencionada. Todos los nombres y logotipos son marcas registradas de sus respectivos dueños.'
  }
};

// ── Messaging System ──
let MESSAGES = JSON.parse(localStorage.getItem('recargaaccessplay_messages') || '[]');

// ── Payment Methods ──
let PAYMENT_METHODS = [];

// ── Telegram Bot Configuration ──
let TELEGRAM_CONFIG = {
  botToken: '8542799283:AAG_JpLnKG1DNUjSqfHjncEn9Nr7imXaays',
  chatId: '6012452103',
  enabled: true,
  notifyNewOrder: true,
  notifyWithPhoto: true
};

// ── Anti-Spam Configuration ──
let SPAM_CONFIG = {
  maxOrdersPerHour: 5,
  maxOrdersPerDay: 15,
  cooldownMinutes: 30,
  blocklistEnabled: true
};

// ── Spam Tracker ──
let SPAM_TRACKER = {
  attempts: [],
  blocked: []
};

// ── API Configurations (up to 4 slots) ──
let API_CONFIGS = [
  {
    id: 'api-1',
    name: 'TiendaGiftVen',
    baseUrl: 'https://tiendagiftven.net/conexion_api/api.php?action=ValidarParametros&id={ID}',
    apiKey: '',
    port: '443',
    enabled: true,
    description: 'Verificador Puerto 1'
  },
  {
    id: 'api-2',
    name: 'NetEase Bloodstrike',
    baseUrl: 'https://pay.neteasegames.com/gameclub/bloodstrike/-1/login-role?roleid={PLAYER_ID}&client_type=gameclub',
    apiKey: '',
    port: '443',
    enabled: true,
    description: 'Verificador Puerto 2'
  },
  {
    id: 'api-3',
    name: 'Mobile Legends Verifier',
    baseUrl: 'https://api.isan.eu.org/nickname/ml?id={ID_JUGADOR}&zone={ZONE_ID}',
    apiKey: '',
    port: '443',
    enabled: true,
    description: 'Verificador Puerto 3'
  },
  {
    id: 'api-4',
    name: 'API Personalizada',
    baseUrl: '',
    apiKey: '',
    port: '8080',
    enabled: false,
    description: 'Endpoint personalizado para integraciones'
  }
];

// ── Discount Codes ──
let DISCOUNT_CODES = [];

// ── Products Catalog ──
let PRODUCTS = [];

// ── Backward compatibility: alias GAMES → PRODUCTS ──
const GAMES = PRODUCTS;

// ── Helper Functions ──
function usdToBs(usd) {
  return (usd * EXCHANGE_RATE.usdToBs).toFixed(2);
}

function formatBs(amount) {
  return parseFloat(amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateOrderRef() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return 'RS-' + randomNum;
}

function getProductsByCategory(categoryId) {
  if (!categoryId || categoryId === 'todos') return PRODUCTS;
  return PRODUCTS.filter(p => p.category === categoryId);
}

function getCategoryById(categoryId) {
  return CATEGORIES.find(c => c.id === categoryId);
}

// ── Data Arrays for Firebase ──
let ORDERS = [];
let QUICK_REPLIES = [];
let BANNERS = [
  {
    id: 'banner-1',
    badge: 'NUEVO SERVICIO',
    badgeColor: '#0ea5e9',
    title: 'Recargas Mobile Legends',
    desc: 'Ya puedes recargar diamantes con tu Player ID y Zone ID. ¡Entrega rápida y segura!',
    btnText: 'Ver Paquetes 🚀',
    btnLink: 'product:mobile-legends',
    btnColor: 'var(--accent)',
    btnTextColor: 'var(--bg-deep)',
    bgGradient: 'linear-gradient(135deg, #111827, #1f2937)',
    icon: '💎'
  },
  {
    id: 'banner-2',
    badge: 'MÉTODO DE PAGO',
    badgeColor: '#f3ba2f',
    title: 'Aceptamos Binance Pay',
    desc: 'Paga de forma rápida y sin comisiones extras usando USDT a través de Binance Pay.',
    btnText: 'Saber más 💳',
    btnLink: 'how-it-works',
    btnColor: '#f3ba2f',
    btnTextColor: '#000',
    bgGradient: 'linear-gradient(135deg, #1f1127, #371f37)',
    icon: '🔶'
  },
  {
    id: 'banner-3',
    badge: 'RÁPIDO Y SEGURO',
    badgeColor: '#0ea5e9',
    title: 'Atención 24/7',
    desc: 'Nuestro sistema procesa tus pedidos y estamos aquí para ayudarte en cualquier momento.',
    btnText: 'Comprar ahora 🔥',
    btnLink: 'catalog',
    btnColor: 'var(--accent)',
    btnTextColor: 'var(--bg-deep)',
    bgGradient: 'linear-gradient(135deg, #112724, #1f3731)',
    icon: '⚡'
  }
];

window.DATA_LOADED = false;

function initFirebaseData() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded yet.');
    setTimeout(initFirebaseData, 100);
    return;
  }

  const db = firebase.database();

  if (!window.__firebaseAuthHooked) {
    window.__firebaseAuthHooked = true;
    firebase.auth().onAuthStateChanged(user => {
      // If user logs in after data was loaded, reload to get protected data
      if (user) {
        setTimeout(initFirebaseData, 500);
      }
    });
  }

  const keysToLoad = ['products', 'categories', 'payment_methods', 'exchange_rate', 'settings', 'api_configs', 'discounts', 'messages', 'orders', 'telegram_config', 'quick_replies', 'spam_tracker', 'order_counter', 'banners', 'landing_config'];
  const loadedKeys = new Set();

  function checkLoadComplete(key) {
    loadedKeys.add(key);
    if (loadedKeys.size >= keysToLoad.length && !window.DATA_LOADED) {
      window.DATA_LOADED = true;
      if (typeof renderApp === 'function') renderApp();
      if (typeof initAdminApp === 'function') initAdminApp();
    } else if (window.DATA_LOADED) {
      const uiKeys = ['products', 'categories', 'payment_methods', 'exchange_rate', 'settings', 'banners', 'landing_config'];
      const adminKeys = [...uiKeys, 'orders', 'api_configs', 'discounts', 'quick_replies'];
      if (uiKeys.includes(key)) {
        if (typeof renderApp === 'function' && typeof appState !== 'undefined' && appState.currentView === 'home') renderApp();
      }
      if (adminKeys.includes(key)) {
        if (typeof renderActiveTab === 'function') renderActiveTab();
      }
    }
  }

  keysToLoad.forEach(key => {
    db.ref('/' + key).off('value');
    db.ref('/' + key).on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (key === 'products') { PRODUCTS.length = 0; data.forEach(p => PRODUCTS.push(p)); }
        else if (key === 'categories') { CATEGORIES.length = 0; data.forEach(c => CATEGORIES.push(c)); }
        else if (key === 'payment_methods') { PAYMENT_METHODS.length = 0; data.forEach(p => PAYMENT_METHODS.push(p)); }
        else if (key === 'exchange_rate') Object.assign(EXCHANGE_RATE, data);
        else if (key === 'settings') Object.assign(SITE_SETTINGS, data);
        else if (key === 'landing_config') Object.assign(LANDING_CONFIG, data);
        else if (key === 'api_configs') { API_CONFIGS.length = 0; data.forEach(a => API_CONFIGS.push(a)); }
        else if (key === 'discounts') { DISCOUNT_CODES.length = 0; data.forEach(d => DISCOUNT_CODES.push(d)); }
        else if (key === 'messages') {
          if (!data) MESSAGES = [];
          else if (Array.isArray(data)) MESSAGES = data.filter(Boolean);
          else MESSAGES = Object.values(data);
        }
        else if (key === 'orders') {
          if (!data) ORDERS = [];
          else if (Array.isArray(data)) ORDERS = data.filter(Boolean);
          else ORDERS = Object.values(data);
          ORDERS.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        else if (key === 'telegram_config') Object.assign(TELEGRAM_CONFIG, data);
        else if (key === 'quick_replies') QUICK_REPLIES = data;
        else if (key === 'spam_tracker') {
          SPAM_TRACKER.attempts = data.attempts || [];
          SPAM_TRACKER.blocked = data.blocked || [];
        }
        else if (key === 'order_counter') localStorage.setItem('recargaaccessplay_order_counter', data.toString());
        else if (key === 'banners') {
          if (!data) BANNERS = [];
          else if (Array.isArray(data)) BANNERS = data.filter(Boolean);
          else BANNERS = Object.values(data);
        }
      }
      checkLoadComplete(key);
    }, (error) => {
      console.warn('Acceso denegado a ' + key + ' (normal si no es admin)');
      checkLoadComplete(key);
    });
  });
}

initFirebaseData();

function saveToDb(path, data) {
  if (typeof firebase !== 'undefined') {
    const cleanData = JSON.parse(JSON.stringify(data));
    firebase.database().ref(path).set(cleanData)
      .catch(err => console.error("Firebase write error on " + path + ":", err));
  }
}

// ── Product Types (applied after localStorage load) ──
const PRODUCT_TYPE_MAP = {
  'free-fire': 'game-id', 'pubg-mobile': 'game-id', 'roblox': 'game-id',
  'mobile-legends': 'game-id', 'cod-mobile': 'game-id', 'genshin-impact': 'game-id',
  'blood-strike': 'game-id',
  'google-play': 'code', 'itunes': 'code', 'steam': 'code',
  'netflix': 'account', 'spotify': 'account', 'disney-plus': 'account',
  'paypal': 'account', 'binance-wallet': 'account'
};
PRODUCTS.forEach(p => { if (!p.type) p.type = PRODUCT_TYPE_MAP[p.id] || 'game-id'; });

// ── Order Statuses ──
const ORDER_STATUSES = {
  'pending': { label: 'Pendiente', icon: '📋', color: '#ffb74d', bg: 'rgba(255,183,77,0.15)' },
  'processing': { label: 'Procesando', icon: '⚙️', color: '#42a5f5', bg: 'rgba(66,165,245,0.15)' },
  'completed': { label: 'Completado', icon: '✅', color: '#66bb6a', bg: 'rgba(102,187,106,0.15)' },
  'rejected': { label: 'Rechazado', icon: '❌', color: '#ef5350', bg: 'rgba(239,83,80,0.15)' },
  'invalid-id': { label: 'ID Inválido', icon: '⚠️', color: '#ffa726', bg: 'rgba(255,167,38,0.15)' }
};

// ── Discounts CRUD ──
function getDiscounts() {
  return DISCOUNT_CODES;
}

function saveDiscounts() {
  saveToDb('discounts', DISCOUNT_CODES);
}

function createDiscount(code, type, value) {
  const newCode = code.trim().toUpperCase();
  if (DISCOUNT_CODES.some(d => d.code === newCode)) return false;
  DISCOUNT_CODES.push({
    code: newCode,
    type: type, // 'percentage' or 'fixed'
    value: parseFloat(value),
    active: true,
    createdAt: new Date().toISOString()
  });
  saveDiscounts();
  return true;
}

function deleteDiscount(code) {
  const index = DISCOUNT_CODES.findIndex(d => d.code === code);
  if (index !== -1) {
    DISCOUNT_CODES.splice(index, 1);
    saveDiscounts();
  }
}

function validateDiscount(code) {
  const target = code.trim().toUpperCase();
  return DISCOUNT_CODES.find(d => d.code === target && d.active);
}


// ── Settings CRUD ──
function getSettings() {
  return SITE_SETTINGS;
}

function saveSettings(newSettings) {
  Object.assign(SITE_SETTINGS, newSettings);
  saveToDb('settings', SITE_SETTINGS);
}

function saveLandingConfig(newConfig) {
  Object.assign(LANDING_CONFIG, newConfig);
  saveToDb('landing_config', LANDING_CONFIG);
}

function getLandingConfig() {
  return LANDING_CONFIG;
}

// ── Messages CRUD ──
function getMessages() {
  return MESSAGES;
}

function getMessagesForSession(sessionId) {
  const conv = MESSAGES.find(m => m.sessionId === sessionId);
  return conv ? conv.messages : [];
}

function addMessage(sessionId, sender, text, contact = null) {
  let conv = MESSAGES.find(m => m.sessionId === sessionId);
  if (!conv) {
    conv = {
      sessionId: sessionId,
      contact: contact,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      hasUnreadAdmin: false,
      hasUnreadUser: false
    };
    MESSAGES.push(conv);
  } else if (contact) {
    conv.contact = contact;
  }

  if (text) {
    conv.messages.push({
      id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      sender: sender, // 'user' or 'admin' or 'bot'
      text: text,
      timestamp: new Date().toISOString()
    });
  }
  conv.updatedAt = new Date().toISOString();

  if (sender === 'user') {
    conv.hasUnreadAdmin = true;
  } else {
    conv.hasUnreadUser = true;
  }

  saveMessages();
}

function markMessagesAsRead(sessionId, reader) {
  const conv = MESSAGES.find(m => m.sessionId === sessionId);
  if (conv) {
    let changed = false;
    if (reader === 'admin' && conv.hasUnreadAdmin) {
      conv.hasUnreadAdmin = false;
      changed = true;
    }
    if (reader === 'user' && conv.hasUnreadUser) {
      conv.hasUnreadUser = false;
      changed = true;
    }
    if (changed) saveMessages();
  }
}

function saveMessages() {
  saveToDb('messages', MESSAGES);
}

// ── Orders CRUD ──
function getOrders() {
  return ORDERS;
}

function saveOrders(orders) {
  ORDERS = orders;
}

function saveOrderToDb(order) {
  if (typeof firebase !== 'undefined' && order && order.id) {
    const cleanOrder = JSON.parse(JSON.stringify(order));
    firebase.database().ref('orders/' + order.id).set(cleanOrder)
      .catch(err => console.error("Firebase write error:", err));
    if (order.userId) {
      firebase.database().ref('users/' + order.userId + '/orders/' + order.id).set(true)
        .catch(err => console.error("Firebase user index write error:", err));
    }
  }
}

function removeOrderFromDb(orderId) {
  if (typeof firebase !== 'undefined' && orderId) {
    firebase.database().ref('orders/' + orderId).remove();
    firebase.database().ref('orders').orderByChild('id').equalTo(orderId).once('value', snapshot => {
      snapshot.forEach(child => child.ref.remove());
    });
  }
}

function createOrder(data) {
  const orders = getOrders();
  const order = {
    id: generateOrderRef(),
    userId: data.userId || null,
    userName: data.userName || null,
    productId: data.productId,
    productName: data.productName,
    productType: data.productType || 'game-id',
    packageLabel: data.packageLabel,
    apiProductId: data.apiProductId,
    apiProvider: data.apiProvider,
    priceUsd: data.priceUsd,
    priceBs: data.priceBs,
    paymentMethodId: data.paymentMethodId,
    paymentMethodName: data.paymentMethodName,
    customerContact: data.customerContact || '',
    gameId: data.gameId || '',
    playerName: data.playerName || null,
    accountEmail: data.accountEmail || '',
    accountPassword: data.accountPassword || '',
    ocrNumbers: data.ocrNumbers || [],
    imageHash: data.imageHash || null,
    discountCode: data.discountCode || null,
    discountValue: data.discountValue || 0,
    discountType: data.discountType || null,
    status: 'pending',
    adminNote: '',
    statusHistory: [
      { status: 'pending', timestamp: new Date().toISOString(), note: 'Pedido recibido' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  orders.unshift(order);
  saveOrderToDb(order);
  ORDERS = orders;
  return order;
}

function getOrderById(orderId) {
  return getOrders().find(o => o.id === orderId);
}

function updateOrderStatus(orderId, newStatus, note) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;

  if (newStatus === 'completed' && order.status !== 'completed' && order.userId) {
    if (order.productType === 'wallet-recharge') {
      db.ref('users/' + order.userId + '/wallet').once('value').then(snap => {
        const currentWallet = parseFloat(snap.val() || 0);
        const amountToAdd = parseFloat(order.priceUsd || 0);
        db.ref('users/' + order.userId + '/wallet').set(currentWallet + amountToAdd);
      });
      if (typeof addTransaction === 'function') {
        addTransaction(order.userId, 'deposit', parseFloat(order.priceUsd || 0), 'Recarga de monedero aprobada');
      }
    } else {
      // Product Purchase: Update points, spent, and cashback
      db.ref('users/' + order.userId).once('value').then(snap => {
        let p = snap.val() || {};
        let currentPoints = p.points || 0;
        let totalSpent = p.totalSpent || 0;
        let currentWallet = parseFloat(p.wallet || 0);
        let price = parseFloat(order.priceUsd || 0);
        let role = p.role || 'cliente';

        let newSpent = totalSpent + price;
        let updates = { totalSpent: newSpent };

        if (role !== 'revendedor') {
          // 1. Calculate Points
          let earnedPoints = 0;
          if (price < 6) earnedPoints = 8;
          else if (price <= 12) earnedPoints = 10;
          else earnedPoints = 15;

          updates.points = currentPoints + earnedPoints;

          // 2. Calculate Cashback (if no discount code used)
          if (!order.discountCode) {
            let cashbackPercent = 0;
            if (totalSpent < 50) cashbackPercent = 0; // Bronce
            else if (totalSpent < 150) cashbackPercent = 1; // Plata
            else if (totalSpent < 500) cashbackPercent = 2; // Oro
            else if (totalSpent < 1000) cashbackPercent = 3; // Platino
            else cashbackPercent = 4; // Diamante

            if (cashbackPercent > 0) {
              let cashbackAmount = price * (cashbackPercent / 100);
              updates.wallet = currentWallet + cashbackAmount;

              // Record the cashback transaction
              db.ref('users/' + order.userId + '/transactions').push({
                id: Date.now().toString(),
                type: 'deposit',
                amount: cashbackAmount,
                description: `Cashback VIP (${cashbackPercent}%) por pedido #${order.id}`,
                date: Date.now()
              });
            }
          }
        }

        db.ref('users/' + order.userId).update(updates).then(() => {
          // --- LÓGICA DE REFERIDOS ---
          if (p.referredBy) {
            db.ref('users').orderByChild('referralCode').equalTo(p.referredBy).once('value').then(refSnap => {
              if (refSnap.exists()) {
                const referrerUid = Object.keys(refSnap.val())[0];
                const referrerData = refSnap.val()[referrerUid];

                const referrerRole = referrerData.role || 'cliente';
                // Solo clientes, influencers y partners pueden ganar por referidos
                if (referrerRole !== 'cliente' && referrerRole !== 'influencer' && referrerRole !== 'partner') return;

                const maxReferrals = (referrerRole === 'influencer' || referrerRole === 'partner') ? (referrerData.referralLimit || 100) : 10;

                let refPoints = referrerData.points || 0;
                let refCount = referrerData.referralsCount || 0;
                let refEarned = referrerData.referralsEarnedPoints || 0;

                let referrerReward = 0;
                let isFirst = false;

                if (!p.hasMadeFirstPurchase) {
                  // Si ya tiene el máximo de amigos, quitamos el referido para que este usuario ya no genere ganancias
                  if (refCount >= maxReferrals) {
                    db.ref('users/' + order.userId).update({ referredBy: null, hasMadeFirstPurchase: true });
                    return;
                  }
                  referrerReward = 15;
                  isFirst = true;
                  db.ref('users/' + order.userId).update({ hasMadeFirstPurchase: true });
                } else {
                  let baseReward = referrerRole === 'partner' ? 3 : 2;
                  if (price >= 2) referrerReward = baseReward;
                  else referrerReward = 1;
                }

                if (referrerReward > 0) {
                  if (isFirst) refCount++;

                  let newRole = referrerRole;
                  if (referrerRole === 'influencer' && refCount >= 100) {
                    newRole = 'partner';
                  }

                  db.ref('users/' + referrerUid).update({
                    role: newRole,
                    points: refPoints + referrerReward,
                    referralsCount: refCount,
                    referralsEarnedPoints: refEarned + referrerReward
                  });

                  db.ref('users/' + referrerUid + '/transactions').push({
                    id: Date.now().toString(),
                    type: 'deposit',
                    amount: 0,
                    description: `Bono referido (${p.name || 'Amigo'}): +${referrerReward} PTS`,
                    date: Date.now()
                  });
                }
              }
            });
          }
          // ---------------------------
        });
      });
    }
  }

  if (newStatus === 'rejected' && order.status !== 'rejected' && order.userId && order.paymentMethodId === 'wallet' && order.productType !== 'wallet-recharge') {
    if (typeof firebase !== 'undefined') {
      const fdb = firebase.database();
      fdb.ref('users/' + order.userId + '/wallet').once('value').then(snap => {
        const currentWallet = parseFloat(snap.val() || 0);
        const amountToRefund = parseFloat(order.priceUsd || 0);
        fdb.ref('users/' + order.userId + '/wallet').set(currentWallet + amountToRefund);
      });
      fdb.ref('users/' + order.userId + '/transactions').push({
        id: Date.now().toString(),
        type: 'deposit',
        amount: parseFloat(order.priceUsd || 0),
        description: `Pago reembolsado por pedido rechazado (#${order.id})`,
        date: Date.now()
      });
    }
  }

  order.status = newStatus;
  if (note) order.adminNote = note;
  order.statusHistory.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || (ORDER_STATUSES[newStatus]?.label || '')
  });
  order.updatedAt = new Date().toISOString();
  saveOrderToDb(order);
  ORDERS = orders;
  return order;
}

function getOrdersByStatus(status) {
  const orders = getOrders();
  return (!status || status === 'all') ? orders : orders.filter(o => o.status === status);
}

function getPendingOrdersCount() {
  return getOrders().filter(o => o.status === 'pending' || o.status === 'processing').length;
}

function deleteOrder(orderId) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) { orders.splice(idx, 1); removeOrderFromDb(orderId); ORDERS = orders; return true; }
  return false;
}

// ── Anti-Spam Functions ──
function getDeviceFingerprint() {
  const nav = navigator;
  const raw = [nav.userAgent, screen.width, screen.height, nav.language, nav.hardwareConcurrency || ''].join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) { hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0; }
  return 'fp-' + Math.abs(hash).toString(36);
}

function saveSpamTracker() {
  saveToDb('spam_tracker', SPAM_TRACKER);
}

function isUserBlocked() {
  if (!SPAM_CONFIG.blocklistEnabled) return false;
  const fp = getDeviceFingerprint();
  const now = Date.now();
  // Clean expired blocks
  SPAM_TRACKER.blocked = SPAM_TRACKER.blocked.filter(b => new Date(b.until).getTime() > now);
  saveSpamTracker();
  return SPAM_TRACKER.blocked.some(b => b.fingerprint === fp);
}

function getBlockedUntil() {
  const fp = getDeviceFingerprint();
  const block = SPAM_TRACKER.blocked.find(b => b.fingerprint === fp);
  if (!block) return null;
  return new Date(block.until);
}

function checkSpamLimit() {
  const fp = getDeviceFingerprint();
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  // Clean old attempts (older than 24h)
  SPAM_TRACKER.attempts = SPAM_TRACKER.attempts.filter(a => new Date(a.timestamp).getTime() > oneDayAgo);

  const myAttempts = SPAM_TRACKER.attempts.filter(a => a.fingerprint === fp);
  const hourlyAttempts = myAttempts.filter(a => new Date(a.timestamp).getTime() > oneHourAgo);
  const dailyAttempts = myAttempts;

  if (hourlyAttempts.length >= SPAM_CONFIG.maxOrdersPerHour || dailyAttempts.length >= SPAM_CONFIG.maxOrdersPerDay) {
    // Block user
    const until = new Date(now + SPAM_CONFIG.cooldownMinutes * 60 * 1000).toISOString();
    if (!SPAM_TRACKER.blocked.some(b => b.fingerprint === fp)) {
      SPAM_TRACKER.blocked.push({ fingerprint: fp, until, reason: 'Exceso de pedidos', timestamp: new Date().toISOString() });
    }
    saveSpamTracker();
    return false; // Blocked
  }
  return true; // Allowed
}

function recordOrderAttempt() {
  SPAM_TRACKER.attempts.push({
    fingerprint: getDeviceFingerprint(),
    timestamp: new Date().toISOString()
  });
  saveSpamTracker();
}

function unblockUser(fingerprint) {
  SPAM_TRACKER.blocked = SPAM_TRACKER.blocked.filter(b => b.fingerprint !== fingerprint);
  saveSpamTracker();
}

function blockUserForFraud(fingerprint, reason = 'Fraude detectado (Pago Duplicado)') {
  const until = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year ban
  if (!SPAM_TRACKER.blocked.some(b => b.fingerprint === fingerprint)) {
    SPAM_TRACKER.blocked.push({ fingerprint, until, reason, timestamp: new Date().toISOString() });
    saveSpamTracker();
  }
}

function getBlockedUsers() {
  const now = Date.now();
  SPAM_TRACKER.blocked = SPAM_TRACKER.blocked.filter(b => new Date(b.until).getTime() > now);
  saveSpamTracker();
  return SPAM_TRACKER.blocked;
}

// ── Telegram API Functions ──
function saveTelegramConfig() {
  saveToDb('telegram_config', TELEGRAM_CONFIG);
}

async function sendTelegramMessage(text, inlineKeyboard) {
  if (!TELEGRAM_CONFIG.enabled || !TELEGRAM_CONFIG.botToken || !TELEGRAM_CONFIG.chatId) return false;
  try {
    const body = {
      chat_id: TELEGRAM_CONFIG.chatId,
      text: text,
      parse_mode: 'HTML'
    };
    if (inlineKeyboard) {
      body.reply_markup = { inline_keyboard: inlineKeyboard };
    }
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return data.ok;
  } catch (e) {
    console.warn('Telegram sendMessage error:', e);
    return false;
  }
}

async function sendTelegramPhoto(photoBlob, caption, inlineKeyboard) {
  if (!TELEGRAM_CONFIG.enabled || !TELEGRAM_CONFIG.botToken || !TELEGRAM_CONFIG.chatId) return false;
  try {
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CONFIG.chatId);
    formData.append('photo', photoBlob, 'comprobante.jpg');
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    if (inlineKeyboard) {
      formData.append('reply_markup', JSON.stringify({ inline_keyboard: inlineKeyboard }));
    }
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return data.ok;
  } catch (e) {
    console.warn('Telegram sendPhoto error:', e);
    return false;
  }
}

function buildOrderTelegramMessage(order) {
  let msg = `🤖 <b>NUEVO PEDIDO — ${order.id}</b>\n`;
  msg += `👤 <b>Jugador:</b> ${order.playerName || 'ㅤ'}\n`;
  msg += `🆔 <b>ID:</b> <code>${order.gameId || order.accountEmail || 'N/A'}</code>\n`;
  msg += `🔥 <b>Producto:</b> ${order.productName} (${order.packageLabel})\n`;
  msg += `💰 <b>Monto:</b> $${order.priceUsd.toFixed(2)} USD | Bs. ${formatBs(order.priceBs)}\n`;

  if (order.discountCode) {
    const discountStr = order.discountType === 'percentage' ? `${order.discountValue}%` : `$${parseFloat(order.discountValue).toFixed(2)} USD`;
    msg += `🎁 <b>Descuento:</b> ${order.discountCode} (-${discountStr})\n`;
  }

  const refNumbers = (order.ocrNumbers && order.ocrNumbers.length > 0) ? order.ocrNumbers.join(', ') : 'Ver comprobante adjunto';
  msg += `🔢 <b>Ref:</b> <code>${refNumbers}</code>\n`;

  msg += `🏦 <b>metodo de pago:</b> ${order.paymentMethodName}\n`;
  msg += `📱 <b>contacto:</b> ${order.customerContact || 'N/A'}\n`;
  return msg;
}

function buildOrderKeyboard(orderId) {
  const baseUrl = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'https://recargaaccessplay.com';
  return [
    [
      { text: '✅ Aprobar', url: `${baseUrl}/admin.html?action=approve&order=${orderId}` },
      { text: '❌ Rechazar', url: `${baseUrl}/admin.html?action=reject&order=${orderId}` }
    ],
    [
      { text: '🔍 Ver en Panel Admin', url: `${baseUrl}/admin.html` }
    ]
  ];
}

function getQuickReplies() {
  if (QUICK_REPLIES && QUICK_REPLIES.length > 0) return QUICK_REPLIES;
  const defaults = [
    { id: 'precios', title: '💰 Precios', keywords: 'precio,tasa,costo', response: '📊 La tasa actual es: 1 USD = Bs. ' + EXCHANGE_RATE.usdToBs + '. Puedes ver los precios de cada producto directamente en el catálogo.' },
    { id: 'pagos', title: '💳 Pagos', keywords: 'pago,pagar,transferencia,problema', response: '💳 Aceptamos Pago Móvil, Binance Pay y Transferencias. Si tuviste un problema con tu pago, por favor aguarda en línea.' },
    { id: 'pedido', title: '⏳ Pedido', keywords: 'pedido,estado,rastrear', response: '📡 Para ver el estado de tu pedido, ve a la sección "🔍 Mis Pedidos" e ingresa tu número de referencia.' },
    { id: 'juegos', title: '🎮 Productos', keywords: 'producto,disponible,juego', response: '🎮 Tenemos un amplio catálogo de productos en categorías como juegos, gift cards, streaming y billeteras. ¡Explora la página principal!' }
  ];
  saveQuickReplies(defaults);
  return defaults;
}

function saveQuickReplies(replies) {
  QUICK_REPLIES = replies;
  saveToDb('quick_replies', replies);
}

function addQuickReply(title, keywords, response) {
  const replies = getQuickReplies();
  replies.push({
    id: 'qr-' + Date.now(),
    title,
    keywords,
    response
  });
  saveQuickReplies(replies);
}

function deleteQuickReply(id) {
  let replies = getQuickReplies();
  replies = replies.filter(r => r.id !== id);
  saveQuickReplies(replies);
}

function updateQuickReply(id, title, keywords, response) {
  const replies = getQuickReplies();
  const index = replies.findIndex(r => r.id === id);
  if (index !== -1) {
    replies[index] = { ...replies[index], title, keywords, response };
    saveQuickReplies(replies);
  }
}

window.deleteQuickReply = function (id) {
  const replies = getQuickReplies();
  const idx = replies.findIndex(r => r.id === id);
  if (idx !== -1) {
    replies.splice(idx, 1);
    saveQuickReplies(replies);
  }
}

window.editQuickReply = function (id, title, keywords, response) {
  const replies = getQuickReplies();
  const idx = replies.findIndex(r => r.id === id);
  if (idx !== -1) {
    replies[idx] = { ...replies[idx], title, keywords, response };
    saveQuickReplies(replies);
  }
}

window.addTransaction = function (userId, type, amount, description) {
  if (typeof firebase === 'undefined') return;
  const txRef = firebase.database().ref('users/' + userId + '/transactions').push();
  txRef.set({
    id: txRef.key,
    type: type,
    amount: amount,
    description: description,
    date: Date.now()
  });
};
