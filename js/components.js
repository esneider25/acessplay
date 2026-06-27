// ============================================================
// AccessPlay — Dynamic Components (Redesigned + Orders)
// ============================================================

function renderNavbar() {
  return `
    <nav class="navbar" id="navbar">
      <div class="navbar-inner">
        <div class="logo" onclick="navigateTo('home')">
          <img src="img/logo.png" alt="AccessPlay" style="height: 45px; width: auto; object-fit: contain;">
        </div>
        <ul class="nav-links" id="nav-links">
          <li><a onclick="navigateTo('home')" class="active" data-section="home">Inicio</a></li>
          <li><a onclick="scrollToSection('catalog')" data-section="catalog">Catálogo</a></li>
          <li><a onclick="scrollToSection('how-it-works')" data-section="how-it-works">¿Cómo Funciona?</a></li>
          <li><a onclick="scrollToSection('features')" data-section="features">Ventajas</a></li>
          <li><a onclick="navigateTo('lookup')" data-section="lookup">🔍 Mis Pedidos</a></li>
          <li id="auth-nav-item">
            ${(typeof currentUser !== 'undefined' && currentUser) 
              ? `<a onclick="navigateTo('dashboard')" class="nav-cta" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); cursor:pointer;">Mi Perfil ($${Number((typeof userProfile !== 'undefined' && userProfile && userProfile.wallet) ? userProfile.wallet : 0).toFixed(2)})</a>`
              : `<a onclick="showAuthModal()" class="nav-cta" style="background: linear-gradient(135deg, #4f46e5, #3b82f6); cursor:pointer;">Iniciar Sesión</a>`
            }
          </li>
          <li><a class="nav-cta" onclick="scrollToSection('catalog')">Recargar 🎮</a></li>
          <li id="pwa-nav-item"><a id="pwa-install-app-btn" onclick="window.handleStoreInstallClick()" class="nav-cta" style="background: linear-gradient(135deg, #10b981, #059669); cursor:pointer; color: white;">📲 Instalar App</a></li>
          <li><a class="theme-toggle-btn" onclick="toggleTheme()" style="cursor:pointer; font-size: 1.2rem;" title="Cambiar Tema">🌓</a></li>
        </ul>
        <button class="mobile-toggle" onclick="toggleMobileMenu()" aria-label="Menu" style="background: var(--bg-surface); border: 1px solid var(--border); padding: 8px 16px; border-radius: 20px; color: var(--text-primary); font-family: var(--font-primary); font-weight: 600; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center; gap: 8px;">Menú Principal <span style="font-size: 0.9rem;">▼</span></div>
        </button>
      </div>
    </nav>
  `;
}

function renderHero() {
  return `
    <section class="hero" id="hero">
      <div class="container">
        <div class="hero-badge">
          <span class="pulse-dot"></span>
          Plataforma activa 24/7
        </div>
        <h1>
          Tu tienda digital<br>
          <span class="gradient-text">todo en un solo lugar</span>
        </h1>
        <p class="hero-subtitle">
          Recargas de videojuegos, gift cards, streaming y billeteras digitales.
          Pagos con Pago Móvil, transferencia bancaria y Binance.
        </p>
        <div class="hero-cta-group">
          <button class="hero-btn-primary" onclick="scrollToSection('catalog')">
            Explorar Catálogo
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button class="hero-btn-secondary" onclick="scrollToSection('how-it-works')">
            ¿Cómo Funciona?
          </button>
        </div>
        <div class="hero-stats">
          ${(typeof LANDING_CONFIG !== 'undefined' && LANDING_CONFIG.heroStats ? LANDING_CONFIG.heroStats : [
            { value: '15000', label: 'Recargas realizadas' },
            { value: '3200', label: 'Clientes satisfechos' },
            { value: PRODUCTS.length.toString(), label: 'Productos disponibles' },
            { value: CATEGORIES.length.toString(), label: 'Categorías' }
          ]).map(stat => `
          <div class="hero-stat">
            <div class="hero-stat-value" data-counter="${stat.value.replace(/[^0-9]/g, '') || 0}">0</div>
            <div class="hero-stat-label">${stat.label}</div>
          </div>
          `).join('')}
        </div>
      </div>
      <div class="hero-gradient-orb hero-orb-1"></div>
      <div class="hero-gradient-orb hero-orb-2"></div>
      <div class="hero-gradient-orb hero-orb-3"></div>
    </section>
  `;
}

function renderPromoCarousel() {
  if (typeof BANNERS === 'undefined' || !BANNERS || BANNERS.length === 0) return '';

  const cards = BANNERS.map(b => {
    const hasImg = !!b.imageUrl;
    const bgStyle = hasImg 
      ? `background: ${b.bgGradient || 'var(--bg-surface)'};`
      : `background: ${b.bgGradient || 'linear-gradient(135deg, #111827, #1f2937)'};`;
      
    const btnAction = b.btnLink && b.btnLink.startsWith('product:') 
      ? `navigateTo('product', '${b.btnLink.split(':')[1]}')` 
      : `scrollToSection('${b.btnLink || 'catalog'}')`;

    return `
      <div class="promo-card" style="${bgStyle} cursor: pointer;" onclick="${btnAction}">
        ${hasImg ? `
          <div style="position: absolute; inset: -20px; background: url('${b.imageUrl}') center/cover; filter: blur(15px); opacity: 0.6; z-index: 0;"></div>
          <div style="position: absolute; inset: 0; background: url('${b.imageUrl}') center/contain no-repeat; z-index: 1;"></div>
          <div style="position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%); z-index: 2;"></div>
        ` : `
          <div style="position: absolute; top: -20px; right: -20px; font-size: 8rem; opacity: 0.05; z-index: 0;">${b.icon || '✨'}</div>
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); z-index: 1;"></div>
        `}
        <div style="position: relative; z-index: 3; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; width: 100%; max-width: ${hasImg ? '65%' : '100%'};">
          <div>
            ${b.badge ? `<div style="background: ${b.badgeColor ? b.badgeColor+'e6' : 'rgba(0, 229, 195, 0.9)'}; color: #000; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; display: inline-block; margin-bottom: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${b.badge}</div>` : ''}
            ${(!hasImg || b.title) ? `<h3 style="color: white; font-size: clamp(1.2rem, 3vw, 1.8rem); margin-bottom: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${b.title}</h3>` : ''}
            ${(!hasImg || b.desc) ? `<p style="color: rgba(255,255,255,0.9); font-size: clamp(0.85rem, 2vw, 1rem); margin-bottom: 15px; text-shadow: 0 1px 3px rgba(0,0,0,0.8); line-height: 1.4;">${b.desc}</p>` : ''}
            <div style="margin-top: 5px;">
              <button style="background: ${b.btnColor || 'var(--accent)'}; color: ${b.btnTextColor || 'var(--bg-deep)'}; border: none; padding: 10px 24px; border-radius: 30px; font-weight: bold; pointer-events: none; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: inline-block;">${b.btnText || 'Ver Más'}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <section class="promo-section" style="padding: 30px 0 50px 0; overflow: hidden; position: relative; width: 100%;">
      <div class="promo-carousel" id="promo-carousel">
        ${cards}
      </div>
      <style>
        .promo-carousel {
          display: flex;
          gap: 15px;
          overflow-x: auto;
          padding-bottom: 20px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          scroll-behavior: smooth;
          --card-width: 88vw;
          padding: 0 calc(50vw - (var(--card-width) / 2));
        }
        @media (min-width: 768px) {
          .promo-carousel {
            --card-width: 75vw;
            gap: 24px;
          }
        }
        @media (min-width: 1200px) {
          .promo-carousel {
            --card-width: 900px;
          }
        }
        .promo-carousel::-webkit-scrollbar { display: none; }
        
        .promo-card {
          flex: 0 0 var(--card-width);
          width: var(--card-width);
          aspect-ratio: 16 / 9; /* Adjusted for better height on mobile */
          min-height: 160px;
          max-height: 360px;
          border-radius: 16px;
          scroll-snap-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 15px 35px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.08);
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), filter 0.4s ease, opacity 0.4s ease;
          padding: 16px; /* Reduced padding on mobile */
          transform: scale(0.92);
          filter: brightness(0.4) grayscale(0.2);
          opacity: 0.8;
        }
        .promo-card.active {
          transform: scale(1);
          filter: brightness(1) grayscale(0);
          opacity: 1;
        }
        @media (min-width: 768px) {
          .promo-card { 
            border-radius: 24px; 
            padding: 40px; 
            aspect-ratio: 21 / 9; /* Restore wide aspect ratio on desktop */
          }
        }
        @media (min-width: 1200px) {
          /* Inherits max-height and aspect-ratio */
        }
        
        .promo-card:hover { 
          transform: translateY(-5px) scale(1.01); 
        }
        .light-theme .promo-card { border: 1px solid rgba(0,0,0,0.1) !important; }
      </style>
    </section>
  `;
}

function renderHowItWorks() {
  return `
    <section class="how-it-works" id="how-it-works">
      <div class="container">
        <div class="section-header">
          <h2>¿Cómo <span class="gradient-text">Funciona</span>?</h2>
          <p>Tres simples pasos para recargar</p>
        </div>
        <div class="steps-grid">
          ${(() => {
            const steps = (typeof LANDING_CONFIG !== 'undefined' && LANDING_CONFIG.howItWorks) ? LANDING_CONFIG.howItWorks : [
              { title: 'Elige tu Producto', desc: 'Selecciona el juego, gift card, streaming o billetera que deseas recargar y elige el paquete.', icon: '🎯' },
              { title: 'Realiza el Pago', desc: 'Paga con Pago Móvil, transferencia bancaria o Binance Pay. Envía el comprobante.', icon: '💳' },
              { title: 'Recibe tu Recarga', desc: 'Verificamos tu pago y procesamos la recarga. ¡Listo en minutos!', icon: '🚀' }
            ];
            return steps.map((step, idx) => `
              <div class="step-card fade-in-up stagger-${idx + 1}">
                <div class="step-number">${idx + 1}</div>
                <div class="step-icon">${step.icon}</div>
                <h3>${step.title}</h3>
                <p>${step.desc}</p>
              </div>
              ${idx < steps.length - 1 ? `
              <div class="step-connector">
                <svg width="40" height="2" viewBox="0 0 40 2"><line x1="0" y1="1" x2="40" y2="1" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4 4"/></svg>
              </div>` : ''}
            `).join('');
          })()}
        </div>
      </div>
    </section>
  `;
}

function renderCatalogSection(activeCategory) {
  const catId = activeCategory || 'todos';
  let products = catId === 'todos' ? PRODUCTS.slice() : getProductsByCategory(catId).slice();
  products.sort((a, b) => (a.position || 999) - (b.position || 999));

  const categoryPills = `
    <div class="category-pills" id="category-pills">
      <button class="cat-pill ${catId === 'todos' ? 'active' : ''}" onclick="filterCategory('todos')">
        <span>🌐</span> Todos
      </button>
      ${CATEGORIES.map(cat => `
        <button class="cat-pill ${catId === cat.id ? 'active' : ''}" onclick="filterCategory('${cat.id}')" style="--pill-color: ${cat.color}">
          <span>${cat.icon}</span> ${cat.name}
        </button>
      `).join('')}
    </div>
  `;

  const cards = products.map((product, i) => renderProductCard(product, i)).join('');

  return `
    <section class="catalog-section" id="catalog">
      <div class="container">
        <div class="section-header">
          <h2>🛍️ Nuestro Catálogo</h2>
          <p>Explora por categoría y selecciona tu producto favorito</p>
        </div>
        
        <div class="catalog-search-container" style="max-width: 600px; margin: 0 auto 30px auto; position: relative;">
          <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; opacity: 0.5;">🔍</span>
          <input type="text" id="catalog-search" oninput="handleProductSearch(this.value)" placeholder="Buscar juegos, tarjetas o servicios..." autocomplete="off" style="width: 100%; padding: 16px 16px 16px 48px; border-radius: 30px; border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-primary); font-size: 1rem; outline: none; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        </div>

        ${categoryPills}
        <div class="products-grid" id="products-grid">
          ${cards.length > 0 ? cards : '<div class="empty-catalog"><p>No hay productos en esta categoría.</p></div>'}
        </div>
      </div>
    </section>
  `;
}

function renderProductCard(product, index) {
  const category = getCategoryById(product.category);
  const productType = product.type || 'game-id';
  const typeBadges = { 'account': '🔐', 'code': '🎫', 'game-id': '' };

  let badge = '';
  if (product.isOutofStock) badge = '<span class="game-card-badge" style="background: rgba(239, 83, 80, 0.9); color: white;">⛔ Agotado</span>';
  else if (product.popular) badge = '<span class="game-card-badge badge-popular">🔥 Popular</span>';
  else if (product.isNew) badge = '<span class="game-card-badge badge-new">✨ Nuevo</span>';
  const minPrice = Math.min(...product.packages.map(p => p.priceUsd));
  const maxPrice = Math.max(...product.packages.map(p => p.priceUsd));

  const bannerContent = product.imageUrl
    ? `<img src="${product.imageUrl}" alt="${product.name}" loading="lazy">`
    : `<span class="product-card-emoji">${product.currencyIcon}</span>`;

  return `
    <div class="game-card fade-in-up stagger-${(index % 7) + 1}"
         style="--game-color: ${product.color}; --game-gradient: ${product.colorGradient}; ${product.isOutofStock ? 'opacity: 0.7; filter: grayscale(0.6);' : ''}"
         onclick="navigateTo('product', '${product.id}')"
         id="card-${product.id}">
      <div class="game-card-banner" style="background: ${product.colorGradient};">
        ${badge}
        ${bannerContent}
        <div class="game-card-banner-overlay"></div>
      </div>
      <div class="game-card-body">
        ${category ? `<div class="product-category-tag" style="--cat-color: ${category.color}">${category.icon} ${category.name}</div>` : ''}
        <div class="game-card-title">${typeBadges[productType] || ''} ${product.name}</div>
        <div class="game-card-currency">
          ${product.currencyIcon} ${product.currency}
        </div>
        <div class="game-card-price-range">
          <span class="price">$${minPrice.toFixed(2)} — $${maxPrice.toFixed(2)}</span>
          <span class="game-card-arrow">→</span>
        </div>
      </div>
    </div>
  `;
}

function renderProductDetail(productId) {
  const product = PRODUCTS.find(g => g.id === productId);
  if (!product) return '<p>Producto no encontrado.</p>';
  const category = getCategoryById(product.category);
  const productType = product.type || 'game-id';

  const productIcon = product.imageUrl
    ? `<img src="${product.imageUrl}" alt="${product.name}" class="game-detail-icon">`
    : `<div style="width:64px;height:64px;border-radius:14px;background:${product.colorGradient};display:flex;align-items:center;justify-content:center;font-size:1.8rem;">${product.currencyIcon}</div>`;

  let packages = '';
  if (product.isOutofStock) {
    packages = '<div style="padding: 20px; background: rgba(239, 83, 80, 0.1); color: #ef5350; border: 1px solid rgba(239, 83, 80, 0.3); border-radius: 8px; text-align: center; width: 100%; margin-top: 15px;">Este producto se encuentra <b>agotado</b> por el momento.<br>Por favor, intenta más tarde.</div>';
  } else {
    packages = product.packages.map((pkg, i) => {
      if (pkg.isOutofStock) {
        return `
          <div class="package-card fade-in-up stagger-${(i % 7) + 1}"
               style="opacity: 0.5; filter: grayscale(1); cursor: not-allowed; position: relative;"
               onclick="showToast('⚠️ Este paquete está agotado por el momento.')"
               id="pkg-${product.id}-${i}">
            <div style="position: absolute; top: -10px; right: -10px; background: #ef5350; color: white; font-size: 0.65rem; padding: 2px 8px; border-radius: 10px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 2;">Agotado</div>
            <div class="package-amount">${pkg.amount.toLocaleString()}</div>
            <div class="package-label">${product.currency}</div>
            <div class="package-price-bs">Bs. ${formatBs(usdToBs(pkg.priceUsd))}</div>
          </div>
        `;
      }
      return `
        <div class="package-card fade-in-up stagger-${(i % 7) + 1}"
             onclick="selectPackage('${product.id}', ${i})"
             id="pkg-${product.id}-${i}">
          <div class="package-amount">${pkg.amount.toLocaleString()}</div>
          <div class="package-label">${product.currency}</div>
          <div class="package-price-bs">Bs. ${formatBs(usdToBs(pkg.priceUsd))}</div>
        </div>
      `;
    }).join('');
  }

  // Saved IDs handling
  let savedIdsHtml = '';
  if (typeof currentUser !== 'undefined' && currentUser && typeof userProfile !== 'undefined' && userProfile && userProfile.savedIds && userProfile.savedIds.length > 0) {
    const relevantIds = userProfile.savedIds.filter(id => id.gameName && id.gameName.toLowerCase().includes(product.name.toLowerCase()));
    
    // If no exact match, show all saved IDs as a fallback
    const idsToShow = relevantIds.length > 0 ? relevantIds : userProfile.savedIds;
    
    savedIdsHtml = `
      <div style="margin-bottom: 20px; padding: 16px; background: rgba(14, 165, 233, 0.05); border: 1px solid rgba(14, 165, 233, 0.2); border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <div style="font-size: 0.9rem; color: #38bdf8; margin-bottom: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <i class="ph-fill ph-magic-wand"></i> Autocompletar con tus cuentas guardadas
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${idsToShow.map(id => `
            <button type="button" 
                    onclick="fillSavedId('${id.uid}', '${id.zoneId || ''}')"
                    style="background: linear-gradient(145deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.8)); border: 1px solid rgba(56, 189, 248, 0.3); color: #f8fafc; padding: 10px 14px; border-radius: 10px; cursor: pointer; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"
                    onmouseover="this.style.borderColor='#38bdf8'; this.style.boxShadow='0 4px 12px rgba(56,189,248,0.2)'; this.style.transform='translateY(-1px)';"
                    onmouseout="this.style.borderColor='rgba(56, 189, 248, 0.3)'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.2)'; this.style.transform='translateY(0)';">
              <span style="font-size: 0.70rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">${id.gameName}</span>
              ${id.alias ? `<span style="font-size: 0.85rem; color: #e2e8f0; font-weight: 600;">${id.alias}</span>` : ''}
              <span style="font-size: 1.05rem; font-weight: 700; letter-spacing: 0.5px; color: #38bdf8;">${id.uid}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Dynamic input fields based on product type
  let typeFieldsHtml = savedIdsHtml;
  if (productType === 'game-id') {
    let verifierHtml = '';
    if (product.apiVerifierProvider) {
      verifierHtml = `
        <div style="margin-top: 10px;">
          <button type="button" class="btn-secondary" onclick="verifyGameId('${product.id}')" id="btn-verify-id" style="width: 100%; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Verificar ID
          </button>
          <div id="verify-result" style="margin-top: 8px; font-weight: bold; text-align: center; font-size: 0.95rem; min-height: 20px;"></div>
        </div>
      `;
    }
    let uidInputHtml = `<input type="text" class="form-input" id="game-uid" placeholder="Ingresa tu ID del juego" autocomplete="off">`;
    if (typeof userProfile !== 'undefined' && userProfile && userProfile.role === 'revendedor') {
      uidInputHtml = `
        <textarea class="form-input" id="game-uid" placeholder="Múltiples IDs: sepáralas por comas o saltos de línea (Max 10)" style="height:80px; resize:vertical; font-family: monospace;"></textarea>
        <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:5px;">🌟 Revendedor: Se creará un pedido por cada ID ingresado (se multiplicará el costo).</div>
      `;
    }
    
    typeFieldsHtml = savedIdsHtml + `
      <div class="form-group">
        <label for="game-uid">🎮 ID del juego</label>
        ${uidInputHtml}
        ${verifierHtml}
      </div>
    `;
  } else if (productType === 'game-id-zone') {
    let verifierHtml = '';
    if (product.apiVerifierProvider) {
      verifierHtml = `
        <div style="grid-column: 1 / -1; margin-top: 5px;">
          <button type="button" class="btn-secondary" onclick="verifyGameId('${product.id}')" id="btn-verify-id" style="width: 100%; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Verificar ID + Zona
          </button>
          <div id="verify-result" style="margin-top: 8px; font-weight: bold; text-align: center; font-size: 0.95rem; min-height: 20px;"></div>
        </div>
      `;
    }
    typeFieldsHtml = savedIdsHtml + `
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
        <div class="form-group">
          <label for="game-uid">🎮 Player ID</label>
          <input type="text" class="form-input" id="game-uid"
                 placeholder="Ej. 12345678" autocomplete="off">
        </div>
        <div class="form-group">
          <label for="game-zone">🌐 Zone ID</label>
          <input type="text" class="form-input" id="game-zone"
                 placeholder="Ej. 1234" autocomplete="off">
        </div>
        ${verifierHtml}
      </div>
    `;
  } else if (productType === 'account') {
    typeFieldsHtml = savedIdsHtml + `
      <div class="form-section-label">🔐 Datos de la Cuenta (Recarga Interna)</div>
      <div class="form-group">
        <label for="account-email">📧 Correo o usuario de la cuenta</label>
        <input type="text" class="form-input" id="account-email"
               placeholder="tu-correo@ejemplo.com" autocomplete="off">
      </div>
      <div class="form-group">
        <label for="account-password">🔒 Contraseña de la cuenta</label>
        <div class="password-input-wrapper">
          <input type="password" class="form-input" id="account-password"
                 placeholder="Contraseña" autocomplete="new-password">
          <button type="button" class="password-toggle" onclick="togglePasswordVisibility()" title="Mostrar/ocultar">
            <svg id="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <div class="form-hint">🛡️ Tus credenciales solo se usan para realizar la recarga. No almacenamos contraseñas.</div>
      </div>
    `;
  }
  // For 'code' type: no extra fields (just contact below)

  // Product type badge
  const typeLabels = {
    'game-id': { text: '🎮 Recarga por ID', color: '#42a5f5' },
    'game-id-zone': { text: '🎮 Recarga por ID + Zona', color: '#42a5f5' },
    'account': { text: '🔐 Recarga Interna', color: '#e040fb' },
    'code': { text: '🎫 Entrega por Código', color: '#0ea5e9' }
  };
  const typeInfo = typeLabels[productType] || typeLabels['game-id'];

  return `
    <section class="game-detail" id="game-detail">
      <button class="game-detail-back" onclick="navigateTo('home')">← Volver al catálogo</button>
      <div class="game-detail-header">
        ${productIcon}
        <div>
          ${category ? `<div class="product-category-tag" style="--cat-color: ${category.color}">${category.icon} ${category.name}</div>` : ''}
          <h2>${product.name}</h2>
          <p class="game-detail-desc">${product.description}</p>
          <div class="product-type-badge" style="--type-color: ${typeInfo.color}">${typeInfo.text}</div>
        </div>
      </div>
      <div class="packages-title" style="margin-top: 20px;">Selecciona un paquete</div>
      <div class="packages-grid" id="packages-grid">
        ${packages}
      </div>
      <div class="order-form" id="order-form" style="display:none;">
        <h3>📝 Datos del Pedido</h3>
        ${typeFieldsHtml}
        ${(typeof currentUser !== 'undefined' && currentUser) ? `
          <input type="hidden" id="customer-contact" value="${currentUser.email || currentUser.displayName || ''}">
        ` : `
        ${(typeof currentUser !== 'undefined' && currentUser) ? '' : `
        <div class="form-group">
          <label for="customer-contact">📱 Teléfono o correo de contacto</label>
          <input type="text" class="form-input" id="customer-contact"
                 placeholder="Ej: +58 412-1234567 o tu-correo@gmail.com" autocomplete="off">
          <div class="form-hint">Te contactaremos para notificarte sobre tu pedido</div>
        </div>
        `}
        `}
        <div class="form-group" style="margin-top: 15px; margin-bottom: 25px;">
          <label for="discount-input">🏷️ Código de Descuento (Opcional)</label>
          <div style="display: flex; gap: 10px; align-items: stretch;">
            <input type="text" class="form-input" id="discount-input" placeholder="INGRESA TU CÓDIGO" style="text-transform: uppercase; flex: 1; width: 100%;" autocomplete="off">
            <button class="btn-primary" type="button" onclick="applyDiscount()" style="width: auto; padding: 0 20px; flex-shrink: 0; min-height: 48px; margin: 0;">Aplicar</button>
          </div>
        </div>
        <div class="form-group">
          <label>Método de pago</label>
          <div class="payment-methods" id="payment-methods">
            ${PAYMENT_METHODS.map(pm => `
              <div class="payment-option" onclick="selectPayment('${pm.id}')" id="pay-${pm.id}">
                <div class="payment-option-icon">${pm.icon}</div>
                <div class="payment-option-name">${pm.name}</div>
              </div>
            `).join('')}
            ${(typeof currentUser !== 'undefined' && currentUser && typeof userProfile !== 'undefined' && userProfile && userProfile.wallet > 0) ? `
              <div class="payment-option" onclick="selectPayment('wallet')" id="pay-wallet" style="border-color: #0ea5e9;">
                <div class="payment-option-icon">💰</div>
                <div class="payment-option-name" style="color: #0ea5e9;">Monedero ($${userProfile.wallet.toFixed(2)})</div>
              </div>
            ` : ''}
          </div>
        </div>
        <div id="payment-details-container"></div>
        <div class="order-summary" id="order-summary" style="margin-top: 20px; margin-bottom: 20px;"></div>
        <div id="screenshot-group" class="form-group" style="display:none;">
          <label>📸 Captura del comprobante de pago</label>
          <div class="screenshot-upload" id="screenshot-upload" onclick="document.getElementById('payment-screenshot').click()">
            <input type="file" id="payment-screenshot" accept="image/*" style="display:none;" onchange="previewScreenshot(this)">
            <div class="screenshot-preview" id="screenshot-preview">
              <div class="screenshot-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                <span>Toca para subir captura</span>
                <span class="screenshot-hint">JPG, PNG — Máx 5MB</span>
              </div>
            </div>
          </div>
          <div class="form-hint">📷 Sube la captura de tu pago para agilizar el proceso</div>
        </div>
        <button class="btn-primary" id="btn-submit" onclick="submitOrder()" disabled>
          🤖 Confirmar Pedido
        </button>
      </div>
    </section>
  `;
}

function renderPaymentDetails(methodId) {
  const method = PAYMENT_METHODS.find(m => m.id === methodId);
  if (!method) return '';
  const rows = Object.entries(method.details).map(([key, val]) => `
    <div class="payment-detail-row">
      <span class="label">${formatDetailLabel(key)}</span>
      <span class="value">
        ${val}
        <button class="copy-btn" onclick="copyToClipboard('${val}')" title="Copiar">📋</button>
      </span>
    </div>
  `).join('');
  return `
    <div class="payment-details-box fade-in-up">
      <h4>${method.icon} Datos de ${method.name}</h4>
      ${rows}
    </div>
  `;
}

function formatDetailLabel(key) {
  const labels = {
    banco: 'Banco', telefono: 'Teléfono', cedula: 'Cédula',
    rif: 'RIF', cuenta: 'Nro. Cuenta', titular: 'Titular',
    binanceId: 'Binance ID', red: 'Red', wallet: 'Wallet', nota: 'Nota'
  };
  return labels[key] || key;
}

function renderOrderSummary(product, pkg, method, discount = null) {
  let originalPriceUsd = pkg.priceUsd;
  let finalUsd = pkg.priceUsd;

  if (typeof userProfile !== 'undefined' && userProfile && userProfile.role === 'revendedor' && userProfile.discountPercentage > 0 && product.id !== 'wallet-recharge') {
    if (pkg.costUsd && pkg.costUsd > 0) {
      finalUsd = pkg.costUsd + (pkg.costUsd * (userProfile.discountPercentage / 100));
      originalPriceUsd = finalUsd;
    }
  }

  let discountHtml = '';
  const displayCurrency = method.currency || 'bs';

  if (discount) {
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = finalUsd * (discount.value / 100);
    } else if (discount.type === 'fixed') {
      discountAmount = Math.min(finalUsd, discount.value);
    }

    finalUsd = Math.max(0, finalUsd - discountAmount);

    if (displayCurrency === 'usd') {
      discountHtml = `
        <div class="order-summary-row" style="color: var(--primary);">
          <span>Cupón (${discount.code})</span>
          <span>-$${discountAmount.toFixed(2)} USD</span>
        </div>
      `;
    } else {
      discountHtml = `
        <div class="order-summary-row" style="color: var(--primary);">
          <span>Cupón (${discount.code})</span>
          <span>- Bs. ${formatBs(usdToBs(discountAmount))}</span>
        </div>
      `;
    }
  }

  const bs = usdToBs(finalUsd);

  let basePriceHtml = '';
  let totalHtml = '';

  if (displayCurrency === 'usd') {
    basePriceHtml = `
      <div class="order-summary-row">
        <span>Precio base</span>
        <span>$${originalPriceUsd.toFixed(2)} USD</span>
      </div>
    `;
    totalHtml = `
      <div class="order-summary-row total" style="color: #0ea5e9;">
        <span>Total a pagar (USD)</span>
        <span>$${finalUsd.toFixed(2)} USD</span>
      </div>
    `;
  } else {
    basePriceHtml = `
      <div class="order-summary-row">
        <span>Precio base</span>
        <span>Bs. ${formatBs(usdToBs(originalPriceUsd))}</span>
      </div>
    `;
    totalHtml = `
      <div class="order-summary-row total">
        <span>Total a pagar (Bs.)</span>
        <span>Bs. ${formatBs(bs)}</span>
      </div>
    `;
  }

  return `
    <h4>Resumen del pedido</h4>
    <div class="order-summary-row">
      <span>Producto</span>
      <span>${product.name}</span>
    </div>
    <div class="order-summary-row">
      <span>Paquete</span>
      <span>${pkg.label}</span>
    </div>
    <div class="order-summary-row">
      <span>Método de pago</span>
      <span>${method.name}</span>
    </div>
    ${basePriceHtml}
    ${discountHtml}
    ${totalHtml}
  `;
}

// ── Order Tracking Page ──
function renderOrderTracking(orderId) {
  const order = getOrderById(orderId);

  if (!order) {
    return `
      <section class="order-tracking-section" id="order-tracking">
        <div class="container">
          <button class="game-detail-back" onclick="navigateTo('home')">← Volver al inicio</button>
          <div class="tracking-not-found">
            <div class="tracking-not-found-icon">🔍</div>
            <h2>Pedido no encontrado</h2>
            <p>No encontramos un pedido con la referencia <strong>${orderId}</strong></p>
            <button class="hero-btn-primary" onclick="navigateTo('lookup')">Intentar de nuevo</button>
          </div>
        </div>
      </section>
    `;
  }

  const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES['pending'];
  const statusOrder = ['pending', 'processing', 'completed'];
  const isErrorStatus = order.status === 'rejected' || order.status === 'invalid-id';
  const currentIndex = isErrorStatus ? 1 : statusOrder.indexOf(order.status);

  const cleanStr = (str) => {
    if (!str) return str;
    let clean = str;
    clean = clean.replace(/Enviando a API externa\.\.\./gi, 'Procesando el pedido de forma automatizada...');
    clean = clean.replace(/Aprobado y entregado por API/gi, 'Aprobado y entregado automáticamente');
    clean = clean.replace(/El proveedor rechazó la recarga/gi, 'El sistema rechazó la recarga');
    clean = clean.replace(/Fallo conexión API externa/gi, 'Fallo en el sistema de recarga automatizada');
    clean = clean.replace(/El proveedor canceló la recarga/gi, 'El sistema canceló la recarga automáticamente');
    clean = clean.replace(/API rechazó la cuenta/gi, 'Datos inválidos');
    clean = clean.replace(/API Error:/gi, 'Error:');
    clean = clean.replace(/\bAPI\b/gi, 'Sistema');
    clean = clean.replace(/\bproveedor\b/gi, 'sistema');
    return clean;
  };

  const cleanAdminNote = cleanStr(order.adminNote);

  const timelineSteps = [
    { key: 'pending', label: 'Recibido', icon: '📋', desc: 'Tu pedido fue registrado exitosamente' },
    { key: 'processing', label: 'Procesando', icon: '⚙️', desc: 'Estamos verificando tu pago y procesando la recarga' },
    { key: 'completed', label: 'Completado', icon: '✅', desc: '¡Tu recarga ha sido entregada!' }
  ];

  const timelineHtml = timelineSteps.map((step, i) => {
    let stepClass = '';
    let displayIcon = step.icon;
    let displayLabel = step.label;
    let displayDesc = step.desc;

    if (isErrorStatus && i === 1) {
      stepClass = 'error';
      displayIcon = order.status === 'rejected' ? '❌' : '⚠️';
      displayLabel = ORDER_STATUSES[order.status]?.label || step.label;
      displayDesc = cleanAdminNote || 'Contacta soporte para más información';
    } else if (i < currentIndex) {
      stepClass = 'completed';
      displayIcon = '✓';
    } else if (i === currentIndex && !isErrorStatus) {
      stepClass = 'active';
      if (step.key !== 'completed') {
        displayIcon = `<span class="tracking-spinner">${displayIcon}</span>`;
      }
    }

    return `
      <div class="tracking-step ${stepClass}">
        <div class="tracking-step-dot"><span>${displayIcon}</span></div>
        <div class="tracking-step-content">
          <div class="tracking-step-label">${displayLabel}</div>
          <div class="tracking-step-desc">${displayDesc}</div>
        </div>
      </div>
    `;
  }).join('');

  const historyHtml = (order.statusHistory || []).slice().reverse().map(h => {
    const s = ORDER_STATUSES[h.status] || {};
    const date = new Date(h.timestamp);
    
    // Enmascarar notas viejas para eliminar rastro de APIs o proveedores
    let cleanNote = cleanStr(h.note);

    return `
      <div class="tracking-history-item">
        <div class="tracking-history-dot" style="background: ${s.color || '#5a7099'}"></div>
        <div class="tracking-history-info">
          <span class="tracking-history-status">${s.icon || ''} ${s.label || h.status}</span>
          <span class="tracking-history-time">${date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${cleanNote ? `<div class="tracking-history-note">${cleanNote}</div>` : ''}
      </div>
    `;
  }).join('');

  const typeLabel = order.productType === 'account' ? '🔐 Interna' : order.productType === 'code' ? '🎫 Código' : '🎮 Por ID';

  const config = typeof getSettings === 'function' ? getSettings() : {};
  let rouletteButtonHtml = '';
  
  // Solo mostrar ruleta si fue activada, el pedido está completado, no se ha jugado, 
  // y el pedido fue creado DESPUÉS del 27 de Junio de 2026 a las 12:00 PM (16:00 UTC)
  const rouletteCutoffTime = new Date('2026-06-27T16:00:00Z').getTime();
  const orderTime = new Date(order.createdAt || 0).getTime();
  const isEligibleByDate = orderTime >= rouletteCutoffTime;

  if (config.enableRoulette !== false && order.status === 'completed' && !order.roulettePlayed && isEligibleByDate) {
    const products = typeof getProducts === 'function' ? getProducts() : [];
    const product = products.find(p => p.id === order.productId);
    const profile = typeof userProfile !== 'undefined' ? userProfile : null;
    const isNotReseller = !profile || profile.role !== 'revendedor';
    
    if (isNotReseller) {
      rouletteButtonHtml = `
        <div style="margin-top: 25px; background: linear-gradient(135deg, rgba(0, 229, 195, 0.1), rgba(14, 165, 233, 0.1)); border: 1px dashed var(--accent); border-radius: var(--radius-md); padding: 25px 20px; text-align: center; box-shadow: 0 5px 20px rgba(0,0,0,0.2);">
          <h4 style="color: var(--accent); font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 10px; text-shadow: 0 0 10px rgba(0,229,195,0.3);">🎁 ¡Tienes un giro pendiente!</h4>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 20px;">Por tu recarga, has ganado la oportunidad de girar la Ruleta de la Suerte.</p>
          <button class="btn-primary" onclick="showRouletteModal('${order.id}')" style="background: var(--accent); color: #000; padding: 14px 30px; font-weight: 800; font-size: 1.1rem; border-radius: 30px; box-shadow: 0 0 20px rgba(0,229,195,0.4); border: none; letter-spacing: 1px; width: 100%; max-width: 300px; margin: 0 auto; display: block;">
            🎰 GIRAR AHORA
          </button>
        </div>
      `;
    }
  }

  return `
    <section class="order-tracking-section" id="order-tracking">
      <div class="container">
        <button class="game-detail-back" onclick="navigateTo('home')">← Volver al inicio</button>

        <div class="tracking-header">
          <div class="tracking-ref">
            <span class="tracking-ref-label">Referencia del pedido</span>
            <span class="tracking-ref-code">${order.id}</span>
          </div>
          <div class="tracking-current-status" style="--status-color: ${statusInfo.color}; --status-bg: ${statusInfo.bg}">
            ${statusInfo.icon} ${statusInfo.label}
          </div>
        </div>

        <div class="tracking-card">
          <h3>📡 Estado del Pedido</h3>
          <div class="tracking-timeline">
            ${timelineHtml}
          </div>
          ${cleanAdminNote && isErrorStatus ? `
            <div class="tracking-admin-note">
              <strong>📝 Nota del equipo:</strong> ${cleanAdminNote}
            </div>
          ` : ''}
          ${order.status === 'invalid-id' ? `
            <div class="tracking-rectify-container" style="margin-top: 20px; background: rgba(255,167,38,0.08); border: 1px solid rgba(255,167,38,0.25); border-radius: var(--radius-md); padding: 20px;">
              <h4 style="color: #ffa726; font-family: var(--font-display); font-size: 1.05rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Corregir Datos del Pedido
              </h4>
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 16px;">Los datos proporcionados son incorrectos. Por favor, ingresa los datos correctos a continuación.</p>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${order.productType === 'account' ? `
                  <input type="text" id="rectify-email-input" placeholder="Correo de la cuenta" style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,167,38,0.4); border-radius: 8px; padding: 14px 16px; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.3s;" onfocus="this.style.borderColor='#ffa726'" onblur="this.style.borderColor='rgba(255,167,38,0.4)'">
                  <input type="text" id="rectify-pass-input" placeholder="Contraseña de la cuenta" style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,167,38,0.4); border-radius: 8px; padding: 14px 16px; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.3s;" onfocus="this.style.borderColor='#ffa726'" onblur="this.style.borderColor='rgba(255,167,38,0.4)'">
                ` : order.productType === 'game-id-zone' ? `
                  <div style="display: flex; gap: 10px;">
                    <input type="text" id="rectify-id-input" placeholder="ID del Jugador" style="flex: 2; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,167,38,0.4); border-radius: 8px; padding: 14px 16px; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.3s;" onfocus="this.style.borderColor='#ffa726'" onblur="this.style.borderColor='rgba(255,167,38,0.4)'">
                    <input type="text" id="rectify-zone-input" placeholder="Zona" style="flex: 1; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,167,38,0.4); border-radius: 8px; padding: 14px 16px; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.3s;" onfocus="this.style.borderColor='#ffa726'" onblur="this.style.borderColor='rgba(255,167,38,0.4)'">
                  </div>
                ` : `
                  <input type="text" id="rectify-id-input" placeholder="Escribe aquí los datos correctos (ID)..." style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,167,38,0.4); border-radius: 8px; padding: 14px 16px; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.3s;" onfocus="this.style.borderColor='#ffa726'" onblur="this.style.borderColor='rgba(255,167,38,0.4)'">
                `}
                <button class="btn-primary" onclick="this.disabled=true; this.innerHTML='Enviando...'; rectifyOrderId('${order.id}')" style="width: 100%; padding: 14px 24px; background: #ffa726; color: #060d1a; box-shadow: 0 4px 15px rgba(255,167,38,0.3); border: none; font-weight: 700;">Re-enviar Pedido</button>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="tracking-details-grid">
          <div class="tracking-card">
            <h3>📦 Detalles del Pedido</h3>
            <div class="tracking-detail-row"><span>Producto</span><span>${order.productName}</span></div>
            <div class="tracking-detail-row"><span>Tipo</span><span>${typeLabel}</span></div>
            <div class="tracking-detail-row"><span>Paquete</span><span>${order.packageLabel}</span></div>
            ${order.playerName ? `<div class="tracking-detail-row"><span>Jugador</span><span>${order.playerName}</span></div>` : ''}
            ${order.gameId ? `<div class="tracking-detail-row"><span>ID Juego</span><span>${order.gameId}</span></div>` : ''}
            ${order.accountEmail ? `<div class="tracking-detail-row"><span>Cuenta</span><span>${order.accountEmail}</span></div>` : ''}
            ${order.accountPassword ? `<div class="tracking-detail-row"><span>Contraseña</span><span>${order.accountPassword}</span></div>` : ''}
            <div class="tracking-detail-row"><span>Total Pagado</span><span>${order.paymentCurrency === 'usd' ? '$' + order.priceUsd.toFixed(2) + ' USD' : 'Bs. ' + formatBs(order.priceBs)}</span></div>
            <div class="tracking-detail-row"><span>Método de Pago</span><span>${order.paymentMethodName}</span></div>
            <div class="tracking-detail-row"><span>Contacto</span><span>${order.customerContact}</span></div>
            <div class="tracking-detail-row"><span>Fecha</span><span>${new Date(order.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
          </div>

          <div class="tracking-card">
            <h3>📜 Historial de Estado</h3>
            <div class="tracking-history">
              ${historyHtml}
            </div>
          </div>
        </div>

        ${rouletteButtonHtml}
        <div style="text-align: center; margin-top: 24px;">
          <button class="hero-btn-secondary" onclick="navigateTo('lookup')">🔍 Buscar otro pedido</button>
        </div>
      </div>
    </section>
  `;
}

// ── Order Lookup Page ──
function renderOrderLookup() {
  return `
    <section class="order-tracking-section" id="order-lookup">
      <div class="container">
        <button class="game-detail-back" onclick="navigateTo('home')">← Volver al inicio</button>
        <div class="tracking-lookup-container">
          <div class="tracking-lookup-icon">🔍</div>
          <h2>Mis Pedidos</h2>
          <p>Ingresa tu número de referencia, correo electrónico o teléfono para ver tu historial de pedidos.</p>
          <div class="tracking-lookup-form">
            <input type="text" class="form-input" id="lookup-input"
                   placeholder="Ej: 0001, juan@gmail.com, o +58412..." autocomplete="off"
                   onkeydown="if(event.key==='Enter')lookupOrder()">
            <button class="hero-btn-primary" onclick="lookupOrder()">
              Buscar
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderOrderHistoryList(orders, contactStr) {
  const listHtml = orders.map(order => {
    const sInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES['pending'];
    const dateStr = new Date(order.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
    return `
      <div class="tracking-history-item" style="padding: 15px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 10px; cursor: pointer; transition: background 0.3s;" onclick="navigateTo('tracking', '${order.id}')" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: bold; color: var(--primary);">#${order.id}</span>
          <span class="tracking-history-status" style="font-size: 0.8rem; background: ${sInfo.bg}; padding: 3px 8px; border-radius: 20px; color: ${sInfo.color};">${sInfo.icon} ${sInfo.label}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-secondary);">
          <span>${order.productName}</span>
          <span>${order.paymentCurrency === 'usd' ? '$' + order.priceUsd.toFixed(2) : 'Bs. ' + formatBs(order.priceBs)}</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">📅 ${dateStr}</div>
      </div>
    `;
  }).join('');

  return `
    <section class="order-tracking-section" id="order-history">
      <div class="container">
        <button class="game-detail-back" onclick="navigateTo('lookup')">← Volver al buscador</button>
        <div class="tracking-lookup-container" style="max-width: 600px;">
          <h2 style="margin-bottom: 10px;">Historial de Pedidos</h2>
          <p style="color: var(--text-secondary); margin-bottom: 25px;">Se han encontrado <strong>${orders.length}</strong> pedidos asociados a "${contactStr}".</p>
          <div style="text-align: left;">
            ${listHtml}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderFeaturesSection() {
  return `
    <section class="features-section" id="features">
      <div class="container">
        <div class="section-header">
          <h2>¿Por qué <span class="gradient-text">AccessPlay</span>?</h2>
          <p>La mejor experiencia en recargas digitales de Venezuela</p>
        </div>
        <div class="features-grid">
          ${(() => {
            const features = (typeof LANDING_CONFIG !== 'undefined' && LANDING_CONFIG.features) ? LANDING_CONFIG.features : [
              { title: 'Entrega Inmediata', desc: 'Recibe tu recarga en minutos después de confirmar el pago. Sin esperas innecesarias.', icon: '⚡' },
              { title: '100% Seguro', desc: 'Tus datos están protegidos. Proceso transparente y confiable con cada transacción.', icon: '🔒' },
              { title: 'Soporte 24/7', desc: 'Atención personalizada por WhatsApp. Estamos disponibles para resolver cualquier duda.', icon: '💬' },
              { title: 'Mejores Precios', desc: 'Tasas competitivas actualizadas diariamente. Precios justos para todos.', icon: '💰' },
              { title: 'Rastreo en Vivo', desc: 'Sigue el estado de tu pedido en tiempo real. Sabrás exactamente cuándo estará lista tu recarga.', icon: '📡' },
              { title: 'Cobertura Total', desc: 'Servicio para toda Venezuela con pagos en bolívares, dólares y criptomonedas.', icon: '🌎' }
            ];
            return features.map((feat, idx) => `
              <div class="feature-card fade-in-up stagger-${(idx % 6) + 1}">
                <span class="feature-icon">${feat.icon}</span>
                <h3>${feat.title}</h3>
                <p>${feat.desc}</p>
              </div>
            `).join('');
          })()}
        </div>
      </div>
    </section>
  `;
}

function renderFAQ() {
  return `
    <section class="faq-section" id="faq" style="padding: 60px 0;">
      <div class="container">
        <div class="section-header">
          <h2>Preguntas <span class="gradient-text">Frecuentes</span></h2>
          <p>Resolvemos tus dudas antes de comprar</p>
        </div>
        <div class="faq-accordion" style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px;">
          
          ${(() => {
            const faq = (typeof LANDING_CONFIG !== 'undefined' && LANDING_CONFIG.faq) ? LANDING_CONFIG.faq : [
              { q: '⏱️ ¿Cuánto tiempo tarda en llegar mi recarga?', a: 'Por lo general, las recargas se procesan en un tiempo de <strong>5 a 15 minutos</strong> una vez que tu pago ha sido confirmado. En algunos casos excepcionales o durante mantenimientos del juego, puede demorar un poco más.' },
              { q: '⚠️ ¿Qué pasa si me equivoco al poner mi ID del juego?', a: 'Si notas un error en tu ID, contáctanos inmediatamente a través de nuestro botón de soporte en WhatsApp o Telegram. Si la recarga <strong>aún no ha sido procesada</strong>, podemos corregirlo. Si ya fue enviada al ID erróneo, lamentablemente no podemos revertir la transacción.' },
              { q: '💳 ¿Cuáles son los métodos de pago aceptados?', a: 'Aceptamos pagos a través de <strong>Pago Móvil</strong>, <strong>Transferencia Bancaria Nacional</strong> y también criptomonedas como USDT a través de <strong>Binance Pay</strong>.' },
              { q: '✅ ¿Cómo sé si mi pedido fue exitoso?', a: 'Al finalizar tu compra, recibirás un número de referencia (Ej: AP-1234). Puedes ingresar ese código en la sección de <strong>"🔍 Mis Pedidos"</strong> en el menú superior para ver el estado en tiempo real.' }
            ];
            return faq.map(item => `
              <details style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.3s ease;">
                <summary style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); outline: none; list-style: none; position: relative; padding-right: 24px;">
                  ${item.q}
                  <span style="position: absolute; right: 0; top: 0; color: var(--accent);">+</span>
                </summary>
                <p style="color: var(--text-secondary); margin-top: 12px; font-size: 0.95rem; line-height: 1.6;">
                  ${item.a}
                </p>
              </details>
            `).join('');
          })()}

        </div>
      </div>
      <style>
        details[open] summary span { transform: rotate(45deg); display: inline-block; transition: transform 0.3s; }
        details summary::-webkit-details-marker { display: none; }
        details:hover { border-color: var(--accent) !important; }
        .light-theme details { background: white !important; }
      </style>
    </section>
  `;
}

function renderFooter() {
  return `
    <footer class="footer" id="contact">
      <div class="footer-content">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-logo">
              <span>🤖</span>
              <span class="footer-logo-text">AccessPlay</span>
            </div>
            <p class="footer-brand-desc">La plataforma #1 de recargas digitales en Venezuela. Juegos, gift cards, streaming y más.</p>
            <div class="footer-socials">
              <a href="https://wa.me/${SITE_SETTINGS.whatsapp.replace(/\\D/g, '')}" class="footer-social-link footer-social--whatsapp" title="WhatsApp" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="${SITE_SETTINGS.instagram}" class="footer-social-link footer-social--instagram" title="Instagram" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="${SITE_SETTINGS.telegram}" class="footer-social-link footer-social--telegram" title="Telegram" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            </div>
          </div>
          <div class="footer-links-group">
            <h4>Categorías</h4>
            <ul>
              ${CATEGORIES.map(cat => `<li><a onclick="filterCategory('${cat.id}'); scrollToSection('catalog');">${cat.icon} ${cat.name}</a></li>`).join('')}
            </ul>
          </div>
          <div class="footer-links-group">
            <h4>Información</h4>
            <ul>
              <li><a onclick="scrollToSection('how-it-works')">¿Cómo funciona?</a></li>
              <li><a onclick="scrollToSection('features')">Ventajas</a></li>
              <li><a onclick="navigateTo('lookup')">Rastrear Pedido</a></li>
              <li><a onclick="scrollToSection('contact')">Contacto</a></li>
            </ul>
          </div>
          <div class="footer-links-group">
            <h4>Horario</h4>
            <p class="footer-schedule">📱 ${SITE_SETTINGS.schedule.replace('\\n', '<br>')}</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="footer-disclaimer">
            ${(typeof LANDING_CONFIG !== 'undefined' && LANDING_CONFIG.footer && LANDING_CONFIG.footer.disclaimer) 
              ? LANDING_CONFIG.footer.disclaimer.replace(/\\n/g, '<br>') 
              : 'AccessPlay no está afiliado con Garena, Tencent, Roblox Corporation, miHoYo ni ninguna otra empresa mencionada.<br>Todos los nombres y logotipos son marcas registradas de sus respectivos dueños.'}
          </p>
          <p class="footer-copy">© ${new Date().getFullYear()} AccessPlay. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  `;
}

// ── Terms & Conditions Modal ──
function renderTermsModal() {
  const termsData = typeof getSettings === 'function' ? getSettings().termsAndConditions : null;
  let termsHtmlContent = '';
  
  if (Array.isArray(termsData)) {
    termsHtmlContent = termsData.map((t, i) => `
      <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px dashed rgba(255,255,255,0.05);">
        <h4 style="color: ${t.titleColor || '#0ea5e9'}; margin-bottom: 10px; font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
          <span style="background: rgba(0, 229, 195, 0.1); padding: 4px 10px; border-radius: 8px; font-size: 0.9rem;">${i + 1}</span> 
          ${t.title}
        </h4>
        <p style="color: ${t.descColor || '#e2e8f0'}; margin: 0; line-height: 1.6; white-space: pre-wrap;">${t.desc}</p>
      </div>
    `).join('');
  } else if (typeof termsData === 'string') {
    termsHtmlContent = termsData;
  } else {
    termsHtmlContent = '<h4>Términos y Condiciones</h4><p>Al utilizar nuestros servicios aceptas las reglas de la tienda.</p>';
  }

  return `
    <div id="terms-modal-container">
      <div class="modal-overlay active" style="z-index: 10000; backdrop-filter: blur(8px); background: rgba(6, 13, 26, 0.85);">
        <div class="modal" style="max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
          <div style="padding: 24px; border-bottom: 1px solid var(--border); background: var(--bg-surface);">
            <h2 style="margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.8rem;">📜</span> Términos y Condiciones
            </h2>
          </div>
          <div style="padding: 24px; overflow-y: auto; color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem; background: var(--bg-deep);">
            ${termsHtmlContent}
          </div>
          <div style="padding: 20px 24px; border-top: 1px solid var(--border); background: var(--bg-surface); text-align: center;">
            <p style="margin-bottom: 16px; font-size: 0.9rem; color: var(--text-muted);">Debes aceptar los términos para poder continuar y realizar compras.</p>
            <button class="btn-primary" onclick="acceptTerms()" style="width: 100%; padding: 14px; font-size: 1.1rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 229, 195, 0.2);">
              Acepto los Términos y Condiciones ✅
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.acceptTerms = function() {
  sessionStorage.setItem('recargaaccessplay_terms_accepted', 'true');
  const container = document.getElementById('terms-modal-container');
  if (container) {
    const overlay = container.querySelector('.modal-overlay');
    if (overlay) overlay.classList.remove('active');
    setTimeout(() => {
      container.remove();
      // Show announcement if exists
      const config = typeof getSettings === 'function' ? getSettings() : {};
      if (config.announcementEnabled && config.announcementMessage) {
        if (typeof showAnnouncementModal === 'function') {
          showAnnouncementModal(config.announcementMessage);
        }
      }
    }, 300);
  }
};

// ── Support Chat Widget ──
function renderSupportWidget() {
  const settings = getSettings();
  const channelLink = settings.whatsappChannel || 'https://whatsapp.com/channel/TU_CANAL_AQUI';
  const whatsappChannelBtn = `
    <div class="whatsapp-tooltip">Únete al canal</div>
    <a href="${channelLink}" target="_blank" class="whatsapp-fab" aria-label="Canal de WhatsApp" title="Únete a nuestro canal">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>`;

  return `
    <div class="support-widget" id="support-widget">
      ${whatsappChannelBtn}
      <button class="support-fab" id="support-fab" onclick="toggleSupportChat()" aria-label="Soporte">
        <svg class="support-fab-icon support-fab-icon--chat" viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
        <svg class="support-fab-icon support-fab-icon--close" viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        <span class="support-fab-pulse"></span>
      </button>
      <div class="support-chat" id="support-chat">
        <div class="support-chat-header">
          <div class="support-chat-header-info">
            <div class="support-chat-avatar">🤖</div>
            <div>
              <div class="support-chat-name">AccessPlay Soporte</div>
              <div class="support-chat-status"><span class="support-online-dot"></span> En línea</div>
            </div>
          </div>
          <button class="support-chat-close" onclick="toggleSupportChat()">✕</button>
        </div>
        <div class="support-chat-messages" id="support-messages">
          <!-- Dynamic messages will be loaded here -->
        </div>
        
        <div id="support-login-view" style="display: none; padding: 20px; text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; background: var(--bg-surface);">
          <h3 style="margin-bottom: 10px;">¡Hola! 👋</h3>
          <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.95rem;">Para brindarte una atención personalizada, por favor ingresa tu número de contacto o correo.</p>
          <input type="text" id="support-contact-input" class="support-input" placeholder="Tu número o correo" style="margin-bottom: 15px; width: 100%; text-align: center;">
          <button class="support-send-btn" style="width:100%; border-radius: 20px; padding: 10px; background: var(--accent); color: var(--bg-deep); font-weight: 600;" onclick="startSupportSession()">Comenzar Chat</button>
        </div>

        <div id="support-chat-bottom" style="display: none;">
          <div class="support-quick-actions" id="support-quick-actions" style="padding: 10px; border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: 8px;">
            <!-- Rendered dynamically via JS, see below -->
          </div>
          <div class="support-chat-input">
            <button class="support-menu-btn" onclick="showSupportMenu()" style="background:transparent; border:none; color:var(--text-secondary); cursor:pointer; font-size:1.2rem; padding:0 5px;" title="Volver al Menú">
              🔙
            </button>
            <input type="text" class="support-input" id="support-input" placeholder="Escribe tu mensaje..." autocomplete="off" onkeydown="if(event.key==='Enter')sendSupportMessage()">
            <button class="support-send-btn" onclick="sendSupportMessage()">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDynamicQuickActions() {
  const container = document.getElementById('support-quick-actions');
  if (!container) return;
  const replies = getQuickReplies();
  container.innerHTML = replies.map(r =>
    `<button class="support-quick-btn" style="flex: 1; min-width: 45%;" onclick="supportQuickAction('${r.title}')">${r.title}</button>`
  ).join('');
}

function renderBubbles() {
  return ''; // Desactivado por diseño de AccessPlay
}

// ── Wallet Recharge Page ──
function renderWalletRecharge() {
  const predefinedAmounts = [5, 10, 20, 50, 100];
  
  const amountsHtml = predefinedAmounts.map((amount, i) => `
    <div class="package-card fade-in-up stagger-${(i % 5) + 1}"
         onclick="selectWalletAmount(${amount}, ${i})"
         id="wallet-amt-${i}">
      <div class="package-amount">$${amount}</div>
      <div class="package-label">Saldo</div>
      <div class="package-price-bs">Bs. ${formatBs(usdToBs(amount))}</div>
    </div>
  `).join('');

  return `
    <section class="game-detail" id="wallet-recharge-section">
      <button class="game-detail-back" onclick="navigateTo('home')">← Volver al inicio</button>
      <div class="game-detail-header" style="justify-content: center; text-align: center; display: flex; flex-direction: column; align-items: center;">
        <div style="width:80px;height:80px;border-radius:20px;background:linear-gradient(135deg, #0ea5e9, #0284c7);display:flex;align-items:center;justify-content:center;font-size:2.5rem; margin-bottom: 15px;">💰</div>
        <div>
          <h2>Recargar Monedero</h2>
          <p class="game-detail-desc" style="max-width: 500px; margin: 0 auto;">Agrega saldo a tu cuenta para realizar compras más rápidas sin tener que verificar el pago cada vez.</p>
        </div>
      </div>
      
      <div class="packages-title" style="margin-top: 30px; text-align: center;">1. Selecciona el monto a recargar</div>
      <div class="packages-grid" id="wallet-amounts-grid" style="justify-content: center;">
        ${amountsHtml}
      </div>
      
      <div class="order-form" id="wallet-order-form" style="display:none; max-width: 600px; margin: 30px auto;">
        <h3>2. Detalles de Pago</h3>
        <div class="form-group">
          <label>Método de pago</label>
          <div class="payment-methods" id="payment-methods">
            ${PAYMENT_METHODS.filter(pm => pm.id !== 'wallet').map(pm => `
              <div class="payment-option" onclick="selectPayment('${pm.id}')" id="pay-${pm.id}">
                <div class="payment-option-icon">${pm.icon}</div>
                <div class="payment-option-name">${pm.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div id="payment-details-container"></div>
        
        <div class="order-summary" id="order-summary" style="margin-top: 20px; margin-bottom: 20px;"></div>
        
        <div class="form-group">
          <label>📸 Captura del comprobante de pago</label>
          <div class="screenshot-upload" id="screenshot-upload" onclick="document.getElementById('payment-screenshot').click()">
            <input type="file" id="payment-screenshot" accept="image/*" style="display:none;" onchange="previewScreenshot(this)">
            <div class="screenshot-preview" id="screenshot-preview">
              <div class="screenshot-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                <span>Toca para subir captura</span>
                <span class="screenshot-hint">JPG, PNG — Máx 5MB</span>
              </div>
            </div>
          </div>
        </div>
        <button class="btn-primary" id="btn-submit" onclick="submitWalletRecharge()" disabled>
          🤖 Confirmar Recarga
        </button>
      </div>
    </section>
  `;
}

// ==========================================
// Dashboard Component
// ==========================================

function renderDashboard() {
  if (!currentUser) {
    return `<div style="text-align:center; padding: 100px;"><h2>Por favor inicia sesión.</h2></div>`;
  }

  setTimeout(() => { if (typeof loadDashboardData === 'function') loadDashboardData(); }, 100);

  const wallet = userProfile?.wallet || 0;
  const spent = userProfile?.totalSpent || 0;
  const points = userProfile?.points || 0;
  const vip = typeof getVipLevel === 'function' ? getVipLevel(spent) : { name: 'Bronce', color: '#cd7f32', gradient: 'linear-gradient(135deg, #d4a373 0%, #a68a64 100%)', nextThreshold: 50 };
  
  let progressHtml = '';
  if (vip.nextThreshold) {
     const percent = Math.min(100, (spent / vip.nextThreshold) * 100);
     progressHtml = `
       <div style="margin-top: 15px; font-size: 0.8rem; color: var(--text-secondary);">
         Progreso a siguiente nivel: $${spent.toFixed(2)} / $${vip.nextThreshold}
         <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 5px; overflow: hidden;">
           <div style="width: ${percent}%; height: 100%; background: ${vip.gradient}; transition: width 1s ease;"></div>
         </div>
       </div>
     `;
  } else {
     progressHtml = `<div style="margin-top: 15px; font-size: 0.85rem; color: ${vip.color}; font-weight: bold;">¡Has alcanzado el nivel máximo!</div>`;
  }

  return `
    <div class="dashboard-container" style="max-width: 1200px; margin: 40px auto; padding: 20px; color: white;">
      <h1 style="margin-bottom: 30px; font-size: 2.5rem; text-shadow: 0 0 20px rgba(16, 185, 129, 0.4);">Panel de Usuario</h1>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px;">
        
        <div style="background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); padding: 25px; border-radius: 16px; display: flex; gap: 20px; align-items: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: ${vip.gradient}; filter: blur(50px); opacity: 0.3;"></div>
          <img src="${currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + currentUser.email + '&background=0D8ABC&color=fff'}" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid ${vip.color}; box-shadow: 0 0 15px ${vip.color}40; position: relative; z-index: 2;">
          <div style="flex: 1; position: relative; z-index: 2;">
            <h3 style="margin: 0 0 5px 0; font-size: 1.3rem;">${currentUser.displayName || 'Usuario'}</h3>
            <span style="background: ${vip.gradient}; color: #000; font-weight: bold; padding: 3px 10px; border-radius: 20px; font-size: 0.8rem; box-shadow: 0 2px 10px ${vip.color}50;">VIP ${vip.name}</span>
            ${progressHtml}
          </div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(16, 185, 129, 0.3); padding: 25px; border-radius: 16px; position: relative; overflow: hidden;">
          <div style="position: absolute; bottom: -50px; left: -50px; width: 100px; height: 100px; background: #0ea5e9; filter: blur(50px); opacity: 0.2;"></div>
          <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">Saldo Monedero</div>
          <div style="font-size: 2.8rem; font-weight: 800; color: #0ea5e9; text-shadow: 0 0 15px rgba(16, 185, 129, 0.3);">\$${wallet.toFixed(2)}</div>
          <div style="margin-top: 15px; display: flex; gap: 10px;">
            <button onclick="startWalletRecharge()" class="btn-primary" style="flex: 1; padding: 8px;">+ Recargar</button>
          </div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(59, 130, 246, 0.3); padding: 25px; border-radius: 16px; position: relative; overflow: hidden;">
          <div style="position: absolute; bottom: -50px; right: -50px; width: 100px; height: 100px; background: #3b82f6; filter: blur(50px); opacity: 0.2;"></div>
          <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px;">AccessPlay Points</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: #3b82f6; text-shadow: 0 0 15px rgba(59, 130, 246, 0.3);">${points}</div>
          <div style="margin-top: 15px; display: flex; gap: 10px;">
            <button onclick="if(typeof redeemPoints==='function')redeemPoints()" class="btn-secondary" style="flex: 1; padding: 8px; border-color: #3b82f6; color: #3b82f6;">Canjear por $1</button>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 30px;">
        
        <div>
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 25px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
              <h2 style="margin: 0; font-size: 1.5rem;">Mis Pedidos</h2>
              <div style="display: flex; gap: 15px;">
                <button id="tab-active-orders" onclick="switchDashboardTab('active')" style="background:none; border:none; color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 5px; cursor: pointer; font-weight: bold;">En Proceso</button>
                <button id="tab-completed-orders" onclick="switchDashboardTab('completed')" style="background:none; border:none; color: var(--text-secondary); padding-bottom: 5px; cursor: pointer; font-weight: bold;">Completados</button>
              </div>
            </div>
            <div id="dashboard-orders-container" style="min-height: 200px;">
              <div style="text-align:center; padding: 40px;"><span class="tracking-spinner" style="display:inline-block; width:24px; height:24px; border:3px solid #0ea5e9; border-bottom-color:transparent; border-radius:50%; animation:spin 1s linear infinite;"></span></div>
            </div>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 25px;">
             <h2 style="margin: 0 0 20px 0; font-size: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">Historial de Billetera</h2>
             <div id="dashboard-transactions-container" style="max-height: 300px; overflow-y: auto; padding-right: 10px;">
                <div style="text-align:center; padding: 20px; color: var(--text-secondary);">Cargando movimientos...</div>
             </div>
          </div>
        </div>

        <div>
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 25px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h3 style="margin: 0;">Libreta de IDs</h3>
              <button onclick="showAddIdModal()" class="btn-primary" style="padding: 5px 12px; font-size: 0.8rem; border-radius: 20px;">+ Añadir</button>
            </div>
            <div id="dashboard-saved-ids">
              <div style="text-align:center; color:var(--text-secondary);"><small>Cargando...</small></div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn-secondary" style="width: 100%; border-radius: 12px;" onclick="navigateTo('home')">Volver a la Tienda</button>
            <button onclick="logout()" class="btn-secondary" style="width: 100%; border-radius: 12px; color: #ff5252; border-color: rgba(255, 82, 82, 0.3); background: rgba(255, 82, 82, 0.05);">Cerrar Sesión</button>
          </div>
        </div>

      </div>
    </div>
  `;
}

function renderDashboardOrders(orders, type) {
  if (orders.length === 0) {
    return `
      <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <div style="font-size: 3rem; margin-bottom: 10px; opacity: 0.5;">${type === 'active' ? '📦' : '✅'}</div>
        <h3 style="font-weight: 500;">No tienes pedidos ${type === 'active' ? 'en proceso' : 'completados'}.</h3>
      </div>
    `;
  }
  
  return orders.map(order => {
    let statusColor = '#f59e0b';
    if (order.status === 'processing') statusColor = '#3b82f6';
    if (order.status === 'completed') statusColor = '#0ea5e9';
    if (order.status === 'rejected') statusColor = '#ef4444';

    return `
    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid ${statusColor}; border-radius: 8px; padding: 20px; margin-bottom: 15px; transition: transform 0.2s ease, background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'; this.style.transform='translateY(0)'">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <div>
          <span style="font-weight: 800; color: #fff; font-size: 1.1rem;">${order.productName || 'Producto'}</span>
          <div style="color: #0ea5e9; font-weight: bold; margin-top: 5px;">${order.packageLabel || ''}</div>
        </div>
        <div style="text-align: right;">
           <span style="background: ${statusColor}20; color: ${statusColor}; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; border: 1px solid ${statusColor}40;">${order.status.toUpperCase()}</span>
           <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;">Ord: #${order.id}</div>
        </div>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 15px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 10px;">
        Fecha: ${new Date(order.createdAt).toLocaleString()}
      </div>
      
      ${type === 'active' ? `
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 5px; font-weight: bold;">
        <span style="color: ${order.status === 'pending' || order.status === 'processing' ? '#0ea5e9' : 'var(--text-secondary)'}">1. Recibido</span>
        <span style="color: ${order.status === 'processing' ? '#3b82f6' : 'var(--text-secondary)'}">2. Procesando</span>
        <span>3. Entregado</span>
      </div>
      <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
        <div style="width: ${order.status === 'pending' ? '33%' : (order.status === 'processing' ? '66%' : '100%')}; height: 100%; background: ${statusColor}; transition: width 0.5s ease;"></div>
      </div>
      ` : ''}
    </div>
  `}).join('');
}

function renderDashboardTransactions() {
  const container = document.getElementById('dashboard-transactions-container');
  if (!container) return;
  
  if (!userProfile || !userProfile.transactions || userProfile.transactions.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-secondary);">No hay movimientos recientes.</div>`;
    return;
  }
  
  const sortedTx = [...userProfile.transactions].sort((a,b) => b.date - a.date);
  
  container.innerHTML = sortedTx.map(tx => {
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
       <div style="font-weight: bold; color: ${color};">${sign}\$${parseFloat(tx.amount).toFixed(2)}</div>
    </div>
    `;
  }).join('');
}

// ── Theme Toggle ──
function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  localStorage.setItem('recargaaccessplay_theme', isLight ? 'light' : 'dark');
}
// Helper function to fill saved ID in the modal
window.fillSavedId = function(uid, zoneId) {
  const uidInput = document.getElementById('game-uid');
  const zoneInput = document.getElementById('game-zone');
  if (uidInput) {
    uidInput.value = uid;
    // Trigger input event to update any listeners
    uidInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (zoneInput && zoneId && zoneId !== 'undefined' && zoneId !== 'null') {
    zoneInput.value = zoneId;
    zoneInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
};
