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
      actionsHtml += `<button class="admin-order-action-btn admin-action-approve" style="background-color: #0288d1;" onclick="event.stopPropagation(); completeOrderLocally('${order.id}', false, 'Aprobado manualmente (API omitida)')" title="Aprobar localmente sin enviar a la API">✅ Local</button>`;
      actionsHtml += `<button class="admin-order-action-btn admin-action-reject" onclick="event.stopPropagation(); openRejectModal('${order.id}', 'rejected')" title="Rechazar pedido">❌ Rechazar</button>`;
      actionsHtml += `<button class="admin-order-action-btn admin-action-invalid" onclick="event.stopPropagation(); openRejectModal('${order.id}', 'invalid-id')" title="ID Inválido">⚠️ Inválido</button>`;
    } else {
      // For completed/rejected/invalid-id, allow overriding
      actionsHtml += `<span style="font-size: 0.75rem; color: var(--text-muted); margin-right: 4px;">Cambiar a:</span>`;
      if (order.status !== 'completed') {
        actionsHtml += `<button class="admin-order-action-btn admin-action-approve" onclick="event.stopPropagation(); quickUpdateStatus('${order.id}', 'completed')" title="Forzar Aprobación">✅</button>`;
        actionsHtml += `<button class="admin-order-action-btn admin-action-approve" style="background-color: #0288d1;" onclick="event.stopPropagation(); completeOrderLocally('${order.id}', false, 'Aprobado forzadamente (API omitida)')" title="Aprobar Localmente (Omitir API)">✅ Local</button>`;
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
            ${typeLabel} ${escapeHTML(order.productName)}
            <span style="font-size: 0.78rem; font-weight: 400; color: var(--text-muted);">— ${escapeHTML(order.packageLabel)}</span>
          </div>
          <div class="admin-order-meta">
            <span class="admin-order-meta-item">💰 $${order.priceUsd.toFixed(2)} | Bs. ${formatBs(order.priceBs)}</span>
            <span class="admin-order-meta-item">💳 ${order.paymentMethodName}</span>
            <span class="admin-order-meta-item">📱 ${escapeHTML(order.customerContact || 'Sin contacto')}</span>
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
    // BUG-1 FIX: Ya no bloqueamos la actualización desde el panel admin.
    // updateOrderStatus se encargará de asignar saldo de billetera, puntos y cashback.
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
          <strong>${escapeHTML(order.gameId)}</strong>
          <button class="copy-btn" onclick="adminCopyText('${escapeHTML(order.gameId)}')" title="Copiar">📋</button>
        </span>
      </div>
    `;
  } else if (order.productType === 'account') {
    typeSpecificHtml = `
      <div class="admin-detail-row">
        <span class="label">📧 Email / Usuario</span>
        <span class="value">
          <strong>${order.accountEmail || 'N/A'}</strong>
          ${order.accountEmail ? `<button class="copy-btn" onclick="adminCopyText('${escapeHTML(order.accountEmail)}')" title="Copiar">📋</button>` : ''}
        </span>
      </div>
      <div class="admin-detail-row">
        <span class="label">🔒 Contraseña</span>
        <span class="value">
          <span id="order-pass-display" style="font-family: monospace;" data-password="${escapeHTML(order.accountPassword || '')}">••••••••</span>
          <button class="copy-btn" onclick="toggleOrderPassword()" title="Mostrar" id="order-pass-toggle">👁️</button>
          ${order.accountPassword ? `<button class="copy-btn" onclick="adminCopyPassword()" title="Copiar">📋</button>` : ''}
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
        <button class="admin-order-action-btn admin-action-approve" style="background-color: #0288d1; padding: 10px 20px; font-size: 0.88rem;" onclick="completeOrderLocally('${order.id}', true, 'Aprobado manualmente (API omitida)')">✅ Local</button>
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
          <span class="value">${escapeHTML(order.productName)}</span>
        </div>
        <div class="admin-detail-row">
          <span class="label">Tipo</span>
          <span class="value">${typeLabel}</span>
        </div>
        <div class="admin-detail-row">
          <span class="label">Paquete</span>
          <span class="value">${escapeHTML(order.packageLabel)}</span>
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
            ${escapeHTML(order.customerContact || 'No proporcionado')}
            ${order.customerContact ? `<button class="copy-btn" onclick="adminCopyText('${escapeHTML(order.customerContact)}')" title="Copiar">📋</button>` : ''}
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
        <div style="margin-top: 4px; font-size: 0.9rem;">${escapeHTML(order.adminNote)}</div>
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
    // BUG-1 FIX: Permitir completar desde el modal del admin
  }
  const order = updateOrderStatus(orderId, newStatus, ORDER_STATUSES[newStatus]?.label || '');
  if (order) {
    showAdminToast(`${ORDER_STATUSES[newStatus]?.icon || '✅'} Pedido ${orderId} → ${ORDER_STATUSES[newStatus]?.label}`, 'success');
    closeAdminModal();
    refreshOrdersView();
  }
}

async function toggleOrderPassword() {
  const display = document.getElementById('order-pass-display');
  const toggleBtn = document.getElementById('order-pass-toggle');
  if (!display) return;
  const password = display.getAttribute('data-password');
  if (display.textContent === '••••••••') {
    if (toggleBtn) toggleBtn.innerHTML = '<span class="tracking-spinner" style="font-size:0.8rem">⏳</span>';
    
    // Decrypt if it contains ':' (our iv:encrypted format)
    let decryptedPassword = password;
    if (password && password.includes(':')) {
      try {
        const token = await firebase.auth().currentUser.getIdToken();
        const res = await fetch('/api/crypto', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'decrypt', payload: password })
        });
        if (res.ok) {
          const data = await res.json();
          decryptedPassword = data.result || password;
        }
      } catch (e) {
        console.error("Error decrypting password", e);
      }
    }
    
    display.textContent = decryptedPassword;
    display.setAttribute('data-decrypted', decryptedPassword);
    if (toggleBtn) toggleBtn.textContent = '🙈';
  } else {
    display.textContent = '••••••••';
    if (toggleBtn) toggleBtn.textContent = '👁️';
  }
}

async function adminCopyPassword() {
  const display = document.getElementById('order-pass-display');
  if (!display) return;
  let textToCopy = display.getAttribute('data-decrypted');
  
  if (!textToCopy) {
    // Need to decrypt first
    const password = display.getAttribute('data-password');
    let decryptedPassword = password;
    if (password && password.includes(':')) {
      try {
        const token = await firebase.auth().currentUser.getIdToken();
        const res = await fetch('/api/crypto', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'decrypt', payload: password })
        });
        if (res.ok) {
          const data = await res.json();
          decryptedPassword = data.result || password;
        }
      } catch (e) {}
    }
    textToCopy = decryptedPassword;
  }
  adminCopyText(textToCopy);
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

