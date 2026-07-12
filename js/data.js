// ============================================================
// AccessPlay — Data Layer: Products, Categories, APIs & Config
// ============================================================

const VIP_TIERS = [
  { max: 1, name: 'Novato', cashback: 0, color: '#888', gradient: 'linear-gradient(135deg, #aaa, #666)' },
  { max: 20, name: 'BRONCE I', cashback: 0.2, color: '#cd7f32', gradient: 'linear-gradient(135deg, #d4a373, #a68a64)' },
  { max: 40, name: 'BRONCE II', cashback: 0.4, color: '#cd7f32', gradient: 'linear-gradient(135deg, #d4a373, #a68a64)' },
  { max: 60, name: 'BRONCE III', cashback: 0.6, color: '#cd7f32', gradient: 'linear-gradient(135deg, #d4a373, #a68a64)' },
  { max: 80, name: 'BRONCE IV', cashback: 0.8, color: '#cd7f32', gradient: 'linear-gradient(135deg, #d4a373, #a68a64)' },
  { max: 100, name: 'BRONCE V', cashback: 1.0, color: '#cd7f32', gradient: 'linear-gradient(135deg, #d4a373, #a68a64)' },
  { max: 120, name: 'PLATA I', cashback: 1.2, color: '#c0c0c0', gradient: 'linear-gradient(135deg, #e0e0e0, #a0a0a0)' },
  { max: 140, name: 'PLATA II', cashback: 1.4, color: '#c0c0c0', gradient: 'linear-gradient(135deg, #e0e0e0, #a0a0a0)' },
  { max: 160, name: 'PLATA III', cashback: 1.6, color: '#c0c0c0', gradient: 'linear-gradient(135deg, #e0e0e0, #a0a0a0)' },
  { max: 180, name: 'PLATA IV', cashback: 1.8, color: '#c0c0c0', gradient: 'linear-gradient(135deg, #e0e0e0, #a0a0a0)' },
  { max: 200, name: 'PLATA V', cashback: 2.0, color: '#c0c0c0', gradient: 'linear-gradient(135deg, #e0e0e0, #a0a0a0)' },
  { max: 220, name: 'ORO I', cashback: 2.2, color: '#ffd700', gradient: 'linear-gradient(135deg, #ffe066, #f5af19)' },
  { max: 240, name: 'ORO II', cashback: 2.4, color: '#ffd700', gradient: 'linear-gradient(135deg, #ffe066, #f5af19)' },
  { max: 260, name: 'ORO III', cashback: 2.6, color: '#ffd700', gradient: 'linear-gradient(135deg, #ffe066, #f5af19)' },
  { max: 280, name: 'ORO IV', cashback: 2.8, color: '#ffd700', gradient: 'linear-gradient(135deg, #ffe066, #f5af19)' },
  { max: 300, name: 'ORO V', cashback: 3.0, color: '#ffd700', gradient: 'linear-gradient(135deg, #ffe066, #f5af19)' },
  { max: 320, name: 'DIAMANTE I', cashback: 3.2, color: '#b9f2ff', gradient: 'linear-gradient(135deg, #00c6ff, #0072ff)' },
  { max: 340, name: 'DIAMANTE II', cashback: 3.4, color: '#b9f2ff', gradient: 'linear-gradient(135deg, #00c6ff, #0072ff)' },
  { max: 360, name: 'DIAMANTE III', cashback: 3.6, color: '#b9f2ff', gradient: 'linear-gradient(135deg, #00c6ff, #0072ff)' },
  { max: 380, name: 'DIAMANTE IV', cashback: 3.8, color: '#b9f2ff', gradient: 'linear-gradient(135deg, #00c6ff, #0072ff)' },
  { max: Infinity, name: 'DIAMANTE V', cashback: 4.0, color: '#b9f2ff', gradient: 'linear-gradient(135deg, #00c6ff, #0072ff)' }
];

function getVipLevel(spent) {
  for (let i = 0; i < VIP_TIERS.length; i++) {
    if (spent < VIP_TIERS[i].max) {
      let tier = VIP_TIERS[i];
      return {
        name: tier.name,
        color: tier.color,
        gradient: tier.gradient,
        nextThreshold: tier.max === Infinity ? null : tier.max,
        cashback: tier.cashback
      };
    }
  }
  return { name: 'DIAMANTE V', color: '#b9f2ff', gradient: 'linear-gradient(135deg, #00c6ff, #0072ff)', nextThreshold: null, cashback: 4.0 };
}

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
    { q: '✅ ¿Cómo sé si mi pedido fue exitoso?', a: 'Al finalizar tu compra, recibirás un número de referencia (Ej: AP-1234). Puedes ingresar ese código en la sección de <strong>"🔍 Mis Pedidos"</strong> en el menú superior para ver el estado en tiempo real.' }
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
  enabled: true,
  notifyNewOrder: true,
  notifyWithPhoto: true
};

// 🛡️ Anti-Spam Configuration 🛡️
let _antiSpamConf = {
  maxOrdersPerHour: 5,
  maxOrdersPerDay: 15,
  cooldownMinutes: 30,
  blocklistEnabled: true
};
Object.freeze(_antiSpamConf);

// 🕵️ Spam Tracker 🕵️──
let _sysTracking = {
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
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'AP-' + randomNum + '-' + randomStr;
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

  const isAdmin = window.location.pathname.includes('admin');
  const userLoggedIn = typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser;
  
  const baseKeys = ['products', 'categories', 'payment_methods', 'exchange_rate', 'settings', 'banners', 'landing_config', 'discounts'];
  const keysToLoad = isAdmin 
    ? ['products', 'categories', 'payment_methods', 'exchange_rate', 'settings', 'api_configs', 'discounts', 'messages', 'orders', 'telegram_config', 'quick_replies', '_sysTracking', 'order_counter', 'banners', 'landing_config']
    : baseKeys;
  
  const loadedKeys = new Set();

  function checkLoadComplete(key) {
    loadedKeys.add(key);
    if (loadedKeys.size >= keysToLoad.length && !window.DATA_LOADED) {
      window.DATA_LOADED = true;
      if (typeof renderApp === 'function') renderApp();
      if (typeof initAdminApp === 'function') initAdminApp();
    } else if (window.DATA_LOADED) {
      const uiKeys = ['products', 'categories', 'payment_methods', 'exchange_rate', 'settings', 'banners', 'landing_config', 'discounts'];
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
    let dbRef = db.ref('/' + key);
    if (key === 'orders') {
      dbRef = dbRef.orderByChild('createdAt').limitToLast(150);
    }
    db.ref('/' + key).off('value');
    dbRef.on('value', (snapshot) => {
      const data = snapshot.val();
      try {
        if (data !== null && data !== undefined) {
          const toArray = (d) => Array.isArray(d) ? d.filter(Boolean) : Object.values(d);
          if (key === 'products') { 
            PRODUCTS.length = 0; 
            toArray(data).forEach(p => {
              if (p.packages) {
                p.packages = (Array.isArray(p.packages) ? p.packages : Object.values(p.packages)).filter(Boolean);
              } else {
                p.packages = [];
              }
              PRODUCTS.push(p); 
            }); 
          }
          else if (key === 'categories') { CATEGORIES.length = 0; toArray(data).forEach(c => CATEGORIES.push(c)); }
          else if (key === 'payment_methods') { PAYMENT_METHODS.length = 0; toArray(data).forEach(p => PAYMENT_METHODS.push(p)); }
          else if (key === 'exchange_rate') Object.assign(EXCHANGE_RATE, data);
          else if (key === 'settings') Object.assign(SITE_SETTINGS, data);
          else if (key === 'landing_config') Object.assign(LANDING_CONFIG, data);
          else if (key === 'api_configs') { API_CONFIGS.length = 0; toArray(data).forEach(a => API_CONFIGS.push(a)); }
          else if (key === 'discounts') { DISCOUNT_CODES.length = 0; toArray(data).forEach(d => DISCOUNT_CODES.push(d)); }
          else if (key === 'messages') { 
            MESSAGES = toArray(data); 
            if (typeof updateAdminMessagesUI === 'function') updateAdminMessagesUI();
            if (typeof updateAdminSidebarBadges === 'function') updateAdminSidebarBadges();
          }
          else if (key === 'orders') {
            let newOrders = [];
            if (!data) newOrders = [];
            else if (Array.isArray(data)) newOrders = data.filter(Boolean);
            else newOrders = Object.values(data).filter(Boolean);
            
            // Preserve currently tracked order if it's older than the limit
            if (typeof appState !== 'undefined' && appState.currentView === 'tracking' && appState.trackingOrderId) {
              const trackedOrder = getOrderById(appState.trackingOrderId);
              if (trackedOrder && !newOrders.some(o => o.id === trackedOrder.id)) {
                newOrders.push(trackedOrder);
              }
            }
            
            ORDERS = newOrders;
            ORDERS.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          }
          else if (key === 'telegram_config') Object.assign(TELEGRAM_CONFIG, data);
          else if (key === 'quick_replies') QUICK_REPLIES = data;
          else if (key === '_sysTracking') {
            _sysTracking.attempts = data.attempts || [];
            _sysTracking.blocked = data.blocked || [];
          }
          else if (key === 'order_counter') localStorage.setItem('recargaaccessplay_order_counter', data.toString());
          else if (key === 'banners') { BANNERS = toArray(data); }
        }
      } catch (err) {
        console.error('Error parsing data for key: ' + key, err);
      }
      checkLoadComplete(key);
    }, (error) => {
      console.warn('Acceso denegado a ' + key + ' (normal si no es admin)');
      checkLoadComplete(key);
    });
  });

  // Fallback to prevent freezing if any key fails to load
  setTimeout(() => {
    if (!window.DATA_LOADED) {
      console.warn('Forcing DATA_LOADED true after timeout');
      window.DATA_LOADED = true;
      if (typeof renderApp === 'function') renderApp();
      if (typeof initAdminApp === 'function') initAdminApp();
    }
  }, 4000);
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
  'invalid-id': { label: 'ID Inválido', icon: '⚠️', color: '#ffa726', bg: 'rgba(255,167,38,0.15)' },
  'replaced': { label: 'Reemplazado', icon: '🔄', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' }
};

// ── Discounts CRUD ──
function getDiscounts() {
  return DISCOUNT_CODES;
}

function saveDiscounts() {
  saveToDb('discounts', DISCOUNT_CODES);
}

function createDiscount(code, type, value, expiryDate = null, globalLimit = null, perClientLimit = null) {
  const newCode = code.trim().toUpperCase();
  if (DISCOUNT_CODES.some(d => d.code === newCode)) return false;
  DISCOUNT_CODES.push({
    code: newCode,
    type: type, // 'percentage' or 'fixed'
    value: parseFloat(value),
    expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
    globalLimit: globalLimit ? parseInt(globalLimit) : null,
    perClientLimit: perClientLimit ? parseInt(perClientLimit) : null,
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

function validateDiscount(code, contact = null) {
  const target = code.trim().toUpperCase();
  const d = DISCOUNT_CODES.find(d => d.code === target && d.active);
  if (!d) return null;

  if (d.expiryDate && new Date() > new Date(d.expiryDate)) {
    return null;
  }

  const allOrdersWithCode = getOrders().filter(o => o.discountCode === target && o.status !== 'rejected');
  
  if (d.globalLimit && allOrdersWithCode.length >= d.globalLimit) {
    return null;
  }

  if (d.perClientLimit && contact) {
    const clientUses = allOrdersWithCode.filter(o => o.customerContact === contact).length;
    if (clientUses >= d.perClientLimit) {
      return null;
    }
  }

  return d;
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
  // Local UI Update for instant feedback
  let localConv = MESSAGES.find(m => m.sessionId === sessionId);
  if (!localConv) {
    localConv = { sessionId, contact: contact || 'Desconocido', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [], hasUnreadAdmin: false, hasUnreadUser: false };
    MESSAGES.push(localConv);
  } else if (contact) {
    localConv.contact = contact;
  }
  
  if (text) {
    localConv.messages.push({
      id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      sender: sender,
      text: text,
      timestamp: new Date().toISOString()
    });
  }
  localConv.updatedAt = new Date().toISOString();
  if (sender === 'user') localConv.hasUnreadAdmin = true;
  else localConv.hasUnreadUser = true;

  // DB Transaction to avoid overwriting other chats
  if (typeof firebase !== 'undefined') {
    firebase.database().ref('messages/' + sessionId).transaction((conv) => {
      if (!conv) {
        conv = {
          sessionId: sessionId,
          contact: contact || 'Desconocido',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
          hasUnreadAdmin: false,
          hasUnreadUser: false
        };
      } else if (contact) {
        conv.contact = contact;
      }

      if (text) {
        if (!conv.messages) conv.messages = [];
        if (!Array.isArray(conv.messages)) conv.messages = Object.values(conv.messages).filter(Boolean);
        conv.messages.push({
          id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          sender: sender,
          text: text,
          timestamp: new Date().toISOString()
        });
      }
      conv.updatedAt = new Date().toISOString();
      if (sender === 'user') conv.hasUnreadAdmin = true;
      else conv.hasUnreadUser = true;
      
      return conv;
    });
  }
}

function syncUserChat(sessionId) {
  if (typeof firebase === 'undefined' || window.location.pathname.includes('admin')) return;
  firebase.database().ref('messages/' + sessionId).on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const idx = MESSAGES.findIndex(m => m.sessionId === sessionId);
      if (idx !== -1) {
        MESSAGES[idx] = data;
      } else {
        MESSAGES.push(data);
      }
      if (typeof renderSupportMessages === 'function') renderSupportMessages();
    }
  });
}

function markMessagesAsRead(sessionId, reader) {
  // Local update
  let localConv = MESSAGES.find(m => m.sessionId === sessionId);
  if (localConv) {
    if (reader === 'admin') localConv.hasUnreadAdmin = false;
    if (reader === 'user') localConv.hasUnreadUser = false;
  }
  
  // DB Transaction
  if (typeof firebase !== 'undefined') {
    firebase.database().ref('messages/' + sessionId).transaction((conv) => {
      if (!conv) return conv;
      
      let changed = false;
      if (reader === 'admin' && conv.hasUnreadAdmin) {
        conv.hasUnreadAdmin = false;
        changed = true;
      }
      if (reader === 'user' && conv.hasUnreadUser) {
        conv.hasUnreadUser = false;
        changed = true;
      }
      if (changed) return conv;
      return; // return undefined aborts the transaction
    });
  }
}

function saveMessages() {
  // Deprecated: handled via transaction now
}

// ── Orders CRUD ──
function subscribeToGuestOrder(orderId) {
  if (typeof firebase === 'undefined' || !orderId) return;
  const db = firebase.database();
  db.ref('orders/' + orderId).off('value'); 
  db.ref('orders/' + orderId).on('value', (snapshot) => {
    if (snapshot.exists()) {
      const updatedOrder = snapshot.val();
      const idx = ORDERS.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        ORDERS[idx] = updatedOrder;
      } else {
        ORDERS.push(updatedOrder);
      }
      if (typeof appState !== 'undefined' && appState.currentView === 'tracking' && appState.trackingOrderId === orderId) {
        if (typeof renderApp === 'function') renderApp();
      }
    }
  });
}
function getOrders() {
  const canceledIds = [20, 31, 46, 49, 50, 62, 63, 81, 82, 84, 85, 86, 88, 103, 121, 134, 139, 173, 178, 179, 180, 210, 223, 231, 246, 274, 286, 307, 348, 350, 351, 358, 370, 374, 407, 415, 439, 471, 472, 473, 482, 485, 487, 488, 489, 500, 503, 505, 517].map(id => 'AP-OLD-' + id);
  const processingIds = [1, 143, 236, 369].map(id => 'AP-OLD-' + id);

  return ORDERS.map(o => {
    if (o.status === 'completado') o.status = 'completed';
    if (o.status === 'rechazado' || o.status === 'cancelado') o.status = 'rejected';
    if (o.status === 'pendiente') o.status = 'pending';
    if (o.status === 'procesando') o.status = 'processing';
    
    // Auto-heal orders that were erroneously exported as 'pendiente' in Firebase
    if (canceledIds.includes(o.id)) o.status = 'rejected';
    if (processingIds.includes(o.id)) o.status = 'processing';
    
    if (!o.productName && o.productDetails) o.productName = o.productDetails;
    if (!o.packageLabel) o.packageLabel = 'Migrado';
    if (!o.paymentMethodName && o.paymentMethod) o.paymentMethodName = o.paymentMethod;
    if (!o.customerContact && (o.userEmail || o.userPhone)) o.customerContact = o.userEmail || o.userPhone;
    
    return o;
  });
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
    id: data.id || generateOrderRef(),
    screenshot: data.screenshot || null,
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
    costUsd: data.costUsd || 0,
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
          if (price < 5) earnedPoints = 2;
          else if (price <= 12) earnedPoints = 4;
          else earnedPoints = 7;

          updates.points = currentPoints + earnedPoints;

          // 2. Calculate Cashback (if no discount code used)
          if (!order.discountCode) {
            let vip = typeof getVipLevel === 'function' ? getVipLevel(newSpent) : { cashback: 0 };
            let cashbackPercent = vip.cashback || 0;

            if (cashbackPercent > 0) {
              let cashbackAmount = price * (cashbackPercent / 100);
              updates.wallet = currentWallet + cashbackAmount;

              // Record the cashback transaction
              db.ref('users/' + order.userId + '/transactions').push({
                id: Date.now().toString(),
                type: 'deposit',
                amount: cashbackAmount,
                description: `Cashback VIP (${cashbackPercent.toFixed(1)}%) por pedido #${order.id}`,
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
                  referrerReward = 12;
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
  if (!order.statusHistory) order.statusHistory = [];
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
  saveToDb('_sysTracking', _sysTracking);
}

function isUserBlocked() {
  if (!_antiSpamConf.blocklistEnabled) return false;
  const fp = getDeviceFingerprint();
  const now = Date.now();
  // Clean expired blocks
  _sysTracking.blocked = _sysTracking.blocked.filter(b => new Date(b.until).getTime() > now);
  saveSpamTracker();
  return _sysTracking.blocked.some(b => b.fingerprint === fp);
}

function getBlockedUntil() {
  const fp = getDeviceFingerprint();
  const block = _sysTracking.blocked.find(b => b.fingerprint === fp);
  if (!block) return null;
  return new Date(block.until);
}

function checkSpamLimit() {
  const fp = getDeviceFingerprint();
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  // Clean old attempts (older than 24h)
  _sysTracking.attempts = _sysTracking.attempts.filter(a => new Date(a.timestamp).getTime() > oneDayAgo);

  const myAttempts = _sysTracking.attempts.filter(a => a.fingerprint === fp);
  const hourlyAttempts = myAttempts.filter(a => new Date(a.timestamp).getTime() > oneHourAgo);
  const dailyAttempts = myAttempts;

  if (hourlyAttempts.length >= _antiSpamConf.maxOrdersPerHour || dailyAttempts.length >= _antiSpamConf.maxOrdersPerDay) {
    // Block user
    const until = new Date(now + _antiSpamConf.cooldownMinutes * 60 * 1000).toISOString();
    if (!_sysTracking.blocked.some(b => b.fingerprint === fp)) {
      _sysTracking.blocked.push({ fingerprint: fp, until, reason: 'Exceso de pedidos', timestamp: new Date().toISOString() });
    }
    saveSpamTracker();
    return false; // Blocked
  }
  return true; // Allowed
}

function recordOrderAttempt() {
  _sysTracking.attempts.push({
    fingerprint: getDeviceFingerprint(),
    timestamp: new Date().toISOString()
  });
  saveSpamTracker();
}

function unblockUser(fingerprint) {
  _sysTracking.blocked = _sysTracking.blocked.filter(b => b.fingerprint !== fingerprint);
  saveSpamTracker();
}

function blockUserForFraud(fingerprint, reason = 'Fraude detectado (Pago Duplicado)') {
  const until = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year ban
  if (!_sysTracking.blocked.some(b => b.fingerprint === fingerprint)) {
    _sysTracking.blocked.push({ fingerprint, until, reason, timestamp: new Date().toISOString() });
    saveSpamTracker();
  }
}

function getBlockedUsers() {
  const now = Date.now();
  _sysTracking.blocked = _sysTracking.blocked.filter(b => new Date(b.until).getTime() > now);
  saveSpamTracker();
  return _sysTracking.blocked;
}

// ── Telegram API Functions ──
function saveTelegramConfig() {
  saveToDb('telegram_config', TELEGRAM_CONFIG);
}

async function sendTelegramMessage(text, inlineKeyboard) {
  if (!TELEGRAM_CONFIG.enabled) return false;
  try {
    const body = {
      type: 'message',
      text: text,
      inlineKeyboard: inlineKeyboard || null
    };
    
    const res = await fetch('/api/telegram', {
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
  if (!TELEGRAM_CONFIG.enabled) return false;
  try {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64data = reader.result.split(',')[1];
          const body = {
            type: 'photo',
            text: caption,
            inlineKeyboard: inlineKeyboard || null,
            photoBase64: base64data
          };
          
          const res = await fetch('/api/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await res.json();
          resolve(data.ok);
        } catch (e) {
          console.warn('Telegram proxy photo error:', e);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(photoBlob);
    });
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
  return [
    [
      { text: '✅ Aprobar', url: `${window.location.origin}/admin.html?action=approve&order=${orderId}` },
      { text: '❌ Rechazar', url: `${window.location.origin}/admin.html?action=reject&order=${orderId}` }
    ],
    [
      { text: '🔍 Ver en Panel Admin', url: `${window.location.origin}/admin.html` }
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
