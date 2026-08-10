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
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 16px;">Usuarios bloqueados temporalmente por exceder el límite de pedidos (${_antiSpamConf.maxOrdersPerHour} por hora).</p>
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

