// ════════════════════════════════════════
// 2. PRODUCTS
// ════════════════════════════════════════
function renderProducts(container) {
  const productCardsHtml = PRODUCTS.map(product => {
    const cat = getCategoryById(product.category);
    const pkgList = product.packages || [];
    const minPrice = pkgList.length > 0 ? Math.min(...pkgList.map(p => p.priceUsd)) : 0;
    const maxPrice = pkgList.length > 0 ? Math.max(...pkgList.map(p => p.priceUsd)) : 0;

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
            <span>📦 ${pkgList.length} Paquetes</span> |
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
// 7. PRODUCT MODAL (Add/Edit)
