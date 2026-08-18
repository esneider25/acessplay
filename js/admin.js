// ============================================================
// AccessPlay Admin Panel Logic (Enhanced)
// ============================================================

// ── State ──
const adminState = {
  currentTab: 'dashboard',
  editingProductId: null,
  editingCategoryId: null,
  tempPackages: [],
  ordersFilter: 'all',
  ordersPage: 1,
  crmPage: 1,
  ordersSearch: '',
  customersSearch: '',
  dashboardStartDate: '',
  dashboardEndDate: ''
};

let lastPendingOrders = 0;
let lastUnreadMessages = 0;
const notifySound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

let adminAuthVerified = false;

// ── Initialization ──
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredAdminPrompt = e;
});

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('recargaaccessplay_theme') === 'light') {
    document.body.classList.add('light-theme');
  }

  // Ensure loading UI and diagnostics are shown immediately
  initAdminApp();

  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user && user.email === 'admin@accesplay.com') {
        adminAuthVerified = true;
        if (window.DATA_LOADED) initAdminApp();
      } else {
        adminAuthVerified = false;
        window.location.href = 'index.html';
      }
    });
  }
});

function toggleAdminTheme() {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  localStorage.setItem('recargaaccessplay_theme', isLight ? 'light' : 'dark');
}

function initAdminApp() {
  const container = document.getElementById('admin-app');
  if (!container) return;

  if (!window.DATA_LOADED) {
    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-deep);">
        <div class="tracking-spinner" style="font-size: 3rem;">🤖</div>
        <h2 style="margin-top: 20px; color: var(--accent);">Conectando con la base de datos...</h2>
        <div id="diagnostic-info" style="margin-top: 20px; color: #ffb74d; font-family: monospace; text-align: center; max-width: 80%;">
          Comprobando estado...
        </div>
        <button onclick="location.reload(true)" style="margin-top: 20px; padding: 8px 16px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Forzar Recarga</button>
      </div>
    `;

    // Add a diagnostic interval
    if (!window.diagInterval) {
      window.diagInterval = setInterval(() => {
        const info = document.getElementById('diagnostic-info');
        if (info) {
          info.innerHTML = `
            Firebase definido: ${typeof firebase !== 'undefined'}<br>
            Auth verificado: ${adminAuthVerified}<br>
            Datos cargados: ${window.DATA_LOADED}<br>
            Llaves cargadas: ${typeof loadedKeys !== 'undefined' ? loadedKeys.size : 'N/A'}/15<br>
            Versión: 19
          `;
        }
      }, 1000);
    }
    return;
  }

  if (!adminAuthVerified) {
    renderAdminLogin(container);
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const orderId = urlParams.get('order');

  if (action && orderId) {
    handleUrlAction(action, orderId);
  }

  // Request Push Notification permission if supported
  if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  container.innerHTML = `
    <div class="admin-container">
      <aside class="admin-sidebar">
        <div class="admin-logo">
          <img src="img/logo.png" alt="AccessPlay Admin" style="height: 40px; width: auto; object-fit: contain; margin-right: 10px;">
          <span class="admin-logo-text" style="font-size: 1.1rem;">Admin</span>
        </div>
        <ul class="admin-nav">
          <li class="admin-nav-item active" data-tab="dashboard" onclick="switchTab('dashboard')">
            <span class="admin-nav-icon">📊</span> Resumen
          </li>
          <li class="admin-nav-item" data-tab="orders" onclick="switchTab('orders')">
            <span class="admin-nav-icon">📋</span> Pedidos
            ${getPendingOrdersCount() > 0 ? `<span class="admin-nav-badge">${getPendingOrdersCount()}</span>` : ''}
          </li>
          <li class="admin-nav-item" data-tab="products" onclick="switchTab('products')">
            <span class="admin-nav-icon">🎮</span> Productos
          </li>
          <li class="admin-nav-item" data-tab="tournaments" onclick="switchTab('tournaments')">
            <span class="admin-nav-icon">🏆</span> Torneos
          </li>
          <li class="admin-nav-item" data-tab="customers" onclick="switchTab('customers')">
            <span class="admin-nav-icon">👥</span> Clientes
          </li>
          <li class="admin-nav-item" data-tab="influencers" onclick="switchTab('influencers')">
            <span class="admin-nav-icon">🌟</span> Influencers VIP
          </li>
          <li class="admin-nav-item" data-tab="banners" onclick="switchTab('banners')">
            <span class="admin-nav-icon">🖼️</span> Banners
          </li>
          <li class="admin-nav-item" data-tab="landing" onclick="switchTab('landing')">
            <span class="admin-nav-icon">🎨</span> Diseño Web
          </li>
          <li class="admin-nav-item" data-tab="categories" onclick="switchTab('categories')">
            <span class="admin-nav-icon">📁</span> Categorías
          </li>
          <li class="admin-nav-item" data-tab="payments" onclick="switchTab('payments')">
            <span class="admin-nav-icon">💳</span> Métodos de Pago
          </li>
          <li class="admin-nav-item" data-tab="exchange" onclick="switchTab('exchange')">
            <span class="admin-nav-icon">💵</span> Tasa de Cambio
          </li>
          <li class="admin-nav-item" data-tab="apis" onclick="switchTab('apis')">
            <span class="admin-nav-icon">📡</span> APIs
          </li>
          <li class="admin-nav-item" data-tab="discounts" onclick="switchTab('discounts')">
            <span class="admin-nav-icon">🏷️</span> Descuentos
          </li>
          <li class="admin-nav-item" data-tab="withdrawals" onclick="switchTab('withdrawals')">
            <span class="admin-nav-icon">💸</span> Retiros
          </li>
          <li class="admin-nav-item" data-tab="telegram" onclick="switchTab('telegram')">
            <span class="admin-nav-icon">📲</span> Telegram
          </li>
          <li class="admin-nav-item" data-tab="pins" onclick="switchTab('pins')">
            <span class="admin-nav-icon">🎫</span> Pines
          </li>
          <li class="admin-nav-item" data-tab="messages" onclick="switchTab('messages')">
            <span class="admin-nav-icon">💬</span> Mensajes
            ${getUnreadMessagesCount() > 0 ? `<span class="admin-nav-badge" style="background:var(--error);">${getUnreadMessagesCount()}</span>` : ''}
          </li>
          <li class="admin-nav-item" data-tab="quick-replies" onclick="switchTab('quick-replies')">
            <span class="admin-nav-icon">🤖</span> Respuestas Rápidas
          </li>
          <li class="admin-nav-item" data-tab="settings" onclick="switchTab('settings')">
            <span class="admin-nav-icon">⚙️</span> Configuración
          </li>
        </ul>
        <div class="admin-sidebar-footer" style="display:flex; flex-direction:column; gap:10px;">
          <button id="pwa-install-sidebar-btn" onclick="handleAdminInstallClick()" class="admin-view-store-btn" style="background:var(--accent); color:white; cursor:pointer;">
            📲 Instalar App
          </button>
          <button class="admin-view-store-btn" onclick="toggleAdminTheme()" style="background:var(--bg-surface); color:var(--text-primary); cursor:pointer;">
            🌓 Alternar Tema
          </button>
        </div>
      </aside>
      <main class="admin-main" id="admin-main-content"></main>
    </div>
    <div class="admin-modal-overlay" id="admin-modal-overlay">
      <div class="admin-modal" id="admin-modal-content"></div>
    </div>
  `;

  renderActiveTab();
}

function handleAdminInstallClick() {
  if (window.deferredAdminPrompt) {
    window.deferredAdminPrompt.prompt();
    window.deferredAdminPrompt.userChoice.then((choice) => {
      window.deferredAdminPrompt = null;
    });
    return;
  }

  window.showManualInstallModal();
}

function renderAdminLogin(container) {
  container.innerHTML = `
    <div style="position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-deep); color: var(--text-primary); text-align: center; padding: 20px;">
      <div style="font-size: 4rem; margin-bottom: 20px;">🛡️</div>
      <h1 style="font-family: var(--font-display); font-size: 2rem; margin-bottom: 10px;">Acceso Administrativo</h1>
      <p style="color: var(--text-secondary); max-width: 400px; line-height: 1.5; margin-bottom: 30px;">
        Por favor, ingresa tus credenciales para acceder al panel.
      </p>
      
      <form id="admin-login-form" style="width: 100%; max-width: 320px; text-align: left; background: var(--bg-surface); padding: 30px; border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div class="admin-form-group" style="margin-bottom: 16px;">
          <label class="admin-form-label" style="display: block; font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px;">Correo Electrónico</label>
          <input type="email" id="admin-email" class="admin-form-input" style="width: 100%; padding: 10px 14px; background: var(--bg-deep); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); outline: none;" required>
        </div>
        <div class="admin-form-group" style="margin-bottom: 24px;">
          <label class="admin-form-label" style="display: block; font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px;">Contraseña</label>
          <input type="password" id="admin-pass" class="admin-form-input" style="width: 100%; padding: 10px 14px; background: var(--bg-deep); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); outline: none;" required>
        </div>
        <button type="submit" id="admin-login-btn" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px; font-size: 1rem; border: none; border-radius: var(--radius-md); cursor: pointer;">Iniciar Sesión</button>
        <div id="admin-login-error" style="color: #ff6b6b; font-size: 0.85rem; margin-top: 15px; text-align: center; display: none;">Credenciales incorrectas.</div>
      </form>
      
      <button id="pwa-install-btn" onclick="handleAdminInstallClick()" class="btn btn-secondary" style="margin-top: 15px; width: 100%; max-width: 320px; justify-content: center; background: rgba(14, 165, 233, 0.1); border: 1px solid var(--accent); color: var(--accent); padding: 12px; border-radius: var(--radius-md); font-size: 0.95rem; cursor: pointer; transition: all 0.3s ease;">📲 Instalar App Admin</button>
      
      <a href="index.html" class="admin-view-store-btn" style="margin-top: 30px; border: none; background: transparent; color: var(--text-muted); text-decoration: none; font-size: 0.9rem;">← Volver a la Tienda</a>
    </div>
  `;

  document.getElementById('admin-login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const pass = document.getElementById('admin-pass').value.trim();
    const btn = document.getElementById('admin-login-btn');
    const errorDiv = document.getElementById('admin-login-error');

    if (!email || !pass) return;

    btn.innerHTML = 'Verificando... <span class="tracking-spinner" style="display:inline-block; font-size: 0.9rem;">⏳</span>';
    btn.disabled = true;
    errorDiv.style.display = 'none';

    firebase.auth().signInWithEmailAndPassword(email, pass)
      .then(result => {
        if (result.user.email !== 'admin@accesplay.com') {
          firebase.auth().signOut().then(() => {
            errorDiv.textContent = 'Acceso denegado: No eres administrador.';
            errorDiv.style.display = 'block';
            btn.innerHTML = 'Iniciar Sesión';
            btn.disabled = false;
          });
        }
        // If it is admin, onAuthStateChanged in admin.js will automatically trigger initAdminApp()
      })
      .catch(error => {
        console.error('Admin Login Error:', error);
        errorDiv.textContent = 'Credenciales incorrectas o error de conexión.';
        errorDiv.style.display = 'block';
        btn.innerHTML = 'Iniciar Sesión';
        btn.disabled = false;
      });
  });
}

// ── Tab Switching ──
function switchTab(tabId) {
  adminState.currentTab = tabId;
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
  });
  renderActiveTab();
}

function renderActiveTab() {
  const main = document.getElementById('admin-main-content');
  if (!main) return;

  // Initialize notification counts when layout loads
  lastPendingOrders = getPendingOrdersCount();
  lastUnreadMessages = getUnreadMessagesCount();

  switch (adminState.currentTab) {
    case 'dashboard': 
      if (adminState.showHistorical && adminState.historicalOrders) {
        renderDashboard(main, adminState.historicalOrders);
      } else {
        renderDashboard(main);
      }
      break;
    case 'orders': renderOrders(main); break;
    case 'products': renderProducts(main); break;
    case 'customers': renderCustomers(main); break;
    case 'influencers':
      if (typeof renderInfluencers === 'function') renderInfluencers(main);
      break;
    case 'banners': renderBanners(main); break;
    case 'landing': renderLanding(main); break;
    case 'categories': renderCategories(main); break;
    case 'tournaments': renderTournaments(main); break;
    case 'payments': renderPayments(main); break;
    case 'exchange': renderExchange(main); break;
    case 'apis': renderApis(main); break;
    case 'discounts': renderDiscounts(main); break;
    case 'telegram': renderTelegram(main); break;
    case 'messages': renderMessages(main); break;
    case 'quick-replies': renderQuickReplies(main); break;
    case 'withdrawals': renderWithdrawals(main); break;
    case 'settings': renderSettings(main); break;
    case 'pins':
      if (typeof renderPins === 'function') renderPins(main);
      break;
    default: renderDashboard(main);
  }
}

// ── Helper: Unread Messages Count ──
function getUnreadMessagesCount() {
  return getMessages().filter(m => m.hasUnreadAdmin).length;
}

