// ════════════════════════════════════════
// PINES DE REGALO (GIFT PINS)
// ════════════════════════════════════════

let pinsFilter = 'all';

function renderPins(container) {
  const allPins = PINS || [];
  let filteredPins = allPins;
  
  if (pinsFilter !== 'all') {
    filteredPins = allPins.filter(p => p.status === pinsFilter);
  }

  // Ordenar por fecha de creación (más recientes primero)
  filteredPins.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const counts = {
    all: allPins.length,
    available: allPins.filter(p => p.status === 'available').length,
    redeemed: allPins.filter(p => p.status === 'redeemed').length,
    disabled: allPins.filter(p => p.status === 'disabled').length
  };

  const filters = [
    { id: 'all', label: 'Todos', icon: '🎫' },
    { id: 'available', label: 'Disponibles', icon: '✅' },
    { id: 'redeemed', label: 'Canjeados', icon: '📦' },
    { id: 'disabled', label: 'Deshabilitados', icon: '⛔' }
  ];

  const filtersHtml = filters.map(f => `
    <button class="admin-filter-pill ${pinsFilter === f.id ? 'active' : ''}" onclick="filterPins('${f.id}')">
      ${f.icon} ${f.label}
      <span class="admin-filter-count">${counts[f.id]}</span>
    </button>
  `).join('');

  const pinsHtml = filteredPins.length > 0 ? filteredPins.map(pin => {
    let statusClass = pin.status === 'available' ? 'completed' : pin.status === 'redeemed' ? 'processing' : 'rejected';
    let statusLabel = pin.status === 'available' ? 'Disponible' : pin.status === 'redeemed' ? 'Canjeado' : 'Deshabilitado';
    let statusIcon = pin.status === 'available' ? '✅' : pin.status === 'redeemed' ? '📦' : '⛔';

    const date = new Date(pin.createdAt);
    
    let actionsHtml = '';
    if (pin.status === 'available') {
      actionsHtml += `<button class="admin-order-action-btn admin-action-reject" onclick="togglePinStatus('${pin.code}', 'disabled')" title="Deshabilitar">⛔ Deshabilitar</button>`;
    } else if (pin.status === 'disabled') {
      actionsHtml += `<button class="admin-order-action-btn admin-action-approve" onclick="togglePinStatus('${pin.code}', 'available')" title="Habilitar">✅ Habilitar</button>`;
    }

    return `
      <div class="pin-row-wrapper">
        
        <!-- PIN Column -->
        <div class="pin-col-code" style="display: flex; align-items: center; gap: 6px;">
          <span style="font-family: monospace; font-size: 1.1rem; color: var(--accent); font-weight: bold; cursor: pointer;" onclick="adminCopyText('${pin.code}')" title="Copiar PIN">${pin.code}</span>
        </div>

        <!-- Package Column -->
        <div class="pin-col-prize" style="font-size: 1.1rem; font-weight: bold; color: #4ade80; display: flex; flex-direction: column; justify-content: center;">
          ${escapeHTML(pin.packageLabel)}
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal; margin-top: 2px;">${escapeHTML(pin.productName)}</span>
        </div>

        <!-- Status Column -->
        <div class="pin-col-status">
          <span style="display: inline-flex; align-items: center; gap: 4px; color: ${pin.status === 'redeemed' ? '#4ade80' : pin.status === 'available' ? '#38bdf8' : '#f87171'}; font-weight: 600; font-size: 0.9rem; background: ${pin.status === 'redeemed' ? 'rgba(74, 222, 128, 0.1)' : pin.status === 'available' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(248, 113, 113, 0.1)'}; padding: 4px 10px; border-radius: 6px;">
            ${statusIcon} ${statusLabel}
          </span>
        </div>

        <!-- Redeemed By Column -->
        <div class="pin-col-redeemed">
          ${redemptionStr}
        </div>

        <!-- Actions Column -->
        <div class="pin-col-actions" style="display: flex; gap: 8px;">
          ${actionsHtml}
          <button style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; padding: 4px 8px; border-radius: 4px; cursor: pointer;" onclick="deletePin('${pin.code}')" title="Eliminar">🗑️</button>
        </div>

      </div>
    `;
  }).join('') : `
    <div class="admin-empty-orders" style="padding: 40px; text-align: center; background: var(--bg-dark); border-radius: 12px; border: 1px dashed var(--border);">
      <div class="admin-empty-orders-icon" style="font-size: 3rem; margin-bottom: 15px;">🎫</div>
      <h3 style="color: white; margin-bottom: 8px;">No hay PINes encontrados</h3>
      <p style="color: var(--text-muted);">Crea nuevos PINes de regalo para tus clientes.</p>
    </div>
  `;

  const tableHeader = filteredPins.length > 0 ? `
    <div class="pin-desktop-header">
      <div>CÓDIGO DE TARJETA</div>
      <div>PREMIO</div>
      <div>ESTADO</div>
      <div>CANJEADO POR</div>
      <div style="text-align: right;">ACCIONES</div>
    </div>
  ` : '';

  container.innerHTML = `
    <div class="admin-header" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px;">
      <div>
        <h1 class="admin-title" style="margin: 0; font-size: 1.8rem; font-weight: 700;">Gestión de Tarjetas</h1>
        <p class="admin-subtitle" style="margin: 6px 0 0 0; color: var(--text-muted); font-size: 1rem;">Crea códigos de regalo para sorteos o ventas directas</p>
      </div>
      <button class="btn btn-primary" onclick="openCreatePinModal()" style="padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 1rem; display: flex; align-items: center; gap: 8px; white-space: nowrap; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);">
        <span>➕</span> Crear Tarjeta
      </button>
    </div>
    <div class="admin-orders-filters" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
      ${filtersHtml}
    </div>
    
    <div class="admin-orders-list" style="display: flex; flex-direction: column; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border); overflow: hidden;">
      ${tableHeader}
      ${pinsHtml}
    </div>
  `;
}

function filterPins(status) {
  pinsFilter = status;
  renderActiveTab();
}

function generatePinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr1 = '';
  let randomStr2 = '';
  for (let i = 0; i < 4; i++) {
    randomStr1 += chars.charAt(Math.floor(Math.random() * chars.length));
    randomStr2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  let randomStr3 = '';
  let randomStr4 = '';
  for (let i = 0; i < 4; i++) {
    randomStr3 += chars.charAt(Math.floor(Math.random() * chars.length));
    randomStr4 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // User requested format: ACCESPLAY-XXXXXXXX
  return `ACCESPLAY-${randomStr1}${randomStr2}`;
}

function openCreatePinModal() {
  const overlay = document.getElementById('admin-modal-overlay');
  const modalContent = document.getElementById('admin-modal-content');
  if (!overlay || !modalContent) return;

  const productsOptions = PRODUCTS.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  modalContent.innerHTML = `
    <div class="admin-modal-header">
      <h2 class="admin-modal-title">🎫 Crear Nuevo PIN</h2>
      <button class="admin-modal-close" onclick="closeAdminModal()">✕</button>
    </div>
    
    <div class="admin-form-group">
      <label class="admin-form-label">Código del PIN (ACCESPLAY-XXXXXXXX)</label>
      <div style="display: flex; gap: 10px;">
        <input type="text" id="pin-code" class="admin-form-input" style="font-family: monospace;" value="${generatePinCode()}" oninput="this.value = this.value.replace(/[^a-zA-Z0-9-]/g, '')">
        <button class="btn btn-secondary" onclick="document.getElementById('pin-code').value = generatePinCode()">🔄 Generar</button>
      </div>
    </div>

    <div class="admin-form-group">
      <label class="admin-form-label">Producto</label>
      <select id="pin-product-id" class="admin-form-input" onchange="updatePinPackagesDropdown()">
        <option value="">Selecciona un producto...</option>
        ${productsOptions}
      </select>
    </div>

    <div class="admin-form-group">
      <label class="admin-form-label">Paquete / Cantidad</label>
      <select id="pin-package-index" class="admin-form-input" disabled>
        <option value="">Primero selecciona un producto</option>
      </select>
    </div>

    <div class="admin-form-group">
      <label class="admin-form-label">Nota (Opcional)</label>
      <input type="text" id="pin-note" class="admin-form-input" placeholder="Ej: Sorteo Instagram 15 Ago">
    </div>

    <div class="admin-modal-footer">
      <button class="btn btn-secondary" onclick="closeAdminModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveNewPin()">Guardar PIN</button>
    </div>
  `;

  overlay.classList.add('active');
}

function updatePinPackagesDropdown() {
  const productId = document.getElementById('pin-product-id').value;
  const packageSelect = document.getElementById('pin-package-index');
  
  if (!productId) {
    packageSelect.innerHTML = '<option value="">Primero selecciona un producto</option>';
    packageSelect.disabled = true;
    return;
  }

  const product = PRODUCTS.find(p => p.id === productId);
  if (!product || !product.packages || product.packages.length === 0) {
    packageSelect.innerHTML = '<option value="">Este producto no tiene paquetes configurados</option>';
    packageSelect.disabled = true;
    return;
  }

  packageSelect.innerHTML = '<option value="">Selecciona el paquete...</option>' + 
    product.packages.map((pkg, idx) => {
      let label = pkg.amount + (pkg.hideCurrency ? '' : ' ' + (product.currency || ''));
      return `<option value="${idx}">${label} — $${pkg.priceUsd.toFixed(2)}</option>`;
    }).join('');
  packageSelect.disabled = false;
}

function saveNewPin() {
  const codeInput = document.getElementById('pin-code').value.trim();
  const productId = document.getElementById('pin-product-id').value;
  const packageIdxStr = document.getElementById('pin-package-index').value;
  const note = document.getElementById('pin-note').value.trim();

  if (!codeInput) return showAdminToast('⚠️ El código del PIN no puede estar vacío', 'error');
  if (!codeInput.startsWith('ACCESPLAY-')) return showAdminToast('⚠️ El código del PIN debe empezar con ACCESPLAY-', 'error');
  if (!productId) return showAdminToast('⚠️ Selecciona un producto', 'error');
  if (packageIdxStr === '') return showAdminToast('⚠️ Selecciona un paquete', 'error');

  const packageIndex = parseInt(packageIdxStr);
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return showAdminToast('⚠️ Producto inválido', 'error');
  const pkg = product.packages[packageIndex];
  if (!pkg) return showAdminToast('⚠️ Paquete inválido', 'error');

  const btn = event.target;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '⏳ Guardando...';
  btn.disabled = true;

  const pinData = {
    code: codeInput,
    productId: product.id,
    productName: product.name,
    packageIndex: packageIndex,
    packageLabel: pkg.amount + (pkg.hideCurrency ? '' : ' ' + (product.currency || '')),
    productType: product.type || 'game-id',
    priceUsd: pkg.priceUsd,
    apiProductId: pkg.apiServiceId || null,
    apiProvider: product.apiProvider || null,
    status: 'available',
    createdAt: new Date().toISOString(),
    createdBy: firebase.auth().currentUser.email,
    redeemedAt: null,
    redeemedBy: null,
    redemptionOrderId: null,
    note: note
  };

  firebase.database().ref('pins/' + codeInput).once('value', snap => {
    if (snap.exists()) {
      showAdminToast('❌ Ese código de PIN ya existe', 'error');
      btn.innerHTML = originalHtml;
      btn.disabled = false;
      return;
    }

    firebase.database().ref('pins/' + codeInput).set(pinData)
      .then(() => {
        showAdminToast('✅ PIN creado exitosamente', 'success');
        closeAdminModal();
        renderActiveTab();
      })
      .catch(err => {
        console.error(err);
        showAdminToast('❌ Error al crear PIN: ' + err.message, 'error');
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      });
  });
}

function togglePinStatus(code, newStatus) {
  firebase.database().ref('pins/' + code + '/status').set(newStatus)
    .then(() => {
      showAdminToast('✅ Estado del PIN actualizado', 'success');
      renderActiveTab();
    })
    .catch(err => {
      console.error(err);
      showAdminToast('❌ Error al actualizar PIN: ' + err.message, 'error');
    });
}

function deletePin(code) {
  if (confirm(`¿Estás seguro de eliminar el PIN ${code}? Esta acción no se puede deshacer.`)) {
    firebase.database().ref('pins/' + code).remove()
      .then(() => {
        showAdminToast('🗑️ PIN eliminado', 'success');
        renderActiveTab();
      })
      .catch(err => {
        console.error(err);
        showAdminToast('❌ Error al eliminar PIN: ' + err.message, 'error');
      });
  }
}
