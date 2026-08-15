
// Configurar tema oscuro por defecto para todas las alertas SweetAlert2
if (typeof Swal !== 'undefined') {
  const originalSwal = Swal;
  window.Swal = originalSwal.mixin({
    background: 'var(--bg-surface, #1e293b)',
    color: 'var(--text-primary, #f8fafc)',
    customClass: {
      popup: 'swal-dark-theme'
    }
  });
}

// ============================================================
// AccessPlay — Main App Logic & SPA Routing (v2 + Orders)
// ============================================================


// ── State ──
const appState = {
  currentView: 'home',        // 'home' | 'product' | 'tracking' | 'lookup'
  selectedProductId: null,
  selectedPackageIndex: null,
  selectedPaymentId: null,
  selectedCategory: 'todos',
  trackingOrderId: null,
  appliedDiscount: null,
  historyContactStr: null,
  verifiedPlayerName: null,
  pinData: null
};

// ── Init ──
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredStorePrompt = e;
});

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('ref')) {
    localStorage.setItem('recargaaccessplay_referredBy', urlParams.get('ref'));
  }
  if (urlParams.get('recharge') === 'true') {
    appState.currentView = 'wallet-recharge';
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  if (urlParams.get('tracking')) {
    appState.currentView = 'tracking';
    appState.trackingOrderId = urlParams.get('tracking');
    window.history.replaceState({}, document.title, window.location.pathname);
    if (typeof subscribeToGuestOrder === 'function') {
      subscribeToGuestOrder(appState.trackingOrderId);
    }
  }
  if (localStorage.getItem('recargaaccessplay_theme') === 'light') {
    document.body.classList.add('light-theme');
  }
  renderApp();
  initScrollEffects();
  initCounters();
  initCarousel();
  initTournamentAlert();
});

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  localStorage.setItem('recargaaccessplay_theme', isLight ? 'light' : 'dark');
}

window.showManualInstallModal = function () {
  if (document.getElementById('pwa-manual-install-modal')) return;
  const modalContainer = document.createElement('div');
  modalContainer.id = 'pwa-manual-install-modal';
  modalContainer.innerHTML = `
    <div class="modal-overlay active" style="z-index: 9999; backdrop-filter: blur(8px);">
      <div class="modal" style="text-align: center; max-width: 450px; border: 1px solid var(--border); background: var(--bg-surface); padding: 35px 25px; border-radius: var(--radius-lg); box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
        <div style="font-size: 3.5rem; margin-bottom: 15px;">📲</div>
        <h3 style="color: var(--text-primary); margin-bottom: 15px; font-family: var(--font-display); font-size: 1.6rem;">Instalar Aplicación</h3>
        <p style="color: var(--text-secondary); margin-bottom: 25px; font-size: 0.95rem; line-height: 1.5;">
          Tu dispositivo requiere instalación manual. Sigue estos rápidos pasos:
        </p>
        
        <div style="text-align: left; background: var(--bg-deep); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; margin-bottom: 25px;">
          <div style="margin-bottom: 20px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
              <span style="font-size:1.5rem;">🍎</span>
              <strong style="color:var(--text-primary); font-size:1.05rem;">En iPhone (Safari)</strong>
            </div>
            <p style="color:var(--text-secondary); font-size:0.9rem; margin-left:34px; line-height:1.5;">
              1. Toca el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).<br>
              2. Selecciona <b>"Agregar a inicio"</b>.
            </p>
          </div>
          <div style="height:1px; background:var(--border); margin-bottom:20px;"></div>
          <div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
              <span style="font-size:1.5rem;">🤖</span>
              <strong style="color:var(--text-primary); font-size:1.05rem;">En Android (Chrome)</strong>
            </div>
            <p style="color:var(--text-secondary); font-size:0.9rem; margin-left:34px; line-height:1.5;">
              1. Toca el <b>Menú</b> (los 3 puntos arriba a la derecha).<br>
              2. Selecciona <b>"Instalar aplicación"</b> o <b>"Agregar a inicio"</b>.
            </p>
          </div>
        </div>

        <button id="close-pwa-modal-btn" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 1rem; justify-content:center; cursor:pointer;">
          ¡Entendido! 👍
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modalContainer);

  document.getElementById('close-pwa-modal-btn').addEventListener('click', () => {
    const overlay = modalContainer.querySelector('.modal-overlay');
    overlay.classList.remove('active');
    setTimeout(() => { modalContainer.remove(); }, 300);
  });
};

window.handleStoreInstallClick = function () {
  if (window.deferredStorePrompt) {
    window.deferredStorePrompt.prompt();
    window.deferredStorePrompt.userChoice.then((choice) => {
      window.deferredStorePrompt = null;
    });
    return;
  }

  window.showManualInstallModal();
};

// ── Render ──
function showAnnouncementModal(config) {
  if (sessionStorage.getItem('recargaaccessplay_announcement_seen') === 'true') return;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'announcement-modal-container';

  const imageUrl = config.announcementImageUrl;
  const message = config.announcementMessage || '';
  const link = config.announcementLink;

  // Detect if message is a direct image URL or contains HTML image tags (fallback if they didn't use the new upload field)
  const isImageUrlText = message.trim().match(/^https?:\/\/.*\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) != null;
  const isHtmlImage = message.includes('<img');

  let contentHtml = '';
  
  if (imageUrl || isImageUrlText || isHtmlImage) {
    const finalImageSrc = imageUrl || (isImageUrlText ? message.trim() : null);
    const imgElement = finalImageSrc 
      ? `<img src="${finalImageSrc}" style="width: 100%; border-radius: 16px 16px 0 0; display: block; object-fit: contain; max-height: 70vh;">` 
      : `<div style="width: 100%; border-radius: 16px 16px 0 0; overflow: hidden; background: #000; display: flex; justify-content: center;">${message}</div>`;
      
    let imageWithLink = imgElement;
    if (link) {
      if (link.startsWith('http')) {
        imageWithLink = `<a href="${link}" target="_blank" style="display: block;">${imgElement}</a>`;
      } else {
        imageWithLink = `<a href="#" onclick="handleAnnouncementClick(event, '${link}')" style="display: block;">${imgElement}</a>`;
      }
    }

    // Style for full image popup
    contentHtml = `
      <div class="modal payment-flow-modal" style="text-align: center; max-width: 480px; width: 100%; background: transparent; padding: 0; border: none; box-shadow: 0 20px 50px rgba(0,0,0,0.9);">
        ${imageWithLink}
        <button id="announcement-modal-btn" style="width: 100%; padding: 18px; font-size: 1.05rem; border-radius: 0 0 16px 16px; font-weight: bold; background: #22c55e; color: white; border: none; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: background 0.2s;">
          ✓ He leído y acepto la información
        </button>
      </div>
    `;
  } else {
    let textLinkBtnHtml = '';
    if (link) {
      if (link.startsWith('http')) {
        textLinkBtnHtml = `<a href="${link}" target="_blank" class="btn-secondary" style="width: 100%; display: block; margin-bottom: 15px; padding: 12px; border-radius: 12px; font-weight: bold; text-decoration: none;">🔗 Más Información</a>`;
      } else {
        textLinkBtnHtml = `<button onclick="handleAnnouncementClick(event, '${link}')" class="btn-secondary" style="width: 100%; margin-bottom: 15px; padding: 12px; border-radius: 12px; font-weight: bold;">🔗 Más Información</button>`;
      }
    }

    // Standard text style
    contentHtml = `
      <div class="modal payment-flow-modal" style="text-align: center; max-width: 500px; width: 100%; border: 1px solid rgba(0, 229, 195, 0.3); background: var(--bg-card); padding: 35px 25px; border-radius: 16px;">
        <div style="font-size: 3.5rem; margin-bottom: 15px; text-shadow: 0 0 15px rgba(0, 229, 195, 0.4);">📢</div>
        <h3 style="color: #0ea5e9; margin-bottom: 15px; font-size: 1.5rem;">Aviso Importante</h3>
        <div style="color: var(--text-secondary); margin-bottom: 30px; line-height: 1.6; font-size: 1.05rem; text-align: left; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">
          ${message}
        </div>
        ${textLinkBtnHtml}
        <button id="announcement-modal-btn" class="btn-primary" style="width: 100%; padding: 14px; font-size: 1.1rem; border-radius: 12px; font-weight: bold; box-shadow: 0 4px 15px rgba(0, 229, 195, 0.3);">
          Entendido 👍
        </button>
      </div>
    `;
  }

  window.handleAnnouncementClick = function(e, link) {
    e.preventDefault();
    const modalContainer = document.getElementById('announcement-modal-container');
    if (modalContainer) {
      sessionStorage.setItem('recargaaccessplay_announcement_seen', 'true');
      const overlay = modalContainer.querySelector('.modal-overlay');
      if (overlay) overlay.classList.remove('active');
      setTimeout(() => modalContainer.remove(), 300);
    }
    
    if (link.startsWith('product:')) {
      if (typeof navigateTo === 'function') navigateTo('product', link.split(':')[1]);
    } else {
      if (typeof scrollToSection === 'function') scrollToSection(link);
    }
  };

  modalContainer.innerHTML = `
    <div class="modal-overlay active" style="z-index: 99999; backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(0,0,0,0.85); padding: 15px;">
      ${contentHtml}
    </div>
  `;
  document.body.appendChild(modalContainer);

  document.getElementById('announcement-modal-btn').addEventListener('click', () => {
    sessionStorage.setItem('recargaaccessplay_announcement_seen', 'true');
    const overlay = modalContainer.querySelector('.modal-overlay');
    overlay.classList.remove('active');
    setTimeout(() => {
      modalContainer.remove();
    }, 300);
  });
}

function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!window.DATA_LOADED) {
    app.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="tracking-spinner" style="font-size: 3rem;">🤖</div>
        <h2 style="margin-top: 20px; color: var(--accent);">Conectando...</h2>
      </div>
    `;
    return;
  }

  const config = typeof getSettings === 'function' ? getSettings() : {};
  if (config.maintenance) {
    app.innerHTML = `
      <div class="bg-ocean-grid" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;">${typeof renderBubbles === 'function' ? renderBubbles() : ''}</div>
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px;">
        <div style="font-size: 5rem; margin-bottom: 20px;">🚧</div>
        <h1 style="color: var(--text-primary); margin-bottom: 10px;">Estamos en Mantenimiento</h1>
        <p style="color: var(--text-secondary); max-width: 500px; font-size: 1.1rem; line-height: 1.6;">
          Estamos actualizando nuestros precios y productos para brindarte un mejor servicio.<br>
          <b style="color: var(--accent);">¡Regresamos en unos minutos!</b>
        </p>
      </div>
    `;
    return;
  }

  const termsAccepted = sessionStorage.getItem('recargaaccessplay_terms_accepted');
  const termsHtml = !termsAccepted ? (typeof renderTermsModal === 'function' ? renderTermsModal() : '') : '';

  if (appState.currentView === 'home') {
    app.innerHTML = `
      <div class="bg-ocean-grid">${renderBubbles()}</div>
      ${renderNavbar()}
      <div class="app-container">
        <section class="hero-2col">
          <div class="hero-text-side">
            ${renderHero()}
          </div>
          <div class="hero-banner-side">
            ${renderPromoCarousel()}
          </div>
        </section>
        ${renderHowItWorks()}
        ${renderCatalogSection(appState.selectedCategory)}
        ${renderFeaturesSection()}
        ${renderFAQ()}
        ${renderFooter()}
      </div>
      ${renderSupportWidget()}
      ${termsHtml}
    `;
    requestAnimationFrame(() => {
      initCounters();
      initScrollObserver();
      initCarousel();
      if (typeof initCatalogCarousel === 'function') initCatalogCarousel();
      if (config.announcementEnabled && (config.announcementMessage || config.announcementImageUrl) && termsAccepted) {
        setTimeout(() => showAnnouncementModal(config), 500);
      }
    });
  } else if (appState.currentView === 'product') {
    app.innerHTML = `
      <div class="bg-ocean-grid">${renderBubbles()}</div>
      ${renderNavbar()}
      <div class="app-container">
        ${renderProductDetail(appState.selectedProductId)}
        ${renderFooter()}
      </div>
      ${renderSupportWidget()}
      ${termsHtml}
    `;
  } else if (appState.currentView === 'tracking') {
    app.innerHTML = `
      <div class="bg-ocean-grid">${renderBubbles()}</div>
      ${renderNavbar()}
      <div class="app-container">
        ${renderOrderTracking(appState.trackingOrderId)}
        ${renderFooter()}
      </div>
      ${renderSupportWidget()}
      ${termsHtml}
    `;
  } else if (appState.currentView === 'lookup') {
    app.innerHTML = `
      <div class="bg-ocean-grid">${renderBubbles()}</div>
      ${renderNavbar()}
      <div class="app-container">
        ${renderOrderLookup()}
        ${renderFooter()}
      </div>
      ${renderSupportWidget()}
      ${termsHtml}
    `;
  } else if (appState.currentView === 'history') {
    const orders = getOrders().filter(o => {
      if (!appState.historyContactStr) return false;
      const term = appState.historyContactStr.toLowerCase();
      const matchContact = o.customerContact && o.customerContact.toLowerCase().includes(term);
      const matchEmail = o.userEmail && o.userEmail.toLowerCase().includes(term);
      const matchPhone = o.userPhone && o.userPhone.toLowerCase().includes(term);
      return matchContact || matchEmail || matchPhone;
    });
    app.innerHTML = `
      <div class="bg-ocean-grid">${renderBubbles()}</div>
      ${renderNavbar()}
      <div class="app-container">
        ${renderOrderHistoryList(orders, appState.historyContactStr)}
        ${renderFooter()}
      </div>
      ${renderSupportWidget()}
      ${termsHtml}
    `;
  } else if (appState.currentView === 'wallet-recharge') {
    app.innerHTML = `
      <div class="bg-ocean-grid">${typeof renderBubbles === 'function' ? renderBubbles() : ''}</div>
      ${typeof renderNavbar === 'function' ? renderNavbar() : ''}
      <div class="app-container">
        ${typeof renderWalletRecharge === 'function' ? renderWalletRecharge() : ''}
        ${typeof renderFooter === 'function' ? renderFooter() : ''}
      </div>
      ${typeof renderSupportWidget === 'function' ? renderSupportWidget() : ''}
      ${termsHtml}
    `;
  } else if (appState.currentView === 'redeem-pin') {
    app.innerHTML = `
      <div class="bg-ocean-grid">${typeof renderBubbles === 'function' ? renderBubbles() : ''}</div>
      ${typeof renderNavbar === 'function' ? renderNavbar() : ''}
      <div class="app-container">
        ${typeof renderPinRedemption === 'function' ? renderPinRedemption() : ''}
        ${typeof renderFooter === 'function' ? renderFooter() : ''}
      </div>
      ${typeof renderSupportWidget === 'function' ? renderSupportWidget() : ''}
      ${termsHtml}
    `;
  }
}

// ── Navigation ──
function navigateTo(view, param) {
  // Fix cross-page navigation (e.g. from torneos.html)
  if (!document.getElementById('app') && view !== 'dashboard') {
    window.location.href = 'index.html';
    return;
  }

  if (view === 'home') {
    appState.currentView = 'home';
    appState.selectedProductId = null;
    appState.selectedPackageIndex = null;
    appState.selectedPaymentId = null;
    appState.trackingOrderId = null;
  } else if (view === 'product') {
    appState.currentView = 'product';
    appState.selectedProductId = param;
    appState.selectedPackageIndex = null;
    appState.selectedPaymentId = null;
  } else if (view === 'tracking') {
    appState.currentView = 'tracking';
    appState.trackingOrderId = param;
    if (typeof subscribeToGuestOrder === 'function') {
      subscribeToGuestOrder(param);
    }
  } else if (view === 'lookup') {
    appState.currentView = 'lookup';
    appState.trackingOrderId = null;
  } else if (view === 'history') {
    appState.currentView = 'history';
    appState.historyContactStr = param;
  } else if (view === 'dashboard') {
    window.location.href = 'usuario.html';
    return;
  } else if (view === 'redeem-pin') {
    appState.currentView = 'redeem-pin';
    appState.pinData = null;
  }
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const nav = document.getElementById('nav-links');
  if (nav) nav.classList.remove('open');
}

function scrollToSection(sectionId) {
  if (!document.getElementById('app')) {
    window.location.href = 'index.html';
    return;
  }

  if (appState.currentView !== 'home') {
    navigateTo('home');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return;
  }
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const nav = document.getElementById('nav-links');
  if (nav) nav.classList.remove('open');
}

function toggleMobileMenu() {
  const nav = document.getElementById('nav-links');
  if (nav) nav.classList.toggle('open');
}

// ── Search ──
function handleProductSearch(query) {
  const searchTerm = query.toLowerCase().trim();
  const productsGrid = document.getElementById('products-grid');
  if (!productsGrid) return;

  const filteredProducts = PRODUCTS.filter(p => {
    if (appState.selectedCategory !== 'todos' && p.category !== appState.selectedCategory) return false;
    return p.name.toLowerCase().includes(searchTerm) ||
      (p.description && p.description.toLowerCase().includes(searchTerm));
  });

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-surface); border-radius: 12px;">No se encontraron productos que coincidan con tu búsqueda.</div>';
  } else {
    productsGrid.innerHTML = filteredProducts.map((product, index) => {
      const category = CATEGORIES.find(c => c.id === product.category);
      const delay = (index % 10) * 0.05;
      const pkgList = product.packages || [];
      const minPrice = pkgList.length > 0 ? Math.min(...pkgList.map(p => p.priceUsd)) : 0;

      const iconHtml = product.imageUrl
        ? `<img src="${product.imageUrl}" class="product-icon-img" alt="${product.name}" onerror="this.onerror=null; this.outerHTML='<div class=\\'product-icon\\'>${product.currencyIcon}</div>'">`
        : `<div class="product-icon">${product.currencyIcon}</div>`;

      return `
        <div class="product-card fade-in-up" style="animation-delay: ${delay}s" onclick="navigateTo('product', '${product.id}')">
          <div class="product-card-bg" style="background: ${product.colorGradient || 'linear-gradient(135deg, var(--accent), var(--accent-hover))'}"></div>
          ${product.popular ? '<div class="product-badge badge-popular">🔥 Popular</div>' : ''}
          ${product.isNew ? '<div class="product-badge badge-new">✨ Nuevo</div>' : ''}
          ${iconHtml}
          <div class="product-info">
            <div class="product-category" style="color: ${category ? category.color : 'var(--text-muted)'}">
              ${category ? category.icon + ' ' + category.name : ''}
            </div>
            <h3>${product.name}</h3>
            <div class="product-price">Desde Bs. ${formatBs(usdToBs(minPrice))}</div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ── Category Filtering ──
function filterCategory(categoryId) {
  appState.selectedCategory = categoryId;
  const catalogContainer = document.getElementById('catalog');
  if (catalogContainer) {
    const parent = catalogContainer.parentElement;
    const newCatalog = document.createElement('div');
    newCatalog.innerHTML = renderCatalogSection(categoryId);
    const newSection = newCatalog.firstElementChild;

    catalogContainer.style.opacity = '0';
    catalogContainer.style.transform = 'translateY(10px)';

    setTimeout(() => {
      parent.replaceChild(newSection, catalogContainer);
      requestAnimationFrame(() => {
        newSection.style.opacity = '1';
        newSection.style.transform = 'translateY(0)';
        initScrollObserver();
        if (typeof initCatalogCarousel === 'function') initCatalogCarousel();
      });
    }, 200);
  }
}

// ── Package Selection ──
function selectPackage(productId, index) {
  appState.selectedPackageIndex = index;
  document.querySelectorAll('.package-card').forEach(card => card.classList.remove('selected'));
  const selected = document.getElementById(`pkg-${productId}-${index}`);
  if (selected) selected.classList.add('selected');
  const form = document.getElementById('order-form');
  if (form) {
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const product = PRODUCTS.find(g => g.id === productId);
  const pkg = product && product.packages ? product.packages[index] : null;
  if (pkg && typeof userProfile !== 'undefined' && userProfile && userProfile.wallet > 0) {
    if (userProfile.wallet >= pkg.priceUsd) {
      selectPayment('wallet');
    }
  }

  updateOrderSummary();
}

function selectWalletAmount(amount, index) {
  appState.selectedPackageIndex = amount; // Using this as the amount in USD
  document.querySelectorAll('.package-card').forEach(card => card.classList.remove('selected'));
  const selected = document.getElementById(`wallet-amt-${index}`);
  if (selected) selected.classList.add('selected');
  const form = document.getElementById('wallet-order-form');
  if (form) {
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  updateOrderSummary();
}

// ── Payment Selection ──
function selectPayment(methodId) {
  appState.selectedPaymentId = methodId;
  document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
  const selected = document.getElementById(`pay-${methodId}`);
  if (selected) selected.classList.add('selected');
  const container = document.getElementById('payment-details-container');
  const screenshotGroup = document.getElementById('screenshot-group');

  if (methodId === 'wallet') {
    if (container) container.innerHTML = `<div class="payment-details-card" style="border-color: #0ea5e9;">
      <h4>💰 Pago con Monedero</h4>
      <p>El monto será descontado automáticamente de tu saldo actual.</p>
    </div>`;
    if (screenshotGroup) screenshotGroup.style.display = 'none';
  } else {
    if (container) container.innerHTML = renderPaymentDetails(methodId);
    if (screenshotGroup) screenshotGroup.style.display = 'block';
  }
  updateOrderSummary();
  updatePackagePriceCurrency(methodId);
}

// ── Dynamic Price Currency Switch on Package Cards ──
function updatePackagePriceCurrency(methodId) {
  let isUsd = false;
  if (methodId === 'wallet') {
    isUsd = true;
  } else {
    const method = PAYMENT_METHODS.find(m => m.id === methodId);
    isUsd = method && method.currency === 'usd';
  }
  document.querySelectorAll('.package-price-badge').forEach(badge => {
    if (isUsd) {
      badge.textContent = '$' + badge.dataset.usd;
      badge.classList.add('show-usd');
    } else {
      badge.textContent = 'Bs. ' + badge.dataset.bs;
      badge.classList.remove('show-usd');
    }
  });
}

// ── Discounts ──
function applyDiscount() {
  const input = document.getElementById('discount-input');
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  input.value = code; // Force uppercase in input

  if (!code) {
    appState.appliedDiscount = null;
    updateOrderSummary();
    return;
  }

  const contactInput = document.getElementById('customer-contact');
  const contact = contactInput ? contactInput.value.trim() : null;

  const discount = validateDiscount(code, contact);
  if (!discount) {
    showToast('⚠️ Código inválido, expirado o límite excedido');
    appState.appliedDiscount = null;
    updateOrderSummary();
    return;
  }

  appState.appliedDiscount = discount;
  showToast('✅ Cupón aplicado correctamente');
  updateOrderSummary();
}

function calculateDiscountAmount(originalUsd, discount) {
  if (!discount) return 0;
  if (discount.type === 'percentage') {
    return originalUsd * (discount.value / 100);
  } else if (discount.type === 'fixed') {
    return Math.min(originalUsd, discount.value); // Cannot discount more than the price
  }
  return 0;
}

// ── Order Summary ──
function updateOrderSummary() {
  let method;
  if (appState.selectedPaymentId === 'wallet') {
    method = { id: 'wallet', name: 'Saldo del Monedero', currency: 'usd' };
  } else {
    method = PAYMENT_METHODS.find(m => m.id === appState.selectedPaymentId);
  }
  const summary = document.getElementById('order-summary');
  const btn = document.getElementById('btn-submit');

  if (appState.currentView === 'wallet-recharge') {
    const amount = appState.selectedPackageIndex;
    if (amount && method) {
      const bs = usdToBs(amount);
      const isUsd = method.currency === 'usd';
      const totalHtml = isUsd
        ? `<div class="order-summary-row total" style="color: #0ea5e9;"><span>Total a pagar (USD)</span><span>$${amount.toFixed(2)} USD</span></div>`
        : `<div class="order-summary-row total"><span>Total a pagar (Bs.)</span><span>Bs. ${formatBs(bs)}</span></div>`;

      summary.innerHTML = `
        <h4>Resumen de la Recarga</h4>
        <div class="order-summary-row"><span>Producto</span><span>Recarga de Monedero</span></div>
        <div class="order-summary-row"><span>Monto</span><span>$${amount.toFixed(2)}</span></div>
        <div class="order-summary-row"><span>Método de pago</span><span>${method.name}</span></div>
        ${totalHtml}
      `;
      summary.style.display = 'block';
      if (btn) btn.disabled = false;
    } else {
      summary.innerHTML = '';
      if (btn) btn.disabled = true;
    }
    return;
  }

  const product = PRODUCTS.find(g => g.id === appState.selectedProductId);
  const pkg = appState.selectedPackageIndex !== null ? product?.packages[appState.selectedPackageIndex] : null;
  if (product && pkg && method) {
    summary.innerHTML = renderOrderSummary(product, pkg, method, appState.appliedDiscount);
    summary.style.display = 'block';
    if (btn) btn.disabled = false;
  } else {
    summary.innerHTML = '';
    if (btn) btn.disabled = true;
  }
}

// ── Submit Order — Creates real order + redirects to tracking ──
async function submitOrder() {
  const btnSubmit = document.getElementById('btn-submit');
  if (btnSubmit && btnSubmit.dataset.processing === 'true') {
    return;
  }
  if (btnSubmit) {
    btnSubmit.dataset.processing = 'true';
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '⏳ Procesando...';
  }
  try {
    const success = await _submitOrderLogic();
    if (!success && btnSubmit) {
      btnSubmit.dataset.processing = 'false';
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '🦈 Confirmar Pedido';
    }
  } catch (err) {
    console.error("Error en el pedido:", err);
    if (btnSubmit) {
      btnSubmit.dataset.processing = 'false';
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '🦈 Confirmar Pedido';
    }
  }
}

async function _submitOrderLogic() {
  const product = PRODUCTS.find(g => g.id === appState.selectedProductId);
  if (!product) return;
  const productType = product.type || 'game-id';

  // Validate contact
  const contactInput = document.getElementById('customer-contact');
  if (!contactInput || !contactInput.value.trim()) {
    showToast('⚠️ Ingresa tu teléfono o correo de contacto');
    contactInput?.focus();
    return;
  }
  let numberOfOrders = 1;

  // Validate type-specific fields
  let gameId = '';
  let accountEmail = '';
  let accountPassword = '';

  if (productType === 'game-id') {
    const uidInput = document.getElementById('game-uid');
    if (!uidInput || !uidInput.value.trim()) {
      showToast('⚠️ Ingresa tu ID del juego');
      uidInput?.focus();
      return;
    }
    if (typeof userProfile !== 'undefined' && userProfile && userProfile.role === 'revendedor') {
      const ids = uidInput.value.trim().split(/[\n,]+/).map(i => i.trim()).filter(i => i.length > 0);
      if (ids.length === 0) {
        showToast('⚠️ Ingresa al menos un ID');
        return;
      }
      if (ids.length > 10) {
        showToast('⚠️ Máximo 10 IDs permitidos por pedido masivo');
        return;
      }
      gameId = ids;
      numberOfOrders = ids.length;
    } else {
      gameId = uidInput.value.trim();
    }
  } else if (productType === 'game-id-zone') {
    const uidInput = document.getElementById('game-uid');
    const zoneInput = document.getElementById('game-zone');
    if (!uidInput || !uidInput.value.trim()) {
      showToast('⚠️ Ingresa el Player ID');
      uidInput?.focus();
      return;
    }
    if (!zoneInput || !zoneInput.value.trim()) {
      showToast('⚠️ Ingresa el Zone ID');
      zoneInput?.focus();
      return;
    }
    gameId = `ID: ${uidInput.value.trim()} | Zona: ${zoneInput.value.trim()}`;
  } else if (productType === 'account') {
    const emailInput = document.getElementById('account-email');
    const passInput = document.getElementById('account-password');
    if (!emailInput || !emailInput.value.trim()) {
      showToast('⚠️ Ingresa el correo o usuario de la cuenta');
      emailInput?.focus();
      return;
    }
    if (!passInput || !passInput.value.trim()) {
      showToast('⚠️ Ingresa la contraseña de la cuenta');
      passInput?.focus();
      return;
    }
    accountEmail = emailInput.value.trim();
    accountPassword = passInput.value.trim();
  }

  if (appState.selectedPackageIndex === null) {
    showToast('⚠️ Selecciona un paquete');
    return;
  }
  if (!appState.selectedPaymentId) {
    showToast('⚠️ Selecciona un método de pago');
    return;
  }

  const pkg = (product.packages || [])[appState.selectedPackageIndex];
  let method = PAYMENT_METHODS.find(m => m.id === appState.selectedPaymentId);
  if (appState.selectedPaymentId === 'wallet') {
    method = { id: 'wallet', name: 'Saldo (Monedero)', currency: 'usd' };
  }

  let finalUsd = pkg.priceUsd;

  if (typeof userProfile !== 'undefined' && userProfile && userProfile.role === 'revendedor' && userProfile.discountPercentage > 0 && product.id !== 'wallet-recharge') {
    if (pkg.costUsd && pkg.costUsd > 0) {
      finalUsd = pkg.costUsd + (pkg.costUsd * (userProfile.discountPercentage / 100));
    }
  }

  // Multiplica el precio por la cantidad de pedidos masivos
  finalUsd = finalUsd * numberOfOrders;

  let discountCode = null;
  let discountValue = 0;
  let discountType = null;

  if (appState.appliedDiscount) {
    const validDiscount = validateDiscount(appState.appliedDiscount.code, contactInput.value.trim());
    if (!validDiscount) {
      showToast('⚠️ El cupón ya no es válido, expiró o alcanzó su límite de uso.');
      return;
    }
    const dAmount = calculateDiscountAmount(finalUsd, validDiscount);
    finalUsd = Math.max(0, finalUsd - dAmount);
    discountCode = validDiscount.code;
    discountValue = validDiscount.value;
    discountType = validDiscount.type;
  }

  if (appState.selectedPaymentId === 'wallet') {
    if (typeof currentUser === 'undefined' || !currentUser) {
      showToast('⚠️ Debes iniciar sesión para usar tu monedero');
      return;
    }
    const currentWallet = (typeof userProfile !== 'undefined' && userProfile && userProfile.wallet) ? userProfile.wallet : 0;
    if (currentWallet < finalUsd) {
      showToast(`⚠️ Saldo insuficiente. Tienes $${currentWallet.toFixed(2)} USD y necesitas $${finalUsd.toFixed(2)} USD.`);
      return;
    }
  } else if (!appState.selectedScreenshot) {
    showToast('⚠️ Sube la captura del comprobante de pago');
    document.getElementById('screenshot-upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      document.getElementById('screenshot-upload')?.classList.add('error-shake');
      setTimeout(() => document.getElementById('screenshot-upload')?.classList.remove('error-shake'), 500);
    }, 300);
    return;
  }

  const priceBs = parseFloat(usdToBs(finalUsd));

  if (appState.selectedPaymentId === 'wallet' && typeof window !== 'undefined') {
    await new Promise((resolve) => {
      const modalContainer = document.createElement('div');
      modalContainer.id = 'warning-modal-container';
      modalContainer.innerHTML = `
        <div class="modal-overlay active" style="z-index: 9999; backdrop-filter: blur(5px);">
          <div class="modal payment-flow-modal" style="text-align: center; max-width: 420px; border: 1px solid rgba(255, 183, 77, 0.3); background: var(--bg-card); padding: 30px 24px;">
            <div style="font-size: 3.5rem; margin-bottom: 10px; text-shadow: 0 0 15px rgba(255,183,77,0.4);">⚠️</div>
            <h3 style="color: #ffb74d; margin-bottom: 15px; font-size: 1.4rem;">Aviso Importante</h3>
            <p style="color: var(--text-secondary); margin-bottom: 25px; line-height: 1.6; font-size: 1rem;">
              Tu orden está en proceso. Al presionar <b>Aceptar</b> comenzará el envío automático.<br><br>
              <span style="color: #ff6b6b; font-weight: 600; background: rgba(255,107,107,0.1); padding: 5px 10px; border-radius: 6px; display: inline-block; margin-top: 5px;">
                Por favor, NO CIERRES NI ACTUALICES el navegador hasta terminar.
              </span>
            </p>
            <button id="warning-modal-btn" class="btn-primary" style="width: 100%; padding: 14px; font-size: 1.05rem; border-radius: 12px; font-weight: bold; box-shadow: 0 4px 15px rgba(0, 229, 195, 0.3);">
              Aceptar y Continuar 🚀
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modalContainer);

      document.getElementById('warning-modal-btn').addEventListener('click', () => {
        const overlay = modalContainer.querySelector('.modal-overlay');
        overlay.classList.remove('active');
        setTimeout(() => {
          modalContainer.remove();
          resolve();
        }, 200);
      });
    });
  }

  if (appState.selectedPaymentId === 'wallet') {
    const currentWallet = (typeof userProfile !== 'undefined' && userProfile && userProfile.wallet) ? userProfile.wallet : 0;
    if (currentWallet < finalUsd) {
      if (typeof recordOrderAttempt === 'function') recordOrderAttempt();
      return Swal.fire('Error', 'Saldo insuficiente en tu monedero.', 'error');
    }
    try {
      const idToken = await firebase.auth().currentUser.getIdToken();
      const walletRes = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ action: 'purchase', amount: finalUsd })
      });
      const walletData = await walletRes.json();
      if (walletData.error) throw new Error(walletData.error);
      
      firebase.database().ref('users/' + currentUser.uid + '/transactions').push({
        id: Date.now().toString(),
        type: 'purchase',
        amount: -finalUsd,
        description: numberOfOrders > 1 ? `Compra Masiva (${numberOfOrders} IDs): ${product.name} - ${pkg.label}` : `Compra: ${product.name} - ${pkg.label}`,
        date: Date.now()
      });

      // --- CALCULATE AND AWARD UPFRONT VIP CASHBACK, POINTS, AND TOTAL SPENT FOR WALLET PURCHASES ---
      if (!discountCode && typeof userProfile !== 'undefined' && userProfile && userProfile.role !== 'revendedor') {
        const userId = currentUser.uid;
        
        firebase.database().ref('users/' + userId).transaction(userData => {
          if (userData === null) return userData;
          
          let currentPoints = userData.points || 0;
          let totalSpent = userData.totalSpent || 0;
          
          let newSpent = totalSpent + finalUsd;
          userData.totalSpent = newSpent;
          
          // 1. Calculate Points
          let earnedPoints = 0;
          if (finalUsd < 5) earnedPoints = 2;
          else if (finalUsd <= 12) earnedPoints = 4;
          else earnedPoints = 7;
          
          userData.points = currentPoints + earnedPoints;
          return userData;
        }).then(async (txResult) => {
          if (!txResult.committed) return;
          const p = txResult.snapshot.val();
          const newSpent = p.totalSpent || 0;
          
          if (typeof getVipLevel === 'function') {
            const vip = getVipLevel(newSpent);
            const cashbackPercent = vip.cashback || 0;
            
            if (cashbackPercent > 0) {
              const cashbackAmount = finalUsd * (cashbackPercent / 100);
              try {
                const cbRes = await fetch('/api/wallet', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                  body: JSON.stringify({ action: 'cashback', amount: cashbackAmount })
                });
                const cbData = await cbRes.json();
                if (!cbData.error) {
                  firebase.database().ref('users/' + userId + '/transactions').push({
                    id: Date.now().toString(),
                    type: 'deposit',
                    amount: cashbackAmount,
                    description: `Cashback VIP (${cashbackPercent.toFixed(1)}%) por pedido`,
                    date: Date.now()
                  });
                }
              } catch (cbErr) {
                console.warn('No se pudo otorgar cashback inmediato:', cbErr);
              }
            }
          }
        });
      }
      // --------------------------------------------------------------------------------------------

    } catch (err) {
      console.error(err);
      if (typeof recordOrderAttempt === 'function') recordOrderAttempt();
      return Swal.fire('Error', 'Error al procesar el pago con monedero: ' + err.message, 'error');
    }
  }

  // Subir captura a Firebase Storage ANTES de crear los pedidos para que todos compartan la misma foto
  let sharedScreenshotUrl = null;
  let uploadRes = null;
  if (appState.selectedScreenshot && appState.selectedPaymentId !== 'wallet') {
    try {
      uploadRes = await uploadScreenshotWithRetry(appState.selectedScreenshot);
      if (uploadRes === false) {
        return false; // User cancelled modal
      }
      if (uploadRes && typeof uploadRes === 'object') {
        sharedScreenshotUrl = uploadRes.url || null;
        if (uploadRes.manualRef) {
          if (!appState.selectedScreenshotOcr) appState.selectedScreenshotOcr = [];
          appState.selectedScreenshotOcr.unshift(uploadRes.manualRef);
        }
      } else if (typeof uploadRes === 'string') {
        sharedScreenshotUrl = uploadRes;
      }
    } catch (err) {
      console.error('Error subiendo captura:', err);
      showToast('⚠️ Error al subir captura: ' + (err.message || 'Intenta de nuevo.'));
      return false; // ABORT ORDER
    }
  }

  // Create the orders
  let lastOrder = null;
  const orderList = Array.isArray(gameId) ? gameId : [gameId];

  for (let i = 0; i < orderList.length; i++) {
    const singleGameId = orderList[i];
    const orderPriceUsd = finalUsd / numberOfOrders;
    const orderPriceBs = priceBs / numberOfOrders;

    const orderId = generateOrderRef();

    let secureAccountPassword = accountPassword;
    if (secureAccountPassword) {
      try {
        const encryptRes = await fetch('/api/crypto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'encrypt', payload: secureAccountPassword })
        });
        if (encryptRes.ok) {
          const encData = await encryptRes.json();
          secureAccountPassword = encData.result || secureAccountPassword;
        }
      } catch (e) {
        console.warn('Failed to encrypt password', e);
      }
    }

    const order = createOrder({
      id: orderId,
      screenshot: sharedScreenshotUrl,
      userId: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.uid : null,
      userName: (typeof currentUser !== 'undefined' && currentUser) ? (currentUser.displayName || currentUser.email) : null,
      productId: product.id,
      productName: product.name,
      productType: productType,
      packageLabel: pkg.label,
      apiProductId: pkg.apiServiceId,
      apiProvider: product.apiProvider,
      priceUsd: orderPriceUsd,
      priceBs: orderPriceBs,
      costUsd: pkg.costUsd || 0,
      paymentMethodId: method.id,
      paymentMethodName: method.name,
      paymentCurrency: method.currency || 'bs',
      customerContact: contactInput.value.trim(),
      gameId: singleGameId,
      accountEmail: accountEmail,
      accountPassword: secureAccountPassword,
      ocrNumbers: appState.selectedScreenshotOcr || [],
      manualRef: (uploadRes && typeof uploadRes === 'object' && uploadRes.manualRef) ? uploadRes.manualRef : null,
      imageHash: appState.selectedScreenshotHash || null,
      discountCode: discountCode,
      discountValue: discountValue / numberOfOrders,
      discountType: discountType,
      playerName: appState.verifiedPlayerName
    });

    if (typeof recordOrderAttempt === 'function') recordOrderAttempt();

    // Handle Telegram notification
    if (typeof triggerTelegramNotification === 'function') {
      try {
        const tgPromise = triggerTelegramNotification(order);
        const tgTimeout = new Promise((resolve) => setTimeout(resolve, 15000));
        await Promise.race([tgPromise, tgTimeout]);
      } catch (err) {
        console.warn('Error en Telegram notification:', err);
      }
    }

    lastOrder = order;

    const isReseller = typeof userProfile !== 'undefined' && userProfile && userProfile.role === 'revendedor';
    const autoProcessExternal = isReseller && userProfile.autoProcessExternal === true;

    // Auto-process if paid with wallet, or if it's a reseller with autoProcessExternal enabled
    if ((order.paymentMethodId === 'wallet' || autoProcessExternal) && typeof window !== 'undefined') {
      if (typeof processWalletOrderAuto === 'function') {
        processWalletOrderAuto(order, isReseller);
      }
    }
  }

  // Show success animation then redirect to tracking using the last order created
  showOrderConfirmation(lastOrder);
  return true;
}

let isProcessingOrder = false;
window.addEventListener('beforeunload', function (e) {
  if (isProcessingOrder) {
    e.preventDefault();
    e.returnValue = 'Estamos procesando tu recarga de forma automatizada. Si actualizas la página el proceso podría quedar a medias.';
    return e.returnValue;
  }
});


// ── Submit Wallet Recharge ──
async function submitWalletRecharge() {
  const btnSubmit = document.getElementById('btn-submit');
  if (btnSubmit && btnSubmit.dataset.processing === 'true') return;
  if (btnSubmit) {
    btnSubmit.dataset.processing = 'true';
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '⏳ Procesando...';
  }

  try {
    const success = await _submitWalletRechargeLogic();
    if (!success && btnSubmit) {
      btnSubmit.dataset.processing = 'false';
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '🤖 Confirmar Recarga';
    }
  } catch (err) {
    console.error("Error en recarga:", err);
    if (btnSubmit) {
      btnSubmit.dataset.processing = 'false';
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '🤖 Confirmar Recarga';
    }
  }
}

async function _submitWalletRechargeLogic() {
  if (!currentUser) {
    showToast('⚠️ Debes iniciar sesión para recargar tu monedero');
    return false;
  }
  const amount = appState.selectedPackageIndex;
  const method = PAYMENT_METHODS.find(m => m.id === appState.selectedPaymentId);

  if (!amount) { showToast('⚠️ Selecciona un monto'); return false; }
  if (!method) { showToast('⚠️ Selecciona un método de pago'); return false; }
  if (!appState.selectedScreenshot) {
    showToast('⚠️ Sube la captura del comprobante');
    return false;
  }

  let sharedScreenshotUrl = null;
  let manualRef = null;
  try {
    const uploadRes = await uploadScreenshotWithRetry(appState.selectedScreenshot);
    if (uploadRes === false) {
      return false; // User cancelled modal
    }
    if (uploadRes && typeof uploadRes === 'object') {
      sharedScreenshotUrl = uploadRes.url || null;
      if (uploadRes.manualRef) {
        if (!appState.selectedScreenshotOcr) appState.selectedScreenshotOcr = [];
        appState.selectedScreenshotOcr.unshift(uploadRes.manualRef);
        manualRef = uploadRes.manualRef;
      }
    } else if (typeof uploadRes === 'string') {
      sharedScreenshotUrl = uploadRes;
    }
  } catch (err) {
    console.error('Error subiendo captura:', err);
    showToast('⚠️ Error al subir captura: ' + (err.message || 'Intenta de nuevo.'));
    return false;
  }

  const priceBs = parseFloat(usdToBs(amount));

  const order = createOrder({
    userId: currentUser.uid,
    userName: currentUser.displayName || currentUser.email,
    productId: 'wallet-recharge',
    productName: 'Recarga de Monedero',
    productType: 'wallet-recharge',
    packageLabel: `$${amount} USD`,
    priceUsd: amount,
    priceBs: priceBs,
    costUsd: 0,
    paymentMethodId: method.id,
    paymentMethodName: method.name,
    paymentCurrency: method.currency || 'bs',
    customerContact: currentUser.email,
    accountEmail: currentUser.email,
    screenshot: sharedScreenshotUrl,
    ocrNumbers: appState.selectedScreenshotOcr || [],
    manualRef: manualRef,
  });

  if (typeof recordOrderAttempt === 'function') recordOrderAttempt();

  if (typeof triggerTelegramNotification === 'function') {
    try {
      const tgPromise = triggerTelegramNotification(order);
      const tgTimeout = new Promise((resolve) => setTimeout(resolve, 15000));
      await Promise.race([tgPromise, tgTimeout]);
    } catch (err) {
      console.warn('Error en Telegram notification:', err);
    }
  }

  showOrderConfirmation(order);
  return true;
}

function showOrderConfirmation(order) {
  const modalContainer = document.createElement('div');
  modalContainer.id = 'modal-container';
  modalContainer.innerHTML = `
    <div class="modal-overlay active" id="modal-overlay">
      <div class="modal payment-flow-modal">
        <div class="payment-flow-steps" id="payment-flow-steps">
          <div class="pf-steps-bar">
            <div class="pf-step-indicator active" id="pf-ind-1">
              <div class="pf-step-dot">1</div>
              <span>Registrando</span>
            </div>
            <div class="pf-step-line" id="pf-line-1"></div>
            <div class="pf-step-indicator" id="pf-ind-2">
              <div class="pf-step-dot">2</div>
              <span>Guardando</span>
            </div>
            <div class="pf-step-line" id="pf-line-2"></div>
            <div class="pf-step-indicator" id="pf-ind-3">
              <div class="pf-step-dot">3</div>
              <span>Listo</span>
            </div>
          </div>

          <div class="pf-step-content active" id="pf-content-1">
            <div class="pf-spinner">
              <div class="pf-spinner-ring"></div>
              <span class="pf-spinner-icon">📋</span>
            </div>
            <h3>Registrando Pedido</h3>
            <p>Estamos registrando tu pedido en el sistema...</p>
          </div>

          <div class="pf-step-content" id="pf-content-2">
            <div class="pf-processing">
              <div class="pf-progress-bar">
                <div class="pf-progress-fill" id="pf-progress-fill"></div>
              </div>
              <span class="pf-processing-icon">⚙️</span>
            </div>
            <h3>Guardando Datos</h3>
            <p>Tu pedido ha sido registrado correctamente...</p>
          </div>

          <div class="pf-step-content" id="pf-content-3">
            <div class="pf-success">
              <div class="pf-check-circle">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#0ea5e9" stroke-width="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div class="pf-confetti" id="pf-confetti"></div>
            </div>
            <h3 style="margin-top: 20px; margin-bottom: 10px;">¡Pedido Registrado!</h3>
            <p style="margin-bottom: 25px; color: var(--text-secondary);">Tu pedido ha sido registrado exitosamente. Por favor, guarda tu número de referencia.</p>
            
            <div style="background: rgba(0, 229, 195, 0.05); border: 1px dashed rgba(0, 229, 195, 0.4); border-radius: var(--radius-md); padding: 20px; margin-bottom: 25px;">
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 5px;">Código de Referencia</div>
              <div style="font-family: 'Courier New', monospace; font-size: 1.6rem; font-weight: 800; color: var(--accent); letter-spacing: 2px; margin-bottom: 12px; text-shadow: 0 0 10px rgba(0,229,195,0.3);">
                ${order.id}
              </div>
              <div style="display: inline-block; background: rgba(255, 183, 77, 0.1); border: 1px solid rgba(255, 183, 77, 0.3); color: #ffb74d; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                ⏳ Pendiente de verificación
              </div>
            </div>

            <button class="btn-primary pf-done-btn" onclick="goToTracking('${order.id}')" style="width: 100%; border-radius: 12px; padding: 16px; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
              📡 Ver Estado del Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalContainer);

  // Animate through steps
  setTimeout(() => {
    advanceToStep(2);
    setTimeout(() => {
      const fill = document.getElementById('pf-progress-fill');
      if (fill) fill.style.width = '100%';
    }, 100);
    setTimeout(() => {
      advanceToStep(3);
      setTimeout(() => createConfetti(), 300);
    }, 1800);
  }, 1500);
}

function handleRouletteTransition(orderId) {
  const container = document.getElementById('modal-container');
  if (container) container.remove();

  const orders = typeof getOrders === 'function' ? getOrders() : ORDERS;
  const products = typeof getProducts === 'function' ? getProducts() : PRODUCTS;

  const order = orders.find(o => o.id === orderId);
  const product = order ? products.find(p => p.id === order.productId) : null;

  if (typeof showRouletteModal === 'function' && order && product) {
    showRouletteModal(order.id);
  } else {
    goToTracking(orderId);
  }
}

function goToTracking(orderId) {
  const container = document.getElementById('modal-container');
  if (container) container.remove();
  navigateTo('tracking', orderId);
}

function advanceToStep(step) {
  for (let i = 1; i <= 3; i++) {
    const ind = document.getElementById(`pf-ind-${i}`);
    const content = document.getElementById(`pf-content-${i}`);
    if (ind) {
      ind.classList.toggle('active', i <= step);
      ind.classList.toggle('completed', i < step);
    }
    if (content) {
      content.classList.toggle('active', i === step);
    }
  }
  for (let i = 1; i < step; i++) {
    const line = document.getElementById(`pf-line-${i}`);
    if (line) line.classList.add('filled');
  }
}

function createConfetti() {
  const container = document.getElementById('pf-confetti');
  if (!container) return;
  const colors = ['#0ea5e9', '#ff6b4a', '#3d8bfd', '#f5c518', '#e040fb', '#4caf50'];
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay: ${Math.random() * 0.5}s;
      animation-duration: ${1 + Math.random() * 1.5}s;
    `;
    container.appendChild(confetti);
  }
}

function closeModal() {
  const container = document.getElementById('modal-container');
  if (container) {
    const overlay = container.querySelector('.modal-overlay');
    if (overlay) overlay.classList.remove('active');
    setTimeout(() => container.remove(), 300);
  }
}

function closeModalOutside(event) {
  if (event.target.classList.contains('modal-overlay')) {
    closeModal();
  }
}

// ── Order Lookup ──
async function lookupOrder() {
  const input = document.getElementById('lookup-input');
  if (!input || !input.value.trim()) {
    showToast('⚠️ Ingresa un dato de búsqueda');
    input?.focus();
    return;
  }
  const val = input.value.trim();

  let orderIdToTrack = null;
  if (/^AP-/i.test(val)) {
    orderIdToTrack = val.toUpperCase();
  } else if (/^\d{1,6}(?:-[A-Za-z0-9]+)?$/.test(val)) {
    orderIdToTrack = 'AP-' + val.toUpperCase();
  }

  if (orderIdToTrack) {
    const btn = input.nextElementSibling;
    const oldHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = '⏳';
      btn.disabled = true;
    }
    try {
      const snap = await firebase.database().ref('orders/' + orderIdToTrack).once('value');
      if (btn) { btn.innerHTML = oldHtml; btn.disabled = false; }

      if (snap.exists()) {
        const orderData = snap.val();
        // Insert into local ORDERS if not present
        if (!ORDERS.find(o => o.id === orderData.id)) {
          ORDERS.push(orderData);
        }
        navigateTo('tracking', orderData.id);
      } else {
        showToast('❌ Pedido no encontrado. Verifica el número (Ej: AP-1234)');
      }
    } catch (e) {
      if (btn) { btn.innerHTML = oldHtml; btn.disabled = false; }
      showToast('❌ Error al buscar pedido');
    }
  } else {
    // Búsqueda por correo/teléfono:
    if (firebase.auth().currentUser) {
      showToast('Tus pedidos están en tu perfil', 'info');
      navigateTo('dashboard');
    } else {
      showToast('⚠️ Para buscar por correo/teléfono debes Iniciar Sesión, o usa tu número de pedido (Ej: AP-1234)', 'info');
    }
  }
}

// ── Rectify Order ID ──
function rectifyOrderId(orderId, btnElement) {
  const orders = getOrders();
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    showToast('❌ Pedido no encontrado');
    if (btnElement) { btnElement.disabled = false; btnElement.innerHTML = 'Re-enviar Pedido'; }
    return;
  }

  const order = orders[orderIndex];
  let newGameId = '';
  let accountEmail = order.accountEmail || '';
  let accountPassword = order.accountPassword || '';

  if (order.productType === 'account') {
    const emailInput = document.getElementById(`rectify-email-input-${orderId}`);
    const passInput = document.getElementById(`rectify-pass-input-${orderId}`);
    if (!emailInput || !emailInput.value.trim() || !passInput || !passInput.value.trim()) {
      showToast('⚠️ Ingresa correo y contraseña');
      if (btnElement) { btnElement.disabled = false; btnElement.innerHTML = 'Re-enviar Pedido'; }
      return;
    }
    accountEmail = emailInput.value.trim();
    accountPassword = passInput.value.trim();
    newGameId = `Correo: ${escapeHTML(accountEmail)} | Clave: ${accountPassword}`;
  } else if (order.productType === 'game-id-zone') {
    const idInput = document.getElementById(`rectify-id-input-${orderId}`);
    const zoneInput = document.getElementById(`rectify-zone-input-${orderId}`);
    if (!idInput || !idInput.value.trim() || !zoneInput || !zoneInput.value.trim()) {
      showToast('⚠️ Ingresa el ID y la Zona');
      if (btnElement) { btnElement.disabled = false; btnElement.innerHTML = 'Re-enviar Pedido'; }
      return;
    }
    newGameId = `ID: ${idInput.value.trim()} | Zona: ${zoneInput.value.trim()}`;
  } else {
    const input = document.getElementById(`rectify-id-input-${orderId}`);
    if (!input || !input.value.trim()) {
      showToast('⚠️ Ingresa los datos correctos');
      input?.focus();
      if (btnElement) { btnElement.disabled = false; btnElement.innerHTML = 'Re-enviar Pedido'; }
      return;
    }
    newGameId = input.value.trim();
  }

  // 1. Mark the OLD order as replaced
  order.status = 'pending';
  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = order.statusHistory ? Object.values(order.statusHistory) : [];
  }
  order.statusHistory.push({
    status: 'pending',
    timestamp: new Date().toISOString(),
    note: `El cliente rectificó los datos a: ${newGameId}`
  });
  order.updatedAt = new Date().toISOString();
  order.gameId = newGameId; // IMPORTANT: update the gameId on the existing order!
  
  saveOrderToDb(order);

  // Update local state
  orders[orderIndex] = order;
  ORDERS = orders;

  showToast('✅ Datos actualizados y reenviados correctamente');

  // Trigger web notification manually
  const msgText = `🔄 <b>PEDIDO RECTIFICADO — #${order.id}</b>\n\nEl cliente ha corregido sus datos.\nNuevos datos: <code>${newGameId}</code>`;
  if (typeof sendTelegramMessage === 'function') {
    sendTelegramMessage(msgText, buildOrderKeyboard(order.id));
  }
}

// ── Toggle Password Visibility ──
function togglePasswordVisibility() {
  const passInput = document.getElementById('account-password');
  if (!passInput) return;
  if (passInput.type === 'password') {
    passInput.type = 'text';
  } else {
    passInput.type = 'password';
  }
}

// ── Toast Notification ──
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ── Copy to Clipboard ──
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('✅ Copiado al portapapeles');
  }).catch(() => {
    const tmp = document.createElement('textarea');
    tmp.value = text;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    tmp.remove();
    showToast('✅ Copiado al portapapeles');
  });
}

// ── Scroll Effects ──
function initScrollEffects() {
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
  });
}

// ── Counter Animation ──
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach(el => {
    const target = parseInt(el.getAttribute('data-counter'));
    animateCounter(el, target);
  });
}

function animateCounter(el, target) {
  const duration = 2000;
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    if (target >= 1000) {
      el.textContent = current.toLocaleString() + '+';
    } else {
      el.textContent = current;
    }
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

// ── Scroll Observer for fade-in animations ──
function initScrollObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in-up').forEach(el => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
}

// ── Support Chat Logic ──
let chatPollingInterval = null;

function renderSupportMessages() {
  const messagesContainer = document.getElementById('support-messages');
  if (!messagesContainer) return;
  const sessionId = getDeviceFingerprint();
  const msgs = getMessagesForSession(sessionId);

  if (msgs.length === 0) {
    messagesContainer.innerHTML = `
      <div class="support-msg support-msg--bot">
        <div class="support-msg-bubble">
          ¡Hola! 👋 Bienvenido a <strong>AccessPlay</strong>. ¿En qué puedo ayudarte hoy?
        </div>
        <div class="support-msg-time">${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    `;
    return;
  }

  let html = '';
  msgs.forEach(msg => {
    if (msg.sender === 'system') return;
    const isUser = msg.sender === 'user';
    const time = new Date(msg.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    html += `
      <div class="support-msg ${isUser ? 'support-msg--user' : 'support-msg--bot'}">
        <div class="support-msg-bubble">${escapeHTML(msg.text)}</div>
        <div class="support-msg-time">${time}</div>
      </div>
    `;
  });
  messagesContainer.innerHTML = html;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function toggleSupportChat() {
  const widget = document.getElementById('support-widget');
  if (widget) {
    widget.classList.toggle('open');
    if (!widget.classList.contains('open')) {
      widget.classList.remove('chat-active');
      if (typeof chatPollingInterval !== 'undefined' && chatPollingInterval) {
        clearInterval(chatPollingInterval);
        chatPollingInterval = null;
      }
    }
  }
}

function openSupportWebChat() {
  const widget = document.getElementById('support-widget');
  if (widget) {
    widget.classList.add('chat-active');
    const sessionId = getDeviceFingerprint();
    const contact = localStorage.getItem('support_contact');

    const loginView = document.getElementById('support-login-view');
    const messagesView = document.getElementById('support-messages');
    const bottomView = document.getElementById('support-chat-bottom');

    if (!contact) {
      if (loginView) loginView.style.display = 'flex';
      if (messagesView) messagesView.style.display = 'none';
      if (bottomView) bottomView.style.display = 'none';
      const contactInput = document.getElementById('support-contact-input');
      if (contactInput) setTimeout(() => contactInput.focus(), 300);
    } else {
      if (loginView) loginView.style.display = 'none';
      if (messagesView) messagesView.style.display = 'flex';
      if (bottomView) bottomView.style.display = 'block';

      markMessagesAsRead(sessionId, 'user');
      if (typeof renderDynamicQuickActions === 'function') renderDynamicQuickActions();
      renderSupportMessages();

      const input = document.getElementById('support-input');
      if (input) setTimeout(() => input.focus(), 300);

      if (typeof chatPollingInterval !== 'undefined' && !chatPollingInterval) {
        chatPollingInterval = setInterval(() => {
          if (widget.classList.contains('open') && localStorage.getItem('support_contact')) {
            renderSupportMessages();
            markMessagesAsRead(sessionId, 'user');
          }
        }, 5000);
      }
    }
  }
}

function closeSupportWebChat() {
  const widget = document.getElementById('support-widget');
  if (widget) {
    widget.classList.remove('chat-active');
    if (typeof chatPollingInterval !== 'undefined' && chatPollingInterval) {
      clearInterval(chatPollingInterval);
      chatPollingInterval = null;
    }
  }
}

function startSupportSession() {
  const input = document.getElementById('support-contact-input');
  if (!input || !input.value.trim()) {
    showToast('Por favor ingresa tu contacto', 'error');
    return;
  }
  const contact = input.value.trim();
  localStorage.setItem('support_contact', contact);

  const loginView = document.getElementById('support-login-view');
  const messagesView = document.getElementById('support-messages');
  const bottomView = document.getElementById('support-chat-bottom');

  if (loginView) loginView.style.display = 'none';
  if (messagesView) messagesView.style.display = 'flex';
  if (bottomView) bottomView.style.display = 'block';

  const sessionId = getDeviceFingerprint();
  
  // BUG-2 FIX: Iniciar sincronización de mensajes para recibir respuestas del admin en tiempo real
  if (typeof syncUserChat === 'function') {
    syncUserChat(sessionId);
  }

  // Call addMessage empty just to create session with contact if not exists
  let msgs = getMessagesForSession(sessionId);
  if (msgs.length === 0) {
    addMessage(sessionId, 'bot', '¡Hola! 👋 Bienvenido a AccesPlay. ¿En qué puedo ayudarte hoy?', contact);
  } else {
    // Force contact update
    addMessage(sessionId, 'system', '', contact);
  }

  if (typeof renderDynamicQuickActions === 'function') renderDynamicQuickActions();

  renderSupportMessages();
  const chatInput = document.getElementById('support-input');
  if (chatInput) setTimeout(() => chatInput.focus(), 300);
}

async function sendSupportMessage() {
  const input = document.getElementById('support-input');
  if (!input || !input.value.trim()) return;
  const text = input.value.trim();
  input.value = '';

  const sessionId = getDeviceFingerprint();
  const contact = localStorage.getItem('support_contact') || 'Desconocido';

  addMessage(sessionId, 'user', text, contact);
  renderSupportMessages();

  const quickActions = document.getElementById('support-quick-actions');
  if (quickActions) quickActions.style.display = 'none';

  // Notify Telegram using global TELEGRAM_CONFIG (Ahora manejado por el Robot Tiendas)
  // fetch API removido porque el Cerebro Central procesa los mensajes


  // Smart bot auto-replies for quick actions
  setTimeout(() => {
    let reply = '';
    const lowerText = text.toLowerCase();

    // Check dynamic quick replies
    const replies = getQuickReplies();
    for (const r of replies) {
      const keywords = r.keywords.split(',').map(k => k.trim().toLowerCase());
      if (keywords.some(k => lowerText.includes(k))) {
        reply = r.response;
        break; // Stop at first match
      }
    }

    if (reply !== '') {
      addMessage(sessionId, 'bot', reply, contact);
      renderSupportMessages();
    }
  }, 1000);
}

function supportQuickAction(title) {
  const input = document.getElementById('support-input');
  if (!input) return;
  input.value = title;
  sendSupportMessage();
}

function previewScreenshot(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('⚠️ La captura no debe superar los 5MB');
    input.value = '';
    return;
  }

  const previewContainer = document.getElementById('screenshot-preview');

  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;

    appState.selectedScreenshot = file;

    if (previewContainer) {
      previewContainer.innerHTML = `
        <div class="screenshot-preview-wrapper" style="position: relative; border-radius: var(--radius); overflow: hidden;">
          <img src="${dataUrl}" class="screenshot-img-preview" alt="Vista previa" style="width: 100%; display: block;">
          <div class="screenshot-remove-overlay" onclick="removeScreenshot(event)" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; opacity: 0; transition: opacity 0.3s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">
            <span>❌ Eliminar</span>
          </div>
        </div>
      `;
    }
  };
  reader.readAsDataURL(file);
}

function removeScreenshot(event) {
  event.stopPropagation();
  appState.selectedScreenshot = null;
  const fileInput = document.getElementById('payment-screenshot');
  if (fileInput) fileInput.value = '';

  const previewContainer = document.getElementById('screenshot-preview');
  if (previewContainer) {
    previewContainer.innerHTML = `
      <div class="screenshot-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        <span>Toca para subir captura</span>
        <span class="screenshot-hint">JPG, PNG — Máx 5MB</span>
      </div>
    `;
  }
}

function generateThumbnail(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 1200;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Robust Firebase Storage Upload ──
function uploadToFirebaseStorage(blob, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const tempId = generateOrderRef();
    const randomSecret = Math.random().toString(36).substring(2, 10);
    const path = 'orders_screenshots/' + tempId + '_' + randomSecret + '.jpg';
    
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Tiempo de espera agotado (30s).'));
      }
    }, timeoutMs);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64data = reader.result;
          const headers = { 'Content-Type': 'application/json' };
          if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            try {
              const token = await firebase.auth().currentUser.getIdToken();
              headers['Authorization'] = `Bearer ${token}`;
            } catch (e) {
              console.warn("Could not get auth token for upload", e);
            }
          }
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ imageBase64: base64data, path: path })
          });

          if (!res.ok) {
            throw new Error(`Error de proxy: ${res.status}`);
          }
          
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            resolve(data.url);
          }
        } catch (e) {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            reject(e);
          }
        }
      };
      
      reader.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          reject(new Error('Error al procesar la imagen'));
        }
      };
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(err);
      }
    }
  });
}

async function uploadScreenshotWithRetry(file) {
  const compressedBlob = await compressFileToBlob(file);

  try {
    const url = await uploadToFirebaseStorage(compressedBlob, 20000);
    return { url: url };
  } catch (err) {
    console.warn("Upload de captura superó los 20s o falló:", err.message);
    return await promptManualReferenceModal(file);
  }
}

function promptManualReferenceModal(file) {
  return new Promise((resolve) => {
    const existingModal = document.getElementById('timeout-ref-modal-container');
    if (existingModal) existingModal.remove();

    const modalContainer = document.createElement('div');
    modalContainer.id = 'timeout-ref-modal-container';
    
    const existingOcr = (appState.selectedScreenshotOcr && appState.selectedScreenshotOcr.length > 0) 
      ? appState.selectedScreenshotOcr[0] 
      : '';

    modalContainer.innerHTML = `
      <div class="modal-overlay active" style="z-index: 99999; backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(0,0,0,0.85); padding: 15px;">
        <div class="modal payment-flow-modal" style="text-align: center; max-width: 440px; width: 100%; border: 1px solid rgba(14, 165, 233, 0.4); background: #0f172a; padding: 25px 20px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.9);">
          <div style="font-size: 3rem; margin-bottom: 8px;">⏱️</div>
          <h3 style="color: #0ea5e9; margin-bottom: 8px; font-size: 1.3rem; font-weight: 700;">Envío de comprobante demorado</h3>
          <p style="color: #94a3b8; margin-bottom: 18px; line-height: 1.5; font-size: 0.92rem; text-align: center;">
            La subida de la imagen tardó más de 20 segundos debido a la conexión.<br>
            <strong style="color: #e2e8f0;">Para no hacerte esperar más</strong>, ingresa los <u style="color: #38bdf8;">últimos 6 dígitos</u> del número de referencia de tu pago:
          </p>
          
          <div style="margin-bottom: 20px; text-align: left;">
            <label style="display: block; color: #f1f5f9; font-size: 0.85rem; margin-bottom: 6px; font-weight: 600;">
              Últimos 6 dígitos de referencia:
            </label>
            <input type="text" id="manual-ref-input" maxlength="12" placeholder="Ej: 123456" 
                   value="${existingOcr}"
                   style="width: 100%; padding: 14px 16px; border-radius: 10px; border: 1px solid rgba(14, 165, 233, 0.5); background: rgba(0,0,0,0.5); color: #fff; font-size: 1.25rem; text-align: center; letter-spacing: 2px; font-weight: bold; outline: none; box-sizing: border-box;">
            <div id="manual-ref-error" style="color: #ef4444; font-size: 0.82rem; margin-top: 6px; display: none; text-align: center;">
              ⚠️ Ingresa al menos los últimos 4 a 6 dígitos del pago.
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="btn-confirm-manual-ref" class="btn-primary" style="width: 100%; padding: 14px; font-size: 1rem; border-radius: 12px; font-weight: bold; background: linear-gradient(135deg, #0ea5e9, #0284c7); border: none; cursor: pointer; color: white;">
              🚀 Confirmar Pedido con Referencia
            </button>
            <button id="btn-retry-upload-image" style="width: 100%; padding: 11px; font-size: 0.88rem; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; cursor: pointer;">
              🔄 Reintentar subir imagen
            </button>
            <button id="btn-cancel-manual-ref" style="width: 100%; padding: 8px; font-size: 0.8rem; background: transparent; border: none; color: #64748b; cursor: pointer; text-decoration: underline;">
              Cancelar y volver
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    const refInput = document.getElementById('manual-ref-input');
    const errDiv = document.getElementById('manual-ref-error');
    setTimeout(() => refInput && refInput.focus(), 100);

    document.getElementById('btn-confirm-manual-ref').addEventListener('click', () => {
      const val = refInput.value.trim().replace(/\s+/g, '');
      if (!val || val.length < 4) {
        errDiv.style.display = 'block';
        refInput.focus();
        return;
      }
      modalContainer.remove();
      resolve({ url: null, manualRef: val });
    });

    refInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('btn-confirm-manual-ref').click();
      }
    });

    document.getElementById('btn-retry-upload-image').addEventListener('click', async () => {
      modalContainer.remove();
      try {
        const compressedBlob = await compressFileToBlob(file);
        const url = await uploadToFirebaseStorage(compressedBlob, 20000);
        resolve({ url: url });
      } catch (retryErr) {
        const result = await promptManualReferenceModal(file);
        resolve(result);
      }
    });

    document.getElementById('btn-cancel-manual-ref').addEventListener('click', () => {
      modalContainer.remove();
      resolve(false);
    });
  });
}



function compressFileToBlob(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 1000;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function triggerTelegramNotification(order) {
  let shouldSendPhoto = true;
  try {
    const [notifySnap, photoSnap] = await Promise.all([
      firebase.database().ref('telegram_config/notifyOnNewOrder').once('value'),
      firebase.database().ref('telegram_config/notifyWithPhoto').once('value')
    ]);
    if (notifySnap.exists() && notifySnap.val() === false) {
      console.log('Web notifications disabled by admin.');
      return;
    }
    if (photoSnap.exists()) {
      shouldSendPhoto = photoSnap.val();
    }
  } catch (e) {
    console.error('Could not check telegram_config:', e);
  }

  const tgMsg = typeof buildOrderTelegramMessage === 'function'
    ? buildOrderTelegramMessage(order)
    : `\u{1F916} <b>NUEVO PEDIDO \u2014 ${order.id}</b>\n\u{1F525} ${escapeHTML(order.productName)} (${escapeHTML(order.packageLabel)})\n\u{1F4B0} $${order.priceUsd} USD`;

  const keyboard = typeof buildOrderKeyboard === 'function'
    ? buildOrderKeyboard(order.id)
    : null;

  try {
    if (appState.selectedScreenshot && shouldSendPhoto) {
      const compressedBlob = await compressFileToBlob(appState.selectedScreenshot);
      const photoSent = await sendTelegramPhoto(compressedBlob, tgMsg, keyboard);
      if (!photoSent) {
        console.warn('Photo send failed, falling back to text-only');
        await sendTelegramMessage(tgMsg, keyboard);
      }
    } else {
      await sendTelegramMessage(tgMsg, keyboard);
    }
  } catch (e) {
    console.warn('Telegram notification error, sending text fallback:', e);
    try {
      await sendTelegramMessage(tgMsg, keyboard);
    } catch (e2) {
      console.warn('Telegram text fallback also failed:', e2);
    }
  }

  appState.selectedScreenshot = null;
}

// ── Real-Time Tracking Polling ──
let lastTrackingStatus = null;
setInterval(() => {
  if (appState.currentView === 'tracking' && appState.trackingOrderId) {
    const order = getOrderById(appState.trackingOrderId);
    if (order) {
      if (lastTrackingStatus === null) {
        lastTrackingStatus = order.status;
      } else if (lastTrackingStatus !== order.status) {
        // Status changed!
        lastTrackingStatus = order.status;
        renderApp();
        // Show a quick notification to the user
        const statusInfo = ORDER_STATUSES[order.status] || {};
        showToast(`¡Tu pedido se ha actualizado a: ${statusInfo.label || order.status}!`, 'success');
      }
    }
  } else {
    lastTrackingStatus = null;
  }
}, 3000); // Check every 3 seconds

// ── Verificador de ID ──
window.verifyGameId = async function (productId) {
  appState.verifiedPlayerName = null;
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product || !product.apiVerifierProvider) return;

  const resultDiv = document.getElementById('verify-result');
  const btnVerify = document.getElementById('btn-verify-id');

  if (typeof API_CONFIGS === 'undefined' || API_CONFIGS.length === 0) {
    resultDiv.innerHTML = '<span style="color: #ff5252;">❌ Error interno: Verificador inaccesible (Problema de permisos o sesión). Contacta a soporte.</span>';
    return;
  }

  const verifierIdx = parseInt(product.apiVerifierProvider);
  const api = API_CONFIGS[verifierIdx];
  if (!api || !api.enabled) {
    resultDiv.innerHTML = '<span style="color: #ff5252;">❌ Verificador inactivo o eliminado.</span>';
    return;
  }

  const uidInput = document.getElementById('game-uid');
  const zoneInput = document.getElementById('game-zone');

  if (!uidInput || !uidInput.value.trim()) {
    showToast('⚠️ Ingresa el ID del juego primero.', 'info');
    uidInput?.focus();
    return;
  }

  let id_juego = uidInput.value.trim();
  let input2 = zoneInput ? zoneInput.value.trim() : '';

  btnVerify.disabled = true;
  btnVerify.innerHTML = '<span class="tracking-spinner" style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-bottom-color:transparent; border-radius:50%; animation:spin 1s linear infinite;"></span> Verificando...';
  resultDiv.innerHTML = '';

  try {
    const proxyUrl = '/api/proxy';

    const requestBody = {
      action: 'verify_id',
      apiIdx: verifierIdx,
      data: {
        producto_id: parseInt(product.apiServiceId) || 0,
        id_juego: id_juego
      }
    };
    if (input2) requestBody.data.input2 = input2;

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    // Comprobar éxito (código 200 numérico o string, o si existe data.data)
    const isSuccess = data.ok || data.status == 200 || data.code == 200 || data.success || data.alerta === 'green' || data.mensaje === 'Consulta exitosa' || (data.data && typeof data.data === 'object' && !Array.isArray(data.data));

    if (isSuccess) {
      // Buscar el nombre en la raíz o dentro del objeto "data" (solo si es un objeto válido)
      const src = (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) ? data.data : data;

      // Probar múltiples campos. Ignoramos temporalmente los que tengan "@" (como los correos internos de NetEase)
      let name = src.nickname || src.nick_name || src.rolename || src.role_name || src.PlayerName || src.player_name || src.nombre || src.Name;

      if (!name) {
        // Si no encontró los primarios, intentar con estos
        const secondary = src.username || src.name || src.role || src.account;
        if (secondary && typeof secondary === 'string' && !secondary.includes('@')) {
          name = secondary;
        }
      }

      if (name && typeof name === 'string' && name.trim() !== '' && !name.includes('@')) {
        appState.verifiedPlayerName = name;
        resultDiv.innerHTML = `<span style="color: #0ea5e9;">✅ Nombre: <b>${escapeHTML(name)}</b></span>`;
      } else {
        // Fallback inteligente: buscar cualquier string que no sea un correo y tenga longitud de nombre
        let fallbackName = Object.values(src).find(v => typeof v === 'string' && v.length > 2 && v.length < 30 && v !== 'success' && v !== 'OK' && !v.includes('@'));

        if (fallbackName) {
          appState.verifiedPlayerName = fallbackName;
          resultDiv.innerHTML = `<span style="color: #0ea5e9;">✅ Nombre: <b>${escapeHTML(fallbackName)}</b></span>`;
        } else {
          // Imprimir un mini-resumen de los datos recibidos para que el usuario pueda decirnos qué llaves llegaron
          const availableKeys = Object.keys(src).filter(k => typeof src[k] === 'string' || typeof src[k] === 'number').map(k => `${k}: ${src[k]}`).join(', ');
          resultDiv.innerHTML = `<span style="color: #0ea5e9; font-size: 0.8rem;">✅ Encontrado: ${availableKeys.substring(0, 100)}...</span>`;
        }
      }
    } else {
      // Mostrar el error o el JSON crudo para depurar
      const errorMsg = data.error || data.msg || data.mensaje || data.message;
      if (errorMsg) {
        resultDiv.innerHTML = `<span style="color: #ff5252;">❌ Error: ${errorMsg}</span>`;
      } else {
        resultDiv.innerHTML = `<span style="color: #ff5252;">❌ ID Inválido. Respuesta API: ${JSON.stringify(data).substring(0, 60)}...</span>`;
      }
    }
  } catch (error) {
    console.error('Error verificando ID:', error);
    resultDiv.innerHTML = `<span style="color: #ff5252;">❌ Error de conexión al verificar el ID.</span>`;
  } finally {
    btnVerify.disabled = false;
    btnVerify.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg> Verificar ID';
  }
}

// ==========================================
// AUTHENTICATION & USER PROFILE
// ==========================================

let currentUser = null;
let userProfile = null;

function initPublicAuth() {
  if (!firebase || !firebase.auth) return;

  firebase.auth().onAuthStateChanged(async (user) => {
    currentUser = user;
    const authNavItem = document.getElementById('auth-nav-item');
    const mobileAuthBtn = document.querySelector('.mobile-auth-btn');

    // Si es el administrador, le mostramos el botón para ir al panel y un botón para salir
    if (user && user.email === 'admin@accesplay.com') {
      const adminHtml = `
            <div style="display:flex; gap:8px; align-items:center;">
              <a onclick="window.location.href='https://admin.accesplay.com/'" class="nav-cta" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); cursor:pointer; padding: 8px 16px;">Ir al Panel</a>
              <a onclick="firebase.auth().signOut().then(() => window.location.href='/')" class="nav-cta" style="background: rgba(239, 68, 68, 0.1); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.3); cursor:pointer; padding: 8px;" title="Cerrar sesión">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              </a>
            </div>
          `;
      if (authNavItem) authNavItem.innerHTML = adminHtml;
      if (mobileAuthBtn) mobileAuthBtn.innerHTML = adminHtml;
      return;
    }

    if (user) {
      // Fetch profile from DB
      firebase.database().ref('users/' + user.uid).on('value', (snapshot) => {
        userProfile = snapshot.val() || { wallet: 0 };

        if (userProfile.isBlocked) {
          firebase.auth().signOut();
          showToast('🚫 Tu cuenta ha sido suspendida. Contacta a soporte.', 'error');
          return;
        }

        const balanceHtml = `<a onclick="navigateTo('dashboard')" class="nav-cta" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); cursor:pointer; font-size: 0.85rem; padding: 6px 12px !important;">Mi Perfil ($${Number(userProfile.wallet || 0).toFixed(2)})</a>`;

        if (authNavItem) {
          authNavItem.innerHTML = `<a onclick="navigateTo('dashboard')" class="nav-cta" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); cursor:pointer;">Mi Perfil ($${Number(userProfile.wallet || 0).toFixed(2)})</a>`;
        }
        if (mobileAuthBtn) {
          mobileAuthBtn.innerHTML = balanceHtml;
        }
      });
    } else {
      userProfile = null;
      const loginHtmlDesktop = `<a onclick="showAuthModal()" class="nav-cta" style="background: linear-gradient(135deg, #4f46e5, #3b82f6); cursor:pointer;">Iniciar Sesión</a>`;
      const loginHtmlMobile = `<a onclick="showAuthModal()" class="nav-cta" style="background: linear-gradient(135deg, #4f46e5, #3b82f6); cursor:pointer; font-size: 0.85rem; padding: 6px 12px !important;">Iniciar Sesión</a>`;

      if (authNavItem) {
        authNavItem.innerHTML = loginHtmlDesktop;
      }
      if (mobileAuthBtn) {
        mobileAuthBtn.innerHTML = loginHtmlMobile;
      }
    }
  });
}

function showAuthModal(mode = 'login') {
  const existing = document.getElementById('auth-modal-container');
  const modalContainer = existing || document.createElement('div');
  modalContainer.id = 'auth-modal-container';

  const isLogin = mode === 'login';

  modalContainer.innerHTML = `
    <div class="modal-overlay active" onclick="if(event.target===this) this.parentElement.remove()" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 99999; display: flex; align-items: center; justify-content: center;">
      <div class="modal" style="background: var(--bg-surface); padding: 40px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); text-align: center; max-width: 400px; width: 90%;">
        <h2 style="margin-bottom: 20px; font-size: 1.8rem; color: white;">${isLogin ? 'Iniciar Sesión' : 'Regístrate'}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 30px; font-size: 0.95rem; line-height: 1.5;">
          ${isLogin ? 'Ingresa tus datos o usa Google para continuar.' : 'Crea tu cuenta para acceder a todos los beneficios.'}
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
          ${!isLogin ? `<input type="text" id="auth-name" placeholder="Nombre completo" class="admin-form-input" style="width: 100%; padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white;">` : ''}
          <input type="email" id="auth-email" placeholder="Correo electrónico" class="admin-form-input" style="width: 100%; padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white;">
          <input type="password" id="auth-pass" placeholder="Contraseña" class="admin-form-input" style="width: 100%; padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white;">
          ${isLogin ? `<div style="text-align: right; font-size: 0.85rem;"><a href="#" onclick="resetPassword(); return false;" style="color: var(--accent);">¿Olvidaste tu contraseña?</a></div>` : ''}
          <button onclick="${isLogin ? 'authWithEmail()' : 'registerWithEmail()'}" class="btn-primary" style="width: 100%; padding: 14px; border-radius: 12px; border: none; font-weight: bold; cursor: pointer; margin-top: 5px;">
            ${isLogin ? 'Ingresar' : 'Crear Cuenta'}
          </button>
        </div>

        <div style="display: flex; align-items: center; margin: 20px 0; color: var(--text-secondary); font-size: 0.9rem;">
          <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
          <span style="padding: 0 10px;">o</span>
          <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.1);"></div>
        </div>

        <button onclick="authWithGoogle()" class="btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; background: white; color: black; border: none; border-radius: 12px; padding: 14px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: transform 0.2s;">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="24"> Continuar con Google
        </button>
        
        <div style="margin-top: 25px; font-size: 0.9rem; color: var(--text-secondary);">
          ${isLogin ? '¿No tienes cuenta? <a href="#" onclick="showAuthModal(\'register\'); return false;" style="color: var(--accent);">Regístrate aquí</a>' : '¿Ya tienes cuenta? <a href="#" onclick="showAuthModal(\'login\'); return false;" style="color: var(--accent);">Inicia sesión</a>'}
        </div>
      </div>
    </div>`;

  if (!existing) {
    document.body.appendChild(modalContainer);
  }
}

function authWithEmail() {
  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-pass').value.trim();
  if (!email || !pass) return showToast('⚠️ Ingresa correo y contraseña');

  firebase.auth().signInWithEmailAndPassword(email, pass).then(result => {
    const modal = document.getElementById('auth-modal-container');
    if (modal) modal.remove();
  }).catch(err => {
    showToast('❌ Correo o contraseña incorrectos');
  });
}

function registerWithEmail() {
  const name = document.getElementById('auth-name').value.trim();
  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-pass').value.trim();
  if (!name || !email || !pass) return showToast('⚠️ Llena todos los campos');

  firebase.auth().createUserWithEmailAndPassword(email, pass).then(result => {
    const user = result.user;
    user.updateProfile({ displayName: name });

    const referredBy = localStorage.getItem('recargaaccessplay_referredBy') || null;
    firebase.database().ref('users/' + user.uid).set({
      email: email,
      name: name,
      wallet: 0,
      points: 0,
      totalSpent: 0,
      createdAt: Date.now(),
      referredBy: referredBy,
      hasMadeFirstPurchase: false
    });

    const modal = document.getElementById('auth-modal-container');
    if (modal) modal.remove();
    showToast('🎉 Cuenta creada exitosamente');
  }).catch(err => {
    if (err.code === 'auth/email-already-in-use') {
      showToast('❌ Este correo ya está registrado');
    } else if (err.code === 'auth/weak-password') {
      showToast('❌ La contraseña debe tener al menos 6 caracteres');
    } else {
      showToast('❌ Error: ' + err.message);
    }
  });
}

function resetPassword() {
  let email = document.getElementById('auth-email').value.trim();
  if (!email) {
    email = prompt('Por favor, ingresa el correo electrónico de tu cuenta para recuperar la contraseña:');
    if (!email) return;
    email = email.trim();
  }

  firebase.auth().sendPasswordResetEmail(email).then(() => {
    showToast('📩 Te hemos enviado un enlace para restablecer tu contraseña');
    const modal = document.getElementById('auth-modal-container');
    if (modal) modal.remove();
  }).catch(err => {
    console.error("Reset Password Error: ", err);
    showToast('❌ Error: Verifica que el correo esté registrado');
  });
}

function authWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).then((result) => {
    const modal = document.getElementById('auth-modal-container');
    if (modal) modal.remove();

    const user = result.user;
    if (user.email === 'admin@accesplay.com') return; // Admin bypass

    // Ensure user profile exists
    firebase.database().ref('users/' + user.uid).once('value', (snap) => {
      if (!snap.exists()) {
        const referredBy = localStorage.getItem('recargaaccessplay_referredBy') || null;
        firebase.database().ref('users/' + user.uid).set({
          email: user.email,
          name: user.displayName,
          wallet: 0,
          points: 0,
          totalSpent: 0,
          createdAt: Date.now(),
          referredBy: referredBy,
          hasMadeFirstPurchase: false
        });
      }
    });
  }).catch((error) => {
    alert('Error al iniciar sesión: ' + error.message);
  });
}

function showProfileModal() {
  const modalContainer = document.createElement('div');
  modalContainer.id = 'profile-modal-container';
  modalContainer.innerHTML = `
    <div class="modal-overlay active" onclick="if(event.target===this) this.parentElement.remove()">
      <div class="modal" style="max-width: 500px;">
        <h2 style="margin-bottom: 5px;">Mi Perfil</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">${currentUser.email}</p>
        
        <div style="background: var(--bg-card); padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center; border: 1px solid var(--border-color);">
          <div style="font-size: 0.9rem; color: var(--text-secondary);">Saldo Disponible (Monedero)</div>
          <div style="font-size: 2.5rem; font-weight: bold; color: #0ea5e9; margin-top: 10px;">$${userProfile?.wallet || 0}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
           <button class="btn-primary" style="width: 100%; margin-bottom: 10px;" onclick="loadUserHistory()">Ver Historial de Compras</button>
           <button class="btn-secondary" style="width: 100%;" onclick="startWalletRecharge()">Recargar Monedero</button>
        </div>

        <button onclick="logout()" class="btn-secondary" style="width: 100%; color: #ff5252; border-color: #ff5252;">Cerrar Sesión</button>
      </div>
    </div>`;
  document.body.appendChild(modalContainer);
}

function startWalletRecharge() {
  const modal = document.getElementById('profile-modal-container');
  if (modal) modal.remove();
  navigateTo('wallet-recharge');
}

async function loadUserHistory() {
  if (!currentUser) return;
  document.getElementById('profile-modal-container')?.remove();

  // Show a loading state
  appState.currentView = 'history';
  app.innerHTML = `
      <div class="bg-ocean-grid"></div>
      ${typeof renderNavbar === 'function' ? renderNavbar() : ''}
      <div class="app-container" style="text-align: center; margin-top: 50px;">
        <h2>Cargando tu historial...</h2>
      </div>
  `;

  try {
    const snap = await firebase.database().ref('users/' + currentUser.uid + '/orders').once('value');
    const orderIds = snap.val();

    if (!orderIds) {
      appState.historyContactStr = currentUser.email;
      app.innerHTML = `
        <div class="bg-ocean-grid"></div>
        ${typeof renderNavbar === 'function' ? renderNavbar() : ''}
        <div class="app-container">
          ${typeof renderOrderHistoryList === 'function' ? renderOrderHistoryList([], appState.historyContactStr) : ''}
        </div>
      `;
      return;
    }

    const fetchedOrders = [];
    const keys = Object.keys(orderIds);
    for (let id of keys) {
      const orderSnap = await firebase.database().ref('orders/' + id).once('value');
      if (orderSnap.exists()) {
        fetchedOrders.push(orderSnap.val());
      }
    }

    fetchedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    appState.historyContactStr = currentUser.email;

    app.innerHTML = `
      <div class="bg-ocean-grid"></div>
      ${typeof renderNavbar === 'function' ? renderNavbar() : ''}
      <div class="app-container">
        ${typeof renderOrderHistoryList === 'function' ? renderOrderHistoryList(fetchedOrders, appState.historyContactStr) : ''}
      </div>
    `;
  } catch (error) {
    alert("Error cargando historial: " + error.message);
    navigateTo('home');
  }
}

function logout() {
  firebase.auth().signOut().then(() => {
    const modal = document.getElementById('profile-modal-container');
    if (modal) modal.remove();
    // Navbar will automatically update via onAuthStateChanged
    window.location.reload();
  });
}

// Initialize auth when app loads
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initPublicAuth, 1000);
});




// ── Carousel Auto-Slide ──
let carouselInterval = null;
function initCarousel() {
  const carousel = document.getElementById('promo-carousel');
  if (!carousel) return;

  const cards = Array.from(carousel.querySelectorAll('.promo-card'));
  if (cards.length === 0) return;

  // Add active styling dynamically
  const updateActiveCard = () => {
    const center = carousel.scrollLeft + carousel.clientWidth / 2;
    cards.forEach(card => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(center - cardCenter);
      if (distance < card.clientWidth / 2) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  };

  carousel.addEventListener('scroll', updateActiveCard, { passive: true });

  // Start at the center banner (or the second one if even)
  setTimeout(() => {
    const middleIndex = Math.floor(cards.length / 2);
    const middleCard = cards[middleIndex];
    if (middleCard) {
      const targetScroll = middleCard.offsetLeft - carousel.clientWidth / 2 + middleCard.clientWidth / 2;
      carousel.scrollTo({ left: targetScroll, behavior: 'instant' });
    }
    updateActiveCard();
  }, 100);

  if (carouselInterval) clearInterval(carouselInterval);

  const autoScroll = () => {
    if (carousel.matches(':hover')) return;

    let currentIndex = 0;
    cards.forEach((c, i) => { if (c.classList.contains('active')) currentIndex = i; });

    if (currentIndex + 1 < cards.length) {
      const next = cards[currentIndex + 1];
      carousel.scrollTo({ left: next.offsetLeft - carousel.clientWidth / 2 + next.clientWidth / 2, behavior: 'smooth' });
    } else {
      carousel.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  carouselInterval = setInterval(autoScroll, 3000);

  const resetInterval = () => {
    clearInterval(carouselInterval);
    carouselInterval = setInterval(autoScroll, 3000);
  };

  carousel.addEventListener('pointerdown', resetInterval);
  carousel.addEventListener('touchstart', resetInterval, { passive: true });
}
// ── Catalog Carousel Controls ──
function scrollCatalogCarousel(direction) {
  const carousel = document.getElementById('products-grid');
  if (!carousel) return;
  
  // Calculate scroll amount based on card width + gap
  const cardWidth = carousel.querySelector('.game-card')?.offsetWidth || 260;
  const gap = 20;
  const scrollAmount = (cardWidth + gap) * 2 * direction; // scroll 2 cards at a time
  
  carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

function initCatalogCarousel() {
  const carousel = document.getElementById('products-grid');
  const indicatorContainer = document.getElementById('carousel-scroll-indicator');
  const btnLeft = document.getElementById('catalog-nav-left');
  const btnRight = document.getElementById('catalog-nav-right');
  
  if (!carousel || !indicatorContainer) return;
  
  const cards = carousel.querySelectorAll('.game-card');
  if (cards.length === 0) return;

  // Clear existing indicators
  indicatorContainer.innerHTML = '';
  
  // Create indicators based on total width
  const updateIndicators = () => {
    const totalWidth = carousel.scrollWidth - carousel.clientWidth;
    if (totalWidth <= 0) {
      indicatorContainer.style.display = 'none';
      if (btnLeft) btnLeft.classList.add('hidden');
      if (btnRight) btnRight.classList.add('hidden');
      return;
    }
    
    indicatorContainer.style.display = 'flex';
    
    // Manage buttons visibility
    if (btnLeft) {
      if (carousel.scrollLeft <= 10) btnLeft.classList.add('hidden');
      else btnLeft.classList.remove('hidden');
    }
    if (btnRight) {
      if (carousel.scrollLeft >= totalWidth - 10) btnRight.classList.add('hidden');
      else btnRight.classList.remove('hidden');
    }

    // Determine how many dots to show (max 5 for UX)
    const numDots = Math.min(Math.ceil(carousel.scrollWidth / carousel.clientWidth), 5);
    
    if (indicatorContainer.children.length !== numDots) {
      indicatorContainer.innerHTML = '';
      for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.onclick = () => {
          const scrollPos = (totalWidth / (numDots - 1 || 1)) * i;
          carousel.scrollTo({ left: scrollPos, behavior: 'smooth' });
        };
        indicatorContainer.appendChild(dot);
      }
    } else {
      // Update active dot
      const scrollPercent = carousel.scrollLeft / totalWidth;
      const activeIndex = Math.round(scrollPercent * (numDots - 1));
      
      Array.from(indicatorContainer.children).forEach((dot, index) => {
        if (index === activeIndex) dot.classList.add('active');
        else dot.classList.remove('active');
      });
    }
  };

  carousel.addEventListener('scroll', updateIndicators, { passive: true });
  window.addEventListener('resize', updateIndicators);
  
  // Initial check
  updateIndicators();
}

function initTournamentAlert() {
  if (window.location.pathname.includes('torneos')) return;
  if (sessionStorage.getItem('accesplay_tournament_alert_shown')) return;

  setTimeout(() => {
    firebase.database().ref('tournaments').orderByChild('status').equalTo('registration_open').once('value', snap => {
      if (snap.exists()) {
        const tList = [];
        snap.forEach(child => { tList.push(child.val()); });
        if (tList.length > 0) {
          const t = tList[tList.length - 1]; // Get one of them
          
          sessionStorage.setItem('accesplay_tournament_alert_shown', 'true');
          
          const alertEl = document.createElement('div');
          alertEl.className = 'tournament-floating-alert';
          
          // Swipe up to dismiss for mobile
          let startY = 0;
          let startX = 0;
          alertEl.addEventListener('touchstart', e => {
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
          }, {passive: true});
          
          alertEl.addEventListener('touchmove', e => {
            if (!startY) return;
            const yDiff = startY - e.touches[0].clientY;
            const xDiff = startX - e.touches[0].clientX;
            // Swipe Up or Left/Right
            if (yDiff > 30 || Math.abs(xDiff) > 50) {
              alertEl.classList.add('hiding');
              setTimeout(() => alertEl.remove(), 300);
            }
          }, {passive: true});

          alertEl.innerHTML = `
            <div class="tournament-alert-icon">🏆</div>
            <div class="tournament-alert-content">
              <strong>¡Torneo Disponible!</strong>
              <p>Inscríbete ahora en el torneo de <strong>${t.gameTitle || 'juego'}</strong>. ¡Demuestra tu habilidad!</p>
            </div>
            <button class="tournament-alert-close" onclick="this.parentElement.classList.add('hiding'); setTimeout(() => this.parentElement.remove(), 300); event.stopPropagation();">✕</button>
          `;
          alertEl.onclick = () => {
             window.location.href = '/torneos.html';
          };

          document.body.appendChild(alertEl);

          // Auto-hide after 15s if not clicked
          setTimeout(() => {
            if (document.body.contains(alertEl)) {
               alertEl.classList.add('hiding');
               setTimeout(() => alertEl.remove(), 300);
            }
          }, 15000);
        }
      }
    }).catch(console.error);
  }, 5000);
}
