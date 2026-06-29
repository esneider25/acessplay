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
        if (window.DATA_LOADED) initAdminApp();
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
          <li class="admin-nav-item" data-tab="customers" onclick="switchTab('customers')">
            <span class="admin-nav-icon">👥</span> Clientes
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
    case 'banners': renderBanners(main); break;
    case 'landing': renderLanding(main); break;
    case 'categories': renderCategories(main); break;
    case 'payments': renderPayments(main); break;
    case 'exchange': renderExchange(main); break;
    case 'apis': renderApis(main); break;
    case 'discounts': renderDiscounts(main); break;
    case 'telegram': renderTelegram(main); break;
    case 'messages': renderMessages(main); break;
    case 'quick-replies': renderQuickReplies(main); break;
    case 'withdrawals': renderWithdrawals(main); break;
    case 'settings': renderSettings(main); break;
    default: renderDashboard(main);
  }
}

// ── Helper: Unread Messages Count ──
function getUnreadMessagesCount() {
  return getMessages().filter(m => m.hasUnreadAdmin).length;
}

// ════════════════════════════════════════
// 1. DASHBOARD
// ════════════════════════════════════════
function renderDashboard(container, forcedOrders = null) {
  let allOrders = forcedOrders || getOrders();

  // Date filtering
  if (adminState.dashboardStartDate) {
    const start = new Date(adminState.dashboardStartDate).getTime();
    allOrders = allOrders.filter(o => o.createdAt >= start);
  }
  if (adminState.dashboardEndDate) {
    const end = new Date(adminState.dashboardEndDate);
    end.setHours(23, 59, 59, 999);
    allOrders = allOrders.filter(o => o.createdAt <= end.getTime());
  }

  const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'completado');
  const rejectedOrders = allOrders.filter(o => o.status === 'rejected' || o.status === 'invalid-id' || o.status === 'rechazado');
  const pendingCount = allOrders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'pendiente').length;
  const completedCount = completedOrders.length;
  const totalProcessed = completedCount + rejectedOrders.length;
  const rejectionRate = totalProcessed > 0 ? ((rejectedOrders.length / totalProcessed) * 100).toFixed(1) : 0;

  let totalResponseTimeMs = 0;
  let validResponseCount = 0;
  let totalRevenue = 0;
  let totalCost = 0;

  completedOrders.forEach(o => {
    totalRevenue += Number(o.priceUsd) || 0;
    let cost = 0;
    if (o.costUsd !== undefined && o.costUsd !== null && parseFloat(o.costUsd) > 0) {
      cost = parseFloat(o.costUsd) || 0;
    } else {
      let pkg = null;
      const searchLabel = String(o.packageLabel || o.productDetails || '').toLowerCase();
      const orderPrice = Number(o.priceUsd) || 0;
      let prodList = o.productId && o.productId !== 'legacy' ? PRODUCTS.filter(p => p.id === o.productId) : PRODUCTS;

      // First pass: try to find a package that matches the exact sales price (as requested by user)
      for (let i = 0; i < prodList.length; i++) {
        if (prodList[i].packages) {
          pkg = prodList[i].packages.find(p => Number(p.priceUsd) === orderPrice);
          if (pkg) break;
        }
      }

      // Second pass: if price doesn't match (e.g. because of discounts), try to extract the amount number (e.g. "1166")
      if (!pkg) {
        const nums = searchLabel.match(/\d+/g);
        // Find the most prominent number (usually the first large number)
        if (nums && nums.length > 0) {
          const targetNum = nums[0];
          for (let i = 0; i < prodList.length; i++) {
            if (prodList[i].packages) {
              pkg = prodList[i].packages.find(p => {
                return String(p.amount) === targetNum || String(p.label).includes(targetNum);
              });
              if (pkg) break;
            }
          }
        }
      }

      if (pkg && pkg.costUsd) {
        cost = parseFloat(pkg.costUsd) || 0;
      }
    }
    totalCost += cost;

    const created = new Date(o.createdAt).getTime();
    const completedHistory = o.statusHistory && o.statusHistory.find(h => h.status === 'completed');
    if (completedHistory && completedHistory.timestamp) {
      const completedTime = new Date(completedHistory.timestamp).getTime();
      totalResponseTimeMs += (completedTime - created);
      validResponseCount++;
    }
  });

  const totalProfit = totalRevenue - totalCost;
  const marginPercentage = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  let avgResponseText = '--';
  if (validResponseCount > 0) {
    const avgMs = totalResponseTimeMs / validResponseCount;
    const avgMins = Math.round(avgMs / 60000);
    if (avgMins < 60) avgResponseText = `${avgMins} min`;
    else avgResponseText = `${(avgMins / 60).toFixed(1)} h`;
  }

  // Recent orders (last 5 from the filtered set)
  const recentOrders = allOrders.slice(0, 5);
  const recentOrdersHtml = recentOrders.length > 0 ? recentOrders.map(order => {
    const status = order.status || 'pending';
    const statusInfo = ORDER_STATUSES[status] || ORDER_STATUSES['pending'];
    const statusClass = status.replace('-', '-');
    const date = new Date(order.createdAt);
    return `
      <div class="admin-cat-row" style="cursor: pointer;" onclick="switchTab('orders'); setTimeout(() => openOrderDetailModal('${order.id}'), 100);">
        <span style="display: flex; align-items: center; gap: 8px;">
          <span class="admin-order-ref" style="font-size: 0.75rem; padding: 3px 8px;">${order.id}</span>
          <span style="font-size: 0.82rem;">${order.productName}</span>
        </span>
        <span class="admin-status-badge admin-status-${statusClass}" style="font-size: 0.7rem; padding: 3px 10px;">${statusInfo.icon} ${statusInfo.label}</span>
      </div>
    `;
  }).join('') : '<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">No hay pedidos aún</div>';

  const titleText = forcedOrders ? 'Panel Financiero (Histórico Completo)' : 'Panel Financiero (Últimos 150)';
  const btnHtml = forcedOrders ? `<button class="btn btn-secondary" style="margin-left: 10px; padding: 4px 8px; font-size: 0.75rem;" onclick="adminState.showHistorical = false; renderActiveTab();">Volver a Recientes</button>` : `<button id="btn-calc-history" onclick="calculateHistoricalStats()" style="background: none; border: 1px solid var(--accent); color: var(--accent); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; margin-left: 10px;">Calcular Histórico Completo</button>`;

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">${titleText}</h1>
        <p class="admin-subtitle">Resumen de ganancias ${btnHtml}</p>
      </div>
      <div style="display: flex; gap: 8px; align-items: center; background: var(--bg-surface); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);">
        <input type="date" id="dash-start-date" class="admin-form-input" style="margin-bottom: 0; padding: 6px;" value="${adminState.dashboardStartDate}" onchange="updateDashboardDates()">
        <span style="color: var(--text-muted);">hasta</span>
        <input type="date" id="dash-end-date" class="admin-form-input" style="margin-bottom: 0; padding: 6px;" value="${adminState.dashboardEndDate}" onchange="updateDashboardDates()">
        ${adminState.dashboardStartDate || adminState.dashboardEndDate ? `<button class="btn btn-secondary" style="padding: 6px 12px;" onclick="clearDashboardDates()">✕</button>` : ''}
      </div>
    </div>

    <!-- Financial Core Widgets -->
    <div class="admin-stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom: 24px;">
      <div class="admin-stat-card" style="background: linear-gradient(135deg, rgba(66, 165, 245, 0.1), rgba(66, 165, 245, 0.02)); border-color: rgba(66, 165, 245, 0.3);">
        <div class="admin-stat-icon">💰</div>
        <div class="admin-stat-value" id="dash-total-revenue" style="color: #42a5f5;">$${totalRevenue.toFixed(2)}</div>
        <div class="admin-stat-label">Ingresos Brutos</div>
      </div>
      <div class="admin-stat-card" style="background: linear-gradient(135deg, rgba(239, 83, 80, 0.1), rgba(239, 83, 80, 0.02)); border-color: rgba(239, 83, 80, 0.3);">
        <div class="admin-stat-icon">📉</div>
        <div class="admin-stat-value" id="dash-total-cost" style="color: #ef5350;">$${totalCost.toFixed(2)}</div>
        <div class="admin-stat-label">Costos Proveedor</div>
      </div>
      <div class="admin-stat-card" style="background: linear-gradient(135deg, rgba(102, 187, 106, 0.1), rgba(102, 187, 106, 0.02)); border-color: rgba(102, 187, 106, 0.3);">
        <div class="admin-stat-icon">💎</div>
        <div class="admin-stat-value" id="dash-total-profit" style="color: #66bb6a;">$${totalProfit.toFixed(2)}</div>
        <div class="admin-stat-label">Ganancia Neta</div>
      </div>
    </div>

    <!-- General Stats -->
    <div class="admin-stats-grid" style="margin-bottom: 24px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
      <div class="admin-stat-card" style="cursor: pointer;" onclick="switchTab('orders')">
        <div class="admin-stat-icon">📋</div>
        <div class="admin-stat-value" style="color: #ffb74d;">${pendingCount}</div>
        <div class="admin-stat-label">Pendientes</div>
      </div>
      <div class="admin-stat-card" onclick="switchTab('orders')" style="cursor: pointer;">
        <div class="admin-stat-icon">✅</div>
        <div class="admin-stat-value" style="color: #66bb6a;">${completedCount}</div>
        <div class="admin-stat-label">Completados</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-icon">⏱️</div>
        <div class="admin-stat-value" style="color: #29b6f6;">${avgResponseText}</div>
        <div class="admin-stat-label">Tiempo Promedio</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-icon">❌</div>
        <div class="admin-stat-value" style="color: #ef5350;">${rejectionRate}%</div>
        <div class="admin-stat-label">Tasa Rechazo</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-icon">📈</div>
        <div class="admin-stat-value" style="color: var(--accent);">${marginPercentage}%</div>
        <div class="admin-stat-label">Margen Promedio</div>
      </div>
      <div class="admin-stat-card" style="cursor: pointer;" onclick="switchTab('customers')">
        <div class="admin-stat-icon">👥</div>
        <div class="admin-stat-value" id="dash-total-users">...</div>
        <div class="admin-stat-label">Usuarios</div>
      </div>
    </div>

    <div class="admin-dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 24px;">
      <div class="admin-card" style="grid-column: 1 / -1;">
        <div class="admin-card-header">
          <h2 class="admin-card-title">📈 Ingresos de Pedidos Completados (USD)</h2>
        </div>
        <div style="height: 300px; width: 100%; position: relative;">
          <canvas id="earningsChart"></canvas>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">📋 Pedidos Recientes</h2>
          ${allOrders.length > 0 ? `<button class="btn btn-secondary" onclick="switchTab('orders')" style="padding: 6px 14px; font-size: 0.82rem;">Ver todos →</button>` : ''}
        </div>
        <div class="admin-category-breakdown">
          ${recentOrdersHtml}
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">Acciones Rápidas</h2>
        </div>
        <div class="admin-quick-actions">
          <button class="btn btn-primary" onclick="switchTab('orders')">
            <span>📋</span> Ver Pedidos
          </button>
          <button class="btn btn-secondary" onclick="switchTab('products'); setTimeout(()=>openProductModal(), 100);">
            <span>➕</span> Nuevo Producto
          </button>
          <button class="btn btn-secondary" onclick="switchTab('exchange')">
            <span>💵</span> Tasa de Cambio
          </button>
          <button class="btn btn-secondary" onclick="switchTab('apis')">
            <span>📡</span> Configurar APIs
          </button>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">📊 Ventas por Producto</h2>
        </div>
        <div style="height: 300px; width: 100%; position: relative;">
          <canvas id="ordersChart"></canvas>
        </div>
      </div>
      
      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">💳 Métodos de Pago Usados</h2>
        </div>
        <div style="height: 300px; width: 100%; position: relative;">
          <canvas id="paymentsChart"></canvas>
        </div>
      </div>
      
      <div class="admin-card" style="grid-column: 1 / -1;">
        <div class="admin-card-header">
          <h2 class="admin-card-title">🌟 Top Clientes VIP</h2>
        </div>
        <div id="dash-top-clients" style="min-height: 100px; position: relative;">
          <div class="admin-loading-spinner" style="margin: 40px auto;"></div>
        </div>
      </div>
    </div>
  `;

  // Initialize Chart.js
  setTimeout(() => {
    if (window.Chart) {
      const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'completado');

      // 1. Orders Chart Data
      const ctxOrders = document.getElementById('ordersChart');
      if (ctxOrders) {
        const salesByProduct = {};
        completedOrders.forEach(o => {
          salesByProduct[o.productName] = (salesByProduct[o.productName] || 0) + 1;
        });

        new Chart(ctxOrders, {
          type: 'bar',
          data: {
            labels: Object.keys(salesByProduct).length > 0 ? Object.keys(salesByProduct) : ['Sin Datos'],
            datasets: [{
              label: 'Pedidos Completados',
              data: Object.keys(salesByProduct).length > 0 ? Object.values(salesByProduct) : [0],
              backgroundColor: 'rgba(0, 229, 195, 0.6)',
              borderColor: 'rgba(0, 229, 195, 1)',
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#a0b1cc' } } },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#a0b1cc', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.1)' } },
              x: { ticks: { color: '#a0b1cc' }, grid: { display: false } }
            }
          }
        });
      }

      // 2. Earnings Chart Data
      const ctxEarnings = document.getElementById('earningsChart');
      if (ctxEarnings) {
        const earningsByDate = {};
        completedOrders.forEach(o => {
          const date = new Date(o.createdAt).toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
          earningsByDate[date] = (earningsByDate[date] || 0) + (o.priceUsd || 0);
        });

        const dates = Object.keys(earningsByDate).reverse();
        const amounts = Object.values(earningsByDate).reverse();

        new Chart(ctxEarnings, {
          type: 'line',
          data: {
            labels: dates.length > 0 ? dates : ['Sin Datos'],
            datasets: [{
              label: 'Ingresos (USD)',
              data: amounts.length > 0 ? amounts : [0],
              borderColor: '#42a5f5',
              backgroundColor: 'rgba(66, 165, 245, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#42a5f5',
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#a0b1cc' } } },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#a0b1cc' }, grid: { color: 'rgba(255,255,255,0.1)' } },
              x: { ticks: { color: '#a0b1cc' }, grid: { display: false } }
            }
          }
        });
      }

      // 3. Payments Chart Data
      const ctxPayments = document.getElementById('paymentsChart');
      if (ctxPayments) {
        const pmCounts = {};
        completedOrders.forEach(o => {
          pmCounts[o.paymentMethodName || 'Monedero'] = (pmCounts[o.paymentMethodName || 'Monedero'] || 0) + 1;
        });

        new Chart(ctxPayments, {
          type: 'doughnut',
          data: {
            labels: Object.keys(pmCounts).length > 0 ? Object.keys(pmCounts) : ['Sin Datos'],
            datasets: [{
              data: Object.keys(pmCounts).length > 0 ? Object.values(pmCounts) : [1],
              backgroundColor: ['#42a5f5', '#66bb6a', '#ffb74d', '#ef5350', '#ab47bc', '#26c6da'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#a0b1cc' } } }
          }
        });
      }
    }
    // Fetch total users and top VIPs dynamically
    firebase.database().ref('users').once('value').then(snap => {
      const usersData = snap.val() || {};
      const elUsers = document.getElementById('dash-total-users');
      if (elUsers) elUsers.innerText = snap.numChildren();

      const elTopClients = document.getElementById('dash-top-clients');
      if (elTopClients) {
        const userSpentMap = {};
        completedOrders.forEach(o => {
          if (o.userId && o.productType !== 'wallet-recharge') {
            userSpentMap[o.userId] = (userSpentMap[o.userId] || 0) + (Number(o.priceUsd) || 0);
          }
        });

        const usersArray = Object.keys(userSpentMap).map(uid => {
          const u = usersData[uid] || {};
          const fallbackOrder = completedOrders.find(o => o.userId === uid) || {};
          return {
            uid,
            name: u.name || u.displayName || fallbackOrder.userEmail || 'Usuario',
            email: u.email || fallbackOrder.userEmail || '',
            role: u.role || 'cliente',
            spent: userSpentMap[uid] || 0
          };
        }).filter(u => u.spent > 0);

        usersArray.sort((a, b) => b.spent - a.spent);
        const top5 = usersArray.slice(0, 5);

        if (top5.length === 0) {
          elTopClients.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">Aún no hay clientes con compras.</div>`;
        } else {
          elTopClients.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); text-align: left; font-size: 0.85rem;">
                  <th style="padding: 10px;">#</th>
                  <th style="padding: 10px;">Cliente</th>
                  <th style="padding: 10px;">Rol</th>
                  <th style="padding: 10px; text-align: right;">Total Comprado</th>
                </tr>
              </thead>
              <tbody>
                ${top5.map((u, i) => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px 10px; color: var(--text-secondary);">${i + 1}</td>
                    <td style="padding: 12px 10px;">
                      <div style="font-weight: bold; color: #fff;">${u.name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${u.email}</div>
                    </td>
                    <td style="padding: 12px 10px;">
                      <span class="admin-badge" style="${u.role === 'revendedor' ? 'background: rgba(168, 85, 247, 0.2); color: #d8b4fe;' :
              (u.role === 'influencer' ? 'background: rgba(239, 68, 68, 0.2); color: #f87171;' :
                (u.role === 'admin' ? 'background: rgba(234, 179, 8, 0.2); color: #facc15;' :
                  'background: rgba(0, 229, 195, 0.15); color: #0ea5e9;'))
            }">${(u.role === 'user' ? 'cliente' : u.role).toUpperCase()}</span>
                    </td>
                    <td style="padding: 12px 10px; text-align: right; font-weight: bold; color: #42a5f5;">$${u.spent.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }
      }
    }).catch(e => console.error("Error fetching users data:", e));
  }, 100);
}

window.calculateHistoricalStats = async function() {
  if (!confirm("¿Deseas descargar y calcular el historial completo? Esto puede demorar unos segundos dependiendo de la cantidad de pedidos.")) return;
  const btn = document.getElementById('btn-calc-history');
  if (btn) {
    btn.innerHTML = 'Calculando... ⏳';
    btn.disabled = true;
  }

  try {
    const snap = await firebase.database().ref('orders').once('value');
    const ordersData = snap.val() || {};
    let allHistoricalOrders = Object.values(ordersData);

    const canceledIds = [20, 31, 46, 49, 50, 62, 63, 81, 82, 84, 85, 86, 88, 103, 121, 134, 139, 173, 178, 179, 180, 210, 223, 231, 246, 274, 286, 307, 348, 350, 351, 358, 370, 374, 407, 415, 439, 471, 472, 473, 482, 485, 487, 488, 489, 500, 503, 505, 517].map(id => 'AP-OLD-' + id);
    const processingIds = [1, 143, 236, 369].map(id => 'AP-OLD-' + id);

    allHistoricalOrders = allHistoricalOrders.map(o => {
      if (o.status === 'completado') o.status = 'completed';
      if (o.status === 'rechazado' || o.status === 'cancelado') o.status = 'rejected';
      if (o.status === 'pendiente') o.status = 'pending';
      if (o.status === 'procesando') o.status = 'processing';
      if (canceledIds.includes(o.id)) o.status = 'rejected';
      if (processingIds.includes(o.id)) o.status = 'processing';
      
      if (!o.productName && o.productDetails) o.productName = o.productDetails;
      if (!o.packageLabel) o.packageLabel = 'Migrado';
      if (!o.paymentMethodName && o.paymentMethod) o.paymentMethodName = o.paymentMethod;
      if (!o.customerContact && (o.userEmail || o.userPhone)) o.customerContact = o.userEmail || o.userPhone;
      
      return o;
    });

    // Sort descending by date
    allHistoricalOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Almacenar en el estado temporalmente
    adminState.showHistorical = true;
    adminState.historicalOrders = allHistoricalOrders;

    const main = document.getElementById('admin-main-content');
    if (main) {
      renderDashboard(main, allHistoricalOrders);
    }
  } catch(e) {
    console.error(e);
    alert('Error al calcular el histórico');
    if (btn) {
      btn.innerHTML = 'Calcular Histórico Completo';
      btn.disabled = false;
    }
  }
};

// ════════════════════════════════════════
// 2. PRODUCTS
// ════════════════════════════════════════
function renderProducts(container) {
  const productCardsHtml = PRODUCTS.map(product => {
    const cat = getCategoryById(product.category);
    const minPrice = product.packages.length > 0 ? Math.min(...product.packages.map(p => p.priceUsd)) : 0;
    const maxPrice = product.packages.length > 0 ? Math.max(...product.packages.map(p => p.priceUsd)) : 0;

    let badgeHtml = '';
    if (product.isOutofStock) badgeHtml = `<span class="admin-badge" style="background: rgba(239, 83, 80, 0.2); color: #ef5350;">⛔ Agotado</span>`;
    else if (product.popular) badgeHtml = `<span class="admin-badge admin-badge-popular">🔥 Popular</span>`;
    else if (product.isNew) badgeHtml = `<span class="admin-badge admin-badge-new">✨ Nuevo</span>`;

    const bannerContent = product.imageUrl
      ? `<img src="${product.imageUrl}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
      : product.currencyIcon;

    return `
      <div class="admin-game-card">
        <div class="admin-game-banner" style="background: ${product.colorGradient || '#0f1f38'};">
          ${typeof bannerContent === 'string' && !product.imageUrl ? bannerContent : ''}
          ${product.imageUrl ? bannerContent : ''}
          <div style="position: absolute; top: 12px; right: 12px;">${badgeHtml}</div>
        </div>
        <div class="admin-game-info">
          ${cat ? `<div class="admin-product-cat-tag" style="--cat-color: ${cat.color}">${cat.icon} ${cat.name}</div>` : ''}
          <h3 class="admin-game-name">${product.name}</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; min-height: 36px;">
            ${product.description || 'Sin descripción.'}
          </p>
          <div class="admin-game-packages">
            <span>📦 ${product.packages.length} Paquetes</span> |
            <span>$${minPrice.toFixed(2)} — $${maxPrice.toFixed(2)}</span>
          </div>
        </div>
        <div class="admin-game-actions">
          <button class="btn btn-secondary" onclick="openProductModal('${product.id}')" style="padding: 8px 16px; font-size: 0.85rem;">
            ✏️ Editar
          </button>
          <button class="btn btn-danger" onclick="deleteProduct('${product.id}')" style="padding: 8px 16px; font-size: 0.85rem; background: rgba(220, 53, 69, 0.15); color: #ff6b6b; border: 1px solid rgba(220, 53, 69, 0.3);">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Catálogo de Productos</h1>
        <p class="admin-subtitle">Crea, edita y administra productos — juegos, gift cards, streaming y billeteras</p>
      </div>
      <button class="btn btn-primary" onclick="openProductModal()">
        <span>➕</span> Añadir Producto
      </button>
    </div>
    <div class="admin-games-grid">${productCardsHtml}</div>
  `;
}

// ════════════════════════════════════════
// 2.5 CUSTOMERS (CRM)
// ════════════════════════════════════════
async function renderCustomers(container) {
  const titleText = adminState.showHistoricalOrders ? 'Clientes VIP (Histórico)' : 'Clientes VIP (Últimos 150)';
  const historyBtn = adminState.showHistoricalOrders 
    ? `<button class="btn btn-secondary" onclick="adminState.showHistoricalOrders = false; renderActiveTab();" style="padding: 8px 16px; font-size: 0.85rem;">⬅️ Volver a Recientes</button>`
    : `<button class="btn btn-secondary" onclick="loadHistoricalOrdersList()" style="padding: 8px 16px; font-size: 0.85rem; border: 1px solid var(--accent); color: var(--accent);">📚 Calcular con Historial Completo</button>`;

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">${titleText}</h1>
        <p class="admin-subtitle">Usuarios registrados y mejores compradores</p>
      </div>
      <div style="display: flex; gap: 8px;">
        ${historyBtn}
        <button class="btn btn-secondary" onclick="exportCustomersCSV()">
          <span>📥</span> Exportar a CSV
        </button>
      </div>
    </div>
    
    <div style="margin-bottom: 20px; display: flex; gap: 8px;">
      <input type="text" id="customers-search-input" value="${adminState.customersSearch || ''}" onkeyup="if(event.key==='Enter') filterCrmSearch(this.value)" placeholder="🔍 Buscar por nombre, correo o teléfono... (Presiona Enter)" style="flex: 1; padding: 14px 20px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: #fff; font-size: 1rem; outline: none;">
      <button class="btn btn-secondary" onclick="filterCrmSearch(document.getElementById('customers-search-input').value)" style="padding: 0 20px;">Buscar</button>
      ${adminState.customersSearch ? `<button class="btn btn-danger" onclick="filterCrmSearch('')" style="padding: 0 20px;">✕</button>` : ''}
    </div>

    <div id="customers-loading" style="padding: 40px; text-align: center; color: var(--text-muted);">Cargando clientes...</div>
    <div id="customers-content" style="display: none;"></div>
  `;

  let users = [];
  try {
    const snap = await firebase.database().ref('users').once('value');
    if (snap.exists()) {
      const data = snap.val();
      users = Object.keys(data).map(uid => ({ uid, ...data[uid] }));
      window.ADMIN_CUSTOMERS = users;
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }

  const allOrders = adminState.showHistoricalOrders && adminState.historicalOrders ? adminState.historicalOrders : getOrders();
  const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'completado');

  const customersMap = {};

  users.forEach(u => {
    customersMap[u.uid] = {
      uid: u.uid,
      contact: u.email || 'Sin correo',
      whatsapp: u.whatsapp || '',
      name: u.name || '',
      totalOrders: u.totalOrders || 0,
      hasTotalOrders: !!u.totalOrders,
      totalSpent: u.totalSpent || 0,
      hasTotalSpent: !!u.totalSpent,
      firstOrder: null,
      lastOrder: null,
      role: u.role || 'cliente',
      discountPercentage: u.discountPercentage || 0,
      isBlocked: !!u.isBlocked,
      wallet: u.wallet || 0
    };
  });

  completedOrders.forEach(o => {
    let key = o.userId;
    if (!key) {
      if (!o.customerContact) return;
      key = o.customerContact.toLowerCase().trim();
    }

    if (!customersMap[key]) {
      customersMap[key] = {
        uid: null,
        contact: o.customerContact,
        whatsapp: '',
        name: '',
        totalOrders: 0,
        hasTotalOrders: false,
        totalSpent: 0,
        hasTotalSpent: false,
        firstOrder: o.createdAt,
        lastOrder: o.createdAt
      };
    }
    
    // Only count if it's a guest or if the database doesn't have it yet
    if (!customersMap[key].hasTotalOrders) {
      customersMap[key].totalOrders += 1;
    }
    
    // Si no tiene UID (guest) o no se migró el totalSpent, sumar lo gastado aquí
    if (!customersMap[key].uid || !customersMap[key].hasTotalSpent) {
      if (o.productType !== 'wallet-recharge') {
        customersMap[key].totalSpent += (o.priceUsd || 0);
      }
    }
    if (!customersMap[key].firstOrder || o.createdAt < customersMap[key].firstOrder) customersMap[key].firstOrder = o.createdAt;
    if (!customersMap[key].lastOrder || o.createdAt > customersMap[key].lastOrder) customersMap[key].lastOrder = o.createdAt;
  });

  let customers = Object.values(customersMap).sort((a, b) => b.totalSpent - a.totalSpent);

  const searchTerm = (adminState.customersSearch || '').toLowerCase().trim();
  if (searchTerm) {
    customers = customers.filter(c =>
      c.contact.toLowerCase().includes(searchTerm) ||
      (c.whatsapp && c.whatsapp.toLowerCase().includes(searchTerm)) ||
      (c.name && c.name.toLowerCase().includes(searchTerm))
    );
  }

  // Pagination Logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(customers.length / itemsPerPage) || 1;
  if (!adminState.crmVipPage) adminState.crmVipPage = 1;
  if (adminState.crmVipPage > totalPages) adminState.crmVipPage = totalPages;
  if (adminState.crmVipPage < 1) adminState.crmVipPage = 1;

  const startIndex = (adminState.crmVipPage - 1) * itemsPerPage;
  const paginatedCustomers = customers.slice(startIndex, startIndex + itemsPerPage);

  const customersHtml = paginatedCustomers.map(c => `
    <div class="admin-crm-row" data-search="${(c.name || '').toLowerCase()} ${(c.contact || '').toLowerCase()} ${(c.whatsapp || '').toLowerCase()}">
      <div style="font-weight: 500; display: flex; align-items: center; gap: 10px;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; color: var(--bg-deep); font-weight: bold; flex-shrink: 0;">
          ${(c.name || c.contact || '?').charAt(0).toUpperCase()}
        </div>
        <div style="display: flex; flex-direction: column;">
          <span style="word-break: break-all;">${c.name ? c.name + ' (' + c.contact + ')' : c.contact}</span>
          ${c.whatsapp ? `<span style="font-size: 0.8rem; color: #25D366; margin-top: 2px;">WhatsApp: ${c.whatsapp}</span>` : ''}
        </div>
      </div>
      <div style="color: var(--text-secondary);">
        Pedidos: <b>${c.totalOrders}</b><br>
        <span style="font-size: 0.8rem; color: #0ea5e9;">Gasto: $${c.totalSpent.toFixed(2)}</span>
      </div>
      <div style="font-weight: bold; color: #10b981; font-size: 1.1rem;">
        $${(parseFloat(c.wallet) || 0).toFixed(2)}
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${c.uid ? `
          <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; width: fit-content;" onclick="openRoleModal('${c.uid}', '${c.role}', ${c.discountPercentage})">
              ${c.role === 'revendedor' ? '💼 Revend (' + c.discountPercentage + '%)' : '👤 Cliente'}
            </button>
            <button class="btn ${c.isBlocked ? 'btn-danger' : 'btn-secondary'}" style="padding: 4px 10px; font-size: 0.75rem; width: fit-content;" onclick="toggleBlockUser('${c.uid}', ${c.isBlocked})">
              ${c.isBlocked ? '🚫 Bloqueado' : '✅ Activo'}
            </button>
          </div>
          <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            <button class="btn btn-primary" style="padding: 4px 10px; font-size: 0.75rem; width: fit-content;" onclick="openEditWalletModal('${c.uid}', '${c.contact}', ${c.wallet})">
              💰 Saldo
            </button>
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; width: fit-content;" onclick="openCustomerInfoModal('${c.uid}')">
              ℹ️ Info
            </button>
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; width: fit-content;" onclick="sendCustomerPasswordReset('${c.contact}')" title="Enviar enlace de restablecimiento de contraseña">
              🔑 Restablecer Clave
            </button>
          </div>
        ` : `<span style="font-size: 0.8rem; color: var(--text-muted);">Invitado</span>`}
      </div>
    </div>
  `).join('') || '<div style="text-align: center; padding: 40px; color: var(--text-muted);">No se encontraron clientes.</div>';

  const loadingEl = document.getElementById('customers-loading');
  if (loadingEl) loadingEl.style.display = 'none';

  const paginationHtml = totalPages > 1 ? `
    <div style="display: flex; justify-content: center; align-items: center; gap: 16px; padding: 16px; background: var(--bg-surface); border-top: 1px solid var(--border);">
      <button class="btn btn-secondary" onclick="changeCrmPage(-1)" ${adminState.crmVipPage === 1 ? 'disabled style="opacity:0.5"' : ''}>Anterior</button>
      <span style="font-size: 0.9rem; color: var(--text-secondary);">Página <strong>${adminState.crmVipPage}</strong> de ${totalPages}</span>
      <button class="btn btn-secondary" onclick="changeCrmPage(1)" ${adminState.crmVipPage === totalPages ? 'disabled style="opacity:0.5"' : ''}>Siguiente</button>
    </div>
  ` : '';

  const contentEl = document.getElementById('customers-content');
  if (contentEl) {
    contentEl.style.display = 'block';
    contentEl.innerHTML = `
      <div class="admin-card" style="padding: 0; overflow: hidden;">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; background: rgba(0,0,0,0.2); padding: 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border);">
          <div>Cliente</div>
          <div>Pedidos / Gasto</div>
          <div>Saldo (Monedero)</div>
          <div>Gestión</div>
        </div>
        <div style="padding: 16px;">
          ${customersHtml}
        </div>
        ${paginationHtml}
      </div>
    `;
  }
}

window.filterCrmSearch = function (query) {
  adminState.customersSearch = query.trim();
  adminState.crmVipPage = 1;
  const main = document.getElementById('admin-main-content');
  if (main) renderCustomers(main);
};

window.changeCrmPage = function (delta) {
  adminState.crmVipPage += delta;
  const main = document.getElementById('admin-main-content');
  if (main) {
    renderCustomers(main);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.sendCustomerPasswordReset = async function (email) {
  if (!email || !email.includes('@')) {
    alert('El cliente no tiene un correo válido registrado. Si se registró con WhatsApp o un correo falso, no es posible enviarle el enlace.');
    return;
  }
  if (!confirm(`¿Enviar enlace de recuperación de contraseña a ${email}?`)) return;

  try {
    await firebase.auth().sendPasswordResetEmail(email);
    alert(`Correo de restablecimiento enviado exitosamente a ${email}`);
  } catch (error) {
    console.error("Error enviando reset:", error);
    alert("Hubo un error al intentar enviar el correo. Asegúrate de que el usuario exista en Auth.");
  }
};

async function exportCustomersCSV() {
  let users = [];
  try {
    const snap = await firebase.database().ref('users').once('value');
    if (snap.exists()) {
      const data = snap.val();
      users = Object.keys(data).map(uid => ({ uid, ...data[uid] }));
    }
  } catch (error) {
    console.error("Error fetching users for CSV:", error);
  }

  const allOrders = getOrders();
  const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'completado');
  const customersMap = {};

  users.forEach(u => {
    customersMap[u.uid] = {
      uid: u.uid,
      contact: u.email || 'Sin correo',
      whatsapp: u.whatsapp || '',
      name: u.name || '',
      totalOrders: 0,
      totalSpent: u.totalSpent || 0,
      hasTotalSpent: !!u.totalSpent,
      lastOrder: null
    };
  });

  completedOrders.forEach(o => {
    let key = o.userId;
    if (!key) {
      if (!o.customerContact) return;
      key = o.customerContact.toLowerCase().trim();
    }

    if (!customersMap[key]) {
      customersMap[key] = {
        uid: null,
        contact: o.customerContact,
        whatsapp: '',
        name: '',
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: o.createdAt
      };
    }
    customersMap[key].totalOrders += 1;
    if (!customersMap[key].uid || !customersMap[key].hasTotalSpent) {
      if (o.productType !== 'wallet-recharge') {
        customersMap[key].totalSpent += (o.priceUsd || 0);
      }
    }
    if (!customersMap[key].lastOrder || o.createdAt > customersMap[key].lastOrder) customersMap[key].lastOrder = o.createdAt;
  });

  const customers = Object.values(customersMap).sort((a, b) => b.totalSpent - a.totalSpent);

  if (customers.length === 0) return showAdminToast('No hay clientes para exportar', 'error');

  let csv = 'Nombre,Contacto,WhatsApp,Total Pedidos,Total Gastado (USD),Ultima Compra\n';
  customers.forEach(c => {
    const lastOrd = c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('es-VE') : '';
    csv += `"${c.name}","${c.contact}","${c.whatsapp}",${c.totalOrders},${c.totalSpent.toFixed(2)},"${lastOrd}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `clientes_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showAdminToast('¡Base de clientes exportada!', 'success');
}

// ════════════════════════════════════════
// 3. CATEGORIES
// ════════════════════════════════════════
function renderCategories(container) {
  const catCards = CATEGORIES.map(cat => {
    const count = PRODUCTS.filter(p => p.category === cat.id).length;
    return `
      <div class="admin-category-card" style="--cat-color: ${cat.color}">
        <div class="admin-category-card-header" style="background: ${cat.gradient}">
          <span class="admin-category-card-icon">${cat.icon}</span>
        </div>
        <div class="admin-category-card-body">
          <h3>${cat.name}</h3>
          <p>${count} producto${count !== 1 ? 's' : ''}</p>
          <div class="admin-category-card-id">ID: ${cat.id}</div>
        </div>
        <div class="admin-category-card-actions">
          <button class="btn btn-secondary" onclick="openCategoryModal('${cat.id}')" style="padding: 6px 14px; font-size: 0.82rem;">
            ✏️ Editar
          </button>
          <button class="btn btn-danger" onclick="deleteCategory('${cat.id}')" style="padding: 6px 14px; font-size: 0.82rem; background: rgba(220,53,69,0.15); color: #ff6b6b; border: 1px solid rgba(220,53,69,0.3);">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Categorías</h1>
        <p class="admin-subtitle">Organiza tus productos en categorías para una mejor navegación</p>
      </div>
      <button class="btn btn-primary" onclick="openCategoryModal()">
        <span>➕</span> Nueva Categoría
      </button>
    </div>
    <div class="admin-categories-grid">${catCards}</div>
  `;
}

function openCategoryModal(catId = null) {
  const overlay = document.getElementById('admin-modal-overlay');
  const modalContent = document.getElementById('admin-modal-content');
  if (!overlay || !modalContent) return;

  let cat = { id: '', name: '', icon: '📦', color: '#0ea5e9', gradient: 'linear-gradient(135deg, #0ea5e9, #00b89c)' };
  if (catId) {
    const found = CATEGORIES.find(c => c.id === catId);
    if (found) cat = JSON.parse(JSON.stringify(found));
  }

  modalContent.innerHTML = `
    <div class="admin-modal-header">
      <h2 class="admin-modal-title">${catId ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
      <button class="admin-modal-close" onclick="closeAdminModal()">✕</button>
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label" for="m-cat-name">Nombre</label>
      <input type="text" class="admin-form-input" id="m-cat-name" value="${cat.name}" placeholder="Ej. Gift Cards">
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label" for="m-cat-id">ID (slug)</label>
      <input type="text" class="admin-form-input" id="m-cat-id" value="${cat.id}" placeholder="ej. gift-card" ${catId ? 'disabled' : ''}>
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label" for="m-cat-icon">Icono (emoji)</label>
      <input type="text" class="admin-form-input" id="m-cat-icon" value="${cat.icon}" placeholder="Ej. 🎁">
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label" for="m-cat-color">Color</label>
      <input type="color" class="admin-form-input" id="m-cat-color" value="${cat.color}" style="height: 40px; padding: 4px;">
    </div>
    <div class="admin-modal-footer">
      <button class="btn btn-secondary" onclick="closeAdminModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveCategory('${catId || ''}')">💾 Guardar</button>
    </div>
  `;

  overlay.classList.add('active');
}

function saveCategory(editId) {
  const name = document.getElementById('m-cat-name').value.trim();
  const id = document.getElementById('m-cat-id').value.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
  const icon = document.getElementById('m-cat-icon').value.trim() || '📦';
  const color = document.getElementById('m-cat-color').value;

  if (!name || !id) {
    showAdminToast('❌ Nombre e ID son obligatorios', 'error');
    return;
  }

  const gradient = `linear-gradient(135deg, ${color}, ${adjustColor(color, -40)})`;

  if (editId) {
    const idx = CATEGORIES.findIndex(c => c.id === editId);
    if (idx !== -1) {
      CATEGORIES[idx] = { id: editId, name, icon, color, gradient };
      showAdminToast('✅ Categoría actualizada', 'success');
    }
  } else {
    if (CATEGORIES.some(c => c.id === id)) {
      showAdminToast('❌ Ya existe una categoría con ese ID', 'error');
      return;
    }
    CATEGORIES.push({ id, name, icon, color, gradient });
    showAdminToast('✅ Categoría creada', 'success');
  }

  saveToDb('categories', CATEGORIES);
  closeAdminModal();
  renderActiveTab();
}

function deleteCategory(catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat) return;
  const count = PRODUCTS.filter(p => p.category === catId).length;
  if (confirm(`¿Eliminar categoría "${cat.name}"? ${count > 0 ? `Hay ${count} producto(s) asociados.` : ''}`)) {
    const idx = CATEGORIES.findIndex(c => c.id === catId);
    if (idx !== -1) {
      CATEGORIES.splice(idx, 1);
      saveToDb('categories', CATEGORIES);
      showAdminToast(`🗑️ Categoría "${cat.name}" eliminada`, 'success');
      renderActiveTab();
    }
  }
}

// ════════════════════════════════════════
// 4. PAYMENTS
// ════════════════════════════════════════
function renderPayments(container) {
  const paymentCardsHtml = PAYMENT_METHODS.map(method => {
    let detailFieldsHtml = '';
    Object.entries(method.details || {}).forEach(([key, val]) => {
      detailFieldsHtml += `
        <div class="admin-form-group">
          <label class="admin-form-label">${formatPaymentLabel(key)}</label>
          <input type="text" class="admin-form-input payment-detail-input"
                 data-method-id="${method.id}" data-detail-key="${key}" value="${val}">
        </div>
      `;
    });

    return `
      <div class="admin-card">
        <div class="admin-card-header" style="justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <input type="text" class="admin-form-input payment-icon-input" data-method-id="${method.id}" value="${method.icon}" style="width: 60px; text-align: center; font-size: 1.2rem; padding: 8px;" title="Icono / Emoji">
            <input type="text" class="admin-form-input payment-name-input" data-method-id="${method.id}" value="${method.name}" style="flex: 1; font-weight: bold; font-size: 1.1rem; padding: 8px;" title="Nombre del Método">
          </div>
          <button class="btn btn-secondary" onclick="deletePaymentMethod('${method.id}')" style="padding: 6px 12px; color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1);" title="Eliminar Método">
            🗑️
          </button>
        </div>
        <div class="admin-payment-details-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 15px;">
          ${detailFieldsHtml}
        </div>
        <div class="admin-form-group" style="margin-top: 15px; border-top: 1px solid var(--border); padding-top: 15px;">
          <label class="admin-form-label">Moneda a cobrar al cliente</label>
          <select class="admin-form-input payment-currency-select" data-method-id="${method.id}">
            <option value="bs" ${(!method.currency || method.currency === 'bs') ? 'selected' : ''}>Bolívares (Bs.)</option>
            <option value="usd" ${method.currency === 'usd' ? 'selected' : ''}>Dólares (USD)</option>
          </select>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Métodos de Pago</h1>
        <p class="admin-subtitle">Modifica los datos bancarios, nombres, iconos y monedas de destino</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" onclick="addPaymentMethod()" style="background: rgba(14, 165, 233, 0.1); color: #0ea5e9; border-color: rgba(14, 165, 233, 0.3);">
          <span>➕</span> Añadir Método
        </button>
        <button class="btn btn-primary" onclick="savePaymentMethods()">
          <span>💾</span> Guardar Cambios
        </button>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 24px;">
      ${paymentCardsHtml}
    </div>
  `;
}

function formatPaymentLabel(key) {
  const labels = {
    banco: 'Banco', telefono: 'Teléfono', cedula: 'Cédula / Rif', rif: 'RIF',
    cuenta: 'Nro. Cuenta', titular: 'Titular', binanceId: 'Binance Pay ID',
    red: 'Red de Criptomonedas', wallet: 'Wallet Address (USDT)', nota: 'Nota de Instrucción'
  };
  return labels[key] || key;
}

function savePaymentMethods() {
  const nameInputs = document.querySelectorAll('.payment-name-input');
  nameInputs.forEach(input => {
    const m = PAYMENT_METHODS.find(x => x.id === input.getAttribute('data-method-id'));
    if (m) m.name = input.value.trim();
  });

  const iconInputs = document.querySelectorAll('.payment-icon-input');
  iconInputs.forEach(input => {
    const m = PAYMENT_METHODS.find(x => x.id === input.getAttribute('data-method-id'));
    if (m) m.icon = input.value.trim();
  });

  const detailInputs = document.querySelectorAll('.payment-detail-input');
  detailInputs.forEach(input => {
    const methodId = input.getAttribute('data-method-id');
    const detailKey = input.getAttribute('data-detail-key');
    const value = input.value.trim();
    const method = PAYMENT_METHODS.find(m => m.id === methodId);
    if (method && method.details) method.details[detailKey] = value;
  });

  const currencySelects = document.querySelectorAll('.payment-currency-select');
  currencySelects.forEach(select => {
    const methodId = select.getAttribute('data-method-id');
    const method = PAYMENT_METHODS.find(m => m.id === methodId);
    if (method) method.currency = select.value;
  });

  saveToDb('payment_methods', PAYMENT_METHODS);
  showAdminToast('✅ Métodos de pago guardados', 'success');
}

function addPaymentMethod() {
  const modalHtml = `
    <div class="admin-modal-content" style="max-width: 600px; text-align: left;">
      <h3 style="margin-bottom: 20px; color: var(--text-primary);">➕ Añadir Método de Pago</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="admin-form-group">
          <label class="admin-form-label">Nombre del Método</label>
          <input type="text" id="new-pm-name" class="admin-form-input" placeholder="Ej: Zinli">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">Icono (Emoji)</label>
          <input type="text" id="new-pm-icon" class="admin-form-input" placeholder="Ej: 🟣">
        </div>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">Moneda a cobrar al cliente</label>
        <select id="new-pm-currency" class="admin-form-input">
          <option value="usd">Dólares (USD)</option>
          <option value="bs">Bolívares (Bs.)</option>
        </select>
      </div>
      
      <div class="admin-form-group" style="margin-top: 20px;">
        <label class="admin-form-label" style="margin-bottom: 12px; display: block; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
          ¿Qué datos le pedirás al cliente para este pago? (Selecciona los necesarios)
        </label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" class="new-pm-field-cb" value="titular" checked> Titular de la cuenta
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" class="new-pm-field-cb" value="cedula"> Cédula / Rif
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" class="new-pm-field-cb" value="telefono"> Teléfono
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" class="new-pm-field-cb" value="banco"> Banco de origen
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" class="new-pm-field-cb" value="cuenta"> Nro. de Cuenta
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" class="new-pm-field-cb" value="nota" checked> Nota / Referencia
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" class="new-pm-field-cb" value="binanceId"> Binance Pay ID
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" class="new-pm-field-cb" value="wallet"> Wallet (USDT)
          </label>
        </div>
      </div>
      
      <div style="display: flex; gap: 10px; margin-top: 25px; justify-content: flex-end;">
        <button class="btn btn-secondary" onclick="closeAdminModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="saveNewPaymentMethod()">Añadir Método</button>
      </div>
    </div>
  `;
  showAdminModal(modalHtml);
}

function saveNewPaymentMethod() {
  const name = document.getElementById('new-pm-name').value.trim();
  const icon = document.getElementById('new-pm-icon').value.trim();
  const currency = document.getElementById('new-pm-currency').value;

  const fieldCheckboxes = document.querySelectorAll('.new-pm-field-cb:checked');
  const fields = Array.from(fieldCheckboxes).map(cb => cb.value);

  if (!name || !icon) {
    showAdminToast('❌ Nombre e Icono son obligatorios', 'error');
    return;
  }

  const id = 'pm-' + Date.now();
  const details = {};
  fields.forEach(f => details[f] = "");

  PAYMENT_METHODS.push({
    id, name, icon, currency, details, active: true
  });

  saveToDb('payment_methods', PAYMENT_METHODS);
  closeAdminModal();
  renderActiveTab();
  showAdminToast('✅ Método añadido con éxito', 'success');
}

function deletePaymentMethod(id) {
  if (confirm("¿Seguro que deseas eliminar este método de pago por completo?")) {
    const idx = PAYMENT_METHODS.findIndex(m => m.id === id);
    if (idx !== -1) {
      PAYMENT_METHODS.splice(idx, 1);
      saveToDb('payment_methods', PAYMENT_METHODS);
      renderActiveTab();
      showAdminToast('🗑️ Método eliminado', 'success');
    }
  }
}

// ════════════════════════════════════════
// 5. EXCHANGE RATE
// ════════════════════════════════════════
function renderExchange(container) {
  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Tasa de Cambio</h1>
        <p class="admin-subtitle">Establece la tasa de conversión USD → Bs.</p>
      </div>
    </div>
    <div style="max-width: 500px;">
      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">Ajustar Tasa de Referencia</h2>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label" for="exchange-rate-input">Tasa en Bolívares (Bs. / 1 USD)</label>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="number" step="0.01" class="admin-form-input" id="exchange-rate-input" value="${EXCHANGE_RATE.usdToBs}" style="font-size: 1.25rem; font-weight: bold;">
            <span style="font-weight: 600; font-size: 1.1rem; color: var(--text-secondary);">Bs.</span>
          </div>
        </div>
        <div style="margin-bottom: 24px; font-size: 0.9rem; color: var(--text-muted);">
          ⚠️ Al guardar, todos los precios en bolívares se recalcularán al instante.
        </div>
        <button class="btn btn-primary" onclick="saveExchangeRate()">
          <span>💾</span> Guardar Tasa
        </button>
      </div>
    </div>
  `;
}

function saveExchangeRate() {
  const input = document.getElementById('exchange-rate-input');
  if (!input) return;
  const rateVal = parseFloat(input.value);
  if (isNaN(rateVal) || rateVal <= 0) {
    showAdminToast('❌ La tasa debe ser un número válido mayor a cero.', 'error');
    return;
  }
  EXCHANGE_RATE.usdToBs = rateVal;
  EXCHANGE_RATE.lastUpdated = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
  saveToDb('exchange_rate', EXCHANGE_RATE);
  showAdminToast(`✅ Nueva tasa: 1 USD = Bs. ${rateVal.toFixed(2)}`, 'success');
  renderActiveTab();
}

// ════════════════════════════════════════
// 6. APIs CONFIGURATION
// ════════════════════════════════════════
function renderApis(container) {
  const apiCards = API_CONFIGS.map((api, idx) => `
    <div class="admin-api-card ${api.enabled ? 'enabled' : ''}">
      <div class="admin-api-card-header">
        <div class="admin-api-card-status ${api.enabled ? 'active' : 'inactive'}">
          <span class="admin-api-status-dot"></span>
          ${api.enabled ? 'Activa' : 'Inactiva'}
        </div>
        <span class="admin-api-card-number">Puerto ${idx + 1}</span>
      </div>
      <div class="admin-api-card-body">
        <div class="admin-form-group">
          <label class="admin-form-label">Nombre del Servicio</label>
          <input type="text" class="admin-form-input api-field" data-api-idx="${idx}" data-field="name" value="${api.name}" placeholder="Ej. Pasarela de Pagos">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">URL Base</label>
          <input type="text" class="admin-form-input api-field" data-api-idx="${idx}" data-field="baseUrl" value="${api.baseUrl}" placeholder="https://api.ejemplo.com">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="admin-form-group">
            <label class="admin-form-label">Puerto</label>
            <input type="text" class="admin-form-input api-field" data-api-idx="${idx}" data-field="port" value="${api.port}" placeholder="443">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">API Key</label>
            <input type="password" class="admin-form-input api-field" data-api-idx="${idx}" data-field="apiKey" value="${api.apiKey ? '****************' : ''}" placeholder="sk-xxxx..." onfocus="if(this.value==='****************') this.value='';" onblur="if(this.value==='') this.value='${api.apiKey ? '****************' : ''}';" oncopy="return false;" oncut="return false;">
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">Descripción</label>
          <input type="text" class="admin-form-input api-field" data-api-idx="${idx}" data-field="description" value="${api.description}" placeholder="Descripción del servicio">
        </div>
        <div class="admin-api-card-footer">
          <label class="admin-toggle-label">
            <span>Habilitar</span>
            <label class="admin-toggle">
              <input type="checkbox" ${api.enabled ? 'checked' : ''} onchange="toggleApi(${idx}, this.checked)">
              <span class="admin-toggle-slider"></span>
            </label>
          </label>
          <button class="btn btn-secondary" onclick="testApiConnection(${idx})" style="padding: 6px 14px; font-size: 0.82rem;">
            🔌 Probar Conexión
          </button>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Configuración de APIs</h1>
        <p class="admin-subtitle">Gestiona hasta ${API_CONFIGS.length} conexiones de API externas</p>
      </div>
      <button class="btn btn-primary" onclick="saveApis()">
        <span>💾</span> Guardar APIs
      </button>
    </div>
    <div class="admin-apis-grid">${apiCards}</div>
  `;
}

function toggleApi(idx, enabled) {
  API_CONFIGS[idx].enabled = enabled;
}

async function testApiConnection(idx) {
  // Sync current input values from the DOM so we can test before saving
  const inputs = document.querySelectorAll(`.api-field[data-api-idx="${idx}"]`);
  let api = { ...API_CONFIGS[idx] };
  if (inputs.length > 0) {
    inputs.forEach(input => {
      const field = input.getAttribute('data-field');
      const val = input.value.trim();
      if (field === 'apiKey' && val === '****************') return;
      api[field] = val;
    });
  }

  if (!api.baseUrl) {
    showAdminToast(`❌ ${api.name || 'API'}: Ingresa una URL base`, 'error');
    return;
  }

  // Clean trailing slash
  const baseUrl = api.baseUrl.endsWith('/') ? api.baseUrl.slice(0, -1) : api.baseUrl;

  showAdminToast(`🔌 Conectando con ${api.name || 'API'}...`, 'info');

  try {
    const proxyUrl = '/api/proxy';
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: "saldo",
        method: "GET",
        apiKey: api.apiKey,
        baseUrl: baseUrl
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ok) {
        showAdminToast(`✅ ${api.name || 'API'}: ¡Conectado! Saldo: $${parseFloat(data.saldo || 0).toFixed(2)}`, 'success');
      } else {
        showAdminToast(`⚠️ ${api.name || 'API'}: Conectó pero devolvió error: ${data.error}`, 'error');
      }
    } else {
      showAdminToast(`⚠️ ${api.name || 'API'}: Respondió con error HTTP ${response.status}`, 'error');
    }
  } catch (error) {
    console.error('Error de API:', error);
    showAdminToast(`❌ ${api.name || 'API'}: Falló la conexión. Revisa consola o CORS.`, 'error');
  }
}

async function processAutomaticTopup(orderId, fromModal = false) {
  const order = getOrderById(orderId);
  if (!order) return;

  const apiIdx = parseInt(order.apiProvider);

  // Si el producto no tiene API asignada, es un producto manual.
  if (isNaN(apiIdx) || !API_CONFIGS[apiIdx]) {
    completeOrderLocally(orderId, fromModal);
    return;
  }

  // Si tiene API asignada pero está apagada en Configuración de APIs:
  if (!API_CONFIGS[apiIdx].enabled) {
    showAdminToast(`❌ Configuración: El Proveedor API está apagado. Enciéndelo primero.`, 'error');
    return;
  }

  const api = API_CONFIGS[apiIdx];
  const apiProductId = parseInt(order.apiProductId);

  // Si tiene API asignada pero el paquete específico no tiene ID de Servicio:
  if (isNaN(apiProductId)) {
    showAdminToast(`❌ Error: El paquete de este pedido no tiene "ID Servicio API" asignado. Edita el producto.`, 'error');
    return;
  }

  showAdminToast(`⏳ Procesando recarga por API para ${orderId}...`, 'info');

  const baseUrl = api.baseUrl.endsWith('/') ? api.baseUrl.slice(0, -1) : api.baseUrl;

  updateOrderStatus(orderId, 'processing', 'Procesando el pedido de forma automatizada...');
  refreshOrdersView();

  try {
    const rectificationCount = (order.statusHistory || []).filter(h => h.note && h.note.includes('rectificó')).length;
    const finalMerchantRef = rectificationCount > 0 ? `${orderId}_R${rectificationCount}` : orderId;

    const payload = {
      producto_id: apiProductId,
      merchant_ref: finalMerchantRef,
      cantidad: 1
    };

    if (order.gameId) {
      if (order.productType === 'game-id-zone') {
        const match = order.gameId.match(/ID:\s*(.+?)\s*\|\s*Zona:\s*(.+)/i);
        if (match) {
          payload.id_juego = match[1].trim();
          payload.input2 = match[2].trim();
        } else {
          payload.id_juego = order.gameId;
        }
      } else {
        payload.id_juego = order.gameId;
      }
    }

    const proxyUrl = '/api/proxy';
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: "comprar",
        method: "POST",
        apiKey: api.apiKey,
        baseUrl: baseUrl,
        data: payload
      })
    });

    const data = await response.json();

    if (data.ok) {
      if (data.estado === 'completado') {
        let note = 'Aprobado y entregado automáticamente';
        if (data.codigos && data.codigos.length > 0) {
          note = 'Códigos entregados:\n' + data.codigos.join('\n');
        } else if (data.codigo) {
          note = 'Código entregado: ' + data.codigo;
        }
        showAdminToast(`✅ API: Recarga de ${orderId} exitosa.`, 'success');
        completeOrderLocally(orderId, fromModal, note);
      } else if (data.estado === 'procesando') {
        showAdminToast(`⏳ API: Pedido ${orderId} en proceso. Monitoreando...`, 'info');
        pollApiStatus(baseUrl, api.apiKey, orderId, fromModal);
      } else {
        showAdminToast(`⚠️ API: Pedido ${orderId} con estado: ${data.estado}`, 'info');
      }
    } else {
      const refundMsg = data.reembolsado ? ' (Reembolsado al saldo)' : '';

      const errorStr = (data.error || '').toLowerCase();
      if (errorStr.includes('ya fue usado') || errorStr.includes('ya existe') || errorStr.includes('already used')) {
        showAdminToast(`⚠️ API indica que ya fue procesado. Aprobando localmente...`, 'info');
        completeOrderLocally(orderId, fromModal, `Aprobado forzadamente (API indicó: ${data.error})`);
        return;
      }

      showAdminToast(`❌ API Error: ${data.error}${refundMsg}`, 'error');
      updateOrderStatus(orderId, 'invalid-id', `Verifica que el ID o la cuenta sean correctos. El sistema rechazó la recarga. (${data.error}${refundMsg})`);
      refreshOrdersView();
      if (fromModal) closeAdminModal();

      // Notify Admin via Telegram about the API error
      sendTelegramMessage(`⚠️ <b>DATOS INVÁLIDOS — Pedido #${orderId}</b>\nLa API rechazó la recarga automática.\n\n<b>Motivo:</b> ${data.error}${refundMsg}\n\n<i>Estado cambiado a ID Inválido. El cliente debe corregir los datos.</i>`);
    }
  } catch (error) {
    console.error('Error API Comprar:', error);
    showAdminToast(`❌ Fallo de conexión con la API`, 'error');
    updateOrderStatus(orderId, 'pending', 'Fallo en el sistema de recarga automatizada');
    refreshOrdersView();
    sendTelegramMessage(`⚠️ <b>FALLO DE CONEXIÓN API — Pedido #${orderId}</b>\nNo se pudo conectar con el proveedor API externo.\nEl pedido sigue en estado Pendiente.`);
  }
}

function completeOrderLocally(orderId, fromModal, customNote = 'Aprobado y entregado') {
  const order = updateOrderStatus(orderId, 'completed', customNote);
  if (order) {
    showAdminToast(`✅ Pedido ${orderId} completado`, 'success');
    refreshOrdersView();
    if (fromModal) closeAdminModal();
    sendTelegramMessage(`✅ <b>Pedido #${orderId} APROBADO</b>\nProducto: ${order.productName} — ${order.packageLabel}`);
  }
}

function pollApiStatus(baseUrl, apiKey, orderId, fromModal) {
  let attempts = 0;
  const maxAttempts = 15;

  const interval = setInterval(async () => {
    attempts++;
    try {
      const proxyUrl = '/api/proxy';
      const resp = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: `recargas/status?merchant_ref=${orderId}`,
          method: "GET",
          apiKey: apiKey,
          baseUrl: baseUrl
        })
      });
      const data = await resp.json();

      if (data.ok) {
        if (data.status === 'completed' || data.estado === 'completado') {
          clearInterval(interval);

          let note = 'Aprobado y entregado automáticamente (luego de procesar)';
          if (data.codigo) {
            note = 'Código entregado: ' + data.codigo;
          }
          completeOrderLocally(orderId, fromModal, note);
        } else if (data.status === 'failed' || data.estado === 'cancelado') {
          clearInterval(interval);
          updateOrderStatus(orderId, 'rejected', 'El sistema canceló la recarga automáticamente');
          refreshOrdersView();
          showAdminToast(`❌ Proveedor canceló el pedido ${orderId}`, 'error');
          if (fromModal) closeAdminModal();
        } else {
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            showAdminToast(`⏳ Tiempo agotado revisando API para ${orderId}. Verifica manualmente.`, 'info');
          }
        }
      } else {
        clearInterval(interval);
      }
    } catch (e) {
      console.error('Polling error', e);
      if (attempts >= maxAttempts) clearInterval(interval);
    }
  }, 20000);
}

function saveApis() {
  const inputs = document.querySelectorAll('.api-field');
  inputs.forEach(input => {
    const idx = parseInt(input.getAttribute('data-api-idx'));
    const field = input.getAttribute('data-field');
    const val = input.value.trim();
    if (field === 'apiKey' && val === '****************') return;
    API_CONFIGS[idx][field] = val;
  });
  saveToDb('api_configs', API_CONFIGS);
  showAdminToast('✅ Configuración de APIs guardada', 'success');
  renderActiveTab();
}

// ════════════════════════════════════════
// 7. PRODUCT MODAL (Add/Edit)
// ════════════════════════════════════════
function openProductModal(productId = null) {
  const overlay = document.getElementById('admin-modal-overlay');
  const modalContent = document.getElementById('admin-modal-content');
  if (!overlay || !modalContent) return;

  adminState.editingProductId = productId;

  let product = {
    id: '', name: '', category: 'juegos', currency: '', currencyIcon: '💎',
    imageUrl: '', color: '#00b2ff', colorGradient: 'linear-gradient(135deg, #00b2ff, #0066ff)',
    description: '', popular: false, isNew: false, isOutofStock: false, packages: []
  };

  if (productId) {
    const found = PRODUCTS.find(g => g.id === productId);
    if (found) product = JSON.parse(JSON.stringify(found));
  }

  adminState.tempPackages = [...product.packages];

  const categoryOptions = CATEGORIES.map(cat =>
    `<option value="${cat.id}" ${product.category === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`
  ).join('');

  modalContent.innerHTML = `
    <div class="admin-modal-header">
      <h2 class="admin-modal-title">${productId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
      <button class="admin-modal-close" onclick="closeAdminModal()">✕</button>
    </div>

    <div class="admin-modal-body">
      <div class="admin-modal-grid">
        <!-- Col 1: Info -->
        <div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-name">Nombre</label>
            <input type="text" class="admin-form-input" id="m-prod-name" value="${product.name}" placeholder="Ej. Netflix">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-id">ID (slug)</label>
            <input type="text" class="admin-form-input" id="m-prod-id" value="${product.id}" placeholder="ej. netflix" ${productId ? 'disabled' : ''}>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-position" title="El número menor aparecerá primero">Orden de aparición (Posición)</label>
            <input type="number" class="admin-form-input" id="m-prod-position" value="${product.position || 999}" placeholder="Ej. 1">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-category">Categoría</label>
            <select class="admin-form-input" id="m-prod-category">${categoryOptions}</select>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-type">Tipo de Entrega</label>
            <select class="admin-form-input" id="m-prod-type">
              <option value="game-id" ${product.type === 'game-id' || !product.type ? 'selected' : ''}>🎮 Recarga por ID (Pide ID/Usuario del juego)</option>
              <option value="game-id-zone" ${product.type === 'game-id-zone' ? 'selected' : ''}>🎮 Recarga por ID + Zona (Ej. Mobile Legends)</option>
              <option value="account" ${product.type === 'account' ? 'selected' : ''}>🔐 Recarga Manual (Pide Correo y Contraseña)</option>
              <option value="code" ${product.type === 'code' ? 'selected' : ''}>🎫 Entrega Manual (Pantallas, Gift Cards, Códigos)</option>
            </select>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-api">Proveedor API de Recarga (Opcional)</label>
            <select class="admin-form-input" id="m-prod-api">
              <option value="">-- Manual (Sin API) --</option>
              ${API_CONFIGS.map((api, idx) => `
                <option value="${idx}" ${product.apiProvider === String(idx) ? 'selected' : ''}>Puerto ${idx + 1}: ${api.name || 'Sin nombre'}</option>
              `).join('')}
            </select>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-api-verifier">API Verificador de ID (Opcional)</label>
            <select class="admin-form-input" id="m-prod-api-verifier">
              <option value="">-- Sin Verificador --</option>
              ${API_CONFIGS.map((api, idx) => `
                <option value="${idx}" ${product.apiVerifierProvider === String(idx) ? 'selected' : ''}>Puerto ${idx + 1}: ${api.name || 'Sin nombre'}</option>
              `).join('')}
            </select>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-currency">Moneda / Unidad</label>
            <input type="text" class="admin-form-input" id="m-prod-currency" value="${product.currency}" placeholder="Ej. Diamantes, USD, Mes">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-icon">Emoji / Icono</label>
            <input type="text" class="admin-form-input" id="m-prod-icon" value="${product.currencyIcon}" placeholder="Ej. 💎">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-image">URL de Logotipo / Imagen</label>
            <input type="text" class="admin-form-input" id="m-prod-image" value="${product.imageUrl || ''}" placeholder="https://ejemplo.com/logo.png" oninput="previewProductImage(this.value)">
            <div class="admin-image-preview" id="admin-image-preview">
              ${product.imageUrl ? `<img src="${product.imageUrl}" alt="Preview">` : '<span>Sin imagen</span>'}
            </div>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-desc">Descripción</label>
            <textarea class="admin-form-textarea" id="m-prod-desc" placeholder="Descripción del producto...">${product.description}</textarea>
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-color">Color Primario</label>
            <input type="color" class="admin-form-input" id="m-prod-color" value="${product.color || '#00b2ff'}" style="height: 40px; padding: 4px;">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label" for="m-prod-gradient">Gradiente CSS</label>
            <input type="text" class="admin-form-input" id="m-prod-gradient" value="${product.colorGradient}" placeholder="linear-gradient(135deg, #00b2ff, #0066ff)">
          </div>
          <div class="admin-form-group" style="display: flex; gap: 20px; align-items: center; margin-top: 12px; flex-wrap: wrap;">
            <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem;">
              <input type="checkbox" id="m-prod-popular" ${product.popular ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent);">
              🔥 Popular
            </label>
            <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem;">
              <input type="checkbox" id="m-prod-isnew" ${product.isNew ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent);">
              ✨ Nuevo
            </label>
            <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem;">
              <input type="checkbox" id="m-prod-out-of-stock" ${product.isOutofStock ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #ef5350;">
              ⛔ Agotado
            </label>
          </div>
        </div>

        <!-- Col 2: Packages -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-secondary);">Paquetes</h3>
            <button class="btn btn-secondary" onclick="addTempPackage()" style="padding: 6px 12px; font-size: 0.8rem;">
              ➕ Añadir
            </button>
          </div>
          <div class="admin-packages-editor" id="admin-packages-list-editor"></div>
        </div>
      </div>
    </div>

    <div class="admin-modal-footer">
      <button class="btn btn-secondary" onclick="closeAdminModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveProduct()">💾 Guardar Producto</button>
    </div>
  `;

  renderTempPackages();
  overlay.classList.add('active');
}

function previewProductImage(url) {
  const preview = document.getElementById('admin-image-preview');
  if (!preview) return;
  if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
    preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<span>Error al cargar imagen</span>'">`;
  } else {
    preview.innerHTML = '<span>Sin imagen</span>';
  }
}

function showAdminModal(html) {
  const overlay = document.getElementById('admin-modal-overlay');
  const content = document.getElementById('admin-modal-content');
  if (overlay && content) {
    content.innerHTML = html;
    overlay.classList.add('active');
  }
}

function closeAdminModal() {
  const overlay = document.getElementById('admin-modal-overlay');
  if (overlay) overlay.classList.remove('active');
  adminState.editingProductId = null;
  adminState.editingCategoryId = null;
  adminState.tempPackages = [];
}

// ── Package Editor ──
function renderTempPackages() {
  const container = document.getElementById('admin-packages-list-editor');
  if (!container) return;

  if (adminState.tempPackages.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 24px; border: 1px dashed var(--border); border-radius: 8px;">No hay paquetes. Añade uno para empezar.</div>`;
    return;
  }

  container.innerHTML = adminState.tempPackages.map((pkg, idx) => `
    <div class="admin-package-item" data-package-index="${idx}" style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 12px; background: var(--bg-deep); padding: 12px; border-radius: 8px; border: 1px solid var(--border); flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 1.5; min-width: 120px;">
        <label style="font-size: 0.75rem; color: var(--text-muted);">Cantidad o Nombre</label>
        <input type="text" class="admin-form-input" style="padding: 6px 10px; font-size: 0.85rem;" value="${pkg.amount}" onchange="updateTempPackageField(${idx}, 'amount', this.value)" placeholder="100 o Pase">
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 80px;">
        <label style="font-size: 0.75rem; color: var(--text-muted);">Precio ($)</label>
        <input type="number" class="admin-form-input" style="padding: 6px 10px; font-size: 0.85rem;" step="0.01" value="${pkg.priceUsd}" onchange="updateTempPackageField(${idx}, 'priceUsd', this.value)" placeholder="1.09">
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 80px;">
        <label style="font-size: 0.75rem; color: var(--text-muted);">Costo Prov. ($)</label>
        <input type="number" class="admin-form-input" style="padding: 6px 10px; font-size: 0.85rem;" step="0.01" value="${pkg.costUsd || ''}" onchange="updateTempPackageField(${idx}, 'costUsd', this.value)" placeholder="0.80">
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 1.5; min-width: 120px;">
        <label style="font-size: 0.75rem; color: var(--text-muted);">Etiqueta</label>
        <input type="text" class="admin-form-input" style="padding: 6px 10px; font-size: 0.85rem;" value="${pkg.label || ''}" onchange="updateTempPackageField(${idx}, 'label', this.value)" placeholder="100 diamantes">
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 0.8; min-width: 60px;">
        <label style="font-size: 0.75rem; color: var(--text-muted);">ID API (Opc.)</label>
        <input type="text" class="admin-form-input" style="padding: 6px 10px; font-size: 0.85rem;" value="${pkg.apiServiceId || ''}" onchange="updateTempPackageField(${idx}, 'apiServiceId', this.value)" placeholder="Ej. 341">
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 0.5; min-width: 60px; justify-content: flex-end; align-items: center; margin-bottom: 10px;">
        <label style="font-size: 0.75rem; color: var(--text-muted); text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px;">
          <span>Agotado</span>
          <input type="checkbox" ${pkg.isOutofStock ? 'checked' : ''} onchange="updateTempPackageField(${idx}, 'isOutofStock', this.checked)" style="width: 16px; height: 16px; accent-color: #ef5350; cursor: pointer;">
        </label>
      </div>
      <button class="btn btn-danger" onclick="removeTempPackage(${idx})" title="Eliminar" style="padding: 6px; margin-bottom: 2px; flex-shrink: 0; min-width: 40px; height: 35px; display: flex; align-items: center; justify-content: center;">🗑️</button>
    </div>
  `).join('');
}

function addTempPackage() {
  const currencyInput = document.getElementById('m-prod-currency');
  const currencyName = currencyInput ? currencyInput.value.trim() : 'Unidades';
  adminState.tempPackages.push({ amount: 100, priceUsd: 1.00, label: `100 ${currencyName}`, isOutofStock: false });
  renderTempPackages();
}

function removeTempPackage(index) {
  adminState.tempPackages.splice(index, 1);
  renderTempPackages();
}

function updateTempPackageField(index, field, value) {
  const pkg = adminState.tempPackages[index];
  if (!pkg) return;
  if (field === 'amount') pkg.amount = value;
  else if (field === 'priceUsd') pkg.priceUsd = parseFloat(value) || 0.0;
  else if (field === 'costUsd') pkg.costUsd = parseFloat(value) || 0.0;
  else if (field === 'apiServiceId') pkg.apiServiceId = value.trim();
  else if (field === 'isOutofStock') pkg.isOutofStock = value;
  else pkg.label = value.trim();
}

// ── Save Product ──
function saveProduct() {
  const idInput = document.getElementById('m-prod-id');
  const nameInput = document.getElementById('m-prod-name');
  const categoryInput = document.getElementById('m-prod-category');
  const currencyInput = document.getElementById('m-prod-currency');
  const iconInput = document.getElementById('m-prod-icon');
  const imageInput = document.getElementById('m-prod-image');
  const descText = document.getElementById('m-prod-desc');
  const colorInput = document.getElementById('m-prod-color');
  const gradientInput = document.getElementById('m-prod-gradient');
  const popularCheck = document.getElementById('m-prod-popular');
  const isnewCheck = document.getElementById('m-prod-isnew');

  const productId = idInput.value.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
  const productName = nameInput.value.trim();
  const productCurrency = currencyInput.value.trim();

  if (!productName) { showAdminToast('❌ Ingresa el nombre del producto', 'error'); nameInput.focus(); return; }
  if (!productId) { showAdminToast('❌ Ingresa un ID válido', 'error'); idInput.focus(); return; }
  if (!productCurrency) { showAdminToast('❌ Especifica la moneda/unidad', 'error'); currencyInput.focus(); return; }

  for (let i = 0; i < adminState.tempPackages.length; i++) {
    const pkg = adminState.tempPackages[i];
    if (!pkg.amount || pkg.priceUsd <= 0) {
      showAdminToast(`❌ El paquete #${i + 1} tiene valores incorrectos`, 'error');
      return;
    }
    if (!pkg.label) pkg.label = `${pkg.amount} ${productCurrency}`;
  }

  const hexColor = colorInput.value;
  let cssGradient = gradientInput.value.trim();
  if (!cssGradient) cssGradient = `linear-gradient(135deg, ${hexColor}, ${adjustColor(hexColor, -40)})`;

  const finalData = {
    id: productId,
    name: productName,
    category: categoryInput.value,
    type: document.getElementById('m-prod-type').value,
    currency: productCurrency,
    currencyIcon: iconInput.value.trim() || '💎',
    imageUrl: imageInput.value.trim() || '',
    apiProvider: document.getElementById('m-prod-api') ? document.getElementById('m-prod-api').value : '',
    apiVerifierProvider: document.getElementById('m-prod-api-verifier') ? document.getElementById('m-prod-api-verifier').value : '',
    color: hexColor,
    colorGradient: cssGradient,
    description: descText.value.trim(),
    popular: popularCheck.checked,
    isNew: isnewCheck.checked,
    isOutofStock: document.getElementById('m-prod-out-of-stock') ? document.getElementById('m-prod-out-of-stock').checked : false,
    position: parseInt(document.getElementById('m-prod-position').value) || 999,
    packages: [...adminState.tempPackages]
  };

  if (adminState.editingProductId) {
    const idx = PRODUCTS.findIndex(g => g.id === adminState.editingProductId);
    if (idx !== -1) {
      PRODUCTS[idx] = finalData;
      showAdminToast(`✅ "${productName}" actualizado`, 'success');
    }
  } else {
    if (PRODUCTS.some(g => g.id === productId)) {
      showAdminToast(`❌ Ya existe un producto con ID "${productId}"`, 'error');
      idInput.focus();
      return;
    }
    PRODUCTS.push(finalData);
    showAdminToast(`✅ "${productName}" añadido al catálogo`, 'success');
  }

  saveToDb('products', PRODUCTS);
  closeAdminModal();
  renderActiveTab();
}

function deleteProduct(productId) {
  const product = PRODUCTS.find(g => g.id === productId);
  if (!product) return;
  if (confirm(`¿Eliminar "${product.name}" del catálogo?`)) {
    const index = PRODUCTS.findIndex(g => g.id === productId);
    if (index !== -1) {
      PRODUCTS.splice(index, 1);
      saveToDb('products', PRODUCTS);
      showAdminToast(`🗑️ "${product.name}" eliminado`, 'success');
      renderActiveTab();
    }
  }
}

// ── Helper: Adjust hex color brightness ──
function adjustColor(hex, amount) {
  hex = hex.replace('#', '');
  const num = parseInt(hex, 16);
  let r = Math.min(255, Math.max(0, (num >> 16) + amount));
  let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

// ── Toast ──
function showAdminToast(message, type = 'success') {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ════════════════════════════════════════
// 8. ORDERS MANAGEMENT
// ════════════════════════════════════════
window.loadHistoricalOrdersList = async function() {
  if (!confirm("¿Deseas descargar el historial completo de pedidos? Esto puede demorar unos segundos.")) return;
  const btn = document.getElementById('btn-calc-history-orders');
  if (btn) {
    btn.innerHTML = 'Descargando... ⏳';
    btn.disabled = true;
  }
  try {
    const snap = await firebase.database().ref('orders').once('value');
    const ordersData = snap.val() || {};
    let allHistoricalOrders = Object.values(ordersData);

    const canceledIds = [20, 31, 46, 49, 50, 62, 63, 81, 82, 84, 85, 86, 88, 103, 121, 134, 139, 173, 178, 179, 180, 210, 223, 231, 246, 274, 286, 307, 348, 350, 351, 358, 370, 374, 407, 415, 439, 471, 472, 473, 482, 485, 487, 488, 489, 500, 503, 505, 517].map(id => 'AP-OLD-' + id);
    const processingIds = [1, 143, 236, 369].map(id => 'AP-OLD-' + id);

    allHistoricalOrders = allHistoricalOrders.map(o => {
      if (o.status === 'completado') o.status = 'completed';
      if (o.status === 'rechazado' || o.status === 'cancelado') o.status = 'rejected';
      if (o.status === 'pendiente') o.status = 'pending';
      if (o.status === 'procesando') o.status = 'processing';
      if (canceledIds.includes(o.id)) o.status = 'rejected';
      if (processingIds.includes(o.id)) o.status = 'processing';
      
      if (!o.productName && o.productDetails) o.productName = o.productDetails;
      if (!o.packageLabel) o.packageLabel = 'Migrado';
      if (!o.paymentMethodName && o.paymentMethod) o.paymentMethodName = o.paymentMethod;
      if (!o.customerContact && (o.userEmail || o.userPhone)) o.customerContact = o.userEmail || o.userPhone;
      
      return o;
    });

    allHistoricalOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    adminState.showHistoricalOrders = true;
    adminState.historicalOrders = allHistoricalOrders;

    renderActiveTab();
  } catch(e) {
    console.error(e);
    alert('Error al descargar el historial');
    if (btn) {
      btn.innerHTML = '📚 Ver Historial Completo';
      btn.disabled = false;
    }
  }
};

function renderOrders(container) {
  const allOrders = adminState.showHistoricalOrders && adminState.historicalOrders ? adminState.historicalOrders : getOrders();
  const filter = adminState.ordersFilter || 'all';
  const searchTerm = (adminState.ordersSearch || '').toLowerCase().trim();

  // First, filter by status
  let filteredOrders = filter === 'all' ? allOrders : allOrders.filter(o => o.status === filter);

  // Then, filter by search term if provided
  if (searchTerm) {
    filteredOrders = filteredOrders.filter(o =>
      (o.id && o.id.toLowerCase().includes(searchTerm)) ||
      (o.customerContact && o.customerContact.toLowerCase().includes(searchTerm)) ||
      (o.accountEmail && o.accountEmail.toLowerCase().includes(searchTerm)) ||
      (o.gameId && o.gameId.toLowerCase().includes(searchTerm)) ||
      (o.productName && o.productName.toLowerCase().includes(searchTerm))
    );
  }

  // Count by status (based on ALL orders, so filters show total numbers)
  const counts = {
    all: allOrders.length,
    pending: allOrders.filter(o => o.status === 'pending').length,
    processing: allOrders.filter(o => o.status === 'processing').length,
    completed: allOrders.filter(o => o.status === 'completed').length,
    rejected: allOrders.filter(o => o.status === 'rejected').length,
    'invalid-id': allOrders.filter(o => o.status === 'invalid-id').length
  };

  const filters = [
    { id: 'all', label: 'Todos', icon: '📦' },
    { id: 'pending', label: 'Pendientes', icon: '📋' },
    { id: 'processing', label: 'Procesando', icon: '⚙️' },
    { id: 'completed', label: 'Completados', icon: '✅' },
    { id: 'rejected', label: 'Rechazados', icon: '❌' },
    { id: 'invalid-id', label: 'ID Inválido', icon: '⚠️' }
  ];

  const filtersHtml = filters.map(f => `
    <button class="admin-filter-pill ${filter === f.id ? 'active' : ''}" onclick="filterOrders('${f.id}')">
      ${f.icon} ${f.label}
      <span class="admin-filter-count">${counts[f.id]}</span>
    </button>
  `).join('');

  const bulkActionsHtml = `
    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="text" id="admin-orders-search" class="admin-form-input" style="flex: 1; margin-bottom: 0; padding: 10px 16px; border-radius: 8px;" placeholder="Buscar por ID, Email, Teléfono, Juego..." value="${adminState.ordersSearch}" onkeyup="if(event.key==='Enter') filterOrdersSearch(this.value)">
        <button class="btn btn-secondary" onclick="filterOrdersSearch(document.getElementById('admin-orders-search').value)" style="padding: 10px 16px;">🔍 Buscar</button>
        ${adminState.ordersSearch ? `<button class="btn btn-danger" onclick="filterOrdersSearch('')" style="padding: 10px 16px;">✕</button>` : ''}
      </div>
      <div style="display: flex; gap: 8px; align-items: center; background: var(--bg-surface); padding: 8px; border-radius: 8px; border: 1px solid var(--border);">
        <input type="checkbox" id="admin-bulk-select-all" onchange="toggleAllOrders(this.checked)" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent); margin: 0 8px;">
        <select id="admin-bulk-action" class="admin-form-input" style="padding: 6px 12px; font-size: 0.85rem; height: auto; min-width: 180px; margin-bottom: 0;">
          <option value="">Acción masiva...</option>
          <option value="completed">✅ Aprobar seleccionados</option>
          <option value="rejected">❌ Rechazar seleccionados</option>
        </select>
        <button class="btn-primary" onclick="executeBulkAction()" style="padding: 8px 16px; font-size: 0.85rem; border-radius: 6px; font-weight: 600;">
          Aplicar
        </button>
      </div>
    </div>
  `;

  // Pagination Logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  if (adminState.ordersPage > totalPages) adminState.ordersPage = totalPages;
  if (adminState.ordersPage < 1) adminState.ordersPage = 1;

  const startIndex = (adminState.ordersPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const ordersHtml = paginatedOrders.length > 0 ? paginatedOrders.map(order => {
    const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES['pending'];
    const statusClass = order.status;
    const date = new Date(order.createdAt);
    const typeLabel = order.productType === 'account' ? '🔐' : order.productType === 'code' ? '🎫' : '🎮';

    // Build action buttons based on current status
    let actionsHtml = '';

    if (order.status === 'pending' || order.status === 'processing') {
      if (order.status === 'pending') {
        actionsHtml += `<button class="admin-order-action-btn admin-action-process" onclick="event.stopPropagation(); quickUpdateStatus('${order.id}', 'processing')" title="Marcar como procesando">⚙️ Procesar</button>`;
      }
      actionsHtml += `<button class="admin-order-action-btn admin-action-approve" onclick="event.stopPropagation(); quickUpdateStatus('${order.id}', 'completed')" title="Aprobar y completar">✅ Aprobar</button>`;
      actionsHtml += `<button class="admin-order-action-btn admin-action-reject" onclick="event.stopPropagation(); openRejectModal('${order.id}', 'rejected')" title="Rechazar pedido">❌ Rechazar</button>`;
      actionsHtml += `<button class="admin-order-action-btn admin-action-invalid" onclick="event.stopPropagation(); openRejectModal('${order.id}', 'invalid-id')" title="ID Inválido">⚠️ Inválido</button>`;
    } else {
      // For completed/rejected/invalid-id, allow overriding
      actionsHtml += `<span style="font-size: 0.75rem; color: var(--text-muted); margin-right: 4px;">Cambiar a:</span>`;
      if (order.status !== 'completed') {
        actionsHtml += `<button class="admin-order-action-btn admin-action-approve" onclick="event.stopPropagation(); quickUpdateStatus('${order.id}', 'completed')" title="Forzar Aprobación">✅</button>`;
      }
      if (order.status !== 'rejected') {
        actionsHtml += `<button class="admin-order-action-btn admin-action-reject" onclick="event.stopPropagation(); openRejectModal('${order.id}', 'rejected')" title="Forzar Rechazo">❌</button>`;
      }
      if (order.status !== 'invalid-id') {
        actionsHtml += `<button class="admin-order-action-btn admin-action-invalid" onclick="event.stopPropagation(); openRejectModal('${order.id}', 'invalid-id')" title="Marcar ID Inválido">⚠️</button>`;
      }
      if (order.status !== 'processing') {
        actionsHtml += `<button class="admin-order-action-btn admin-action-process" onclick="event.stopPropagation(); quickUpdateStatus('${order.id}', 'processing')" title="Volver a Procesando">⚙️</button>`;
      }
      if (order.status !== 'pending') {
        actionsHtml += `<button class="admin-order-action-btn admin-action-process" style="filter: grayscale(1);" onclick="event.stopPropagation(); quickUpdateStatus('${order.id}', 'pending')" title="Volver a Pendiente">📋</button>`;
      }
    }

    actionsHtml += `<button class="admin-order-action-btn admin-action-view" onclick="event.stopPropagation(); openOrderDetailModal('${order.id}')" title="Ver detalle" style="margin-left: 8px;">👁️ Ver</button>`;

    return `
      <div class="admin-order-card" onclick="openOrderDetailModal('${order.id}')">
        <div style="padding-right: 12px; display: flex; align-items: center;" onclick="event.stopPropagation()">
          <input type="checkbox" class="admin-bulk-checkbox" value="${order.id}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent);">
        </div>
        <div class="admin-order-ref">${order.id}</div>
        <div class="admin-order-info">
          <div class="admin-order-product">
            ${typeLabel} ${order.productName}
            <span style="font-size: 0.78rem; font-weight: 400; color: var(--text-muted);">— ${order.packageLabel}</span>
          </div>
          <div class="admin-order-meta">
            <span class="admin-order-meta-item">💰 $${order.priceUsd.toFixed(2)} | Bs. ${formatBs(order.priceBs)}</span>
            <span class="admin-order-meta-item">💳 ${order.paymentMethodName}</span>
            <span class="admin-order-meta-item">📱 ${order.customerContact || 'Sin contacto'}</span>
            <span class="admin-order-meta-item">📅 ${date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })} ${date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <div class="admin-order-status-col">
          <span class="admin-status-badge admin-status-${statusClass}">${statusInfo.icon} ${statusInfo.label}</span>
        </div>
        <div class="admin-order-actions">
          ${actionsHtml}
        </div>
      </div>
    `;
  }).join('') : `
    <div class="admin-empty-orders">
      <div class="admin-empty-orders-icon">📋</div>
      <h3>${filter === 'all' && !searchTerm ? 'No hay pedidos todavía' : 'No se encontraron pedidos'}</h3>
      <p>Los pedidos de tus clientes aparecerán aquí</p>
    </div>
  `;

  const paginationHtml = totalPages > 1 ? `
    <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px; padding: 16px; background: var(--bg-surface); border-radius: 8px; border: 1px solid var(--border);">
      <button class="btn btn-secondary" onclick="changeOrdersPage(-1)" ${adminState.ordersPage === 1 ? 'disabled style="opacity:0.5"' : ''}>Anterior</button>
      <span style="font-size: 0.9rem; color: var(--text-secondary);">Página <strong>${adminState.ordersPage}</strong> de ${totalPages}</span>
      <button class="btn btn-secondary" onclick="changeOrdersPage(1)" ${adminState.ordersPage === totalPages ? 'disabled style="opacity:0.5"' : ''}>Siguiente</button>
    </div>
  ` : '';

  const titleText = adminState.showHistoricalOrders ? 'Gestión de Pedidos (Histórico)' : 'Gestión de Pedidos (Últimos 150)';
  const historyBtn = adminState.showHistoricalOrders 
    ? `<button class="btn btn-secondary" onclick="adminState.showHistoricalOrders = false; renderActiveTab();" style="padding: 8px 16px; font-size: 0.85rem;">⬅️ Volver a Recientes</button>`
    : `<button id="btn-calc-history-orders" class="btn btn-secondary" onclick="loadHistoricalOrdersList()" style="padding: 8px 16px; font-size: 0.85rem; border: 1px solid var(--accent); color: var(--accent);">📚 Ver Historial Completo</button>`;

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">${titleText}</h1>
        <p class="admin-subtitle">${filteredOrders.length} resultados de ${allOrders.length} en total · ${counts.pending} pendiente${counts.pending !== 1 ? 's' : ''}</p>
      </div>
      <div style="display: flex; gap: 8px;">
        ${historyBtn}
        <button class="btn btn-secondary" onclick="exportOrders()" style="padding: 8px 16px; font-size: 0.85rem;">
          📥 Exportar
        </button>
        <button class="btn btn-danger" onclick="clearHistoryOrders()" style="padding: 8px 16px; font-size: 0.85rem; background: rgba(220,53,69,0.15); color: #ff6b6b; border: 1px solid rgba(220,53,69,0.3);">
          🗑️ Limpiar Historial
        </button>
      </div>
    </div>
    <div class="admin-orders-filters">
      ${filtersHtml}
    </div>
    ${bulkActionsHtml}
    <div class="admin-orders-list">
      ${ordersHtml}
    </div>
    ${paginationHtml}
  `;
}

function filterOrders(status) {
  adminState.ordersFilter = status;
  adminState.ordersPage = 1;
  const main = document.getElementById('admin-main-content');
  if (main) renderOrders(main);
}

function filterOrdersSearch(query) {
  adminState.ordersSearch = query.trim();
  adminState.ordersPage = 1;
  const main = document.getElementById('admin-main-content');
  if (main) renderOrders(main);
}

function changeOrdersPage(delta) {
  adminState.ordersPage += delta;
  const main = document.getElementById('admin-main-content');
  if (main) {
    renderOrders(main);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function quickUpdateStatus(orderId, newStatus) {
  if (newStatus === 'completed') {
    processAutomaticTopup(orderId, false);
    return;
  }
  const order = updateOrderStatus(orderId, newStatus, ORDER_STATUSES[newStatus]?.label || '');
  if (order) {
    showAdminToast(`${ORDER_STATUSES[newStatus]?.icon || '✅'} Pedido ${orderId} → ${ORDER_STATUSES[newStatus]?.label}`, 'success');
    refreshOrdersView();
  }
}

function openRejectModal(orderId, statusType) {
  const overlay = document.getElementById('admin-modal-overlay');
  const modalContent = document.getElementById('admin-modal-content');
  if (!overlay || !modalContent) return;

  const statusInfo = ORDER_STATUSES[statusType] || {};
  const titleText = statusType === 'rejected' ? 'Rechazar Pedido' : 'Marcar ID Inválido';
  const placeholderText = statusType === 'rejected'
    ? 'Ej: Pago no recibido, comprobante inválido...'
    : 'Ej: ID del juego no existe, verificar con el cliente...';

  modalContent.innerHTML = `
    <div class="admin-modal-header">
      <h2 class="admin-modal-title">${statusInfo.icon} ${titleText} — ${orderId}</h2>
      <button class="admin-modal-close" onclick="closeAdminModal()">✕</button>
    </div>
    <div style="margin-bottom: 16px;">
      <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 12px;">Agrega una nota para el cliente explicando el motivo:</p>
      <textarea class="admin-order-note-input" id="reject-note-input" rows="3" placeholder="${placeholderText}" style="min-height: 80px; resize: vertical;"></textarea>
    </div>
    <div class="admin-modal-footer">
      <button class="btn btn-secondary" onclick="closeAdminModal()">Cancelar</button>
      <button class="btn" style="background: ${statusInfo.color}; color: white; border: none;" onclick="confirmRejectOrder('${orderId}', '${statusType}')">
        ${statusInfo.icon} Confirmar
      </button>
    </div>
  `;

  overlay.classList.add('active');
  setTimeout(() => document.getElementById('reject-note-input')?.focus(), 200);
}

function confirmRejectOrder(orderId, statusType) {
  const noteInput = document.getElementById('reject-note-input');
  const note = noteInput ? noteInput.value.trim() : '';

  if (!note) {
    showAdminToast('⚠️ Agrega una nota para el cliente', 'error');
    noteInput?.focus();
    return;
  }

  const order = updateOrderStatus(orderId, statusType, note);
  if (order) {
    const statusInfo = ORDER_STATUSES[statusType] || {};
    showAdminToast(`${statusInfo.icon} Pedido ${orderId} → ${statusInfo.label}`, 'success');
    closeAdminModal();
    refreshOrdersView();
    if (statusType === 'rejected' || statusType === 'invalid-id') {
      sendTelegramMessage(`❌ <b>Pedido #${orderId} RECHAZADO</b>\nMotivo: ${note}`);
    }
  }
}

function openOrderDetailModal(orderId) {
  const order = getOrderById(orderId);
  if (!order) {
    showAdminToast('❌ Pedido no encontrado', 'error');
    return;
  }

  const overlay = document.getElementById('admin-modal-overlay');
  const modalContent = document.getElementById('admin-modal-content');
  if (!overlay || !modalContent) return;

  const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES['pending'];
  const statusClass = order.status;
  const typeLabel = order.productType === 'account' ? '🔐 Recarga Interna' : order.productType === 'code' ? '🎫 Entrega por Código' : '🎮 Recarga por ID';
  const date = new Date(order.createdAt);

  // Type-specific info
  let typeSpecificHtml = '';
  if (order.productType === 'game-id' && order.gameId) {
    typeSpecificHtml = `
      <div class="admin-detail-row">
        <span class="label">🎮 ID del Juego</span>
        <span class="value">
          <strong>${order.gameId}</strong>
          <button class="copy-btn" onclick="adminCopyText('${order.gameId}')" title="Copiar">📋</button>
        </span>
      </div>
    `;
  } else if (order.productType === 'account') {
    typeSpecificHtml = `
      <div class="admin-detail-row">
        <span class="label">📧 Email / Usuario</span>
        <span class="value">
          <strong>${order.accountEmail || 'N/A'}</strong>
          ${order.accountEmail ? `<button class="copy-btn" onclick="adminCopyText('${order.accountEmail}')" title="Copiar">📋</button>` : ''}
        </span>
      </div>
      <div class="admin-detail-row">
        <span class="label">🔒 Contraseña</span>
        <span class="value">
          <span id="order-pass-display" style="font-family: monospace;">••••••••</span>
          <button class="copy-btn" onclick="toggleOrderPassword('${order.accountPassword || ''}')" title="Mostrar" id="order-pass-toggle">👁️</button>
          ${order.accountPassword ? `<button class="copy-btn" onclick="adminCopyText('${order.accountPassword}')" title="Copiar">📋</button>` : ''}
        </span>
      </div>
    `;
  }

  // Status history
  const historyHtml = (order.statusHistory || []).slice().reverse().map(h => {
    const s = ORDER_STATUSES[h.status] || {};
    const hDate = new Date(h.timestamp);
    return `
      <div class="admin-history-item">
        <div class="admin-history-dot" style="background: ${s.color || '#5a7099'}"></div>
        <div class="admin-history-text">
          <div style="font-weight: 500;">${s.icon || ''} ${s.label || h.status}</div>
          ${h.note ? `<div style="color: var(--text-muted); margin-top: 2px; font-size: 0.78rem;">${h.note}</div>` : ''}
        </div>
        <div class="admin-history-time">${hDate.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })} ${hDate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    `;
  }).join('');

  // Action buttons based on status
  let actionButtonsHtml = '';
  if (order.status === 'pending' || order.status === 'processing') {
    actionButtonsHtml = `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
        ${order.status === 'pending' ? `<button class="admin-order-action-btn admin-action-process" onclick="quickUpdateStatusFromModal('${order.id}', 'processing')" style="padding: 10px 20px; font-size: 0.88rem;">⚙️ Procesando</button>` : ''}
        <button class="admin-order-action-btn admin-action-approve" onclick="quickUpdateStatusFromModal('${order.id}', 'completed')" style="padding: 10px 20px; font-size: 0.88rem;">✅ Aprobar</button>
        <button class="admin-order-action-btn admin-action-reject" onclick="closeAdminModal(); setTimeout(() => openRejectModal('${order.id}', 'rejected'), 200);" style="padding: 10px 20px; font-size: 0.88rem;">❌ Rechazar</button>
        <button class="admin-order-action-btn admin-action-invalid" onclick="closeAdminModal(); setTimeout(() => openRejectModal('${order.id}', 'invalid-id'), 200);" style="padding: 10px 20px; font-size: 0.88rem;">⚠️ ID Inválido</button>
      </div>
    `;
  }

  modalContent.innerHTML = `
    <div class="admin-modal-header">
      <h2 class="admin-modal-title">Detalle del Pedido</h2>
      <button class="admin-modal-close" onclick="closeAdminModal()">✕</button>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <span class="admin-order-ref" style="font-size: 1rem; padding: 8px 16px;">${order.id}</span>
      <span class="admin-status-badge admin-status-${statusClass}" style="font-size: 0.85rem; padding: 6px 16px;">${statusInfo.icon} ${statusInfo.label}</span>
    </div>

    <div class="admin-order-detail-grid">
      <div class="admin-order-detail-section">
        <h4>📦 Producto</h4>
        <div class="admin-detail-row">
          <span class="label">Producto</span>
          <span class="value">${order.productName}</span>
        </div>
        <div class="admin-detail-row">
          <span class="label">Tipo</span>
          <span class="value">${typeLabel}</span>
        </div>
        <div class="admin-detail-row">
          <span class="label">Paquete</span>
          <span class="value">${order.packageLabel}</span>
        </div>
        <div class="admin-detail-row">
          <span class="label">Precio USD</span>
          <span class="value"><strong>$${order.priceUsd.toFixed(2)}</strong></span>
        </div>
        <div class="admin-detail-row">
          <span class="label">Precio Bs.</span>
          <span class="value"><strong>Bs. ${formatBs(order.priceBs)}</strong></span>
        </div>
      </div>

      <div class="admin-order-detail-section">
        <h4>👤 Cliente</h4>
        <div class="admin-detail-row">
          <span class="label">Contacto</span>
          <span class="value">
            ${order.customerContact || 'No proporcionado'}
            ${order.customerContact ? `<button class="copy-btn" onclick="adminCopyText('${order.customerContact}')" title="Copiar">📋</button>` : ''}
          </span>
        </div>
        <div class="admin-detail-row">
          <span class="label">Método de Pago</span>
          <span class="value">${order.paymentMethodName}</span>
        </div>
        ${typeSpecificHtml}
        <div class="admin-detail-row">
          <span class="label">Fecha</span>
          <span class="value">${date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })} ${date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>

    ${order.adminNote ? `
      <div style="background: var(--bg-deep); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 16px;">
        <span style="color: var(--text-muted); font-size: 0.82rem;">📝 Nota del admin:</span>
        <div style="margin-top: 4px; font-size: 0.9rem;">${order.adminNote}</div>
      </div>
    ` : ''}

    <div class="admin-order-detail-section">
      <h4>📜 Historial de Estados</h4>
      <div class="admin-order-history">
        ${historyHtml}
      </div>
    </div>

    ${actionButtonsHtml}

    <div class="admin-modal-footer">
      <button class="btn btn-danger" onclick="confirmDeleteOrder('${order.id}')" style="margin-right: auto; padding: 8px 16px; font-size: 0.85rem; background: rgba(220,53,69,0.15); color: #ff6b6b; border: 1px solid rgba(220,53,69,0.3);">🗑️ Eliminar</button>
      <button class="btn btn-secondary" onclick="closeAdminModal()">Cerrar</button>
    </div>
  `;

  overlay.classList.add('active');
}

function quickUpdateStatusFromModal(orderId, newStatus) {
  if (newStatus === 'completed') {
    processAutomaticTopup(orderId, true);
    return;
  }
  const order = updateOrderStatus(orderId, newStatus, ORDER_STATUSES[newStatus]?.label || '');
  if (order) {
    showAdminToast(`${ORDER_STATUSES[newStatus]?.icon || '✅'} Pedido ${orderId} → ${ORDER_STATUSES[newStatus]?.label}`, 'success');
    closeAdminModal();
    refreshOrdersView();
  }
}

function toggleOrderPassword(password) {
  const display = document.getElementById('order-pass-display');
  const toggleBtn = document.getElementById('order-pass-toggle');
  if (!display) return;
  if (display.textContent === '••••••••') {
    display.textContent = password;
    if (toggleBtn) toggleBtn.textContent = '🙈';
  } else {
    display.textContent = '••••••••';
    if (toggleBtn) toggleBtn.textContent = '👁️';
  }
}

function adminCopyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showAdminToast('✅ Copiado al portapapeles', 'success');
  }).catch(() => {
    const tmp = document.createElement('textarea');
    tmp.value = text;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    tmp.remove();
    showAdminToast('✅ Copiado al portapapeles', 'success');
  });
}

function confirmDeleteOrder(orderId) {
  if (confirm(`¿Eliminar el pedido ${orderId}? Esta acción no se puede deshacer.`)) {
    if (deleteOrder(orderId)) {
      showAdminToast(`🗑️ Pedido ${orderId} eliminado`, 'success');
      closeAdminModal();
      refreshOrdersView();
    }
  }
}

function clearHistoryOrders() {
  const orders = getOrders();
  const toDelete = orders.filter(o => o.status === 'completed' || o.status === 'rejected');
  if (toDelete.length === 0) {
    showAdminToast('ℹ️ No hay pedidos completados o rechazados para eliminar', 'error');
    return;
  }
  if (confirm(`¿Eliminar ${toDelete.length} pedido(s) completados y rechazados? Esta acción no se puede deshacer.`)) {
    const remaining = orders.filter(o => o.status !== 'completed' && o.status !== 'rejected');
    toDelete.forEach(o => removeOrderFromDb(o.id));
    ORDERS = remaining;
    showAdminToast(`🗑️ ${toDelete.length} pedido(s) eliminados del historial`, 'success');
    refreshOrdersView();
  }
}

function exportOrders() {
  const orders = getOrders();
  if (orders.length === 0) {
    showAdminToast('ℹ️ No hay pedidos para exportar', 'error');
    return;
  }

  let csv = 'Referencia,Producto,Paquete,Tipo,Precio USD,Precio Bs,Método de Pago,Contacto,Game ID,Email,Estado,Fecha\n';
  orders.forEach(o => {
    csv += `${o.id},"${o.productName}","${o.packageLabel}",${o.productType || 'game-id'},${o.priceUsd},${o.priceBs},"${o.paymentMethodName}","${o.customerContact || ''}","${o.gameId || ''}","${o.accountEmail || ''}",${o.status},${o.createdAt}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `recargaaccessplay_pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showAdminToast(`📥 ${orders.length} pedidos exportados a CSV`, 'success');
}

function refreshOrdersView() {
  // Update sidebar badge
  const badgeTarget = document.querySelector('.admin-nav-item[data-tab="orders"]');
  if (badgeTarget) {
    const existingBadge = badgeTarget.querySelector('.admin-nav-badge');
    const count = getPendingOrdersCount();
    if (count > 0) {
      if (existingBadge) {
        existingBadge.textContent = count;
      } else {
        const badge = document.createElement('span');
        badge.className = 'admin-nav-badge';
        badge.textContent = count;
        badgeTarget.appendChild(badge);
      }
    } else if (existingBadge) {
      existingBadge.remove();
    }
  }

  // Re-render if on orders or dashboard tab
  if (adminState.currentTab === 'orders' || adminState.currentTab === 'dashboard') {
    renderActiveTab();
  }
}

// ════════════════════════════════════════
// 8. TELEGRAM & ANTI-SPAM
// ════════════════════════════════════════
function renderTelegram(container) {
  const blockedUsers = getBlockedUsers();

  const blockedHtml = blockedUsers.length > 0 ? blockedUsers.map(b => `
    <div class="admin-blocked-user-row" style="background: rgba(220,53,69,0.05); border: 1px solid rgba(220,53,69,0.1); border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
      <div class="blocked-info">
        <div style="font-weight: 500; font-size: 0.9rem; margin-bottom: 4px;">Fingerprint: <code style="background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px;">${b.fingerprint}</code></div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px;">${b.reason}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">Bloqueado hasta: ${new Date(b.until).toLocaleString('es-VE')}</div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="adminUnblockUser('${b.fingerprint}')" style="padding: 6px 12px; font-size: 0.8rem; border-color: rgba(220,53,69,0.2); color: #dc3545;">🔓 Desbloquear</button>
    </div>
  `).join('') : '<p style="color: var(--text-muted); font-size: 0.9rem; padding: 20px; text-align: center; background: rgba(0,0,0,0.02); border-radius: 8px;">No hay usuarios bloqueados actualmente.</p>';

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Telegram & Seguridad</h1>
        <p class="admin-subtitle">Configura el bot de Telegram y gestiona usuarios bloqueados</p>
      </div>
    </div>

    <div class="admin-telegram-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px;">
      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">🤖 Configuración del Bot</h2>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">Bot Token</label>
          <input type="text" class="admin-form-input" id="tg-bot-token" value="${TELEGRAM_CONFIG.botToken}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">Chat ID (Tu Telegram)</label>
          <input type="text" class="admin-form-input" id="tg-chat-id" value="${TELEGRAM_CONFIG.chatId}">
        </div>
        <div class="admin-form-group" style="display: flex; gap: 16px; align-items: center; margin-top: 16px; margin-bottom: 24px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.95rem;">
            <input type="checkbox" id="tg-enabled" ${TELEGRAM_CONFIG.enabled ? 'checked' : ''} style="width: 18px; height: 18px;">
            Habilitar notificaciones a Telegram
          </label>
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="saveAdminTelegramConfig()" style="flex: 1;">💾 Guardar Configuración</button>
          <button class="btn btn-secondary" onclick="testTelegramConnection()" style="flex: 1;">🔌 Probar Conexión</button>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">🛡️ Sistema Anti-Spam</h2>
        </div>
        <div>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 16px;">Usuarios bloqueados temporalmente por exceder el límite de pedidos (${SPAM_CONFIG.maxOrdersPerHour} por hora).</p>
          <div class="admin-blocked-users-list">
            ${blockedHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

function saveAdminTelegramConfig() {
  TELEGRAM_CONFIG.botToken = document.getElementById('tg-bot-token').value.trim();
  TELEGRAM_CONFIG.chatId = document.getElementById('tg-chat-id').value.trim();
  TELEGRAM_CONFIG.enabled = document.getElementById('tg-enabled').checked;
  saveTelegramConfig();
  showAdminToast('✅ Configuración de Telegram guardada', 'success');
}

async function testTelegramConnection() {
  if (!TELEGRAM_CONFIG.botToken || !TELEGRAM_CONFIG.chatId) {
    showAdminToast('⚠️ Faltan datos de configuración', 'error');
    return;
  }
  showAdminToast('Probando conexión...', 'info');
  const success = await sendTelegramMessage('🤖 <b>¡Conexión Exitosa!</b>\nLas notificaciones de AccessPlay están funcionando correctamente.');
  if (success) {
    showAdminToast('✅ Mensaje de prueba enviado', 'success');
  } else {
    showAdminToast('❌ Error al enviar. Verifica el Token y Chat ID.', 'error');
  }
}

function adminUnblockUser(fingerprint) {
  unblockUser(fingerprint);
  showAdminToast('✅ Usuario desbloqueado', 'success');
  renderActiveTab();
}

function handleUrlAction(action, orderId) {
  const checkInterval = setInterval(() => {
    // Esperar a que los datos se hayan cargado (las órdenes están en window.ADMIN_ORDERS o en getOrders())
    const orders = getOrders();
    if (window.DATA_LOADED && orders && orders.length > 0) {
      clearInterval(checkInterval);
      switchTab('orders');
      if (action === 'approve') {
        const order = getOrderById(orderId);
        if (order && order.status !== 'completed') {
          quickUpdateStatus(orderId, 'completed');
        }
      } else if (action === 'reject') {
        openRejectModal(orderId, 'rejected');
        showAdminToast('Por favor confirme el rechazo y escriba el motivo.', 'info');
      } else if (action === 'view') {
        openOrderDetailModal(orderId);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, 200);

  // Fallback timeout para detener el intervalo si tarda más de 10 segundos
  setTimeout(() => clearInterval(checkInterval), 10000);
}

// ════════════════════════════════════════
// 10. DESCUENTOS
// ════════════════════════════════════════
function renderDiscounts(container) {
  const discounts = getDiscounts();
  const listHtml = discounts.length > 0 ? discounts.map(d => `
    <div style="background: rgba(15, 31, 56, 0.4); backdrop-filter: blur(8px); padding: 16px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <span class="admin-order-ref" style="font-size: 1.1rem; padding: 6px 12px;">${d.code}</span>
          <span style="font-size: 1.05rem; color: var(--accent); font-weight: 600;">
            ${d.type === 'percentage' ? '-' + d.value + '%' : '-$' + parseFloat(d.value).toFixed(2)}
          </span>
        </div>
        <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; gap: 12px; flex-wrap: wrap;">
          ${d.expiryDate ? `<span style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">📅 Vence: ${new Date(d.expiryDate).toLocaleDateString()}</span>` : `<span style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">📅 Sin Vencimiento</span>`}
          ${d.globalLimit ? `<span style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">🌍 Uso Global: ${d.globalLimit}</span>` : `<span style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">🌍 Uso Ilimitado</span>`}
          ${d.perClientLimit ? `<span style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">👤 Límite Cliente: ${d.perClientLimit}</span>` : ''}
        </div>
      </div>
      <button class="btn btn-secondary" style="padding: 6px 12px; color: #ff6b6b; border-color: rgba(220,53,69,0.2);" onclick="adminDeleteDiscount('${d.code}')" title="Eliminar cupón">🗑️ Eliminar</button>
    </div>
  `).join('') : '<p style="color: var(--text-muted); padding: 20px; text-align: center; background: rgba(0,0,0,0.2); border-radius: 8px;">No hay cupones activos.</p>';

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">🏷️ Códigos de Descuento</h1>
        <p class="admin-subtitle">Crea y gestiona los cupones promocionales.</p>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px;">
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">✨ Crear Cupón</h3>
        </div>
        <form id="admin-discount-form" onsubmit="adminCreateDiscount(event)">
          <div class="admin-form-group">
            <label class="admin-form-label">Código (Ej: VERANO20)</label>
            <input type="text" id="discount-code" class="admin-form-input" required style="text-transform: uppercase;" placeholder="CÓDIGO" pattern="[A-Za-z0-9]+" title="Solo letras y números, sin espacios">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="admin-form-group">
              <label class="admin-form-label">Tipo de Descuento</label>
              <select id="discount-type" class="admin-form-input" required>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo ($)</option>
              </select>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Valor</label>
              <input type="number" id="discount-value" class="admin-form-input" required min="0.1" step="0.1" placeholder="Ej: 10">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 10px;">
            <div class="admin-form-group">
              <label class="admin-form-label">Vence (Opcional)</label>
              <input type="date" id="discount-expiry" class="admin-form-input">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Uso Global (Opcional)</label>
              <input type="number" id="discount-global-limit" class="admin-form-input" min="1" placeholder="Ilimitado">
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label">Por Cliente (Opcional)</label>
              <input type="number" id="discount-client-limit" class="admin-form-input" min="1" placeholder="Ilimitado">
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 16px;">➕ Crear Cupón</button>
        </form>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">🎟️ Cupones Activos (${discounts.length})</h3>
        </div>
        <div>
          ${listHtml}
        </div>
      </div>
    </div>
  `;
}

function adminCreateDiscount(event) {
  event.preventDefault();
  const code = document.getElementById('discount-code').value;
  const type = document.getElementById('discount-type').value;
  const value = document.getElementById('discount-value').value;
  const expiryDate = document.getElementById('discount-expiry').value || null;
  const globalLimit = document.getElementById('discount-global-limit').value || null;
  const clientLimit = document.getElementById('discount-client-limit').value || null;

  if (createDiscount(code, type, value, expiryDate, globalLimit, clientLimit)) {
    showAdminToast('✅ Cupón creado exitosamente', 'success');
    renderActiveTab();
  } else {
    showAdminToast('⚠️ Ese código ya existe', 'error');
  }
}

function adminDeleteDiscount(code) {
  if (confirm(`¿Seguro que deseas eliminar el cupón ${code}?`)) {
    deleteDiscount(code);
    showAdminToast('Cupón eliminado', 'info');
    renderActiveTab();
  }
}

// ════════════════════════════════════════
// MESSAGES & SETTINGS
// ════════════════════════════════════════

// ── Messages ──
let currentChatSessionId = null;

function renderMessages(main) {
  if (!document.getElementById('admin-chat-container')) {
    main.innerHTML = `
      <header class="admin-header">
        <h2>💬 Mensajería de Soporte</h2>
      </header>
      <div style="display: grid; grid-template-columns: 350px 1fr; gap: 20px; align-items: start; margin-top: 20px;" class="admin-messages-grid">
        <div class="admin-card" style="padding: 15px; max-height: 600px; overflow-y: auto; display: flex; flex-direction: column;">
          <div class="admin-card-header" style="border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 15px;">
            <h3 class="admin-card-title">Bandeja de Entrada</h3>
          </div>
          <div id="admin-chat-list" style="flex: 1; overflow-y: auto; padding-right: 5px;">
            <!-- List loaded via JS -->
          </div>
        </div>
        <div class="admin-card" id="admin-chat-container" style="padding: 0; overflow: hidden; max-height: 600px;">
          <!-- Chat loaded via JS -->
        </div>
      </div>
    `;
  }

  updateAdminMessagesUI();
}

function updateAdminMessagesUI() {
  const allConversations = getMessages();
  allConversations.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  const listContainer = document.getElementById('admin-chat-list');
  const chatContainer = document.getElementById('admin-chat-container');
  if (!listContainer || !chatContainer) return;

  // Render List
  let listHtml = '';
  if (allConversations.length === 0) {
    listHtml = '<p style="color:var(--text-muted); padding: 15px;">No hay mensajes aún.</p>';
  } else {
    allConversations.forEach(conv => {
      const isUnread = conv.hasUnreadAdmin;
      const unreadBadge = isUnread ? '<span style="background:var(--error); width:10px; height:10px; border-radius:50%; display:inline-block; margin-left:10px;"></span>' : '';
      const lastMsg = (conv.messages && conv.messages.length > 0) ? conv.messages[conv.messages.length - 1].text : '';
      const selectedStr = (currentChatSessionId === conv.sessionId) ? 'background: rgba(0, 229, 195, 0.1); border-left: 3px solid var(--accent);' : 'background: var(--bg-deep); border-left: 3px solid transparent;';

      const contactLabel = conv.contact || `Anónimo (${conv.sessionId.substring(0, 8)})`;
      listHtml += `
        <div style="padding: 15px; margin-bottom: 10px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s; ${selectedStr}" onclick="openAdminChat('${conv.sessionId}')">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <strong style="color:var(--text-primary); font-size: 0.95rem;">📱 ${contactLabel}</strong>
            ${unreadBadge}
          </div>
          <div style="color:var(--text-secondary); font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${lastMsg}
          </div>
          <div style="color:var(--text-muted); font-size: 0.75rem; margin-top: 5px; text-align: right;">
            ${new Date(conv.updatedAt).toLocaleString('es-VE')}
          </div>
        </div>
      `;
    });
  }
  listContainer.innerHTML = listHtml;

  // Render Chat
  if (!currentChatSessionId) {
    chatContainer.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%; color:var(--text-muted);">Selecciona una conversación</div>';
    return;
  }

  const conv = allConversations.find(m => m.sessionId === currentChatSessionId);
  if (conv) {
    let messagesHtml = '';
    (conv.messages || []).forEach(msg => {
      const isAdmin = msg.sender === 'admin';
      const align = isAdmin ? 'flex-end' : 'flex-start';
      const bg = isAdmin ? 'var(--accent)' : 'var(--bg-surface)';
      const color = isAdmin ? 'var(--bg-deep)' : 'var(--text-primary)';
      const time = new Date(msg.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
      messagesHtml += `
        <div style="display:flex; flex-direction:column; align-items:${align}; margin-bottom:15px;">
          <div style="background:${bg}; color:${color}; padding:10px 15px; border-radius:15px; max-width:80%;">
            ${msg.text}
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${time}</div>
        </div>
      `;
    });

    const contactLabel = conv.contact || `Anónimo (${conv.sessionId.substring(0, 8)})`;

    // Si ya existe el contenedor de mensajes, solo actualizar la lista para no perder foco del input
    const msgBox = document.getElementById('admin-chat-messages');
    if (msgBox) {
      // Check if scrolled to bottom before update
      const isAtBottom = msgBox.scrollHeight - msgBox.scrollTop <= msgBox.clientHeight + 50;
      msgBox.innerHTML = messagesHtml;
      if (isAtBottom) msgBox.scrollTop = msgBox.scrollHeight;
    } else {
      chatContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 500px;">
          <div class="admin-card-header" style="border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 0;">
            <h3 class="admin-card-title">📱 Conversación con: ${contactLabel}</h3>
          </div>
          <div id="admin-chat-messages" style="flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; background: var(--bg-surface);">
            ${messagesHtml}
          </div>
          <div style="padding: 15px; border-top: 1px solid var(--border); background: var(--bg-deep); display: flex; gap: 10px; align-items: center;">
            <input type="text" id="admin-chat-input" class="admin-input" placeholder="Escribe una respuesta..." style="flex:1; border-radius: 20px; padding: 10px 15px;" onkeydown="if(event.key==='Enter')adminReplyMessage()">
            <button class="admin-btn-primary" style="width:auto; border-radius: 20px; padding: 10px 20px;" onclick="adminReplyMessage()">Enviar</button>
          </div>
        </div>
      `;
    }
  }
}

window.openAdminChat = function (sessionId) {
  currentChatSessionId = sessionId;
  if (typeof markMessagesAsRead === 'function') {
    markMessagesAsRead(sessionId, 'admin');
  }
  updateAdminMessagesUI();
};

window.adminReplyMessage = function () {
  if (!currentChatSessionId) return;
  const input = document.getElementById('admin-chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  if (typeof addMessage === 'function') {
    const allConversations = typeof getMessages === 'function' ? getMessages() : [];
    const conv = allConversations.find(m => m.sessionId === currentChatSessionId);
    const contact = conv ? conv.contact : 'Soporte Admin';

    addMessage(currentChatSessionId, 'admin', text, contact);
    input.value = '';
    updateAdminMessagesUI();
  }
};

function renderSettings(container) {
  const config = getSettings();
  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Configuración</h1>
        <p class="admin-subtitle">Ajustes generales de la tienda</p>
      </div>
      <button class="btn btn-primary" onclick="adminSaveSettings()">
        <span>💾</span> Guardar Cambios
      </button>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px;">
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">📱 Redes Sociales y Contacto</h3>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">🟢 Número de WhatsApp <span style="font-weight: 400; color:var(--text-muted);">(Ej: +584120000000)</span></label>
          <input type="text" id="setting-whatsapp" class="admin-form-input" value="${config.whatsapp || ''}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">🟢 Canal de WhatsApp <span style="font-weight: 400; color:var(--text-muted);">(Enlace completo)</span></label>
          <input type="text" id="setting-whatsapp-channel" class="admin-form-input" value="${config.whatsappChannel || ''}" placeholder="https://whatsapp.com/channel/...">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">📸 Enlace de Instagram</label>
          <input type="text" id="setting-instagram" class="admin-form-input" value="${config.instagram || ''}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">🚀 Enlace de Telegram</label>
          <input type="text" id="setting-telegram" class="admin-form-input" value="${config.telegram || ''}">
        </div>
      </div>
      
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">🕒 Información de la Tienda</h3>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">Horario de Atención <span style="font-weight: 400; color:var(--text-muted);">(Permite saltos de línea)</span></label>
          <textarea id="setting-schedule" class="admin-form-textarea" rows="2">${config.schedule || ''}</textarea>
        </div>
        <div class="admin-form-group" style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px;">
          <label class="admin-form-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>🚧 Modo Mantenimiento</span>
            <input type="checkbox" id="setting-maintenance" ${config.maintenance ? 'checked' : ''} style="width: 24px; height: 24px; accent-color: var(--error); cursor: pointer;">
          </label>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px;">Si se activa, los clientes verán una pantalla de "Regresamos pronto" y no podrán comprar.</p>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">🔄 Herramientas de Sistema</h3>
        </div>
        <div class="admin-form-group">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">Repara automáticamente todos los pedidos antiguos y recalcula el gasto total de los clientes migrados para que la plataforma funcione perfectamente al 100%.</p>
          <button id="btn-normalize" class="btn btn-primary" onclick="normalizeLegacyData()" style="width: 100%; background: #ab47bc;">
            ✨ Normalizar Base de Datos de Migración
          </button>
        </div>
        <div class="admin-form-group" style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">Recalcula el dinero gastado por cada cliente excluyendo las recargas de billetera, para corregir el nivel VIP.</p>
          <button id="btn-fix-wallet" class="btn btn-primary" onclick="fixWalletSpendingBug()" style="width: 100%; background: #0ea5e9;">
            ✨ Corregir Gastos de Billetera
          </button>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">🎰 Gamificación</h3>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Activar Ruleta de la Suerte</span>
            <input type="checkbox" id="setting-enable-roulette" ${config.enableRoulette !== false ? 'checked' : ''} style="width: 24px; height: 24px; accent-color: var(--accent); cursor: pointer;">
          </label>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px;">Si se activa, a los clientes que recarguen en la categoría de juegos les aparecerá el botón para girar la ruleta luego de que su pedido sea aprobado.</p>
        </div>
      </div>

      <div class="admin-card" style="grid-column: 1 / -1;">
        <div class="admin-card-header">
          <h3 class="admin-card-title">📢 Mensaje Emergente (Aviso Inicial)</h3>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Activar Mensaje al entrar a la página</span>
            <input type="checkbox" id="setting-announcement-enabled" ${config.announcementEnabled ? 'checked' : ''} style="width: 24px; height: 24px; accent-color: #0ea5e9; cursor: pointer;">
          </label>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">Contenido del Mensaje <span style="font-weight: 400; color:var(--text-muted);">(Permite HTML básico)</span></label>
          <textarea id="setting-announcement-msg" class="admin-form-textarea" rows="3">${config.announcementMessage || ''}</textarea>
        </div>
      </div>

      <div class="admin-card" style="grid-column: 1 / -1;">
        <div class="admin-card-header">
          <h3 class="admin-card-title">📜 Términos y Condiciones</h3>
        </div>
        <div id="terms-editor-container"></div>
      </div>
    </div>
  `;

  // Initialize Terms Editor
  try {
    const savedTerms = config.termsAndConditions;
    const isOldHtmlString = typeof savedTerms === 'string' && savedTerms.includes('<h4>');

    const defaultTerms = [
      { title: 'Aceptación del Servicio', titleColor: '#0ea5e9', desc: 'Al utilizar AccessPlay, registrarte o realizar un pedido, aceptas estar de acuerdo con todos los términos aquí descritos. Nos reservamos el derecho de modificar estos términos en cualquier momento.', descColor: '#e2e8f0' },
      { title: 'Responsabilidad de Datos (IDs y Cuentas)', titleColor: '#facc15', desc: 'El cliente es el único responsable de proporcionar correctamente su ID de jugador, Zona o datos de cuenta. AccessPlay no se hace responsable por recargas enviadas a cuentas equivocadas debido a errores tipográficos por parte del usuario.', descColor: '#e2e8f0' },
      { title: 'Tiempos de Procesamiento y Entrega', titleColor: '#60a5fa', desc: 'Las recargas automatizadas toman de 1 a 5 minutos una vez confirmado el pago. Las recargas manuales (internas) o envíos de códigos pueden tardar entre 10 a 30 minutos dentro de nuestro horario de atención. En caso de fallas con los servidores del juego, el tiempo puede extenderse.', descColor: '#e2e8f0' },
      { title: 'Política de Reembolsos', titleColor: '#ef4444', desc: 'Una vez que una recarga o código digital ha sido procesado y entregado con éxito, NO hay devoluciones ni reembolsos bajo ninguna circunstancia. Solo se emitirán reembolsos (a su saldo de Monedero o cuenta bancaria) si el producto no pudo ser entregado por falta de stock o error de nuestra plataforma.', descColor: '#e2e8f0' },
      { title: 'Uso del Monedero y Revendedores', titleColor: '#0ea5e9', desc: 'El saldo cargado al Monedero (Wallet) no puede ser retirado en efectivo, solo puede ser utilizado para compras dentro de la tienda. Los usuarios con rol de \'Revendedor\' gozan de descuentos exclusivos, pero están sujetos a las mismas políticas de no-reembolso por errores de tipeo de IDs.', descColor: '#e2e8f0' },
      { title: 'Prevención de Fraude y Bloqueos', titleColor: '#a855f7', desc: 'Contamos con sistemas Anti-Spam. Cualquier intento de enviar comprobantes falsos, comprobantes reciclados, o hacer múltiples pedidos falsos resultará en el BLOQUEO PERMANENTE de la IP, número de WhatsApp y cuenta del usuario, perdiendo acceso a su Monedero sin derecho a reclamo.', descColor: '#e2e8f0' }
    ];

    window.currentTermsEditorData = Array.isArray(savedTerms)
      ? savedTerms
      : typeof savedTerms === 'string' && !isOldHtmlString
        ? [{ title: 'Términos', titleColor: '#0ea5e9', desc: savedTerms, descColor: '#e2e8f0' }]
        : defaultTerms;

    if (!window.currentTermsEditorData) window.currentTermsEditorData = defaultTerms;

    setTimeout(() => {
      if (typeof window.renderTermsEditor === 'function') {
        window.renderTermsEditor();
      }
    }, 50);
  } catch (e) {
    console.error('Error in terms init:', e);
    window.currentTermsEditorData = [];
  }
}

window.renderTermsEditor = function () {
  const container = document.getElementById('terms-editor-container');
  if (!container) return;
  container.innerHTML = window.currentTermsEditorData.map((t, i) => `
    <div style="border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px; background: rgba(0,0,0,0.2);">
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <div style="flex: 1;">
          <label class="admin-form-label">Título ${i + 1}</label>
          <input type="text" class="admin-form-input" value="${t.title || ''}" onchange="window.currentTermsEditorData[${i}].title = this.value">
        </div>
        <div style="width: 80px;">
          <label class="admin-form-label">Color</label>
          <input type="color" class="admin-form-input" value="${t.titleColor || '#0ea5e9'}" style="height: 48px; padding: 2px;" onchange="window.currentTermsEditorData[${i}].titleColor = this.value">
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <div style="flex: 1;">
          <label class="admin-form-label">Descripción</label>
          <textarea class="admin-form-textarea" rows="2" onchange="window.currentTermsEditorData[${i}].desc = this.value">${t.desc || ''}</textarea>
        </div>
        <div style="width: 80px;">
          <label class="admin-form-label">Color</label>
          <input type="color" class="admin-form-input" value="${t.descColor || '#e2e8f0'}" style="height: 48px; padding: 2px;" onchange="window.currentTermsEditorData[${i}].descColor = this.value">
        </div>
        <button class="btn-secondary" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; height: 48px; align-self: flex-end; padding: 0 15px;" onclick="window.currentTermsEditorData.splice(${i}, 1); window.renderTermsEditor()">🗑️</button>
      </div>
    </div>
  `).join('') + `
    <button class="btn-secondary" onclick="window.currentTermsEditorData.push({title:'', titleColor:'#0ea5e9', desc:'', descColor:'#e2e8f0'}); window.renderTermsEditor()" style="width: 100%; border-style: dashed; padding: 12px; margin-top: 10px; justify-content: center;">+ Agregar Nueva Sección</button>
  `;
};

function adminSaveSettings() {
  const whatsapp = document.getElementById('setting-whatsapp').value;
  const whatsappChannel = document.getElementById('setting-whatsapp-channel').value.trim();
  const instagram = document.getElementById('setting-instagram').value;
  const telegram = document.getElementById('setting-telegram').value;
  const schedule = document.getElementById('setting-schedule').value;
  const maintenance = document.getElementById('setting-maintenance').checked;
  const announcementEnabled = document.getElementById('setting-announcement-enabled').checked;
  const announcementMessage = document.getElementById('setting-announcement-msg').value;
  const enableRouletteEl = document.getElementById('setting-enable-roulette');
  const enableRoulette = enableRouletteEl ? enableRouletteEl.checked : true;
  const termsAndConditions = window.currentTermsEditorData || [];

  saveSettings({ whatsapp, whatsappChannel, instagram, telegram, schedule, maintenance, announcementEnabled, announcementMessage, enableRoulette, termsAndConditions });
  showAdminToast('✅ Configuración guardada', 'success');
}

// Global polling for admin panel
setInterval(() => {
  // Always update badge
  updateAdminSidebarBadges();
  checkAdminNotifications();

  // If we are in messages tab, update UI without losing focus
  if (adminState.currentTab === 'messages') {
    if (currentChatSessionId) markMessagesAsRead(currentChatSessionId, 'admin');
    updateAdminMessagesUI();
  }
}, 5000);

function checkAdminNotifications() {
  const currentPending = getPendingOrdersCount();
  const currentUnread = getUnreadMessagesCount();

  if (currentPending > lastPendingOrders || currentUnread > lastUnreadMessages) {
    if (typeof notifySound !== 'undefined' && notifySound.play) notifySound.play().catch(e => console.log('Audio autoplay blocked'));

    // Web Push Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      let title = 'AccessPlay';
      let body = '';
      if (currentPending > lastPendingOrders) {
        body += `¡Nuevo pedido recibido! Tienes ${currentPending} pendiente(s).\n`;
      }
      if (currentUnread > lastUnreadMessages) {
        body += `¡Nuevo mensaje de soporte!`;
      }
      new Notification(title, { body, icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>' });
    }
  }

  lastPendingOrders = currentPending;
  lastUnreadMessages = currentUnread;
}


// ════════════════════════════════════════
// QUICK REPLIES
// ════════════════════════════════════════
let editingQuickReplyId = null;

function renderQuickReplies(main) {
  const replies = getQuickReplies();

  let html = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">🤖 Respuestas Rápidas</h1>
        <p class="admin-subtitle">Configura los mensajes automáticos del chat de soporte</p>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">
      <div class="admin-card" style="align-self: start;">
        <div class="admin-card-header">
          <h3 class="admin-card-title">${editingQuickReplyId ? '✏️ Editar Respuesta' : '✨ Nueva Respuesta'}</h3>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px;">
          <div class="admin-form-group">
            <label class="admin-form-label">Título del botón</label>
            <input type="text" id="qr-title" class="admin-form-input" placeholder="Ej: 🎁 Oferta">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Palabras clave</label>
            <input type="text" id="qr-keywords" class="admin-form-input" placeholder="Ej: descuento, promo">
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">Respuesta del Bot</label>
          <textarea id="qr-response" class="admin-form-textarea" placeholder="Respuesta que dará el bot..." style="height: 120px;"></textarea>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <button class="btn btn-primary" style="flex: 1;" onclick="adminAddQuickReply()">${editingQuickReplyId ? '💾 Guardar Cambios' : '➕ Añadir Respuesta'}</button>
          ${editingQuickReplyId ? `<button class="btn btn-secondary" style="flex: 1;" onclick="adminCancelEditQuickReply()">Cancelar</button>` : ''}
        </div>
      </div>
      
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">📚 Respuestas Configuradas</h3>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
  `;

  if (replies.length === 0) {
    html += `<div style="text-align:center; color:var(--text-muted); padding:20px; background: rgba(0,0,0,0.02); border-radius: 8px;">No hay respuestas rápidas.</div>`;
  } else {
    html += replies.map(r => `
      <div style="background:var(--bg-deep); padding:16px; border-radius:8px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-start; gap: 16px;">
        <div style="flex: 1;">
          <h4 style="color:var(--accent); margin-bottom:4px; font-size: 1.05rem;">${r.title}</h4>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; background: rgba(0,0,0,0.05); display: inline-block; padding: 2px 6px; border-radius: 4px;">🔑 ${r.keywords}</div>
          <div style="font-size:0.9rem; color:var(--text-primary); white-space:pre-wrap; line-height: 1.4;">${r.response}</div>
        </div>
        <div style="display:flex; flex-direction: column; gap: 8px;">
          <button class="btn btn-secondary" style="padding: 6px 12px;" onclick="adminEditQuickReply('${r.id}')">✏️ Editar</button>
          <button class="btn btn-secondary" style="padding: 6px 12px; color:#ff6b6b; border-color: rgba(220,53,69,0.2);" onclick="adminDeleteQuickReply('${r.id}')">🗑️ Borrar</button>
        </div>
      </div>
    `).join('');
  }

  html += `</div></div></div>`;
  main.innerHTML = html;
}

function adminEditQuickReply(id) {
  editingQuickReplyId = id;
  renderQuickReplies(document.getElementById('admin-main-content'));

  const replies = getQuickReplies();
  const reply = replies.find(r => r.id === id);
  if (reply) {
    document.getElementById('qr-title').value = reply.title;
    document.getElementById('qr-keywords').value = reply.keywords;
    document.getElementById('qr-response').value = reply.response;
    document.getElementById('qr-title').focus();
  }
}

function adminCancelEditQuickReply() {
  editingQuickReplyId = null;
  renderQuickReplies(document.getElementById('admin-main-content'));
}

function adminAddQuickReply() {
  const title = document.getElementById('qr-title').value.trim();
  const keywords = document.getElementById('qr-keywords').value.trim();
  const response = document.getElementById('qr-response').value.trim();

  if (!title || !keywords || !response) {
    alert('Completa todos los campos');
    return;
  }

  if (editingQuickReplyId) {
    updateQuickReply(editingQuickReplyId, title, keywords, response);
    showAdminToast('✅ Respuesta actualizada', 'success');
    editingQuickReplyId = null;
  } else {
    addQuickReply(title, keywords, response);
    showAdminToast('✅ Respuesta guardada', 'success');
  }

  renderQuickReplies(document.getElementById('admin-main-content'));
}

function adminDeleteQuickReply(id) {
  if (confirm('¿Eliminar esta respuesta rápida?')) {
    deleteQuickReply(id);
    showAdminToast('🗑️ Respuesta eliminada');
    renderQuickReplies(document.getElementById('admin-main-content'));
  }
}


function renderCustomersTable(usersList) {
  const tbody = document.getElementById('customers-table-body');
  if (!tbody) return;

  if (usersList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--text-secondary);">No hay clientes registrados o que coincidan con la búsqueda.</td></tr>`;
    return;
  }

  const itemsPerPage = 10;
  const totalPages = Math.ceil(usersList.length / itemsPerPage);

  if (adminState.crmPage < 1) adminState.crmPage = 1;
  if (adminState.crmPage > totalPages && totalPages > 0) adminState.crmPage = totalPages;

  const startIndex = (adminState.crmPage - 1) * itemsPerPage;
  const displayList = usersList.slice(startIndex, startIndex + itemsPerPage);

  let html = displayList.map(user => {
    const dateStr = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
    const wallet = user.wallet || 0;
    return `
      <tr class="customer-row">
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); white-space: nowrap;">${user.email || 'N/A'}</td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); white-space: nowrap;">${user.name || '-'}</td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); white-space: nowrap;">${user.whatsapp || 'N/A'}</td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); white-space: nowrap;">${dateStr}</td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); text-align: right; color: #0ea5e9; font-weight: bold; white-space: nowrap;">${wallet.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); text-align: center; white-space: nowrap;">
          <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="openRoleModal('${user.uid}', '${user.role || 'cliente'}', ${user.discountPercentage || 0}, ${user.referralLimit || 30}, ${!!user.autoProcessExternal})">
            ${(user.role === 'revendedor') ? '💼 Revend (+' + (user.discountPercentage || 0) + '%)' : (user.role === 'influencer' ? '✨ Influencer' : '👤 Cliente')}
          </button>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); text-align: center; white-space: nowrap;">
          <button class="btn ${user.isBlocked ? 'btn-danger' : 'btn-secondary'}" style="padding: 6px 12px; font-size: 0.8rem;" onclick="toggleBlockUser('${user.uid}', ${!!user.isBlocked})">
            ${user.isBlocked ? '🚫 Bloqueado' : '✅ Activo'}
          </button>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid var(--border-color); text-align: center; white-space: nowrap;">
          <div style="display: flex; gap: 5px; justify-content: center;">
            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="openCustomerInfoModal('${user.uid}')">ℹ️ Info</button>
            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="openEditWalletModal('${user.uid}', '${user.email}', ${wallet})">Editar Saldo</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (totalPages > 1) {
    html += `
      <tr>
        <td colspan="8" style="padding: 15px; text-align: center; background: var(--card-bg);">
          <div style="display: flex; justify-content: center; align-items: center; gap: 15px;">
            <button class="btn btn-secondary" onclick="adminState.crmPage--; filterCustomersSearch(adminState.customersSearch)" ${adminState.crmPage === 1 ? 'disabled' : ''}>Anterior</button>
            <span style="color: var(--text-color); font-weight: bold;">Página ${adminState.crmPage} de ${totalPages}</span>
            <button class="btn btn-secondary" onclick="adminState.crmPage++; filterCustomersSearch(adminState.customersSearch)" ${adminState.crmPage === totalPages ? 'disabled' : ''}>Siguiente</button>
          </div>
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = html;
}

function filterCustomersSearch(searchTerm) {
  if (!window.ADMIN_CUSTOMERS) return;
  const term = searchTerm.toLowerCase().trim();
  const filtered = window.ADMIN_CUSTOMERS.filter(u =>
    (u.email && u.email.toLowerCase().includes(term)) ||
    (u.name && u.name.toLowerCase().includes(term)) ||
    (u.whatsapp && u.whatsapp.toLowerCase().includes(term)) ||
    (u.cedula && u.cedula.toLowerCase().includes(term))
  );
  renderCustomersTable(filtered);
}

function openEditWalletModal(uid, email, currentWallet) {
  const overlay = document.getElementById('admin-modal-overlay');
  const modalContent = document.getElementById('admin-modal-content');
  if (!overlay || !modalContent) return;

  modalContent.innerHTML = `
    <div class="admin-modal-header">
      <h2 class="admin-modal-title">💰 Editar Monedero</h2>
      <button class="admin-modal-close" onclick="closeAdminModal()">✕</button>
    </div>
    <div style="margin-bottom: 16px;">
      <p style="color: var(--text-secondary); margin-bottom: 10px;">Cliente: <strong>${email}</strong></p>
      <label class="admin-form-label">Saldo Actual (USD)</label>
      <input type="number" id="edit-wallet-amount" class="admin-form-input" value="${currentWallet}" step="0.01" min="0">
    </div>
    <div class="admin-modal-actions" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
      <button class="btn btn-secondary" onclick="closeAdminModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveUserWallet('${uid}', '${email}', ${currentWallet})">Guardar Cambios</button>
    </div>
  `;
  overlay.classList.add('active');
}

function saveUserWallet(uid, email, oldWallet) {
  const input = document.getElementById('edit-wallet-amount');
  const newAmount = parseFloat(input.value);

  if (isNaN(newAmount) || newAmount < 0) {
    alert("Por favor ingresa un monto válido mayor o igual a cero.");
    return;
  }

  firebase.database().ref('users/' + uid + '/wallet').set(newAmount).then(() => {
    // Optional: Log the change
    firebase.database().ref('admin_logs').push({
      action: 'wallet_update',
      userEmail: email,
      uid: uid,
      oldAmount: oldWallet,
      newAmount: newAmount,
      timestamp: Date.now()
    });

    showAdminToast('✅ Saldo actualizado correctamente', 'success');
    closeAdminModal();
    renderCustomers(document.getElementById('admin-main-content'));
  }).catch(err => {
    alert("Error actualizando saldo: " + err.message);
  });
}

// ════════════════════════════════════════
// WITHDRAWALS (RETIROS)
// ════════════════════════════════════════
function renderWithdrawals(container) {
  firebase.database().ref('withdrawals').once('value').then(snap => {
    let withdrawals = [];
    if (snap.exists()) {
      const data = snap.val();
      for (const key in data) {
        withdrawals.push(data[key]);
      }
    }

    withdrawals.sort((a, b) => b.createdAt - a.createdAt);

    const html = `
      <div class="admin-header">
        <h2 class="admin-title">Retiros de Ganancias</h2>
      </div>
      
      <div class="glass-card" style="margin-top: 20px;">
        <div style="overflow-x:auto;">
          <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.02);">
                <th style="text-align: left; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Fecha</th>
                <th style="text-align: left; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Usuario</th>
                <th style="text-align: right; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Monto (PTS)</th>
                <th style="text-align: right; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Monto (USD)</th>
                <th style="text-align: left; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Método y Detalles</th>
                <th style="text-align: center; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Estado</th>
                <th style="text-align: right; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${withdrawals.map(w => {
      let detailsStr = '';
      if (w.method === 'binance') {
        detailsStr = `Binance Pay: <strong>${w.details?.account}</strong>`;
      } else if (w.method === 'pagomovil') {
        detailsStr = `Pago Móvil: <strong>${w.details?.bank}</strong> | ${w.details?.phone} | ${w.details?.cedula}`;
      }

      let statusBadge = '';
      if (w.status === 'pending') statusBadge = '<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">⏳ Pendiente</span>';
      else if (w.status === 'completed') statusBadge = '<span style="background: rgba(16, 185, 129, 0.2); color: #0ea5e9; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">✅ Pagado</span>';
      else if (w.status === 'rejected') statusBadge = '<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">🚫 Rechazado</span>';

      return `
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 12px; font-size: 0.85rem;">${new Date(w.createdAt).toLocaleString()}</td>
                    <td style="padding: 12px; font-size: 0.9rem;">
                      <div>${w.userName || '-'}</div>
                      <div style="font-size: 0.75rem; color: var(--text-secondary);">${w.userEmail}</div>
                    </td>
                    <td style="padding: 12px; font-size: 0.9rem; text-align: right; font-weight: bold; color: #3b82f6;">${w.amountPoints} PTS</td>
                    <td style="padding: 12px; font-size: 0.9rem; text-align: right; font-weight: bold; color: #0ea5e9;">$${w.amountUsd} USD</td>
                    <td style="padding: 12px; font-size: 0.85rem;">${detailsStr}</td>
                    <td style="padding: 12px; text-align: center;">${statusBadge}</td>
                    <td style="padding: 12px; text-align: right;">
                      ${w.status === 'pending' ? `
                        <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem; margin-bottom: 5px; background: #0ea5e9; border-color: #0ea5e9;" onclick="updateWithdrawalStatus('${w.id}', 'completed', '${w.userId}', ${w.amountPoints})">Aprobar</button>
                        <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.8rem;" onclick="updateWithdrawalStatus('${w.id}', 'rejected', '${w.userId}', ${w.amountPoints})">Rechazar</button>
                      ` : ''}
                    </td>
                  </tr>
                `;
    }).join('')}
              
              ${withdrawals.length === 0 ? `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-secondary);">No hay retiros registrados.</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.innerHTML = html;
  }).catch(err => {
    console.error(err);
    container.innerHTML = `<div style="color:red; padding:20px;">Error cargando retiros: ${err.message}</div>`;
  });
}

window.updateWithdrawalStatus = function (withdrawalId, newStatus, userId, pointsToRefund) {
  if (!confirm(newStatus === 'completed' ? '¿Confirmas que ya enviaste el dinero a este usuario?' : '¿Seguro que deseas RECHAZAR este retiro? (Se le devolverán los puntos al usuario)')) return;

  firebase.database().ref('withdrawals/' + withdrawalId).update({
    status: newStatus,
    processedAt: Date.now()
  }).then(() => {
    if (newStatus === 'rejected') {
      // Refund points to user
      firebase.database().ref('users/' + userId + '/points').once('value').then(snap => {
        const currentPts = snap.val() || 0;
        firebase.database().ref('users/' + userId).update({
          points: currentPts + pointsToRefund
        });

        firebase.database().ref('users/' + userId + '/transactions').push({
          id: Date.now().toString(),
          type: 'deposit',
          amount: 0,
          description: `Devolución por retiro rechazado (+${pointsToRefund} PTS)`,
          date: Date.now()
        });
      });
    }
    showAdminToast('Estado actualizado', 'success');
    renderWithdrawals(document.getElementById('admin-main-content'));
  }).catch(err => {
    alert("Error: " + err.message);
  });
}; window.viewUserTransactions = function (userId) {
  const user = window.CUSTOMERS_DATA?.find(u => u.id === userId);
  if (!user) return;

  const modal = document.createElement('div');
  modal.id = 'tx-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0'; modal.style.left = '0'; modal.style.width = '100%'; modal.style.height = '100%';
  modal.style.background = 'rgba(0,0,0,0.8)'; modal.style.zIndex = '1000';
  modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center';

  let txHtml = '<div style="text-align:center; padding: 20px; color: var(--text-secondary);">No hay movimientos.</div>';

  if (user.transactions && user.transactions.length > 0) {
    const sortedTx = [...user.transactions].sort((a, b) => b.date - a.date);
    txHtml = sortedTx.map(tx => {
      let sign = tx.amount >= 0 ? '+' : '';
      let color = tx.amount >= 0 ? '#0ea5e9' : '#ff5252';
      let icon = tx.type === 'deposit' ? '💰' : (tx.type === 'purchase' ? '🛒' : '🔄');
      return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 8px;">
         <div style="display: flex; align-items: center; gap: 12px;">
           <div style="font-size: 1.5rem; opacity: 0.8;">${icon}</div>
           <div>
             <div style="font-weight: bold; font-size: 0.9rem;">${tx.description || 'Movimiento'}</div>
             <div style="font-size: 0.75rem; color: var(--text-secondary);">${new Date(tx.date).toLocaleString()}</div>
           </div>
         </div>
         <div style="font-weight: bold; color: ${color};">${sign}$${parseFloat(tx.amount).toFixed(2)}</div>
      </div>
      `;
    }).join('');
  }

  modal.innerHTML = `
    <div style="background: var(--bg-surface); padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); width: 90%; max-width: 500px; max-height: 80vh; display: flex; flex-direction: column;">
      <h3 style="margin-top: 0; margin-bottom: 20px; display: flex; justify-content: space-between;">
        <span>Movimientos de ${user.name || user.email}</span>
        <span style="color: #0ea5e9;">$${parseFloat(user.wallet || 0).toFixed(2)}</span>
      </h3>
      <div style="overflow-y: auto; flex: 1; padding-right: 10px;">
        ${txHtml}
      </div>
      <div style="margin-top: 25px;">
        <button class="btn-secondary" style="width: 100%;" onclick="document.getElementById('tx-modal').remove()">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

// ── Roles and Blocking ──
window.openCustomerInfoModal = function (uid) {
  showUserDetailsModal(uid);
};

async function showUserDetailsModal(uid) {
  const existingModal = document.getElementById('customer-info-modal-overlay');
  if (existingModal) existingModal.remove();

  const users = adminState.users || {};
  const user = users[uid] || (window.ADMIN_CUSTOMERS ? window.ADMIN_CUSTOMERS.find(u => u.uid === uid) : null);
  if (!user) return;

  const dateStr = user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A';
  const wallet = user.wallet || 0;

  const modalHTML = `
    <div class="modal-overlay active" id="customer-info-modal-overlay">
      <div class="modal" style="max-width: 500px; max-height: 90vh; overflow-y: auto;">
        <h3 style="margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
          <span>Detalles del Cliente</span>
          <button onclick="document.getElementById('customer-info-modal-overlay').remove()" style="background:none; border:none; color: white; cursor: pointer; font-size: 1.2rem;">✕</button>
        </h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Nombre</div>
            <div style="font-weight: bold;">${user.name || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Email</div>
            <div style="font-weight: bold;">${user.email || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">WhatsApp</div>
            <div style="font-weight: bold;">${user.whatsapp || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Cédula (C.I)</div>
            <div style="font-weight: bold;">${user.cedula || 'N/A'}</div>
          </div>
          <div style="grid-column: span 2;">
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Dirección</div>
            <div style="font-weight: bold;">${user.direccion || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Fecha de Registro</div>
            <div style="font-weight: bold;">${dateStr}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Saldo (Monedero)</div>
            <div style="font-weight: bold; color: #0ea5e9;">$${wallet.toFixed(2)}</div>
          </div>
        </div>

        <h4 style="margin-bottom: 10px; color: var(--text-secondary);">Historial de Recargas</h4>
        <div id="modal-order-stats-container-${uid}" style="display: flex; gap: 10px; margin-bottom: 20px;">
          <div style="flex: 1; padding: 20px; text-align: center; color: var(--text-secondary); background: rgba(0,0,0,0.2); border-radius: 8px;">
            <i class="ph ph-spinner-gap" style="animation: spin 1s linear infinite; font-size: 1.5rem;"></i><br><small>Cargando historial...</small>
          </div>
        </div>

        <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; margin-bottom: 20px;">
          <h4 style="margin-bottom: 10px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
            <i class="ph ph-lock-key"></i> Forzar Cambio de Contraseña
          </h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="position: relative;">
              <input type="password" id="admin-force-pass-${uid}" class="admin-form-input" placeholder="Nueva contraseña (mínimo 6)" style="width: 100%; padding-right: 40px; background: rgba(0,0,0,0.2);">
              <i class="ph ph-eye" id="toggle-force-pwd-${uid}" onclick="togglePasswordVisibility('admin-force-pass-${uid}', 'toggle-force-pwd-${uid}')" style="position: absolute; right: 15px; top: 14px; cursor: pointer; color: var(--text-secondary);"></i>
            </div>
            <div style="position: relative;">
              <input type="password" id="admin-force-confirm-${uid}" class="admin-form-input" placeholder="Confirmar contraseña" style="width: 100%; padding-right: 40px; background: rgba(0,0,0,0.2);">
              <i class="ph ph-eye" id="toggle-force-confirm-${uid}" onclick="togglePasswordVisibility('admin-force-confirm-${uid}', 'toggle-force-confirm-${uid}')" style="position: absolute; right: 15px; top: 14px; cursor: pointer; color: var(--text-secondary);"></i>
            </div>
            <button class="btn btn-primary" onclick="forceCustomerPassword('${uid}')" style="width: 100%; justify-content: center; margin-top: 5px;">
              💾 Actualizar Contraseña del Cliente
            </button>
          </div>
        </div>

        <div style="text-align: right;">
          <button class="btn btn-primary" onclick="document.getElementById('customer-info-modal-overlay').remove()">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Fetch true order stats asynchronously
  try {
    const snap = await firebase.database().ref('orders').orderByChild('userId').equalTo(uid).once('value');
    let pending = 0;
    let completed = 0;
    let rejected = 0;
    
    if (snap.exists()) {
      snap.forEach(child => {
        const o = child.val();
        if (o.status === 'pending' || o.status === 'processing' || o.status === 'procesando') pending++;
        else if (o.status === 'completed' || o.status === 'completado') completed++;
        else if (o.status === 'rejected' || o.status === 'rechazado' || o.status === 'cancelado' || o.status === 'invalid-id') rejected++;
      });
    }
    
    const statsContainer = document.getElementById(`modal-order-stats-container-${uid}`);
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div style="flex: 1; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #f59e0b;">${pending}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Pendientes</div>
        </div>
        <div style="flex: 1; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #0ea5e9;">${completed}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Completadas</div>
        </div>
        <div style="flex: 1; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">${rejected}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Rechazadas</div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error fetching order stats for modal:", error);
    const statsContainer = document.getElementById(`modal-order-stats-container-${uid}`);
    if (statsContainer) {
      statsContainer.innerHTML = `<div style="color: #ef4444; font-size: 0.8rem; text-align: center;">Error al cargar historial completo.</div>`;
    }
  }
};

window.forceCustomerPassword = async function (uid) {
  const pass = document.getElementById(`admin-force-pass-${uid}`).value.trim();
  const confirm = document.getElementById(`admin-force-confirm-${uid}`).value.trim();

  if (pass.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");
  if (pass !== confirm) return alert("Las contraseñas no coinciden.");

  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Actualizando...';
  btn.disabled = true;

  try {
    await firebase.database().ref('users/' + uid).update({
      password: pass
    });
    alert("Contraseña actualizada con éxito.");
    document.getElementById(`admin-force-pass-${uid}`).value = '';
    document.getElementById(`admin-force-confirm-${uid}`).value = '';
  } catch (error) {
    alert("Error guardando la contraseña: " + error.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
};

window.openRoleModal = function (uid, currentRole, currentDiscount, currentReferralLimit, currentAutoProcess) {
  const existingModal = document.getElementById('role-modal-overlay');
  if (existingModal) existingModal.remove();

  const modalHTML = `
    <div class="modal-overlay active" id="role-modal-overlay">
      <div class="modal">
        <h3>Editar Rol de Usuario</h3>
        <div class="form-group" style="margin-top: 15px;">
          <label>Rol</label>
          <select id="role-select" class="form-input" onchange="document.getElementById('discount-group').style.display = this.value === 'revendedor' ? 'block' : 'none'; document.getElementById('referral-limit-group').style.display = this.value === 'influencer' ? 'block' : 'none'">
            <option value="cliente" ${(currentRole !== 'revendedor' && currentRole !== 'influencer') ? 'selected' : ''}>Cliente Normal</option>
            <option value="influencer" ${currentRole === 'influencer' ? 'selected' : ''}>Influencer AccessPlay</option>
            <option value="revendedor" ${currentRole === 'revendedor' ? 'selected' : ''}>Revendedor</option>
          </select>
        </div>
        <div class="form-group" id="discount-group" style="display: ${currentRole === 'revendedor' ? 'block' : 'none'};">
          <label>Margen de Ganancia sobre Costo (%)</label>
          <input type="number" id="discount-input" class="form-input" value="${currentDiscount || 0}" min="0" max="1000">
          <div class="form-hint">El precio para este revendedor será: Costo del Producto + Este Porcentaje. (Si el producto no tiene costo configurado, se usará el precio normal).</div>
          
          <div style="margin-top: 15px; background: rgba(14, 165, 233, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(14, 165, 233, 0.2);">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="auto-process-input" ${currentAutoProcess ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
              <span style="font-size: 0.9rem; font-weight: 500;">Auto-procesar pagos externos</span>
            </label>
            <div class="form-hint" style="margin-top: 5px;">Si está activo, los Pagos Móviles y Binance de este revendedor se completarán solos SIN tu aprobación. Actívalo solo para revendedores de total confianza.</div>
          </div>
        </div>
        <div class="form-group" id="referral-limit-group" style="display: ${currentRole === 'influencer' ? 'block' : 'none'}; margin-top: 15px;">
          <label>Límite de Referidos (Cupos)</label>
          <input type="number" id="referral-limit-input" class="form-input" value="${currentReferralLimit || 30}" min="0" max="1000">
          <div class="form-hint">Cantidad máxima de amigos que este influencer puede invitar para ganar recompensas.</div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button class="btn btn-secondary" onclick="document.getElementById('role-modal-overlay').remove()">Cancelar</button>
          <button class="btn btn-primary" onclick="saveUserRole('${uid}')">Guardar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.saveUserRole = function (uid) {
  const role = document.getElementById('role-select').value;
  const discount = parseFloat(document.getElementById('discount-input').value) || 0;
  const referralLimit = parseInt(document.getElementById('referral-limit-input').value) || 30;
  const autoProcessExternal = document.getElementById('auto-process-input') ? document.getElementById('auto-process-input').checked : false;

  firebase.database().ref('users/' + uid).update({
    role: role,
    discountPercentage: role === 'revendedor' ? discount : 0,
    referralLimit: role === 'influencer' ? referralLimit : null,
    autoProcessExternal: role === 'revendedor' ? autoProcessExternal : false
  }).then(() => {
    showAdminToast('✅ Rol actualizado', 'success');
    document.getElementById('role-modal-overlay').remove();
    renderActiveTab();
  });
};

window.toggleBlockUser = function (uid, isBlocked) {
  if (confirm(isBlocked ? '¿Seguro que deseas DESBLOQUEAR a este usuario?' : '¿Seguro que deseas BLOQUEAR a este usuario? Se cerrará su sesión y no podrá comprar.')) {
    firebase.database().ref('users/' + uid).update({
      isBlocked: !isBlocked
    }).then(() => {
      showAdminToast(isBlocked ? '✅ Usuario desbloqueado' : '🚫 Usuario bloqueado', 'success');
      renderActiveTab();
    });
  }
};

// ── Banners Management ──

function renderBanners(container) {
  let html = `
    <div class="admin-header-flex">
      <h2>🖼️ Gestión de Banners</h2>
      <div style="display: flex; gap: 10px;">
        <button class="btn-secondary" onclick="saveToDb('banners', BANNERS); showAdminToast('✅ Banners guardados', 'success');">💾 Guardar Cambios</button>
        <button class="btn-primary" onclick="adminEditBanner(null)">+ Nuevo Banner</button>
      </div>
    </div>
    <p style="color: var(--text-secondary); margin-bottom: 20px;">
      Configura los banners deslizantes de la página principal. Opcionalmente sube una imagen para el fondo.
    </p>
    <div class="admin-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
  `;

  if (!BANNERS || BANNERS.length === 0) {
    html += `<p style="color: var(--text-muted); grid-column: 1 / -1;">No hay banners configurados.</p>`;
  } else {
    BANNERS.forEach(banner => {
      const bg = banner.imageUrl
        ? `background: url('${banner.imageUrl}') center/contain no-repeat, ${banner.bgGradient || 'var(--bg-card)'};`
        : `background: ${banner.bgGradient};`;

      html += `
        <div class="admin-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
          <div style="height: 140px; ${bg} position: relative; border-bottom: 1px solid var(--border-color);">
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 10px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
              <h3 style="color: white; font-size: 1.1rem; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${banner.title || 'Sin Título'}</h3>
            </div>
            ${banner.badge ? `<div style="position: absolute; top: 10px; right: 10px; background: ${banner.badgeColor}; color: #000; font-size: 0.7rem; font-weight: bold; padding: 2px 6px; border-radius: 4px;">${banner.badge}</div>` : ''}
          </div>
          <div style="padding: 15px; flex: 1;">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 15px; line-height: 1.4;">${banner.desc ? (banner.desc.length > 60 ? banner.desc.substring(0, 60) + '...' : banner.desc) : 'Sin descripción'}</p>
            <div style="display: flex; gap: 10px;">
              <button class="btn-secondary" style="flex: 1; padding: 6px;" onclick="adminEditBanner('${banner.id}')">Editar</button>
              <button class="btn-danger" style="flex: 1; padding: 6px;" onclick="adminDeleteBanner('${banner.id}')">Eliminar</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  html += `</div>`;
  container.innerHTML = html;
}

function adminEditBanner(id) {
  let b = { id: 'banner-' + Date.now(), title: '', desc: '', badge: '', badgeColor: '#0ea5e9', imageUrl: '', bgGradient: 'linear-gradient(135deg, #111827, #1f2937)', btnText: 'Ver Más', btnLink: 'catalog', btnColor: 'var(--accent)', btnTextColor: 'var(--bg-deep)' };
  let isEdit = false;

  if (id) {
    const existing = BANNERS.find(x => x.id === id);
    if (existing) {
      b = { ...existing };
      isEdit = true;
    }
  }

  const modalHtml = `
    <div class="admin-modal-content" style="max-width: 600px;">
      <h3>${isEdit ? 'Editar Banner' : 'Nuevo Banner'}</h3>
      
      <div class="form-group" style="margin-top: 15px;">
        <label>🖼️ Imagen de Fondo (Opcional)</label>
        <input type="file" id="banner-file" accept="image/*" class="admin-input" style="padding: 10px;" onchange="handleBannerImageUpload(this)">
        <input type="hidden" id="banner-imageUrl" value="${b.imageUrl || ''}">
        <div id="banner-image-preview" style="margin-top: 10px; height: 120px; border-radius: 8px; border: 1px dashed var(--border-color); background: ${b.imageUrl ? `url('${b.imageUrl}') center/contain no-repeat, ${b.bgGradient || 'rgba(0,0,0,0.2)'}` : 'rgba(0,0,0,0.2)'}; display: flex; align-items: center; justify-content: center;">
          ${!b.imageUrl ? '<span style="color: var(--text-muted); font-size: 0.85rem;">Sin imagen</span>' : ''}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="form-group">
          <label>Título</label>
          <input type="text" id="banner-title" class="admin-input" value="${b.title}">
        </div>
        <div class="form-group">
          <label>Texto del Botón</label>
          <input type="text" id="banner-btnText" class="admin-input" value="${b.btnText}">
        </div>
      </div>

      <div class="form-group">
        <label>Descripción</label>
        <textarea id="banner-desc" class="admin-input" style="height: 60px;">${b.desc}</textarea>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="form-group">
          <label>Etiqueta (Badge)</label>
          <input type="text" id="banner-badge" class="admin-input" value="${b.badge || ''}" placeholder="Ej: NUEVO SERVICIO">
        </div>
        <div class="form-group">
          <label>Color Etiqueta</label>
          <input type="color" id="banner-badgeColor" class="admin-input" value="${b.badgeColor || '#0ea5e9'}">
        </div>
      </div>

      <div class="form-group">
        <label>Enlace del Botón</label>
        <select id="banner-btnLink" class="admin-input">
          <option value="catalog" ${b.btnLink === 'catalog' ? 'selected' : ''}>Catálogo</option>
          <option value="how-it-works" ${b.btnLink === 'how-it-works' ? 'selected' : ''}>¿Cómo Funciona?</option>
          <optgroup label="Productos">
            ${PRODUCTS.map(p => `<option value="product:${p.id}" ${b.btnLink === `product:${p.id}` ? 'selected' : ''}>${p.name}</option>`).join('')}
          </optgroup>
        </select>
      </div>

      <div class="form-group">
        <label>Fondo de Respaldo (Degradado CSS)</label>
        <input type="text" id="banner-bgGradient" class="admin-input" value="${b.bgGradient}" placeholder="Ej: linear-gradient(135deg, #111827, #1f2937)">
        <small style="color: var(--text-muted); font-size: 0.8rem;">Se usa si no subes una imagen.</small>
      </div>

      <div class="admin-modal-actions">
        <button class="btn-secondary" onclick="closeAdminModal()">Cancelar</button>
        <button class="btn-primary" onclick="adminSaveBanner('${b.id}')">Guardar Banner</button>
      </div>
    </div>
  `;
  showAdminModal(modalHtml);
}

function handleBannerImageUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      // Resize to max 800px width/height for base64 storage
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX = 800;

      if (width > height) {
        if (width > MAX) { height *= MAX / width; width = MAX; }
      } else {
        if (height > MAX) { width *= MAX / height; height = MAX; }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      document.getElementById('banner-imageUrl').value = dataUrl;
      const preview = document.getElementById('banner-image-preview');
      const currentGrad = document.getElementById('banner-bgGradient').value || 'rgba(0,0,0,0.2)';
      preview.style.background = `url('${dataUrl}') center/contain no-repeat, ${currentGrad}`;
      preview.innerHTML = '';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function adminSaveBanner(id) {
  const title = document.getElementById('banner-title').value.trim();
  if (!title) { showToast('⚠️ El título es obligatorio'); return; }

  const b = {
    id: id,
    title: title,
    desc: document.getElementById('banner-desc').value.trim(),
    badge: document.getElementById('banner-badge').value.trim(),
    badgeColor: document.getElementById('banner-badgeColor').value,
    imageUrl: document.getElementById('banner-imageUrl').value,
    bgGradient: document.getElementById('banner-bgGradient').value || 'linear-gradient(135deg, #111827, #1f2937)',
    btnText: document.getElementById('banner-btnText').value.trim(),
    btnLink: document.getElementById('banner-btnLink').value,
    btnColor: 'var(--accent)',
    btnTextColor: 'var(--bg-deep)'
  };

  const idx = BANNERS.findIndex(x => x.id === id);
  if (idx >= 0) BANNERS[idx] = b;
  else BANNERS.push(b);

  saveToDb('banners', BANNERS);
  closeAdminModal();
  renderActiveTab();
}

function adminDeleteBanner(id) {
  const modalHtml = `
    <div class="admin-modal-content" style="max-width: 400px; text-align: center;">
      <h3 style="color: #ef5350;">⚠️ Eliminar Banner</h3>
      <p style="margin: 15px 0; color: var(--text-secondary);">¿Estás seguro que deseas eliminar este banner?</p>
      <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
        <button class="btn-secondary" onclick="closeAdminModal()">Cancelar</button>
        <button class="btn-danger" onclick="executeDeleteBanner('${id}')">Sí, Eliminar</button>
      </div>
    </div>
  `;
  showAdminModal(modalHtml);
}

function executeDeleteBanner(id) {
  const idx = BANNERS.findIndex(x => x.id === id);
  if (idx >= 0) {
    BANNERS.splice(idx, 1);
    saveToDb('banners', BANNERS);
    closeAdminModal();
    renderActiveTab();
    showToast('🗑️ Banner eliminado');
  }
}

// ════════════════════════════════════════
// GESTIÓN LANDING
// ════════════════════════════════════════
function renderLanding(container) {
  const config = (typeof getLandingConfig === 'function') ? getLandingConfig() : {};
  const hero = config.heroStats || [{}, {}, {}, {}];
  const how = config.howItWorks || [{}, {}, {}];
  const features = config.features || [{}, {}, {}, {}, {}, {}];
  const faq = config.faq || [{}, {}, {}, {}];
  const footer = config.footer || {};

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">🎨 Diseño Web (Gestión Landing)</h1>
        <p class="admin-subtitle">Modifica los textos, estadísticas y pasos de la página principal</p>
      </div>
      <button class="btn btn-primary" onclick="adminSaveLanding()">
        <span>💾</span> Guardar Cambios
      </button>
    </div>

    <!-- 1. Estadísticas del Hero -->
    <div class="admin-card" style="margin-bottom: 20px;">
      <h2 class="admin-card-title">Estadísticas de Portada (Hero)</h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">Ajusta los 4 números que aparecen en la parte superior del inicio.</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        ${[0, 1, 2, 3].map(i => `
          <div class="admin-form-group" style="background: var(--bg-deep); padding: 10px; border-radius: 8px;">
            <label style="font-size: 0.8rem; color: var(--text-secondary);">Valor ${i + 1}</label>
            <input type="text" id="landing-hero-val-${i}" class="admin-form-input" value="${hero[i] && hero[i].value ? hero[i].value : ''}" placeholder="Ej: 15000">
            <label style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">Texto ${i + 1}</label>
            <input type="text" id="landing-hero-lbl-${i}" class="admin-form-input" value="${hero[i] && hero[i].label ? hero[i].label : ''}" placeholder="Ej: Recargas realizadas">
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 2. Cómo Funciona -->
    <div class="admin-card" style="margin-bottom: 20px;">
      <h2 class="admin-card-title">¿Cómo Funciona? (Pasos)</h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">Edita los 3 pasos explicativos de la tienda.</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
        ${[0, 1, 2].map(i => `
          <div class="admin-form-group" style="background: var(--bg-deep); padding: 15px; border-radius: 8px;">
            <label style="font-size: 0.8rem; color: var(--text-secondary);">Icono (Emoji)</label>
            <input type="text" id="landing-how-icon-${i}" class="admin-form-input" value="${how[i] && how[i].icon ? how[i].icon : ''}" placeholder="Ej: 🛒">
            <label style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">Título Paso ${i + 1}</label>
            <input type="text" id="landing-how-title-${i}" class="admin-form-input" value="${how[i] && how[i].title ? how[i].title : ''}" placeholder="Ej: Elige tu Producto">
            <label style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">Descripción Paso ${i + 1}</label>
            <textarea id="landing-how-desc-${i}" class="admin-form-textarea" rows="2">${how[i] && how[i].desc ? how[i].desc : ''}</textarea>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 3. ¿Por qué AccessPlay? (Ventajas) -->
    <div class="admin-card" style="margin-bottom: 20px;">
      <h2 class="admin-card-title">¿Por qué AccessPlay? (Ventajas)</h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">Edita las 6 ventajas competitivas.</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
        ${[0, 1, 2, 3, 4, 5].map(i => `
          <div class="admin-form-group" style="background: var(--bg-deep); padding: 15px; border-radius: 8px;">
            <label style="font-size: 0.8rem; color: var(--text-secondary);">Icono (Emoji) ${i + 1}</label>
            <input type="text" id="landing-feat-icon-${i}" class="admin-form-input" value="${features[i] && features[i].icon ? features[i].icon : ''}" placeholder="Ej: ⚡">
            <label style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">Título Ventaja ${i + 1}</label>
            <input type="text" id="landing-feat-title-${i}" class="admin-form-input" value="${features[i] && features[i].title ? features[i].title : ''}">
            <label style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">Descripción Ventaja ${i + 1}</label>
            <textarea id="landing-feat-desc-${i}" class="admin-form-textarea" rows="2">${features[i] && features[i].desc ? features[i].desc : ''}</textarea>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 4. Preguntas Frecuentes (FAQ) -->
    <div class="admin-card" style="margin-bottom: 20px;">
      <h2 class="admin-card-title">Preguntas Frecuentes (FAQ)</h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">Edita las 4 preguntas más frecuentes.</p>
      <div style="display: flex; flex-direction: column; gap: 15px;">
        ${[0, 1, 2, 3].map(i => `
          <div class="admin-form-group" style="background: var(--bg-deep); padding: 15px; border-radius: 8px;">
            <label style="font-size: 0.8rem; color: var(--text-secondary);">Pregunta ${i + 1}</label>
            <input type="text" id="landing-faq-q-${i}" class="admin-form-input" value="${faq[i] && faq[i].q ? faq[i].q : ''}">
            <label style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">Respuesta ${i + 1}</label>
            <textarea id="landing-faq-a-${i}" class="admin-form-textarea" rows="2">${faq[i] && faq[i].a ? faq[i].a : ''}</textarea>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 5. Footer -->
    <div class="admin-card">
      <h2 class="admin-card-title">Pie de Página (Footer)</h2>
      <div class="admin-form-group">
        <label style="font-size: 0.8rem; color: var(--text-secondary);">Texto Legal / Descargo de Responsabilidad</label>
        <textarea id="landing-footer-disc" class="admin-form-textarea" rows="3">${footer.disclaimer || ''}</textarea>
      </div>
    </div>
  `;
}

function adminSaveLanding() {
  try {
    const newConfig = {
      heroStats: [0, 1, 2, 3].map(i => {
        const valEl = document.getElementById(`landing-hero-val-${i}`);
        const lblEl = document.getElementById(`landing-hero-lbl-${i}`);
        return { value: valEl ? valEl.value : '', label: lblEl ? lblEl.value : '' };
      }),
      howItWorks: [0, 1, 2].map(i => {
        const icEl = document.getElementById(`landing-how-icon-${i}`);
        const titEl = document.getElementById(`landing-how-title-${i}`);
        const descEl = document.getElementById(`landing-how-desc-${i}`);
        return { icon: icEl ? icEl.value : '', title: titEl ? titEl.value : '', desc: descEl ? descEl.value : '' };
      }),
      features: [0, 1, 2, 3, 4, 5].map(i => {
        const icEl = document.getElementById(`landing-feat-icon-${i}`);
        const titEl = document.getElementById(`landing-feat-title-${i}`);
        const descEl = document.getElementById(`landing-feat-desc-${i}`);
        return { icon: icEl ? icEl.value : '', title: titEl ? titEl.value : '', desc: descEl ? descEl.value : '' };
      }),
      faq: [0, 1, 2, 3].map(i => {
        const qEl = document.getElementById(`landing-faq-q-${i}`);
        const aEl = document.getElementById(`landing-faq-a-${i}`);
        return { q: qEl ? qEl.value : '', a: aEl ? aEl.value : '' };
      }),
      footer: {
        disclaimer: document.getElementById('landing-footer-disc') ? document.getElementById('landing-footer-disc').value : ''
      }
    };

    if (typeof saveLandingConfig === 'function') {
      saveLandingConfig(newConfig);
      showAdminToast('✅ Diseño Web guardado', 'success');
    } else {
      showAdminToast('❌ Error: Función de guardado no encontrada', 'error');
    }
  } catch (err) {
    console.error("Error en adminSaveLanding:", err);
    alert("Error al guardar: " + err.message);
  }
}

window.normalizeLegacyData = async function () {
  if (!confirm("¿Deseas normalizar y actualizar todos los datos antiguos al nuevo formato? Esto puede tardar unos segundos y solo debe hacerse una vez.")) return;

  const btn = document.getElementById('btn-normalize');
  if (btn) {
    btn.innerHTML = `<span style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-right:8px; vertical-align:middle;"></span> Normalizando...`;
    btn.disabled = true;
  }

  try {
    const ordersSnap = await firebase.database().ref('orders').once('value');
    const ordersData = ordersSnap.val() || {};

    let updatedOrders = 0;
    const batchUpdates = {};

    for (const key in ordersData) {
      let changed = false;
      let o = ordersData[key];

      // Migrate RS-OLD keys to AP-OLD
      let newKey = key;
      if (key.startsWith("RS-OLD-")) {
        newKey = key.replace("RS-OLD-", "AP-OLD-");
        o.id = newKey;
        batchUpdates['orders/' + key] = null; // Delete old key
        changed = true;
      }

      // 0. Translate old statuses
      if (o.status === 'completado') { o.status = 'completed'; changed = true; }
      if (o.status === 'rechazado') { o.status = 'rejected'; changed = true; }
      if (o.status === 'pendiente') { o.status = 'pending'; changed = true; }
      if (o.status === 'procesando') { o.status = 'processing'; changed = true; }

      // 1. Fix Status History
      if (!o.statusHistory || !Array.isArray(o.statusHistory)) {
        o.statusHistory = [{ status: o.status || 'pending', timestamp: o.createdAt || new Date().toISOString() }];
        changed = true;
      } else {
        // Also fix inside history
        o.statusHistory.forEach(h => {
          if (h.status === 'completado') { h.status = 'completed'; changed = true; }
          if (h.status === 'rechazado') { h.status = 'rejected'; changed = true; }
          if (h.status === 'pendiente') { h.status = 'pending'; changed = true; }
          if (h.status === 'procesando') { h.status = 'processing'; changed = true; }
        });
      }

      // 2. Fix legacy product and cost
      let correctPkg = null;
      let correctProd = null;
      const searchLabel = String(o.packageLabel || o.productDetails || o.productName || '').toLowerCase();
      const orderPrice = Number(o.priceUsd) || 0;

      // Try to find the real product by matching name in the label
      let matchedProds = PRODUCTS.filter(p => searchLabel.includes(p.name.toLowerCase()));
      if (matchedProds.length === 0) {
        if (o.productId && o.productId !== 'legacy') {
          matchedProds = PRODUCTS.filter(p => p.id === o.productId);
        } else {
          matchedProds = PRODUCTS;
        }
      }

      for (let i = 0; i < matchedProds.length; i++) {
        if (matchedProds[i].packages) {
          // STRICT: Cost must be less than or equal to price to prevent bug
          correctPkg = matchedProds[i].packages.find(p => Number(p.priceUsd) === orderPrice && (parseFloat(p.costUsd) || 0) <= orderPrice);
          if (correctPkg) { correctProd = matchedProds[i]; break; }
        }
      }

      if (!correctPkg) {
        const nums = searchLabel.match(/\d+/g);
        if (nums && nums.length > 0) {
          const targetNum = nums[0];
          for (let i = 0; i < matchedProds.length; i++) {
            if (matchedProds[i].packages) {
              correctPkg = matchedProds[i].packages.find(p => (String(p.amount) === targetNum || String(p.label).includes(targetNum)) && (parseFloat(p.costUsd) || 0) <= orderPrice);
              if (correctPkg) { correctProd = matchedProds[i]; break; }
            }
          }
        }
      }

      if (correctProd && correctPkg) {
        const correctCost = parseFloat(correctPkg.costUsd) || 0;

        // If we found a valid package, update details
        if (o.productId === 'legacy' || o.costUsd > orderPrice || o.costUsd === undefined || o.costUsd === 0) {
          if (o.productId !== correctProd.id) { o.productId = correctProd.id; changed = true; }
          if (!o.packageLabel || o.packageLabel !== correctPkg.label) { o.packageLabel = correctPkg.label; changed = true; }
          if (o.costUsd !== correctCost) { o.costUsd = correctCost; changed = true; }
          if (o.productName !== correctProd.name) { o.productName = correctProd.name; changed = true; }
        }
      } else {
        // Fallback for severely corrupted orders where no valid package is found
        if (o.costUsd === undefined || o.costUsd === 0 || o.costUsd > orderPrice) {
          // Set a safe fallback cost (e.g., 85% of price)
          o.costUsd = orderPrice * 0.85;
          changed = true;
        }
      }

      if (changed) {
        batchUpdates['orders/' + newKey] = o;
        updatedOrders++;
      }
    }

    // 3. Fix Users totalSpent, roles and order associations
    const usersSnap = await firebase.database().ref('users').once('value');
    const usersData = usersSnap.val() || {};

    const freshOrders = Object.values(ordersData);
    const spentMap = {};
    
    // Create an email-to-UID map for legacy orders that might only have an email
    const emailToUid = {};
    for (const uid in usersData) {
      if (usersData[uid].email) {
        emailToUid[usersData[uid].email.toLowerCase().trim()] = uid;
      }
    }
    
    // Also explicitly link all orders to their respective users
    freshOrders.forEach(o => {
      // Find userId if missing but we have contact info/email
      if (!o.userId) {
        const orderEmail = (o.userEmail || o.contactInfo || '').toLowerCase().trim();
        if (orderEmail && emailToUid[orderEmail]) {
          o.userId = emailToUid[orderEmail];
          batchUpdates['orders/' + o.id + '/userId'] = o.userId;
        }
      }

      if (o.userId && o.id) {
        batchUpdates['users/' + o.userId + '/orders/' + o.id] = true;
      }
      if (o.status === 'completed' || o.status === 'completado') {
        if (o.userId && o.productType !== 'wallet-recharge') spentMap[o.userId] = (spentMap[o.userId] || 0) + (Number(o.priceUsd) || 0);
      }
    });

    let updatedUsers = 0;
    for (const uid in usersData) {
      let uChanged = false;
      const actualSpent = spentMap[uid] || 0;

      if (usersData[uid].totalSpent !== actualSpent) {
        batchUpdates['users/' + uid + '/totalSpent'] = actualSpent;
        uChanged = true;
      }

      // Translate old English roles
      const currentRole = usersData[uid].role;
      if (!currentRole || currentRole === 'user') {
        batchUpdates['users/' + uid + '/role'] = 'cliente';
        uChanged = true;
      } else if (currentRole === 'reseller') {
        batchUpdates['users/' + uid + '/role'] = 'revendedor';
        uChanged = true;
      }
      
      // Clean up legacy RS-OLD order keys from user profile
      if (usersData[uid].orders) {
        for (const orderKey in usersData[uid].orders) {
          if (orderKey.startsWith("RS-OLD-")) {
            batchUpdates['users/' + uid + '/orders/' + orderKey] = null;
            uChanged = true;
          }
        }
      }

      if (uChanged) updatedUsers++;
    }

    if (Object.keys(batchUpdates).length > 0) {
      await firebase.database().ref().update(batchUpdates);
    }

    alert(`¡Normalización completada con éxito!\n\nPedidos reparados/renombrados: ${updatedOrders}\nUsuarios actualizados: ${updatedUsers}`);
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Hubo un error normalizando la base de datos. Revisa la consola.");
    if (btn) { btn.innerText = "Error - Reintentar"; btn.disabled = false; }
  }
};


window.filterCrmTable = function (val) {
  const query = val.toLowerCase().trim();
  const rows = document.querySelectorAll('.admin-crm-row');
  let visibleCount = 0;

  rows.forEach(row => {
    if (row.getAttribute('data-search').includes(query)) {
      row.style.display = 'grid'; // because admin-crm-row uses CSS grid
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  const noRes = document.getElementById('crm-no-results');
  if (noRes) {
    noRes.style.display = visibleCount === 0 ? 'block' : 'none';
  }
};

window.fixWalletSpendingBug = async function() {
  if (!confirm("¿Corregir los gastos totales y pedidos de los usuarios excluyendo recargas de billetera?")) return;
  const btn = document.getElementById('btn-fix-wallet');
  if (btn) btn.innerHTML = "Corrigiendo...";
  
  try {
    const ordersSnap = await firebase.database().ref('orders').once('value');
    const ordersData = ordersSnap.val() || {};
    const spentMap = {};
    const ordersCountMap = {};
    
    Object.values(ordersData).forEach(o => {
      if ((o.status === 'completed' || o.status === 'completado') && o.userId) {
        if (o.productType !== 'wallet-recharge') {
          spentMap[o.userId] = (spentMap[o.userId] || 0) + (Number(o.priceUsd) || 0);
        }
        ordersCountMap[o.userId] = (ordersCountMap[o.userId] || 0) + 1;
      }
    });

    const usersSnap = await firebase.database().ref('users').once('value');
    const usersData = usersSnap.val() || {};
    const batchUpdates = {};
    let updatedUsers = 0;

    for (const uid in usersData) {
      const actualSpent = spentMap[uid] || 0;
      const actualOrders = ordersCountMap[uid] || 0;
      
      let changed = false;
      if (usersData[uid].totalSpent !== actualSpent) {
        batchUpdates['users/' + uid + '/totalSpent'] = actualSpent;
        changed = true;
      }
      if (usersData[uid].totalOrders !== actualOrders) {
        batchUpdates['users/' + uid + '/totalOrders'] = actualOrders;
        changed = true;
      }
      if (changed) updatedUsers++;
    }

    if (Object.keys(batchUpdates).length > 0) {
      await firebase.database().ref().update(batchUpdates);
    }
    
    alert(`Se corrigieron los gastos y pedidos de ${updatedUsers} usuarios.`);
    if (btn) btn.innerHTML = "✨ Corregir Gastos de Billetera";
  } catch (err) {
    alert("Error: " + err.message);
    if (btn) btn.innerHTML = "✨ Corregir Gastos de Billetera";
  }
};
