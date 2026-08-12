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

  adminState.tempPackages = [...(product.packages || [])];

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
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 0.8; min-width: 70px;">
        <label style="font-size: 0.75rem; color: ${(pkg.customMargin !== undefined && pkg.customMargin !== null && pkg.customMargin !== '') ? '#a78bfa' : 'var(--text-muted)'};">🎯 Margen (%)</label>
        <input type="number" class="admin-form-input" style="padding: 6px 10px; font-size: 0.85rem; ${(pkg.customMargin !== undefined && pkg.customMargin !== null && pkg.customMargin !== '') ? 'border-color: rgba(139,92,246,0.4); background: rgba(139,92,246,0.05);' : ''}" step="0.5" value="${pkg.customMargin !== undefined && pkg.customMargin !== null && pkg.customMargin !== '' ? pkg.customMargin : ''}" onchange="updateTempPackageField(${idx}, 'customMargin', this.value)" placeholder="Global">
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 1.5; min-width: 120px;">
        <label style="font-size: 0.75rem; color: var(--text-muted);">Etiqueta</label>
        <input type="text" class="admin-form-input" style="padding: 6px 10px; font-size: 0.85rem;" value="${pkg.label || ''}" onchange="updateTempPackageField(${idx}, 'label', this.value)" placeholder="100 diamantes">
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 0.8; min-width: 60px;">
        <label style="font-size: 0.75rem; color: var(--text-muted);">ID API (Opc.)</label>
        <input type="text" class="admin-form-input" style="padding: 6px 10px; font-size: 0.85rem;" value="${pkg.apiServiceId || ''}" onchange="updateTempPackageField(${idx}, 'apiServiceId', this.value)" placeholder="Ej. 341">
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 1.5; min-width: 120px;">
        <label style="font-size: 0.75rem; color: var(--text-muted);">Imagen de Fondo (URL)</label>
        <input type="text" class="admin-form-input" style="padding: 6px 10px; font-size: 0.85rem;" value="${pkg.bgImage || ''}" onchange="updateTempPackageField(${idx}, 'bgImage', this.value)" placeholder="https://...">
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; flex: 0.5; min-width: 70px; justify-content: flex-end; align-items: center; margin-bottom: 10px;">
        <label style="font-size: 0.75rem; color: var(--text-muted); text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px;">
          <span>Sin Moneda</span>
          <input type="checkbox" ${pkg.hideCurrency ? 'checked' : ''} onchange="updateTempPackageField(${idx}, 'hideCurrency', this.checked)" style="width: 16px; height: 16px; accent-color: #0ea5e9; cursor: pointer;">
        </label>
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
  const margin = EXCHANGE_RATE.profitMargin || 0;
  const defaultPrice = 1.00;
  const defaultCost = parseFloat((defaultPrice / (1 + (margin / 100))).toFixed(2));
  adminState.tempPackages.push({ amount: 100, priceUsd: defaultPrice, costUsd: defaultCost, label: `100 ${currencyName}`, isOutofStock: false, bgImage: '' });
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
  else if (field === 'priceUsd') {
    pkg.priceUsd = parseFloat(value) || 0.0;
    const margin = (pkg.customMargin !== undefined && pkg.customMargin !== null && pkg.customMargin !== '') ? pkg.customMargin : (EXCHANGE_RATE.profitMargin || 0);
    if (!pkg.costUsd || pkg.costUsd <= 0) {
      if (pkg.priceUsd > 0) pkg.costUsd = parseFloat((pkg.priceUsd / (1 + (margin / 100))).toFixed(2));
    }
  }
  else if (field === 'costUsd') {
    pkg.costUsd = parseFloat(value) || 0.0;
    // Auto-calculate price
    const margin = (pkg.customMargin !== undefined && pkg.customMargin !== null && pkg.customMargin !== '') ? pkg.customMargin : (EXCHANGE_RATE.profitMargin || 0);
    if (pkg.costUsd > 0) pkg.priceUsd = parseFloat((pkg.costUsd + (pkg.costUsd * margin / 100)).toFixed(2));
    renderTempPackages();
  }
  else if (field === 'customMargin') {
    if (value === '' || value === null || value === undefined) {
      delete pkg.customMargin;
    } else {
      pkg.customMargin = parseFloat(value);
    }
    // Auto-calculate price
    const margin = (pkg.customMargin !== undefined && pkg.customMargin !== null && pkg.customMargin !== '') ? pkg.customMargin : (EXCHANGE_RATE.profitMargin || 0);
    if (pkg.costUsd > 0) pkg.priceUsd = parseFloat((pkg.costUsd + (pkg.costUsd * margin / 100)).toFixed(2));
    renderTempPackages();
  }
  else if (field === 'apiServiceId') pkg.apiServiceId = value.trim();
  else if (field === 'isOutofStock') pkg.isOutofStock = value;
  else if (field === 'hideCurrency') pkg.hideCurrency = value;
  else if (field === 'bgImage') pkg.bgImage = value.trim();
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

  for (let i = 0; i < adminState.tempPackages.length; i++) {
    const pkg = adminState.tempPackages[i];
    if (pkg.priceUsd <= 0) {
      showAdminToast(`❌ El paquete #${i + 1} tiene precio inválido`, 'error');
      return;
    }
    const margin = (pkg.customMargin !== undefined && pkg.customMargin !== null && pkg.customMargin !== '') ? pkg.customMargin : (EXCHANGE_RATE.profitMargin || 0);
    if ((!pkg.costUsd || pkg.costUsd <= 0) && pkg.priceUsd > 0) {
      pkg.costUsd = parseFloat((pkg.priceUsd / (1 + (margin / 100))).toFixed(2));
    }
    if (!pkg.label && pkg.amount) pkg.label = productCurrency ? `${pkg.amount} ${productCurrency}` : `${pkg.amount}`;
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
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary" style="padding: 6px 12px;" onclick="adminEditDiscount('${d.code}')" title="Editar cupón">✏️ Editar</button>
        <button class="btn btn-secondary" style="padding: 6px 12px; color: #ff6b6b; border-color: rgba(220,53,69,0.2);" onclick="adminDeleteDiscount('${d.code}')" title="Eliminar cupón">🗑️ Eliminar</button>
      </div>
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
            <input type="text" id="discount-code" class="admin-form-input" required style="text-transform: uppercase;" placeholder="CÓDIGO" pattern="[A-Za-zÑñ0-9\-_]+" title="Solo letras, números y guiones, sin espacios">
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

  if (window.editingDiscountCode) {
    deleteDiscount(window.editingDiscountCode);
    window.editingDiscountCode = null;
  }

  if (createDiscount(code, type, value, expiryDate, globalLimit, clientLimit)) {
    showAdminToast('✅ Cupón guardado exitosamente', 'success');
    renderActiveTab();
  } else {
    showAdminToast('⚠️ Ese código ya existe', 'error');
  }
}

function adminEditDiscount(code) {
  const discounts = getDiscounts();
  const d = discounts.find(x => x.code === code);
  if (!d) return;
  
  document.getElementById('discount-code').value = d.code;
  document.getElementById('discount-code').setAttribute('readonly', 'true');
  document.getElementById('discount-code').style.opacity = '0.7';
  document.getElementById('discount-type').value = d.type;
  document.getElementById('discount-value').value = d.value;
  
  if (d.expiryDate) {
    document.getElementById('discount-expiry').value = d.expiryDate.split('T')[0];
  } else {
    document.getElementById('discount-expiry').value = '';
  }
  
  document.getElementById('discount-global-limit').value = d.globalLimit || '';
  document.getElementById('discount-client-limit').value = d.perClientLimit || '';
  
  const btn = document.querySelector('#admin-discount-form button[type="submit"]');
  btn.innerHTML = '💾 Actualizar Cupón';
  
  window.editingDiscountCode = d.code;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function adminDeleteDiscount(code) {
  if (confirm(`¿Seguro que deseas eliminar el cupón ${code}?`)) {
    deleteDiscount(code);
    showAdminToast('Cupón eliminado', 'info');
    renderActiveTab();
  }
}

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
          <div class="admin-card-header" style="border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
            <h3 class="admin-card-title">Bandeja de Entrada</h3>
            <button class="btn-secondary" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 6px 12px; font-size: 0.85rem;" onclick="deleteAllMessages()">🗑️ Limpiar Historial</button>
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

window.deleteAllMessages = async function() {
  if (confirm('¿Estás seguro de que deseas eliminar TODAS las conversaciones del historial? Esta acción liberará espacio, pero no se puede deshacer.')) {
    try {
      await firebase.database().ref('messages').remove();
      if (typeof showAdminToast === 'function') showAdminToast('🗑️ Historial de mensajes eliminado', 'success');
      currentChatSessionId = null;
      updateAdminMessagesUI();
    } catch (e) {
      console.error(e);
      if (typeof showAdminToast === 'function') showAdminToast('❌ Error al eliminar historial', 'error');
    }
  }
};

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
            ${escapeHTML(lastMsg)}
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
            ${escapeHTML(msg.text)}
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
        <div class="admin-form-group" style="margin-top: 15px; border-top: 1px solid var(--border); padding-top: 15px;">
          <label class="admin-form-label">Probabilidad de Ganar (%)</label>
          <input type="number" id="setting-roulette-probability" class="admin-form-input" value="${config.rouletteWinProbability || '2'}" min="0" max="100" step="1">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px;">De 0 a 100. (Ejemplo: 2 = 2% de los clientes ganarán el premio de la ruleta).</p>
        </div>
      </div>

      <div class="admin-card" style="grid-column: 1 / -1;">
        <div class="admin-card-header">
          <h3 class="admin-card-title">📢 Aviso Inicial (Popup Promocional)</h3>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Activar Popup Promocional</span>
            <input type="checkbox" id="setting-announcement-enabled" ${config.announcementEnabled ? 'checked' : ''} style="width: 24px; height: 24px; accent-color: #0ea5e9; cursor: pointer;">
          </label>
        </div>
        
        <div class="admin-form-group" style="margin-top: 15px;">
          <label class="admin-form-label">Subir Imagen Promocional (Recomendado)</label>
          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
            <input type="file" id="announcement-image-upload" accept="image/*" style="display: none;" onchange="uploadAnnouncementImage(this)">
            <button class="btn btn-secondary" onclick="document.getElementById('announcement-image-upload').click()">📷 Subir Imagen desde el dispositivo</button>
            <span id="announcement-upload-status" style="font-size: 0.9rem; color: var(--text-secondary);"></span>
          </div>
          <div id="announcement-image-preview-container" style="display: ${config.announcementImageUrl ? 'block' : 'none'}; margin-bottom: 15px;">
            <img id="announcement-image-preview" src="${config.announcementImageUrl || ''}" style="max-width: 300px; max-height: 200px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <button class="btn-secondary" style="margin-top: 10px; background: rgba(2ef, 68, 68, 0.1); color: #ef4444;" onclick="removeAnnouncementImage()">🗑️ Quitar Imagen</button>
          </div>
          <input type="hidden" id="setting-announcement-image-url" value="${config.announcementImageUrl || ''}">
        </div>

        <div class="admin-form-group">
          <label class="admin-form-label">Enlace de Redirección (Opcional)</label>
          <div style="display: flex; gap: 10px;">
            <select id="setting-announcement-link-type" class="admin-form-input" style="flex: 1;" onchange="document.getElementById('setting-announcement-link').style.display = this.value === 'external' ? 'block' : 'none'">
              <option value="">(Ninguno)</option>
              <option value="catalog" ${config.announcementLink === 'catalog' ? 'selected' : ''}>Catálogo</option>
              <option value="how-it-works" ${config.announcementLink === 'how-it-works' ? 'selected' : ''}>¿Cómo Funciona?</option>
              <optgroup label="Productos">
                ${typeof PRODUCTS !== 'undefined' ? PRODUCTS.map(p => `<option value="product:${p.id}" ${config.announcementLink === `product:${p.id}` ? 'selected' : ''}>${p.name}</option>`).join('') : ''}
              </optgroup>
              <option value="external" ${config.announcementLink && config.announcementLink.startsWith('http') ? 'selected' : ''}>🌐 URL Externa</option>
            </select>
            <input type="url" id="setting-announcement-link" class="admin-form-input" style="flex: 1; display: ${config.announcementLink && config.announcementLink.startsWith('http') ? 'block' : 'none'};" placeholder="https://..." value="${config.announcementLink && config.announcementLink.startsWith('http') ? config.announcementLink : ''}">
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px;">Si colocas un enlace aquí, el cliente será redirigido al hacer click en el anuncio.</p>
        </div>

        <div class="admin-form-group" style="margin-top: 15px; border-top: 1px solid var(--border); padding-top: 15px;">
          <label class="admin-form-label">Mensaje de Texto (Alternativa a la imagen) <span style="font-weight: 400; color:var(--text-muted);">(Permite HTML básico)</span></label>
          <textarea id="setting-announcement-msg" class="admin-form-textarea" rows="3" placeholder="Si subes una imagen arriba, este texto se ignorará.">${config.announcementMessage || ''}</textarea>
        </div>
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

window.uploadAnnouncementImage = async function(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const status = document.getElementById('announcement-upload-status');
  status.innerText = 'Subiendo... ⏳';
  
  try {
    const url = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
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
          
          const path = 'settings/announcement_' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ imageBase64: base64data, path: path })
          });
          
          if (!res.ok) throw new Error(`Error de servidor: ${res.status}`);
          
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          
          resolve(data.url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Error leyendo el archivo"));
    });

    document.getElementById('setting-announcement-image-url').value = url;
    document.getElementById('announcement-image-preview').src = url;
    document.getElementById('announcement-image-preview-container').style.display = 'block';
    status.innerText = '✅ Subida con éxito';
  } catch (e) {
    console.error('Error uploading:', e);
    status.innerText = '❌ Error al subir';
  }
};

window.removeAnnouncementImage = function() {
  document.getElementById('setting-announcement-image-url').value = '';
  document.getElementById('announcement-image-preview').src = '';
  document.getElementById('announcement-image-preview-container').style.display = 'none';
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
  const announcementImageUrl = document.getElementById('setting-announcement-image-url').value;
  let announcementLink = document.getElementById('setting-announcement-link-type').value;
  if (announcementLink === 'external') {
    announcementLink = document.getElementById('setting-announcement-link').value.trim();
  }
  const enableRouletteEl = document.getElementById('setting-enable-roulette');
  const enableRoulette = enableRouletteEl ? enableRouletteEl.checked : true;
  const rouletteProbEl = document.getElementById('setting-roulette-probability');
  const rouletteWinProbability = rouletteProbEl ? parseInt(rouletteProbEl.value) : 2;
  const termsAndConditions = window.currentTermsEditorData || [];

  saveSettings({ whatsapp, whatsappChannel, instagram, telegram, schedule, maintenance, announcementEnabled, announcementMessage, announcementImageUrl, announcementLink, enableRoulette, rouletteWinProbability, termsAndConditions });
  showAdminToast('✅ Configuración guardada', 'success');
}

// Global polling for admin panel
setInterval(() => {
  // Always update badge
  if (typeof updateAdminSidebarBadges === 'function') updateAdminSidebarBadges();
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




window.fixWalletSpendingBug = async function() {
  if (!confirm("¿Corregir los gastos totales, pedidos, AccessPoints y Cashback de los usuarios?\n\n(Esto recalculará todo basándose en los pedidos completados reales, reembolsando el cashback perdido al Monedero)")) return;
  const btn = document.getElementById('btn-fix-wallet');
  if (btn) btn.innerHTML = "Corrigiendo...";
  
  try {
    const [ordersSnap, usersSnap, withdrawalsSnap] = await Promise.all([
      firebase.database().ref('orders').once('value'),
      firebase.database().ref('users').once('value'),
      firebase.database().ref('withdrawals').once('value')
    ]);
    const ordersData = ordersSnap.val() || {};
    const usersData = usersSnap.val() || {};
    const withdrawalsData = withdrawalsSnap.val() || {};

    const spentMap = {};
    const ordersCountMap = {};
    const pointsEarnedMap = {};  // Puntos GANADOS por compras
    
    // Agrupar pedidos por usuario para calcular el cashback cronológicamente
    const userOrdersMap = {};

    Object.values(ordersData).forEach(o => {
      if ((o.status === 'completed' || o.status === 'completado') && o.userId) {
        if (!userOrdersMap[o.userId]) userOrdersMap[o.userId] = [];
        userOrdersMap[o.userId].push(o);

        if (o.productType !== 'wallet-recharge' && !o.discountCode) {
          const price = Number(o.priceUsd) || 0;
          spentMap[o.userId] = (spentMap[o.userId] || 0) + price;

          const userRole = usersData[o.userId]?.role || 'cliente';
          if (userRole !== 'revendedor') {
            let earnedPoints = 0;
            if (price < 5) earnedPoints = 2;
            else if (price <= 12) earnedPoints = 4;
            else earnedPoints = 7;
            pointsEarnedMap[o.userId] = (pointsEarnedMap[o.userId] || 0) + earnedPoints;
          }
        }
        ordersCountMap[o.userId] = (ordersCountMap[o.userId] || 0) + 1;
      }
    });

    // Calcular cashback esperado re-simulando las compras en orden cronológico
    const expectedCashbackMap = {};
    for (const uid in userOrdersMap) {
      const userRole = usersData[uid]?.role || 'cliente';
      if (userRole === 'revendedor') continue; // Revendedores no tienen cashback

      const orders = userOrdersMap[uid];
      // Ordenar cronológicamente
      orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      let simulatedSpent = 0;
      let totalExpectedCashback = 0;

      orders.forEach(o => {
        if (o.productType !== 'wallet-recharge' && !o.discountCode) {
          const price = Number(o.priceUsd) || 0;
          simulatedSpent += price;

          if (!o.discountCode) {
            const vip = typeof getVipLevel === 'function' ? getVipLevel(simulatedSpent) : { cashback: 0 };
            const cashbackPercent = vip.cashback || 0;
            if (cashbackPercent > 0) {
              totalExpectedCashback += price * (cashbackPercent / 100);
            }
          }
        }
      });
      expectedCashbackMap[uid] = totalExpectedCashback;
    }

    // 2. Calcular puntos GASTADOS por retiros (cashouts) completados o pendientes
    const pointsWithdrawnMap = {};
    Object.values(withdrawalsData).forEach(w => {
      if (w.userId && w.amountPoints && w.status !== 'rejected') {
        pointsWithdrawnMap[w.userId] = (pointsWithdrawnMap[w.userId] || 0) + (Number(w.amountPoints) || 0);
      }
    });

    // 3. Calcular puntos GASTADOS por canjes y CASHBACK RECIBIDO desde las transacciones del usuario
    const pointsRedeemedMap = {};
    const actualCashbackMap = {};

    for (const uid in usersData) {
      if (usersData[uid].transactions) {
        Object.values(usersData[uid].transactions).forEach(tx => {
          // Puntos canjeados
          if (tx.description && tx.description.includes('Canje de') && tx.description.includes('AccessPoints')) {
            const match = tx.description.match(/Canje de (\d+)/);
            if (match) {
              pointsRedeemedMap[uid] = (pointsRedeemedMap[uid] || 0) + parseInt(match[1]);
            }
          }
          // Cashback recibido
          if (tx.description && tx.description.includes('Cashback VIP')) {
            actualCashbackMap[uid] = (actualCashbackMap[uid] || 0) + (Number(tx.amount) || 0);
          }
        });
      }
    }

    const batchUpdates = {};
    let updatedUsers = 0;
    let pointsFixed = 0;
    let cashbackFixed = 0;

    for (const uid in usersData) {
      const actualSpent = spentMap[uid] || 0;
      const actualOrders = ordersCountMap[uid] || 0;
      const userRole = usersData[uid].role || 'cliente';
      
      let changed = false;
      if (usersData[uid].totalSpent !== actualSpent) {
        batchUpdates['users/' + uid + '/totalSpent'] = actualSpent;
        changed = true;
      }
      if (usersData[uid].totalOrders !== actualOrders) {
        batchUpdates['users/' + uid + '/totalOrders'] = actualOrders;
        changed = true;
      }

      // Recalcular puntos y cashback solo para no-revendedores
      if (userRole !== 'revendedor') {
        // --- FIX PUNTOS ---
        const earnedFromPurchases = pointsEarnedMap[uid] || 0;
        const earnedFromReferrals = usersData[uid].referralsEarnedPoints || 0;
        const spentOnWithdrawals = pointsWithdrawnMap[uid] || 0;
        const spentOnRedemptions = pointsRedeemedMap[uid] || 0;

        const correctPoints = (earnedFromPurchases + earnedFromReferrals) - spentOnWithdrawals - spentOnRedemptions;
        const safePoints = Math.max(0, correctPoints);
        const currentPoints = usersData[uid].points || 0;

        if (currentPoints < safePoints) {
          batchUpdates['users/' + uid + '/points'] = safePoints;
          pointsFixed++;
          changed = true;
        }

        // --- FIX CASHBACK ---
        const expectedCashback = expectedCashbackMap[uid] || 0;
        const actualCashback = actualCashbackMap[uid] || 0;
        const missingCashback = expectedCashback - actualCashback;

        // Si falta cashback (mayor a 1 centavo para ignorar errores de redondeo pequeños)
        if (missingCashback > 0.01) {
          const currentWallet = Number(usersData[uid].wallet) || 0;
          batchUpdates['users/' + uid + '/wallet'] = currentWallet + missingCashback;
          
          // Registrar la transacción de compensación
          const newTxRef = firebase.database().ref('users/' + uid + '/transactions').push();
          batchUpdates['users/' + uid + '/transactions/' + newTxRef.key] = {
            id: Date.now().toString(),
            type: 'deposit',
            amount: missingCashback,
            description: `Recuperación de Cashback VIP pendiente (Corrección del sistema)`,
            date: Date.now()
          };
          
          cashbackFixed++;
          changed = true;
        }
      }

      if (changed) updatedUsers++;
    }

    if (Object.keys(batchUpdates).length > 0) {
      await firebase.database().ref().update(batchUpdates);
    }
    
    alert(`✅ Corrección completada:\n\n• Usuarios actualizados: ${updatedUsers}\n• Puntos corregidos: ${pointsFixed} usuarios\n• Cashback recuperado: ${cashbackFixed} usuarios`);
    if (btn) btn.innerHTML = "✨ Corregir Gastos y Puntos";
  } catch (err) {
    alert("Error: " + err.message);
    if (btn) btn.innerHTML = "✨ Corregir Gastos y Puntos";
  }
};

// ════════════════════════════════════════
function renderTournaments(container) {
  let html = `
    <div class="admin-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
      <h2>🏆 Gestión de Torneos</h2>
      <button class="btn btn-primary" onclick="showCreateTournamentModal()" style="padding: 10px 15px; font-size: 0.9rem;">+ Crear Torneo</button>
    </div>
    
    <div id="tournament-stats-bar" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px;"></div>
    
    <div class="admin-card">
      <div id="tournaments-list" style="display: flex; flex-direction: column; gap: 15px;">
        <div style="text-align: center; padding: 20px;"><div class="spinner"></div> Cargando torneos...</div>
      </div>
    </div>
  `;
  container.innerHTML = html;

  firebase.database().ref('tournaments').on('value', snapshot => {
    const listContainer = document.getElementById('tournaments-list');
    const statsBar = document.getElementById('tournament-stats-bar');
    if (!listContainer) return;

    try {
      let torneos = [];
      snapshot.forEach(child => { torneos.push(child.val()); });
      torneos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      // Stats
      if (statsBar) {
        const active = torneos.filter(t => t.status === 'registration_open' || t.status === 'ongoing').length;
        const completed = torneos.filter(t => t.status === 'completed').length;
        let totalP = 0;
        torneos.forEach(t => { totalP += Object.values(t.participants || {}).reduce((acc, p) => acc + 1 + (p.teamMembers ? p.teamMembers.length : 0), 0); });
        statsBar.innerHTML = `
          <div style="background:var(--bg-deep); border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; text-align:center;">
            <div style="font-size:1.6rem; font-weight:800; color:var(--accent-light); font-family:var(--font-display);">${torneos.length}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Total</div>
          </div>
          <div style="background:var(--bg-deep); border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; text-align:center;">
            <div style="font-size:1.6rem; font-weight:800; color:#38bdf8; font-family:var(--font-display);">${active}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Activos</div>
          </div>
          <div style="background:var(--bg-deep); border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; text-align:center;">
            <div style="font-size:1.6rem; font-weight:800; color:#4ade80; font-family:var(--font-display);">${completed}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Completados</div>
          </div>
          <div style="background:var(--bg-deep); border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px; text-align:center;">
            <div style="font-size:1.6rem; font-weight:800; color:#fbbf24; font-family:var(--font-display);">${totalP}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Participantes</div>
          </div>
        `;
      }

      if (torneos.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 20px;">No hay torneos creados aún.</p>';
        return;
      }

      let listHtml = '';
      torneos.forEach(torneo => {
        const participants = torneo.participants || {};
        const count = Object.values(participants).reduce((acc, p) => acc + 1 + (p.teamMembers ? p.teamMembers.length : 0), 0);
        const max = torneo.maxParticipants || 100;
        const status = torneo.status || 'upcoming';
        const title = torneo.title || 'Torneo Sin Nombre';
        const productName = torneo.productName || 'Producto Desconocido';
        
        let badgeColor = '#ffb74d';
        if (status === 'registration_open') badgeColor = '#42a5f5';
        if (status === 'ongoing') badgeColor = '#8b5cf6';
        if (status === 'completed') badgeColor = '#66bb6a';

        let dateStr = 'Fecha desconocida';
        try { if (torneo.createdAt) dateStr = new Date(torneo.createdAt).toLocaleDateString(); } catch(e) {}
        
        let deadlineStr = '';
        if (torneo.registrationDeadline) {
          try { deadlineStr = ' | Cierre: ' + new Date(torneo.registrationDeadline).toLocaleString(); } catch(e) {}
        }

        // Winners display
        const winners = torneo.winners || [];
        let winnersDisplay = '';
        if (torneo.winnerName) winnersDisplay = `<p style="margin: 5px 0 0 0; color: gold; font-weight: bold;">👑 Ganador: ${torneo.winnerName}</p>`;
        if (winners.length > 0) {
          const medals = ['👑', '🥈', '🥉', '🏅', '🎖️'];
          winnersDisplay = '<div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">';
          winners.forEach((w, i) => {
            winnersDisplay += `<span style="background:rgba(255,215,0,0.08); border:1px solid rgba(255,215,0,0.2); padding:3px 10px; border-radius:20px; font-size:0.8rem; color:#fbbf24;">${medals[i] || '🏅'} ${w.name} ${w.reward ? '(' + w.reward + ')' : ''}</span>`;
          });
          winnersDisplay += '</div>';
        }

        // Game mode
        const modeLabels = { solo: '👤 Solo', duo: '👥 Dúo', squad: '🎯 Escuadras' };
        const modeStr = torneo.gameMode ? ` | ${modeLabels[torneo.gameMode] || torneo.gameMode}` : '';

        listHtml += `
          <details style="background: var(--bg-deep); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 15px; margin-bottom: 10px;">
            <summary style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; list-style:none; outline:none;">
              <div style="display:flex; align-items:center; gap: 10px; flex-wrap:wrap;">
                <h3 style="margin:0; font-family: var(--font-display); font-size:1.1rem;">${title}</h3>
                <span style="background: ${badgeColor}20; color: ${badgeColor}; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; border: 1px solid ${badgeColor}40;">${status.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div style="font-size: 0.85rem; color: var(--text-secondary); display:flex; align-items:center; gap:10px;">
                <span>👥 ${count} / ${max}</span>
                <span style="color:var(--text-primary);">▼</span>
              </div>
            </summary>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; flex-wrap: wrap; gap: 20px; justify-content: space-between; align-items: flex-start;">
              <div style="flex: 1; min-width: 250px;">
                <p style="margin: 0 0 5px 0; font-size: 0.85rem; color: var(--text-secondary);">
                  🎮 <strong>${productName}</strong>${modeStr}
                </p>
                <p style="margin: 0 0 5px 0; font-size: 0.85rem; color: var(--text-secondary);">
                  📅 ${dateStr}${deadlineStr}
                </p>
                ${winnersDisplay}
              </div>
              
              <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items:center; justify-content:flex-end; max-width: 600px;">
                <select class="admin-form-input" style="width: auto; padding: 6px 10px; font-size:0.82rem; background: var(--bg-deep); margin-bottom:5px;" onchange="updateTournamentStatus('${torneo.id}', this.value)">
                  <option value="upcoming" ${status === 'upcoming' ? 'selected' : ''}>📅 Próximo</option>
                  <option value="registration_open" ${status === 'registration_open' ? 'selected' : ''}>📝 Inscripción</option>
                  <option value="ongoing" ${status === 'ongoing' ? 'selected' : ''}>⚔️ En Curso</option>
                  <option value="completed" ${status === 'completed' ? 'selected' : ''}>✅ Finalizado</option>
                </select>
                <button class="btn btn-secondary" onclick="viewTournamentParticipants('${torneo.id}')" style="padding: 6px 12px; font-size: 0.82rem; margin-bottom:5px;">👥 Inscritos</button>
                <button class="btn btn-primary" onclick="manageTournamentResults('${torneo.id}')" style="padding: 6px 12px; font-size: 0.82rem; margin-bottom:5px;">📊 Resultados</button>
                
                <div style="width: 100%; height: 0;"></div> <!-- Force break -->
                
                ${status === 'completed' ? `<button class="btn btn-secondary" onclick="sorteoTournament('${torneo.id}')" style="padding: 6px 12px; font-size: 0.82rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);" title="Sorteo">🎲 Sorteo</button>` : ''}
                <button class="btn btn-secondary" onclick="manageTournamentCredentials('${torneo.id}')" style="padding: 6px 12px; font-size: 0.82rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);" title="Credenciales Sala">🔑 Credenciales</button>
                <button class="btn btn-secondary" onclick="editTournament('${torneo.id}')" style="padding: 6px 12px; font-size: 0.82rem; background:rgba(14, 165, 233, 0.1); border:1px solid rgba(14, 165, 233, 0.3); color:#38bdf8;" title="Editar">✏️ Editar</button>
                <button class="btn btn-secondary" onclick="duplicateTournament('${torneo.id}')" style="padding: 6px 12px; font-size: 0.82rem; background:transparent; border:1px solid rgba(255,255,255,0.1);" title="Duplicar">📋 Duplicar</button>
                <button class="btn btn-secondary" onclick="deleteTournament('${torneo.id}')" style="padding: 6px 12px; font-size: 0.82rem; background:transparent; border:1px solid rgba(239, 68, 68, 0.3); color:#ef4444;" title="Eliminar">🗑️ Eliminar</button>
              </div>
            </div>
          </details>
        `;
      });
      listContainer.innerHTML = listHtml;
    } catch(err) {
      listContainer.innerHTML = '<div style="color:red; padding: 20px;">Error: ' + err.message + '</div>';
    }
  });
}

window.updateTournamentStatus = function(id, newStatus) {
  if (confirm('¿Cambiar el estado de este torneo a ' + newStatus.replace('_',' ') + '?')) {
    firebase.database().ref('tournaments/' + id).update({ status: newStatus });
  }
};

window.deleteTournament = function(id) {
  if (confirm('¿Estás seguro de eliminar este torneo por completo? Esta acción no se puede deshacer.')) {
    firebase.database().ref('tournaments/' + id).remove();
  }
};

window.editTournament = function(id) {
  firebase.database().ref('tournaments/' + id).once('value').then(snap => {
    const torneo = snap.val();
    if (!torneo) return alert('Torneo no encontrado.');

    let deadlineValue = '';
    if (torneo.registrationDeadline) {
      // Input datetime-local expects YYYY-MM-DDTHH:MM
      const d = new Date(torneo.registrationDeadline);
      const pad = (n) => n.toString().padStart(2, '0');
      deadlineValue = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    let prizesHtml = '';
    const prizes = torneo.prizes || [];
    if (prizes.length > 0) {
      const medals = ['🥇', '🥈', '🥉', '🏅', '🎖️', '⭐'];
      prizes.forEach((p, i) => {
        prizesHtml += `
          <div style="display:flex; gap:8px; align-items:center;">
            <span style="font-size:1.2rem; min-width:28px;">${medals[i] || '🎖️'}</span>
            <input type="text" class="admin-form-input ct-prize-input" value="${p.reward || ''}" placeholder="${i+1}° lugar" style="flex:1; padding:8px 10px;">
          </div>
        `;
      });
    } else {
      // Default empty if none exist
      prizesHtml = `
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="font-size:1.2rem; min-width:28px;">🥇</span>
          <input type="text" class="admin-form-input ct-prize-input" value="${torneo.prize || ''}" placeholder="1er lugar" style="flex:1; padding:8px 10px;">
        </div>
      `;
    }

    let html = `
      <div style="padding: 20px; max-height:80vh; overflow-y:auto;">
        <h3>✏️ Editar Torneo</h3>
        
        <form id="edit-tournament-form" style="display: flex; flex-direction: column; gap: 14px; margin-top:15px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Modo de Juego</label>
              <select id="et-gamemode" class="admin-form-input" style="width: 100%; padding: 10px;">
                <option value="">Libre</option>
                <option value="solo" ${torneo.gameMode === 'solo' ? 'selected' : ''}>👤 Solo</option>
                <option value="duo" ${torneo.gameMode === 'duo' ? 'selected' : ''}>👥 Dúo</option>
                <option value="squad" ${torneo.gameMode === 'squad' ? 'selected' : ''}>🎯 Escuadras</option>
              </select>
            </div>
          </div>
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Título del Torneo</label>
              <input type="text" id="et-title" class="admin-form-input" style="width: 100%; padding: 10px;" value="${torneo.title || ''}" required>
            </div>
            <div>
              <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Precio por Kill ($ USD)</label>
              <input type="number" step="0.01" min="0" id="et-price-per-kill" class="admin-form-input" style="width: 100%; padding: 10px;" value="${torneo.pricePerKill || '0.00'}">
            </div>
          </div>
          
          <div>
            <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Descripción / Reglas</label>
            <textarea id="et-description" class="admin-form-input" style="width: 100%; padding: 10px; min-height:80px; resize:vertical;">${torneo.description || ''}</textarea>
          </div>
          
          <div>
            <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Imagen del Banner</label>
            <div style="display:flex; gap:10px;">
              <input type="text" id="et-banner" class="admin-form-input" style="flex:1; padding: 10px;" value="${torneo.bannerUrl || ''}" placeholder="URL o subir desde dispositivo...">
              <button type="button" id="et-banner-btn" class="btn btn-secondary" onclick="uploadTournamentBanner('et-banner', 'et-banner-btn')" style="padding: 0 15px; flex-shrink: 0;">🖼️ Subir</button>
            </div>
          </div>
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Participantes Máximos</label>
              <input type="number" id="et-max" class="admin-form-input" style="width: 100%; padding: 10px;" value="${torneo.maxParticipants || 100}" min="2" required>
            </div>
            <div>
              <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Cierre de Inscripciones</label>
              <input type="datetime-local" id="et-deadline" class="admin-form-input" style="width: 100%; padding: 10px;" value="${deadlineValue}">
            </div>
          </div>
          
          <div>
            <label class="admin-form-label" style="margin-bottom: 5px; display: block;">🏅 Premios</label>
            <div id="et-prizes-list" style="display:flex; flex-direction:column; gap:8px;">
              ${prizesHtml}
            </div>
            <button type="button" onclick="addEditPrizeRow()" style="margin-top:6px; background:none; border:1px dashed var(--border); color:var(--text-muted); padding:6px 12px; border-radius:var(--radius-sm); cursor:pointer; font-size:0.8rem;">+ Agregar premio</button>
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    `;
    openAdminModal(html);

    setTimeout(() => {
      document.getElementById('edit-tournament-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('et-title').value.trim();
        const description = document.getElementById('et-description').value.trim();
        const gameMode = document.getElementById('et-gamemode').value;
        const maxP = parseInt(document.getElementById('et-max').value) || 100;
        const deadline = document.getElementById('et-deadline').value;
        const bannerUrl = document.getElementById('et-banner').value.trim();
        const pricePerKill = parseFloat(document.getElementById('et-price-per-kill').value) || 0;
        
        const prizeInputs = document.querySelectorAll('#et-prizes-list .ct-prize-input');
        const places = ['1er Lugar', '2do Lugar', '3er Lugar', '4to Lugar', '5to Lugar', '6to Lugar'];
        const newPrizes = [];
        prizeInputs.forEach((input, i) => {
          const val = input.value.trim();
          if (val) newPrizes.push({ place: places[i] || (i + 1) + '° Lugar', reward: val });
        });
        
        const updateData = {
          title: title,
          description: description || null,
          gameMode: gameMode || null,
          maxParticipants: maxP,
          pricePerKill: pricePerKill,
          bannerUrl: bannerUrl || null,
          prizes: newPrizes.length > 0 ? newPrizes : null,
          prize: newPrizes.length > 0 ? newPrizes[0].reward : null
        };
        
        if (deadline) {
          updateData.registrationDeadline = new Date(deadline).toISOString();
        } else {
          updateData.registrationDeadline = null;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Guardando...';

        firebase.database().ref('tournaments/' + id).update(updateData).then(() => {
          alert('✅ Torneo actualizado correctamente.');
          closeAdminModal();
        }).catch(err => {
          alert('Error: ' + err.message);
          submitBtn.disabled = false;
          submitBtn.innerText = 'Guardar Cambios';
        });
      });
    }, 100);
  });
};

window.addEditPrizeRow = function() {
  const list = document.getElementById('et-prizes-list');
  const count = list.children.length + 1;
  const medals = ['🥇', '🥈', '🥉', '🏅', '🎖️', '⭐'];
  const div = document.createElement('div');
  div.style.cssText = 'display:flex; gap:8px; align-items:center;';
  div.innerHTML = `
    <span style="font-size:1.2rem; min-width:28px;">${medals[count - 1] || '🎖️'}</span>
    <input type="text" class="admin-form-input ct-prize-input" placeholder="${count}° lugar" style="flex:1; padding:8px 10px;">
  `;
  list.appendChild(div);
};

window.duplicateTournament = function(id) {
  firebase.database().ref('tournaments/' + id).once('value').then(snap => {
    const torneo = snap.val();
    if (!torneo) return alert('Torneo no encontrado.');
    const newId = 'torneo-manual-' + (torneo.productId || 'custom') + '-' + Date.now();
    const newTorneo = { ...torneo };
    newTorneo.id = newId;
    newTorneo.createdAt = new Date().toISOString();
    newTorneo.status = 'registration_open';
    newTorneo.title = torneo.title + ' (Copia)';
    delete newTorneo.participants;
    delete newTorneo.winners;
    delete newTorneo.winnerName;
    delete newTorneo.leaderboard;
    if (torneo.registrationDeadline) {
      const oldDate = new Date(torneo.registrationDeadline);
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 7);
      newTorneo.registrationDeadline = newDate.toISOString();
    }
    firebase.database().ref('tournaments/' + newId).set(newTorneo).then(() => {
      alert('✅ Torneo duplicado exitosamente.');
    });
  });
};

window.viewTournamentParticipants = function(id) {
  firebase.database().ref('tournaments/' + id).once('value').then(snap => {
    const torneo = snap.val();
    const participants = torneo.participants || {};
    const pList = Object.values(participants);
    
    let tableRows = '';
    if (pList.length === 0) {
      tableRows = '<tr><td colspan="6" style="text-align:center; padding: 15px;">Nadie se ha inscrito aún.</td></tr>';
    } else {
      pList.forEach((p, i) => {
        let teamInfo = '';
        if (p.teamMembers && p.teamMembers.length > 0) {
          teamInfo = `<br><span style="font-size:0.75rem; color:var(--accent);">👥 Equipo: ` + p.teamMembers.map(tm => `${tm.gameName} (${tm.gameId})`).join(', ') + `</span>`;
        }
        let paymentBadge = '';
        let paymentActions = '';
        if (p.paymentStatus === 'pending_payment') {
          paymentBadge = `<span style="background:rgba(245,158,11,0.2); color:#fbbf24; padding:2px 6px; border-radius:4px; font-size:0.7rem; display:inline-block; margin-bottom:4px;">⏳ Pendiente</span><br><span style="font-size:0.7rem; color:var(--text-muted);">Ref: ${p.paymentRef || 'N/A'}</span>`;
          paymentActions = `
            <button class="btn btn-primary" onclick="approveTournamentPayment('${id}', '${p.uid}')" style="padding: 4px; font-size: 1rem; background:transparent; border:none; box-shadow:none; color:#4ade80;" title="Aprobar Pago">✅</button>
            <button class="btn btn-secondary" onclick="rejectTournamentPayment('${id}', '${p.uid}')" style="padding: 4px; font-size: 1rem; background:transparent; border:none; box-shadow:none; color:#ef4444;" title="Rechazar Pago">❌</button>
          `;
        } else if (p.paymentStatus === 'approved') {
          paymentBadge = `<span style="background:rgba(34,197,94,0.2); color:#4ade80; padding:2px 6px; border-radius:4px; font-size:0.7rem;">✅ Aprobado (${p.paymentMethod})</span>`;
        } else if (p.paymentStatus === 'rejected') {
          paymentBadge = `<span style="background:rgba(239,68,68,0.2); color:#f87171; padding:2px 6px; border-radius:4px; font-size:0.7rem;">❌ Rechazado</span>`;
        } else {
          paymentBadge = `<span style="font-size:0.7rem; color:var(--text-muted);">Gratis</span>`;
        }
        
        tableRows += `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 8px;">${i + 1}</td>
            <td style="padding: 8px;">${p.name || 'Sin nombre'}</td>
            <td style="padding: 8px;">${p.gameName || '-'}${teamInfo}</td>
            <td style="padding: 8px;">${p.gameId || '-'}</td>
            <td style="padding: 8px; text-align: center;">${paymentBadge}</td>
            <td style="padding: 8px;">${new Date(p.joinedAt).toLocaleString()}</td>
            <td style="padding: 8px; text-align: center; white-space: nowrap;">
              ${paymentActions}
              <button class="btn btn-secondary" onclick="removeParticipant('${id}', '${p.uid}')" style="padding: 4px; font-size: 1rem; color: #ef4444; border:none; background:transparent;" title="Expulsar">🗑️</button>
            </td>
          </tr>
        `;
      });
    }
    
    let html = `
      <div style="padding: 20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:15px;">
          <div>
            <h3>👥 Inscritos: ${torneo.title}</h3>
            <p style="color:var(--text-muted); font-size:0.9rem;">Total: ${pList.length} participantes</p>
          </div>
          <button class="btn btn-secondary" onclick="exportParticipantsCSV('${id}')" style="padding:8px 14px; font-size:0.85rem;">📥 Exportar CSV</button>
        </div>
        <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-sm);">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border); background:rgba(255,255,255,0.02);">
                <th style="padding: 10px; text-align: left;">#</th>
                <th style="padding: 10px; text-align: left;">Nombre</th>
                <th style="padding: 10px; text-align: left;">IGN</th>
                <th style="padding: 10px; text-align: left;">Game ID</th>
                <th style="padding: 10px; text-align: center;">Estado/Pago</th>
                <th style="padding: 10px; text-align: left;">Fecha</th>
                <th style="padding: 10px; text-align: center;">Acción</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        <div style="margin-top: 20px; text-align: right;">
          <button class="btn btn-secondary" onclick="closeAdminModal()">Cerrar</button>
        </div>
      </div>
    `;
    openAdminModal(html);
  });
};

window.removeParticipant = function(tournamentId, userId) {
  if (confirm('¿Estás seguro de expulsar a este participante del torneo?')) {
    firebase.database().ref('tournaments/' + tournamentId + '/participants/' + userId).remove().then(() => {
      alert('Participante eliminado.');
      viewTournamentParticipants(tournamentId);
    }).catch(err => {
      alert('Error: ' + err.message);
    });
  }
};

window.approveTournamentPayment = function(tournamentId, userId) {
  if (confirm('¿Aprobar el pago de esta inscripción?')) {
    firebase.database().ref(`tournaments/${tournamentId}/participants/${userId}`).update({
      paymentStatus: 'approved'
    }).then(() => {
      alert('Pago aprobado.');
      viewTournamentParticipants(tournamentId);
    }).catch(err => alert('Error: ' + err.message));
  }
};

window.rejectTournamentPayment = function(tournamentId, userId) {
  if (confirm('¿Rechazar el pago de esta inscripción? El estado cambiará a rechazado.')) {
    firebase.database().ref(`tournaments/${tournamentId}/participants/${userId}`).update({
      paymentStatus: 'rejected'
    }).then(() => {
      alert('Pago rechazado.');
      viewTournamentParticipants(tournamentId);
    }).catch(err => alert('Error: ' + err.message));
  }
};

window.exportParticipantsCSV = function(id) {
  firebase.database().ref('tournaments/' + id).once('value').then(snap => {
    const torneo = snap.val();
    const participants = Object.values(torneo.participants || {});
    if (participants.length === 0) return alert('No hay participantes para exportar.');
    
    let csv = 'Nombre,IGN,Game ID,Email,Fecha Inscripcion,Miembros Equipo\n';
    participants.forEach(p => {
      let teamStr = '';
      if (p.teamMembers && p.teamMembers.length > 0) {
        teamStr = p.teamMembers.map(tm => `${tm.gameName} (${tm.gameId})`).join(' | ');
      }
      csv += `"${p.name || ''}","${p.gameName || ''}","${p.gameId || ''}","${p.email || ''}","${p.joinedAt || ''}","${teamStr}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes_${torneo.title.replace(/\s/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
};

// ── Sorteo Animado ──
window.sorteoTournament = function(id) {
  firebase.database().ref('tournaments/' + id).once('value').then(snap => {
    const torneo = snap.val();
    const participants = Object.values(torneo.participants || {});
    if (participants.length < 2) return alert('Se necesitan al menos 2 participantes para sortear.');

    const numWinners = parseInt(prompt('¿Cuántos ganadores quieres sortear? (1-' + Math.min(participants.length, 5) + ')')) || 1;
    if (numWinners < 1 || numWinners > participants.length) return alert('Número inválido.');
    
    // Shuffle and pick winners
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, numWinners);
    
    // Animated sorteo modal
    let html = '<div style="padding:30px; text-align:center;">';
    html += '<h2 style="margin-bottom:20px; font-family:var(--font-display);">🎲 Sorteo en Curso...</h2>';
    html += '<div id="sorteo-display" style="font-size:1.5rem; padding:30px; background:var(--bg-deep); border-radius:var(--radius-md); border:2px solid var(--accent); margin-bottom:20px; min-height:80px; display:flex; align-items:center; justify-content:center; font-family:var(--font-display);"></div>';
    html += '<div id="sorteo-results" style="display:none;"></div>';
    html += '<div id="sorteo-actions" style="display:none; margin-top:20px; display:flex; gap:10px; justify-content:center;">';
    html += `<button class="btn btn-primary" id="sorteo-save-btn" onclick="saveSorteoResults('${id}')" style="display:none;">✅ Guardar Ganadores</button>`;
    html += '<button class="btn btn-secondary" onclick="closeAdminModal()">Cerrar</button>';
    html += '</div></div>';
    
    openAdminModal(html);
    
    const display = document.getElementById('sorteo-display');
    const allNames = participants.map(p => p.gameName || p.name || 'Jugador');
    let tick = 0;
    const totalTicks = 40;
    
    const interval = setInterval(() => {
      tick++;
      const randomName = allNames[Math.floor(Math.random() * allNames.length)];
      display.textContent = randomName;
      display.style.color = tick > totalTicks - 10 ? '#fbbf24' : 'var(--text-primary)';
      
      if (tick >= totalTicks) {
        clearInterval(interval);
        
        // Show final winners
        const medals = ['👑', '🥈', '🥉', '🏅', '🎖️'];
        display.innerHTML = '<span style="color:#fbbf24; font-size:2rem;">🎉 ¡Tenemos ganadores!</span>';
        
        const resultsDiv = document.getElementById('sorteo-results');
        resultsDiv.style.display = 'block';
        
        let resultsHtml = '';
        winners.forEach((w, i) => {
          const reward = prompt(`Premio para ${medals[i]} ${w.gameName || w.name} (${i + 1}° lugar):`) || 'Premio especial';
          w._reward = reward;
          w._place = (i + 1) + '° Lugar';
          resultsHtml += `<div style="display:flex; align-items:center; gap:12px; padding:12px; margin:8px 0; background:rgba(255,215,0,0.05); border-radius:var(--radius-sm); border:1px solid rgba(255,215,0,0.15);">
            <span style="font-size:1.8rem;">${medals[i] || '🏅'}</span>
            <div style="text-align:left;">
              <div style="font-weight:700; color:#fbbf24; font-size:1.1rem;">${w.gameName || w.name}</div>
              <div style="font-size:0.85rem; color:var(--text-secondary);">${w._place} — ${reward}</div>
            </div>
          </div>`;
        });
        resultsDiv.innerHTML = resultsHtml;
        
        // Store winners data for saving
        window._sorteoWinners = winners;
        document.getElementById('sorteo-save-btn').style.display = 'inline-block';
      }
    }, 80 + tick * 3);
  });
};

window.saveSorteoResults = function(id) {
  if (!window._sorteoWinners) return;
  const winnersData = window._sorteoWinners.map(w => ({
    name: w.gameName || w.name,
    place: w._place,
    reward: w._reward,
    uid: w.uid || null
  }));
  
  firebase.database().ref('tournaments/' + id).update({
    winners: winnersData,
    winnerName: winnersData.map(w => w.name).join(', '),
    status: 'completed'
  }).then(() => {
    alert('✅ Ganadores guardados exitosamente.');
    closeAdminModal();
    delete window._sorteoWinners;
  });
};

// ── Manage Results / Leaderboard ──
window.manageTournamentResults = function(id) {
  firebase.database().ref('tournaments/' + id).once('value').then(snap => {
    const torneo = snap.val();
    const leaderboard = torneo.leaderboard || [];
    const participants = torneo.participants || {};
    
    // Flatten participants into individual players
    let allPlayers = [];
    Object.values(participants).forEach(p => {
      const pName = p.gameName || p.name || 'Sin Nombre';
      if (!allPlayers.includes(pName)) allPlayers.push(pName);
      
      if (p.teamMembers && p.teamMembers.length > 0) {
        p.teamMembers.forEach(tm => {
          const tmName = tm.gameName || 'Compañero';
          if (!allPlayers.includes(tmName)) allPlayers.push(tmName);
        });
      }
    });
    
    // Add any players from the existing leaderboard that might not be in participants (e.g. manual additions)
    leaderboard.forEach(entry => {
      if (entry.playerName && !allPlayers.includes(entry.playerName)) {
        allPlayers.push(entry.playerName);
      }
    });
    
    // Build lookup for existing kills
    const killsMap = {};
    leaderboard.forEach(entry => {
      killsMap[entry.playerName] = entry.kills || 0;
    });
    
    // Build grouped rows
    let leaderboardRows = '';
    const groupedParticipants = Object.values(participants);
    
    if (groupedParticipants.length > 0 || leaderboard.length > 0) {
      let index = 1;
      
      groupedParticipants.forEach((p) => {
        const teamType = (p.teamMembers && p.teamMembers.length > 0) ? (p.teamMembers.length === 1 ? 'Dúo' : 'Escuadra') : 'Solo';
        const pName = p.gameName || p.name || 'Sin Nombre';
        
        if (teamType !== 'Solo') {
          leaderboardRows += `
            <tr style="background:rgba(255,255,255,0.05);">
              <td colspan="3" style="padding:6px 10px; font-size:0.75rem; color:var(--accent); font-weight:bold; text-transform:uppercase;">
                👥 Equipo ${teamType} - Líder: ${pName}
              </td>
            </tr>
          `;
        }
        
        // Captain row
        const capKills = killsMap[pName] || 0;
        leaderboardRows += `
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:8px; color:var(--text-muted);">${index++}</td>
            <td style="padding:8px; font-weight:500;">${pName} ${teamType !== 'Solo' ? '<span style="font-size:0.7rem; color:var(--text-muted);">(Líder)</span>' : ''}</td>
            <td style="padding:8px;">
              <input type="number" class="admin-form-input bulk-kill-input" data-player="${pName.replace(/"/g, '&quot;')}" value="${capKills}" min="0" style="width:70px; padding:6px; margin:0;">
            </td>
          </tr>
        `;
        
        // Team members rows
        if (p.teamMembers && p.teamMembers.length > 0) {
          p.teamMembers.forEach(tm => {
            const tmName = tm.gameName || 'Compañero';
            const tmKills = killsMap[tmName] || 0;
            leaderboardRows += `
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:8px; color:var(--text-muted);">${index++}</td>
                <td style="padding:8px;">${tmName}</td>
                <td style="padding:8px;">
                  <input type="number" class="admin-form-input bulk-kill-input" data-player="${tmName.replace(/"/g, '&quot;')}" value="${tmKills}" min="0" style="width:70px; padding:6px; margin:0;">
                </td>
              </tr>
            `;
          });
        }
      });
      
      // Also render players in leaderboard that aren't in participants (manual additions)
      leaderboard.forEach(entry => {
        if (entry.playerName && !allPlayers.includes(entry.playerName)) {
          leaderboardRows += `
            <tr style="border-bottom:1px solid var(--border);">
              <td style="padding:8px; color:var(--text-muted);">${index++}</td>
              <td style="padding:8px;">${entry.playerName} <span style="font-size:0.7rem; color:var(--text-muted);">(Manual)</span></td>
              <td style="padding:8px;">
                <input type="number" class="admin-form-input bulk-kill-input" data-player="${entry.playerName.replace(/"/g, '&quot;')}" value="${entry.kills}" min="0" style="width:70px; padding:6px; margin:0;">
              </td>
            </tr>
          `;
        }
      });
      
    } else {
      leaderboardRows = '<tr><td colspan="3" style="text-align:center; padding:15px; color:var(--text-muted);">No hay jugadores inscritos</td></tr>';
    }

    let html = `
      <div style="padding:20px;">
        <h3>📊 Resultados: ${torneo.title}</h3>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:20px;">${torneo.productName || ''}</p>
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h4 style="margin:0;">📋 Kills Individuales</h4>
          <button class="btn btn-primary" onclick="saveBulkLeaderboard('${id}')" style="padding:8px 15px;">💾 Guardar Puntuaciones</button>
        </div>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">Ingresa las kills exactas de cada jugador individual. Los que tengan 0 no aparecerán en el top.</p>
        
        <div style="max-height:400px; overflow-y:auto; border:1px solid var(--border); border-radius:var(--radius-sm);">
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid var(--border); background:rgba(255,255,255,0.02);">
                <th style="padding:8px; text-align:left; width:40px;">#</th>
                <th style="padding:8px; text-align:left;">Jugador</th>
                <th style="padding:8px; text-align:left; width:100px;">Kills</th>
              </tr>
            </thead>
            <tbody>${leaderboardRows}</tbody>
          </table>
        </div>
        
        <div style="margin-top: 25px; background: rgba(0, 210, 255, 0.05); border: 1px solid rgba(0, 210, 255, 0.2); padding: 15px; border-radius: var(--radius-sm);">
          <h4 style="margin-bottom: 8px; color: var(--accent-light);">📸 Capturas de Resultados</h4>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">Sube los captures de pantalla de las posiciones finales para que los usuarios puedan verlas en los detalles del torneo.</p>
          
          <div id="results-images-preview" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px;">
            ${(torneo.resultImages || []).map((imgUrl, idx) => `
              <div style="position:relative; width:80px; height:80px; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1);">
                <img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;">
                <button onclick="removeResultImage('${id}', ${idx})" style="position:absolute; top:2px; right:2px; background:rgba(239, 68, 68, 0.9); color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
              </div>
            `).join('')}
          </div>
          
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <input type="text" id="result-image-url" class="admin-form-input" style="flex: 1; padding: 6px; min-width: 200px;" placeholder="Pega URL o usa 'Subir Archivo'...">
            <button class="btn btn-primary" onclick="addResultImage('${id}', 'result-image-url')" style="padding: 8px 15px; font-size: 0.85rem;">+ Link</button>
            <button class="btn btn-secondary" id="btn-upload-result-img" onclick="uploadTournamentResultImage('${id}', 'btn-upload-result-img')" style="padding: 8px 15px; font-size: 0.85rem;">⬆️ Subir Archivo</button>
          </div>
        </div>
        
        <div style="margin-top: 20px; text-align: right;">
          <button class="btn btn-secondary" onclick="closeAdminModal()">Cerrar</button>
        </div>
      </div>
    `;
    openAdminModal(html);
  });
};

window.saveBulkLeaderboard = function(id) {
  const inputs = document.querySelectorAll('.bulk-kill-input');
  const newLeaderboard = [];
  
  inputs.forEach(input => {
    const kills = parseInt(input.value) || 0;
    const playerName = input.getAttribute('data-player');
    // Save EVERYONE, even with 0 kills, as requested by the user
    newLeaderboard.push({ playerName, kills });
  });
  
  newLeaderboard.sort((a, b) => (b.kills || 0) - (a.kills || 0));
  
  firebase.database().ref('tournaments/' + id + '/leaderboard').set(newLeaderboard).then(() => {
    alert('✅ Puntuaciones guardadas exitosamente.');
    manageTournamentResults(id);
  });
};

// Se mantienen por compatibilidad, aunque ya no se usan en la nueva UI
window.addLeaderboardEntry = function(id) {
  const playerName = document.getElementById('lb-player').value.trim();
  const kills = parseInt(document.getElementById('lb-kills').value) || 0;
  if (!playerName) return alert('Escribe el nombre del jugador.');
  
  firebase.database().ref('tournaments/' + id + '/leaderboard').once('value').then(snap => {
    const leaderboard = snap.val() || [];
    leaderboard.push({ playerName, kills });
    leaderboard.sort((a, b) => (b.kills || 0) - (a.kills || 0));
    firebase.database().ref('tournaments/' + id + '/leaderboard').set(leaderboard).then(() => {
      manageTournamentResults(id);
    });
  });
};

window.removeLeaderboardEntry = function(id, index) {
  firebase.database().ref('tournaments/' + id + '/leaderboard').once('value').then(snap => {
    const leaderboard = snap.val() || [];
    leaderboard.splice(index, 1);
    firebase.database().ref('tournaments/' + id + '/leaderboard').set(leaderboard).then(() => {
      manageTournamentResults(id);
    });
  });
};

window.addWinner = function(id) {
  const name = document.getElementById('winner-name').value.trim();
  const place = document.getElementById('winner-place').value.trim() || '1° Lugar';
  const reward = document.getElementById('winner-reward').value.trim();
  
  if (!name || !reward) return alert('Debes incluir el nombre y el premio.');
  
  firebase.database().ref('tournaments/' + id + '/winners').once('value').then(snap => {
    const winners = snap.val() || [];
    winners.push({ name, place, reward });
    firebase.database().ref('tournaments/' + id).update({
      winners: winners,
      status: 'completed',
      winnerName: winners.map(w => w.name).join(', ')
    }).then(() => {
      manageTournamentResults(id);
    });
  });
};

window.clearWinners = function(id) {
  if (confirm('¿Estás seguro de borrar todos los ganadores actuales?')) {
    firebase.database().ref('tournaments/' + id).update({
      winners: null,
      winnerName: null
    }).then(() => {
      manageTournamentResults(id);
    });
  }
};

window.addResultImage = function(id, inputId) {
  const url = document.getElementById(inputId).value.trim();
  if (!url) return alert('Debes ingresar una URL.');
  
  firebase.database().ref('tournaments/' + id + '/resultImages').once('value').then(snap => {
    const images = snap.val() || [];
    images.push(url);
    firebase.database().ref('tournaments/' + id + '/resultImages').set(images).then(() => {
      manageTournamentResults(id);
    });
  });
};

window.removeResultImage = function(id, index) {
  if (!confirm('¿Eliminar esta captura?')) return;
  firebase.database().ref('tournaments/' + id + '/resultImages').once('value').then(snap => {
    const images = snap.val() || [];
    images.splice(index, 1);
    firebase.database().ref('tournaments/' + id + '/resultImages').set(images).then(() => {
      manageTournamentResults(id);
    });
  });
};

window.uploadTournamentResultImage = function(id, btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check size limit (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 5MB.");
      return;
    }
    
    btn.disabled = true;
    btn.innerText = 'Subiendo...';
    
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(`tournaments/results/${id}_${Date.now()}_${file.name}`);
    
    fileRef.put(file).then(snapshot => {
      return snapshot.ref.getDownloadURL();
    }).then(downloadURL => {
      // Add to database
      firebase.database().ref('tournaments/' + id + '/resultImages').once('value').then(snap => {
        const images = snap.val() || [];
        images.push(downloadURL);
        firebase.database().ref('tournaments/' + id + '/resultImages').set(images).then(() => {
          btn.disabled = false;
          btn.innerText = '⬆️ Subir Archivo';
          manageTournamentResults(id);
        });
      });
    }).catch(error => {
      console.error("Upload error:", error);
      alert("Error al subir imagen: " + error.message);
      btn.disabled = false;
      btn.innerText = '⬆️ Subir Archivo';
    });
  };
  
  input.click();
}


window.openAdminModal = window.openAdminModal || function(html) {
  const overlay = document.getElementById('admin-modal-overlay');
  const content = document.getElementById('admin-modal-content');
  if (overlay && content) {
    content.innerHTML = html;
    overlay.style.display = '';
    overlay.classList.add('active');
  } else {
    alert('Modal fallback (Revisar consola):\n\n' + html.replace(/<[^>]*>?/gm, ''));
  }
};

window.closeAdminModal = window.closeAdminModal || function() {
  const overlay = document.getElementById('admin-modal-overlay');
  if (overlay) {
    overlay.style.display = '';
    overlay.classList.remove('active');
  }
};

window.showCreateTournamentModal = function() {
  let productOptions = '<option value="">Seleccione un producto</option>';
  if (typeof PRODUCTS !== 'undefined') {
    PRODUCTS.forEach(p => {
      productOptions += `<option value="${p.id}">${p.name}</option>`;
    });
  }

  let html = `
    <div style="padding: 20px; max-height:80vh; overflow-y:auto;">
      <h3>🏆 Crear Torneo</h3>
      <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:20px;">Configura los detalles del nuevo torneo</p>
      
      <form id="create-tournament-form" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
          <div>
            <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Producto / Juego</label>
            <select id="ct-product" class="admin-form-input" style="width: 100%; padding: 10px;" required>
              ${productOptions}
            </select>
          </div>
          <div>
            <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Modo de Juego</label>
            <select id="ct-gamemode" class="admin-form-input" style="width: 100%; padding: 10px;">
              <option value="">Libre</option>
              <option value="solo">👤 Solo</option>
              <option value="duo">👥 Dúo</option>
              <option value="squad">🎯 Escuadras</option>
            </select>
          </div>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
          <div>
            <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Título del Torneo</label>
            <input type="text" id="ct-title" class="admin-form-input" style="width: 100%; padding: 10px;" placeholder="Ej: Copa FreeFire Escuadras #1">
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Déjalo vacío para autogenerar</p>
          </div>
          <div>
            <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Precio por Kill ($ USD)</label>
            <input type="number" step="0.01" min="0" id="ct-price-per-kill" class="admin-form-input" style="width: 100%; padding: 10px;" placeholder="0.50" value="0.00">
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Pago automático a jugadores</p>
          </div>
        </div>
        
        <div>
          <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Descripción / Reglas</label>
          <textarea id="ct-description" class="admin-form-input" style="width: 100%; padding: 10px; min-height:80px; resize:vertical; font-family:var(--font-body);" placeholder="Reglas del torneo, cómo participar, restricciones, etc."></textarea>
        </div>
        
        <div>
          <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Imagen del Banner</label>
          <div style="display:flex; gap:10px;">
            <input type="text" id="ct-banner" class="admin-form-input" style="flex:1; padding: 10px;" placeholder="URL o subir desde dispositivo...">
            <button type="button" id="ct-banner-btn" class="btn btn-secondary" onclick="uploadTournamentBanner('ct-banner', 'ct-banner-btn')" style="padding: 0 15px; flex-shrink: 0;">🖼️ Subir</button>
          </div>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
          <div>
            <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Participantes Máximos</label>
            <input type="number" id="ct-max" class="admin-form-input" style="width: 100%; padding: 10px;" value="100" min="2" required>
          </div>
          <div>
            <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Cierre de Inscripciones</label>
            <input type="datetime-local" id="ct-deadline" class="admin-form-input" style="width: 100%; padding: 10px;">
          </div>
        </div>
        
        <div>
          <label class="admin-form-label" style="margin-bottom: 5px; display: block;">Precio de Inscripción ($)</label>
          <input type="number" id="ct-entry-fee" class="admin-form-input" style="width: 100%; padding: 10px; margin-bottom: 14px;" value="0" min="0" step="0.01">
        </div>
        
        <div>
          <label class="admin-form-label" style="margin-bottom: 5px; display: block;">🏅 Premios</label>
          <div id="ct-prizes-list" style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; gap:8px; align-items:center;">
              <span style="font-size:1.2rem; min-width:28px;">🥇</span>
              <input type="text" class="admin-form-input ct-prize-input" placeholder="1er lugar: Ej. 500 diamantes" style="flex:1; padding:8px 10px;">
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <span style="font-size:1.2rem; min-width:28px;">🥈</span>
              <input type="text" class="admin-form-input ct-prize-input" placeholder="2do lugar (opcional)" style="flex:1; padding:8px 10px;">
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <span style="font-size:1.2rem; min-width:28px;">🥉</span>
              <input type="text" class="admin-form-input ct-prize-input" placeholder="3er lugar (opcional)" style="flex:1; padding:8px 10px;">
            </div>
          </div>
          <button type="button" onclick="addPrizeRow()" style="margin-top:6px; background:none; border:1px dashed var(--border); color:var(--text-muted); padding:6px 12px; border-radius:var(--radius-sm); cursor:pointer; font-size:0.8rem;">+ Agregar premio</button>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">🏆 Crear Torneo</button>
        </div>
      </form>
    </div>
  `;
  openAdminModal(html);

  setTimeout(() => {
    document.getElementById('create-tournament-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const pId = document.getElementById('ct-product').value;
      if (!pId) return alert('Selecciona un producto.');
      
      const productObj = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(p => p.id === pId) : null;
      const pName = productObj ? productObj.name : pId;
      const gameMode = document.getElementById('ct-gamemode').value;
      const customTitle = document.getElementById('ct-title').value.trim();
      const description = document.getElementById('ct-description').value.trim();
      const bannerUrl = document.getElementById('ct-banner').value.trim();
      const maxP = parseInt(document.getElementById('ct-max').value) || 100;
      const deadline = document.getElementById('ct-deadline').value;
      const entryFee = parseFloat(document.getElementById('ct-entry-fee').value) || 0;
      const pricePerKill = parseFloat(document.getElementById('ct-price-per-kill').value) || 0;
      
      // Collect prizes
      const prizeInputs = document.querySelectorAll('.ct-prize-input');
      const places = ['1er Lugar', '2do Lugar', '3er Lugar', '4to Lugar', '5to Lugar'];
      const prizes = [];
      prizeInputs.forEach((input, i) => {
        const val = input.value.trim();
        if (val) prizes.push({ place: places[i] || (i + 1) + '° Lugar', reward: val });
      });
      
      // Game mode labels
      const modeLabels = { solo: 'Solo', duo: 'Dúo', squad: 'Escuadras' };
      const modeStr = gameMode ? ' ' + (modeLabels[gameMode] || gameMode) : '';
      
      const title = customTitle || 'Copa ' + pName + modeStr + ' (Especial)';
      const tournamentId = 'torneo-manual-' + pId + '-' + Date.now();
      
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Creando...';
      
      const torneoData = {
        id: tournamentId,
        productId: pId,
        productName: pName,
        title: title,
        description: description || null,
        gameMode: gameMode || null,
        bannerUrl: bannerUrl || null,
        status: 'registration_open',
        createdAt: new Date().toISOString(),
        maxParticipants: maxP,
        entryFee: entryFee,
        pricePerKill: pricePerKill,
        prize: prizes.length > 0 ? prizes[0].reward : 'Premios Especiales'
      };
      
      if (prizes.length > 0) torneoData.prizes = prizes;
      if (deadline) torneoData.registrationDeadline = new Date(deadline).toISOString();
      
      firebase.database().ref('tournaments/' + tournamentId).set(torneoData).then(() => {
        closeAdminModal();
      }).catch(err => {
        alert('Error: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = '🏆 Crear Torneo';
      });
    });
  }, 100);
};

window.addPrizeRow = function() {
  const list = document.getElementById('ct-prizes-list');
  const count = list.children.length + 1;
  const medals = ['🥇', '🥈', '🥉', '🏅', '🎖️', '⭐'];
  const div = document.createElement('div');
  div.style.cssText = 'display:flex; gap:8px; align-items:center;';
  div.innerHTML = `
    <span style="font-size:1.2rem; min-width:28px;">${medals[count - 1] || '🎖️'}</span>
    <input type="text" class="admin-form-input ct-prize-input" placeholder="${count}° lugar (opcional)" style="flex:1; padding:8px 10px;">
  `;
  list.appendChild(div);
};

window.setTournamentWinner = function(id) {
  const winnerName = prompt('Introduce el nombre o UID del ganador del torneo:');
  if (winnerName && winnerName.trim() !== '') {
    firebase.database().ref('tournaments/' + id).update({ winnerName: winnerName.trim() });
  }
};

window.uploadTournamentBanner = function(inputId, btnId) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check size limit (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande (Máximo 5MB).');
      return;
    }

    const storageRef = firebase.storage().ref('tournaments/' + Date.now() + '_' + file.name);
    
    const btn = document.getElementById(btnId);
    const originalText = btn ? btn.innerText : '';
    if(btn) {
      btn.disabled = true;
      btn.innerText = '⏳...';
    }

    storageRef.put(file).then(snapshot => {
      return snapshot.ref.getDownloadURL();
    }).then(url => {
      document.getElementById(inputId).value = url;
      if(btn) {
        btn.disabled = false;
        btn.innerText = '✅ Listo';
        setTimeout(() => btn.innerText = originalText, 2000);
      }
    }).catch(err => {
      console.error(err);
      alert('Error subiendo imagen. Verifica tu conexión.');
      if(btn) {
        btn.disabled = false;
        btn.innerText = originalText;
      }
    });
  };
  fileInput.click();
};

window.openAdminModal = window.openAdminModal || function(html) {
  const overlay = document.getElementById('admin-modal-overlay');
  const content = document.getElementById('admin-modal-content');
  if (overlay && content) {
    content.innerHTML = html;
    overlay.style.display = 'flex';
  }
};

window.closeAdminModal = window.closeAdminModal || function() {
  const overlay = document.getElementById('admin-modal-overlay');
  if (overlay) overlay.style.display = 'none';
};

window.manageTournamentCredentials = function(id) {
  firebase.database().ref('tournaments/' + id).once('value').then(snap => {
    const torneo = snap.val();
    const creds = torneo.credentials || { roomId: '', password: '' };
    
    let html = `
      <div style="padding:20px;">
        <h3>🔑 Credenciales de Sala</h3>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:20px;">${torneo.title} — Configura los datos para que los jugadores puedan unirse a la partida.</p>
        
        <div style="margin-bottom: 15px;">
          <label style="display:block; margin-bottom:5px; font-size:0.9rem; color:var(--text-secondary);">ID de la Sala</label>
          <input type="text" id="cred-room-id" class="admin-form-input" placeholder="Ej: 1234567" value="${creds.roomId}" style="width:100%;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display:block; margin-bottom:5px; font-size:0.9rem; color:var(--text-secondary);">Contraseña</label>
          <input type="text" id="cred-password" class="admin-form-input" placeholder="Ej: 1234" value="${creds.password}" style="width:100%;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; cursor:pointer;">
            <input type="checkbox" id="cred-notify" checked>
            Enviar notificación automática a los inscritos
          </label>
        </div>
        
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button class="btn btn-secondary" onclick="closeAdminModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="saveTournamentCredentials('${id}')">💾 Guardar y Enviar</button>
        </div>
      </div>
    `;
    openAdminModal(html);
  });
};

window.saveTournamentCredentials = function(id) {
  const roomId = document.getElementById('cred-room-id').value.trim();
  const password = document.getElementById('cred-password').value.trim();
  const notify = document.getElementById('cred-notify').checked;
  
  const updateData = {
    'credentials/roomId': roomId,
    'credentials/password': password
  };
  
  firebase.database().ref('tournaments/' + id).update(updateData).then(() => {
    alert('✅ Credenciales guardadas exitosamente.');
    closeAdminModal();
    
    if (notify) {
      // Fetch participants and send notifications
      firebase.database().ref('tournaments/' + id).once('value').then(snap => {
        const torneo = snap.val();
        const participants = torneo.participants || {};
        
        const timestamp = new Date().toISOString();
        const promises = [];
        
        Object.keys(participants).forEach(uid => {
          const notifRef = firebase.database().ref('users/' + uid + '/notifications').push();
          promises.push(notifRef.set({
            title: `🔑 Sala Lista: ${torneo.title}`,
            body: `Las credenciales de la sala ya están publicadas. Entra a "Mis Torneos" para verlas.`,
            type: 'tournament',
            link: '/usuario.html',
            timestamp: timestamp,
            read: false
          }));
        });
        
        Promise.all(promises).then(() => {
          console.log('Notificaciones enviadas a ' + promises.length + ' jugadores.');
        });
      });
    }
  });
};
