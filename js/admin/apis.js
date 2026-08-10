// ════════════════════════════════════════
// 6. APIs CONFIGURATION
// ════════════════════════════════════════
function renderApis(container) {
  const MAX_API_PORTS = 10;
  const MIN_API_PORTS = 2;

  const apiCards = API_CONFIGS.map((api, idx) => {
    const m = api.mapping || { authType: 'x-api-key', authHeader: 'X-API-Key', balanceEndpoint: '/saldo', balanceMethod: 'GET', successPath: 'ok', balancePath: 'saldo', errorPath: 'error' };
    return `
    <div class="admin-api-card ${api.enabled ? 'enabled' : ''}">
      <div class="admin-api-card-header">
        <div class="admin-api-card-status ${api.enabled ? 'active' : 'inactive'}">
          <span class="admin-api-status-dot"></span>
          ${api.enabled ? 'Activa' : 'Inactiva'}
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="admin-api-card-number">Puerto ${idx + 1}</span>
          ${API_CONFIGS.length > MIN_API_PORTS ? `
            <button class="admin-api-delete-btn" onclick="removeApiPort(${idx})" title="Eliminar Puerto ${idx + 1}">
              🗑️
            </button>
          ` : ''}
        </div>
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

        <!-- ── Configuración Avanzada (Universal Mapping) ── -->
        <details class="admin-mapping-details" style="margin-top: 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0;">
          <summary style="cursor: pointer; padding: 10px 14px; font-size: 0.82rem; font-weight: 600; color: #94a3b8; user-select: none; display: flex; align-items: center; gap: 6px;">
            ⚙️ Configuración Avanzada (Mapping Universal)
          </summary>
          <div style="padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 10px; border-top: 1px solid rgba(255,255,255,0.06);">
            <!-- Preset rápido -->
            <div class="admin-form-group" style="margin-bottom: 2px;">
              <label class="admin-form-label" style="font-size: 0.75rem;">🚀 Preset Rápido</label>
              <select class="admin-form-input" style="font-size: 0.8rem;" onchange="applyMappingPreset(${idx}, this.value)">
                <option value="">— Seleccionar Plantilla —</option>
                <option value="tiendagiftven">TiendaGiftVen (X-API-Key + /saldo)</option>
                <option value="recargasamerica">Recargas America (Bearer + /wallet)</option>
                <option value="verifier_only">Solo Verificador (Sin saldo)</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="admin-form-group">
                <label class="admin-form-label" style="font-size: 0.75rem;">Tipo Autenticación</label>
                <select class="admin-form-input api-mapping-field" data-api-idx="${idx}" data-mapping-field="authType" style="font-size: 0.8rem;">
                  <option value="x-api-key" ${m.authType === 'x-api-key' ? 'selected' : ''}>API Key (Header)</option>
                  <option value="bearer" ${m.authType === 'bearer' ? 'selected' : ''}>Bearer Token</option>
                  <option value="query" ${m.authType === 'query' ? 'selected' : ''}>Query Parameter</option>
                  <option value="none" ${m.authType === 'none' ? 'selected' : ''}>Sin Autenticación</option>
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label" style="font-size: 0.75rem;">Nombre Header Auth</label>
                <input type="text" class="admin-form-input api-mapping-field" data-api-idx="${idx}" data-mapping-field="authHeader" value="${m.authHeader || ''}" placeholder="X-API-Key" style="font-size: 0.8rem;">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div class="admin-form-group">
                <label class="admin-form-label" style="font-size: 0.75rem;">Endpoint Saldo</label>
                <input type="text" class="admin-form-input api-mapping-field" data-api-idx="${idx}" data-mapping-field="balanceEndpoint" value="${m.balanceEndpoint || ''}" placeholder="/saldo o /wallet" style="font-size: 0.8rem;">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label" style="font-size: 0.75rem;">Método Saldo</label>
                <select class="admin-form-input api-mapping-field" data-api-idx="${idx}" data-mapping-field="balanceMethod" style="font-size: 0.8rem;">
                  <option value="GET" ${m.balanceMethod === 'GET' ? 'selected' : ''}>GET</option>
                  <option value="POST" ${m.balanceMethod === 'POST' ? 'selected' : ''}>POST</option>
                </select>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
              <div class="admin-form-group">
                <label class="admin-form-label" style="font-size: 0.75rem;">Ruta Éxito</label>
                <input type="text" class="admin-form-input api-mapping-field" data-api-idx="${idx}" data-mapping-field="successPath" value="${m.successPath || ''}" placeholder="ok o success" style="font-size: 0.8rem;">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label" style="font-size: 0.75rem;">Ruta Saldo</label>
                <input type="text" class="admin-form-input api-mapping-field" data-api-idx="${idx}" data-mapping-field="balancePath" value="${m.balancePath || ''}" placeholder="saldo o data.balance" style="font-size: 0.8rem;">
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label" style="font-size: 0.75rem;">Ruta Error</label>
                <input type="text" class="admin-form-input api-mapping-field" data-api-idx="${idx}" data-mapping-field="errorPath" value="${m.errorPath || ''}" placeholder="error o message" style="font-size: 0.8rem;">
              </div>
            </div>
          </div>
        </details>

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
  `;
  }).join('');

  const canAdd = API_CONFIGS.length < MAX_API_PORTS;

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Configuración de APIs</h1>
        <p class="admin-subtitle">Gestiona tus conexiones de API externas (${API_CONFIGS.length}/${MAX_API_PORTS} puertos)</p>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        ${canAdd ? `
          <button class="btn btn-secondary" onclick="addApiPort()" style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 1.1rem;">➕</span> Agregar Puerto
          </button>
        ` : ''}
        <button class="btn btn-primary" onclick="saveApis()">
          <span>💾</span> Guardar APIs
        </button>
      </div>
    </div>
    <div class="admin-apis-grid">
      ${apiCards}
      ${canAdd ? `
        <div class="admin-api-card admin-api-add-card" onclick="addApiPort()">
          <div class="admin-api-add-card-inner">
            <span class="admin-api-add-icon">➕</span>
            <span class="admin-api-add-text">Agregar Nuevo Puerto</span>
            <span class="admin-api-add-hint">${API_CONFIGS.length}/${MAX_API_PORTS} puertos usados</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function toggleApi(idx, enabled) {
  API_CONFIGS[idx].enabled = enabled;
}

// Helper: resolve dot-notation paths like 'data.balance' from a JSON object
function resolveJsonPath(obj, path) {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
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

  // Also sync mapping fields from DOM
  const mappingInputs = document.querySelectorAll(`.api-mapping-field[data-api-idx="${idx}"]`);
  let mapping = { ...(api.mapping || {}) };
  mappingInputs.forEach(input => {
    const field = input.getAttribute('data-mapping-field');
    mapping[field] = input.value.trim();
  });
  api.mapping = mapping;

  if (!api.enabled) {
    showAdminToast(`❌ ${api.name || 'API'}: Debes encender el botón 'Habilitar' para probarla`, 'error');
    return;
  }

  if (!api.baseUrl) {
    showAdminToast(`❌ ${api.name || 'API'}: Ingresa una URL base`, 'error');
    return;
  }

  if (!mapping.balanceEndpoint) {
    showAdminToast(`⚠️ ${api.name || 'API'}: No tiene Endpoint de Saldo configurado. Abre ⚙️ Configuración Avanzada.`, 'error');
    return;
  }

  // Clean trailing slash
  const baseUrl = api.baseUrl.endsWith('/') ? api.baseUrl.slice(0, -1) : api.baseUrl;

  showAdminToast(`🔌 Conectando con ${api.name || 'API'}...`, 'info');

  try {
    let token = '';
    if (firebase.auth().currentUser) {
      token = await firebase.auth().currentUser.getIdToken();
    }
    const proxyUrl = '/api/proxy';
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: "test_connection",
        apiKey: api.apiKey,
        baseUrl: baseUrl,
        mapping: mapping
      })
    });

    if (response.ok) {
      const data = await response.json();

      // Use the mapping to dynamically read the response
      const isSuccess = resolveJsonPath(data, mapping.successPath);
      const saldo = resolveJsonPath(data, mapping.balancePath);
      const errorMsg = resolveJsonPath(data, mapping.errorPath) || data.error || data.message || JSON.stringify(data);

      if (isSuccess) {
        showAdminToast(`✅ ${api.name || 'API'}: ¡Conectado! Saldo: $${parseFloat(saldo || 0).toFixed(2)}`, 'success');
      } else {
        showAdminToast(`⚠️ ${api.name || 'API'}: Conectó pero devolvió error: ${errorMsg}`, 'error');
      }
    } else {
      const errData = await response.json().catch(() => null);
      const msg = errData?.error || `HTTP ${response.status}`;
      showAdminToast(`⚠️ ${api.name || 'API'}: Respondió con error: ${msg}`, 'error');
    }
  } catch (error) {
    console.error('Error de API:', error);
    showAdminToast(`❌ ${api.name || 'API'}: Falló la conexión. Revisa consola o CORS.`, 'error');
  }
}

// Función delegada al backend

function saveApis() {
  // Sync regular fields
  const inputs = document.querySelectorAll('.api-field');
  inputs.forEach(input => {
    const idx = parseInt(input.getAttribute('data-api-idx'));
    const field = input.getAttribute('data-field');
    const val = input.value.trim();
    if (field === 'apiKey' && val === '****************') return;
    API_CONFIGS[idx][field] = val;
  });
  // Sync mapping fields
  const mappingInputs = document.querySelectorAll('.api-mapping-field');
  mappingInputs.forEach(input => {
    const idx = parseInt(input.getAttribute('data-api-idx'));
    const field = input.getAttribute('data-mapping-field');
    const val = input.value.trim();
    if (idx >= 0 && idx < API_CONFIGS.length) {
      if (!API_CONFIGS[idx].mapping) API_CONFIGS[idx].mapping = {};
      API_CONFIGS[idx].mapping[field] = val;
    }
  });
  saveToDb('api_configs', API_CONFIGS);
  showAdminToast('✅ Configuración de APIs guardada', 'success');
  renderActiveTab();
}

function addApiPort() {
  const MAX_API_PORTS = 10;
  if (API_CONFIGS.length >= MAX_API_PORTS) {
    showAdminToast(`❌ Máximo ${MAX_API_PORTS} puertos de API permitidos`, 'error');
    return;
  }

  // Save current unsaved input values before adding
  syncApiFieldsFromDom();

  const newIdx = API_CONFIGS.length + 1;
  API_CONFIGS.push({
    id: `api-${newIdx}`,
    name: '',
    baseUrl: '',
    apiKey: '',
    port: '443',
    enabled: false,
    description: `Puerto ${newIdx}`,
    mapping: {
      authType: 'x-api-key',
      authHeader: 'X-API-Key',
      balanceEndpoint: '/saldo',
      balanceMethod: 'GET',
      successPath: 'ok',
      balancePath: 'saldo',
      errorPath: 'error'
    }
  });

  saveToDb('api_configs', API_CONFIGS);
  showAdminToast(`✅ Puerto ${newIdx} agregado correctamente`, 'success');
  renderActiveTab();
}

function removeApiPort(idx) {
  const MIN_API_PORTS = 2;
  if (API_CONFIGS.length <= MIN_API_PORTS) {
    showAdminToast(`❌ Se requieren al menos ${MIN_API_PORTS} puertos de API`, 'error');
    return;
  }

  const api = API_CONFIGS[idx];
  const apiName = api.name || `Puerto ${idx + 1}`;

  if (!confirm(`¿Estás seguro de eliminar "${apiName}"?\n\nEsto eliminará toda la configuración de este puerto. Los productos que usen este puerto deberán reasignarse manualmente.`)) {
    return;
  }

  // Save current unsaved input values before removing
  syncApiFieldsFromDom();

  API_CONFIGS.splice(idx, 1);

  // Re-index IDs
  API_CONFIGS.forEach((a, i) => {
    a.id = `api-${i + 1}`;
  });

  saveToDb('api_configs', API_CONFIGS);
  showAdminToast(`🗑️ "${apiName}" eliminado`, 'success');
  renderActiveTab();
}

function syncApiFieldsFromDom() {
  // Sync regular fields
  const inputs = document.querySelectorAll('.api-field');
  inputs.forEach(input => {
    const idx = parseInt(input.getAttribute('data-api-idx'));
    const field = input.getAttribute('data-field');
    const val = input.value.trim();
    if (idx >= 0 && idx < API_CONFIGS.length) {
      if (field === 'apiKey' && val === '****************') return;
      API_CONFIGS[idx][field] = val;
    }
  });
  // Sync mapping fields
  const mappingInputs = document.querySelectorAll('.api-mapping-field');
  mappingInputs.forEach(input => {
    const idx = parseInt(input.getAttribute('data-api-idx'));
    const field = input.getAttribute('data-mapping-field');
    const val = input.value.trim();
    if (idx >= 0 && idx < API_CONFIGS.length) {
      if (!API_CONFIGS[idx].mapping) API_CONFIGS[idx].mapping = {};
      API_CONFIGS[idx].mapping[field] = val;
    }
  });
}

// Preset templates for quick mapping configuration
const MAPPING_PRESETS = {
  tiendagiftven: {
    authType: 'x-api-key',
    authHeader: 'X-API-Key',
    balanceEndpoint: '/saldo',
    balanceMethod: 'GET',
    successPath: 'ok',
    balancePath: 'saldo',
    errorPath: 'error'
  },
  recargasamerica: {
    authType: 'bearer',
    authHeader: 'Authorization',
    balanceEndpoint: '/wallet',
    balanceMethod: 'GET',
    successPath: 'success',
    balancePath: 'data.balance',
    errorPath: 'message'
  },
  verifier_only: {
    authType: 'none',
    authHeader: '',
    balanceEndpoint: '',
    balanceMethod: 'GET',
    successPath: 'ok',
    balancePath: '',
    errorPath: 'error'
  },
  custom: {
    authType: 'x-api-key',
    authHeader: 'X-API-Key',
    balanceEndpoint: '/saldo',
    balanceMethod: 'GET',
    successPath: 'ok',
    balancePath: 'saldo',
    errorPath: 'error'
  }
};

window.applyMappingPreset = function(idx, presetName) {
  if (!presetName || !MAPPING_PRESETS[presetName]) return;
  const preset = MAPPING_PRESETS[presetName];

  // Update DOM fields
  const fields = document.querySelectorAll(`.api-mapping-field[data-api-idx="${idx}"]`);
  fields.forEach(input => {
    const field = input.getAttribute('data-mapping-field');
    if (preset[field] !== undefined) {
      input.value = preset[field];
    }
  });

  // Update in-memory config
  if (!API_CONFIGS[idx].mapping) API_CONFIGS[idx].mapping = {};
  Object.assign(API_CONFIGS[idx].mapping, preset);

  showAdminToast(`✅ Preset "${presetName}" aplicado al Puerto ${idx + 1}`, 'success');
};

