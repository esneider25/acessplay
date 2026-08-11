// ════════════════════════════════════════
// 5. EXCHANGE RATE & PROFIT MARGIN
// ════════════════════════════════════════
function renderExchange(container) {
  // Build preview table rows from all products/packages
  let previewRows = '';
  let totalPackages = 0;
  const currentMargin = EXCHANGE_RATE.profitMargin || 0;

  PRODUCTS.forEach(product => {
    (product.packages || []).forEach(pkg => {
      const hasCustom = pkg.customMargin !== undefined && pkg.customMargin !== null && pkg.customMargin !== '';
      const effectiveMargin = hasCustom ? parseFloat(pkg.customMargin) : currentMargin;
      const costUsd = (pkg.costUsd && pkg.costUsd > 0) 
        ? pkg.costUsd 
        : (pkg.priceUsd > 0 ? parseFloat((pkg.priceUsd / (1 + (effectiveMargin / 100))).toFixed(2)) : 0);

      if (costUsd > 0) {
        totalPackages++;
        const newPrice = parseFloat((costUsd + (costUsd * effectiveMargin / 100)).toFixed(2));
        const diff = newPrice - costUsd;
        const diffColor = diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : '#94a3b8';
        const diffSign = diff > 0 ? '+' : '';
        previewRows += `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 8px 10px; font-size: 0.8rem; color: var(--text-secondary);">${product.name}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; color: var(--text-muted);">${pkg.label || pkg.amount}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; color: #f59e0b; font-weight: 600;">$${costUsd.toFixed(2)}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; color: var(--text-secondary);">$${pkg.priceUsd.toFixed(2)}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; color: #0ea5e9; font-weight: 600;">$${newPrice.toFixed(2)}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; color: ${diffColor}; font-weight: 600;">${diffSign}$${diff.toFixed(2)}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; text-align: center;">${hasCustom ? `<span style="background: rgba(139,92,246,0.15); color: #a78bfa; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 600;">🎯 ${pkg.customMargin}%</span>` : `<span style="background: rgba(14,165,233,0.1); color: #38bdf8; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 600;">🌍 ${currentMargin}%</span>`}</td>
          </tr>
        `;
      }
    });
  });

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Tasa de Cambio & Márgenes</h1>
        <p class="admin-subtitle">Configura la tasa USD → Bs. y el porcentaje de ganancia para todos los productos.</p>
      </div>
    </div>

    <!-- ── Two Cards Side by Side ── -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 900px;">
      
      <!-- Card 1: Tasa de Cambio -->
      <div class="admin-card" style="position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #0ea5e9, #06b6d4);"></div>
        <div class="admin-card-header" style="padding-bottom: 8px;">
          <h2 class="admin-card-title" style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.4rem;">💱</span> Tasa de Referencia
          </h2>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label" for="exchange-rate-input">Tasa Tienda (Bs. / 1 USD)</label>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="number" step="0.01" class="admin-form-input" id="exchange-rate-input" value="${EXCHANGE_RATE.usdToBs}" style="font-size: 1.25rem; font-weight: bold;">
            <span style="font-weight: 600; font-size: 1.1rem; color: var(--text-secondary);">Bs.</span>
          </div>
        </div>
        
        <div class="admin-form-group" style="margin-top: 15px;">
          <label class="admin-form-label" for="exchange-rate-tournaments-input" style="color:var(--accent);">Tasa Torneos (Bs. / 1 USD)</label>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="number" step="0.01" class="admin-form-input" id="exchange-rate-tournaments-input" value="${EXCHANGE_RATE.tournamentsUsdToBs || EXCHANGE_RATE.usdToBs}" style="font-size: 1.25rem; font-weight: bold; border-color:rgba(14,165,233,0.3);">
            <span style="font-weight: 600; font-size: 1.1rem; color: var(--text-secondary);">Bs.</span>
          </div>
        </div>
        <div style="margin-bottom: 20px; font-size: 0.82rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
          ⚠️ Al guardar, los precios en bolívares se recalculan al instante.
        </div>
        <button class="btn btn-primary" onclick="saveExchangeRate()" style="width: 100%;">
          <span>💾</span> Guardar Tasa
        </button>
        ${EXCHANGE_RATE.lastUpdated ? `<div style="margin-top: 12px; font-size: 0.75rem; color: var(--text-muted); text-align: center;">Última actualización: ${EXCHANGE_RATE.lastUpdated}</div>` : ''}
      </div>

      <!-- Card 2: Margen de Ganancia (Flotante) -->
      <div class="admin-card" style="position: relative; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.25); box-shadow: 0 0 25px rgba(139, 92, 246, 0.08);">
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #8b5cf6, #a78bfa, #c084fc);"></div>
        <div class="admin-card-header" style="padding-bottom: 8px;">
          <h2 class="admin-card-title" style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.4rem;">📈</span> Margen de Ganancia
          </h2>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label" for="profit-margin-input">Porcentaje de Ganancia Global (%)</label>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="number" step="0.5" min="0" max="500" class="admin-form-input" id="profit-margin-input" value="${EXCHANGE_RATE.profitMargin || 0}" style="font-size: 1.25rem; font-weight: bold; border-color: rgba(139,92,246,0.3);" oninput="previewMarginChanges()">
            <span style="font-weight: 700; font-size: 1.3rem; color: #a78bfa;">%</span>
          </div>
        </div>
        
        <!-- Quick Margin Buttons -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
          ${[10, 15, 20, 25, 30, 50].map(v => `
            <button onclick="document.getElementById('profit-margin-input').value=${v}; previewMarginChanges();" 
                    style="padding: 5px 12px; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1px solid ${currentMargin === v ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.08)'}; background: ${currentMargin === v ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)'}; color: ${currentMargin === v ? '#c084fc' : 'var(--text-muted)'};"
                    onmouseover="this.style.borderColor='rgba(139,92,246,0.4)'; this.style.background='rgba(139,92,246,0.1)';"
                    onmouseout="this.style.borderColor='${currentMargin === v ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.08)'}'; this.style.background='${currentMargin === v ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)'}';">
              ${v}%
            </button>
          `).join('')}
        </div>

        <div style="background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 0.82rem; color: #c4b5fd; display: flex; align-items: flex-start; gap: 8px;">
          <span style="font-size: 1rem; flex-shrink: 0;">💡</span>
          <span>El margen se aplica sobre el <strong>Costo del Proveedor</strong> (costUsd). Los paquetes con margen individual 🎯 no serán afectados por el margen global.</span>
        </div>

        <!-- Summary of what will be affected -->
        <div style="display: flex; gap: 12px; margin-bottom: 18px;">
          <div style="flex: 1; background: rgba(14,165,233,0.05); border: 1px solid rgba(14,165,233,0.15); border-radius: 8px; padding: 10px; text-align: center;">
            <div style="font-size: 1.3rem; font-weight: 700; color: #38bdf8;" id="margin-total-packages">${totalPackages}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Paquetes</div>
          </div>
          <div style="flex: 1; background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 10px; text-align: center;">
            <div style="font-size: 1.3rem; font-weight: 700; color: #a78bfa;" id="margin-current-pct">${currentMargin}%</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Margen Actual</div>
          </div>
          <div style="flex: 1; background: rgba(74,222,128,0.05); border: 1px solid rgba(74,222,128,0.15); border-radius: 8px; padding: 10px; text-align: center;">
            <div style="font-size: 1.3rem; font-weight: 700; color: #4ade80;" id="margin-new-pct">${currentMargin}%</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Nuevo Margen</div>
          </div>
        </div>

        <button class="btn btn-primary" onclick="saveAndApplyMargin()" style="width: 100%; background: linear-gradient(135deg, #8b5cf6, #a78bfa); border: none;">
          <span>🚀</span> Aplicar Margen a Todos los Precios
        </button>
      </div>
    </div>

    <!-- ── Preview Table ── -->
    <div class="admin-card" style="margin-top: 24px; max-width: 900px;">
      <div class="admin-card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h2 class="admin-card-title" style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.2rem;">👁️</span> Vista Previa de Precios
        </h2>
        <span style="font-size: 0.78rem; color: var(--text-muted);">${totalPackages} paquetes con costo de proveedor</span>
      </div>
      <div style="overflow-x: auto; border-radius: 8px; border: 1px solid var(--border);">
        <table style="width: 100%; border-collapse: collapse; font-family: var(--font-body);" id="margin-preview-table">
          <thead>
            <tr style="background: rgba(255,255,255,0.03);">
              <th style="padding: 10px; text-align: left; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Producto</th>
              <th style="padding: 10px; text-align: left; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Paquete</th>
              <th style="padding: 10px; text-align: left; font-size: 0.75rem; color: #f59e0b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Costo Prov.</th>
              <th style="padding: 10px; text-align: left; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Precio Actual</th>
              <th style="padding: 10px; text-align: left; font-size: 0.75rem; color: #0ea5e9; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Nuevo Precio</th>
              <th style="padding: 10px; text-align: left; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ganancia</th>
              <th style="padding: 10px; text-align: center; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Margen</th>
            </tr>
          </thead>
          <tbody id="margin-preview-body">
            ${previewRows || '<tr><td colspan="7" style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No hay paquetes con costo de proveedor definido.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── Live preview when margin input changes ──
function previewMarginChanges() {
  const input = document.getElementById('profit-margin-input');
  if (!input) return;
  const newMargin = parseFloat(input.value) || 0;

  // Update the "Nuevo Margen" indicator
  const newPctEl = document.getElementById('margin-new-pct');
  if (newPctEl) newPctEl.textContent = newMargin + '%';

  // Rebuild preview table body
  const tbody = document.getElementById('margin-preview-body');
  if (!tbody) return;

  let rows = '';
  let totalCount = 0;
  PRODUCTS.forEach(product => {
    (product.packages || []).forEach(pkg => {
      const hasCustom = pkg.customMargin !== undefined && pkg.customMargin !== null && pkg.customMargin !== '';
      const effectiveMargin = hasCustom ? parseFloat(pkg.customMargin) : newMargin;
      const costUsd = (pkg.costUsd && pkg.costUsd > 0) 
        ? pkg.costUsd 
        : (pkg.priceUsd > 0 ? parseFloat((pkg.priceUsd / (1 + (effectiveMargin / 100))).toFixed(2)) : 0);

      if (costUsd > 0) {
        totalCount++;
        const newPrice = parseFloat((costUsd + (costUsd * effectiveMargin / 100)).toFixed(2));
        const diff = newPrice - costUsd;
        const diffColor = diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : '#94a3b8';
        const diffSign = diff > 0 ? '+' : '';
        rows += `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 8px 10px; font-size: 0.8rem; color: var(--text-secondary);">${product.name}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; color: var(--text-muted);">${pkg.label || pkg.amount}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; color: #f59e0b; font-weight: 600;">$${costUsd.toFixed(2)}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; color: var(--text-secondary);">$${pkg.priceUsd.toFixed(2)}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; color: #0ea5e9; font-weight: 600;">$${newPrice.toFixed(2)}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; color: ${diffColor}; font-weight: 600;">${diffSign}$${diff.toFixed(2)}</td>
            <td style="padding: 8px 10px; font-size: 0.8rem; text-align: center;">${hasCustom ? `<span style="background: rgba(139,92,246,0.15); color: #a78bfa; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 600;">🎯 ${pkg.customMargin}%</span>` : `<span style="background: rgba(14,165,233,0.1); color: #38bdf8; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: 600;">🌍 ${newMargin}%</span>`}</td>
          </tr>
        `;
      }
    });
  });

  const totalPkgEl = document.getElementById('margin-total-packages');
  if (totalPkgEl) totalPkgEl.textContent = totalCount;

  tbody.innerHTML = rows || '<tr><td colspan="7" style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No hay paquetes con costo de proveedor definido.</td></tr>';
}

// ── Save & Apply Profit Margin ──
function saveAndApplyMargin() {
  const input = document.getElementById('profit-margin-input');
  if (!input) return;
  const marginVal = parseFloat(input.value);
  if (isNaN(marginVal) || marginVal < 0) {
    showAdminToast('❌ El margen debe ser un número válido igual o mayor a cero.', 'error');
    return;
  }

  if (!confirm(`¿Aplicar un margen de ${marginVal}% sobre el costo del proveedor a TODOS los paquetes?\n\nLos paquetes con margen individual (🎯) usarán su propio margen.`)) return;

  EXCHANGE_RATE.profitMargin = marginVal;
  EXCHANGE_RATE.lastUpdated = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
  saveToDb('exchange_rate', EXCHANGE_RATE);

  const updated = applyProfitMargin(marginVal);
  showAdminToast(`✅ Margen de ${marginVal}% aplicado a ${updated} paquetes`, 'success');
  renderActiveTab();
}

function saveExchangeRate() {
  const input = document.getElementById('exchange-rate-input');
  const inputTournaments = document.getElementById('exchange-rate-tournaments-input');
  if (!input || !inputTournaments) return;
  const rateVal = parseFloat(input.value);
  const rateTournamentsVal = parseFloat(inputTournaments.value);
  if (isNaN(rateVal) || rateVal <= 0 || isNaN(rateTournamentsVal) || rateTournamentsVal <= 0) {
    showAdminToast('❌ Las tasas deben ser números válidos mayores a cero.', 'error');
    return;
  }
  EXCHANGE_RATE.usdToBs = rateVal;
  EXCHANGE_RATE.tournamentsUsdToBs = rateTournamentsVal;
  EXCHANGE_RATE.lastUpdated = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
  saveToDb('exchange_rate', EXCHANGE_RATE);
  showAdminToast(`✅ Tasas actualizadas: Tienda ${rateVal.toFixed(2)} | Torneos ${rateTournamentsVal.toFixed(2)}`, 'success');
  renderActiveTab();
}
