// ════════════════════════════════════════
// 4. PAYMENTS
// ════════════════════════════════════════
function renderPayments(container) {
  const paymentCardsHtml = PAYMENT_METHODS.map(method => {
    let detailFieldsHtml = '';
    Object.entries(method.details || {}).forEach(([key, val]) => {
      detailFieldsHtml += `
        <div class="admin-form-group" style="position: relative;">
          <label class="admin-form-label" style="display: flex; justify-content: space-between; align-items: center;">
            ${formatPaymentLabel(key)}
            <button class="btn" onclick="removeFieldFromPaymentMethod('${method.id}', '${key}')" style="background: transparent; color: #ef4444; padding: 0; font-size: 0.9rem;" title="Eliminar campo">🗑️</button>
          </label>
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
        <div style="margin-top: 15px; display: flex; gap: 10px; align-items: center;">
          <select id="add-field-select-${method.id}" class="admin-form-input" style="width: auto; max-width: 250px;">
            <option value="">+ Añadir campo...</option>
            <option value="titular">Titular</option>
            <option value="cedula">Cédula / Rif</option>
            <option value="telefono">Teléfono</option>
            <option value="banco">Banco de origen</option>
            <option value="cuenta">Nro. de Cuenta</option>
            <option value="nota">Nota / Referencia</option>
            <option value="binanceId">Binance Pay ID</option>
            <option value="wallet">Wallet (USDT)</option>
            <option value="red">Red</option>
          </select>
          <button class="btn btn-secondary" onclick="addFieldToPaymentMethod('${method.id}')" style="padding: 8px 12px; font-size: 0.9rem;" title="Añadir campo seleccionado">➕ Añadir</button>
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
          ¿Qué datos tuyos (del administrador) necesitas mostrarle al cliente para que realice el pago? (Selecciona los necesarios)
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

function addFieldToPaymentMethod(methodId) {
  const select = document.getElementById(`add-field-select-${methodId}`);
  const field = select.value;
  if (!field) return;

  const method = PAYMENT_METHODS.find(m => m.id === methodId);
  if (method) {
    if (!method.details) method.details = {};
    if (method.details[field] !== undefined) {
      showAdminToast('El campo ya existe en este método', 'error');
      return;
    }
    method.details[field] = "";
    saveToDb('payment_methods', PAYMENT_METHODS);
    renderActiveTab();
    showAdminToast('Campo añadido', 'success');
  }
}

function removeFieldFromPaymentMethod(methodId, fieldKey) {
  if (confirm("¿Eliminar este campo?")) {
    const method = PAYMENT_METHODS.find(m => m.id === methodId);
    if (method && method.details) {
      delete method.details[fieldKey];
      saveToDb('payment_methods', PAYMENT_METHODS);
      renderActiveTab();
      showAdminToast('Campo eliminado', 'success');
    }
  }
}

