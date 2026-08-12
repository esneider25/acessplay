// ════════════════════════════════════════
// WITHDRAWALS (RETIROS)
// ════════════════════════════════════════
function renderWithdrawals(container) {
  firebase.database().ref('withdrawals').once('value').then(snap => {
    let withdrawals = [];
    if (snap.exists()) {
      const data = snap.val();
      for (const key in data) {
        withdrawals.push(data[key]);
      }
    }

    withdrawals.sort((a, b) => b.createdAt - a.createdAt);

    const html = `
      <div class="admin-header">
        <h2 class="admin-title">Retiros de Ganancias</h2>
      </div>
      
      <div class="glass-card" style="margin-top: 20px;">
        <div style="overflow-x:auto;">
          <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.02);">
                <th style="text-align: left; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Fecha</th>
                <th style="text-align: left; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Usuario</th>
                <th style="text-align: right; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Monto (PTS)</th>
                <th style="text-align: right; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Monto (USD)</th>
                <th style="text-align: left; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Método y Detalles</th>
                <th style="text-align: center; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Estado</th>
                <th style="text-align: right; padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${withdrawals.map(w => {
      let detailsStr = '';
      if (w.method === 'binance') {
        detailsStr = `Binance Pay: <strong>${w.details?.account}</strong>`;
      } else if (w.method === 'pagomovil') {
        detailsStr = `Pago Móvil: <strong>${w.details?.bank}</strong> | ${w.details?.phone} | ${w.details?.cedula}`;
      }

      let typeBadge = w.type === 'tournament' ? '<span style="color:#10b981; font-size:0.75rem;"><i class="ph-fill ph-trophy"></i> Torneo</span>' : '<span style="color:#f59e0b; font-size:0.75rem;"><i class="ph-fill ph-coin"></i> Tienda (PTS)</span>';

      let statusBadge = '';
      if (w.status === 'pending') statusBadge = '<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">⏳ Pendiente</span>';
      else if (w.status === 'completed') statusBadge = '<span style="background: rgba(16, 185, 129, 0.2); color: #0ea5e9; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">✅ Pagado</span>';
      else if (w.status === 'rejected') statusBadge = '<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">🚫 Rechazado</span>';

      return `
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <td style="padding: 12px; font-size: 0.85rem;">${new Date(w.createdAt).toLocaleString()}<br>${typeBadge}</td>
                    <td style="padding: 12px; font-size: 0.9rem;">
                      <div>${w.userName || '-'}</div>
                      <div style="font-size: 0.75rem; color: var(--text-secondary);">${w.userEmail}</div>
                    </td>
                    <td style="padding: 12px; font-size: 0.9rem; text-align: right; font-weight: bold; color: #3b82f6;">${w.amountPoints} PTS</td>
                    <td style="padding: 12px; font-size: 0.9rem; text-align: right; font-weight: bold; color: #0ea5e9;">$${w.amountUsd} USD</td>
                    <td style="padding: 12px; font-size: 0.85rem;">${detailsStr}</td>
                    <td style="padding: 12px; text-align: center;">${statusBadge}</td>
                    <td style="padding: 12px; text-align: right;">
                      ${w.status === 'pending' ? `
                        <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem; margin-bottom: 5px; background: #0ea5e9; border-color: #0ea5e9;" onclick="updateWithdrawalStatus('${w.id}', 'completed', '${w.userId}', ${w.amountPoints}, '${w.type || 'points'}', ${w.amountUsd || 0})">Aprobar</button>
                        <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.8rem;" onclick="updateWithdrawalStatus('${w.id}', 'rejected', '${w.userId}', ${w.amountPoints}, '${w.type || 'points'}', ${w.amountUsd || 0})">Rechazar</button>
                      ` : ''}
                    </td>
                  </tr>
                `;
    }).join('')}
              
              ${withdrawals.length === 0 ? `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-secondary);">No hay retiros registrados.</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.innerHTML = html;
  }).catch(err => {
    console.error(err);
    container.innerHTML = `<div style="color:red; padding:20px;">Error cargando retiros: ${err.message}</div>`;
  });
}

window.updateWithdrawalStatus = function (withdrawalId, newStatus, userId, pointsToRefund, wType, amountUsd) {
  if (!confirm(newStatus === 'completed' ? '¿Confirmas que ya enviaste el dinero a este usuario?' : '¿Seguro que deseas RECHAZAR este retiro? (Se le devolverá el saldo al usuario)')) return;

  firebase.database().ref('withdrawals/' + withdrawalId).update({
    status: newStatus,
    processedAt: Date.now()
  }).then(() => {
    if (newStatus === 'rejected') {
      if (wType === 'tournament') {
        // Refund tournament earnings (subtract from what they have withdrawn so their available goes up)
        firebase.database().ref('users/' + userId + '/withdrawnTournamentEarnings').once('value').then(snap => {
          const currentWithdrawn = snap.val() || 0;
          firebase.database().ref('users/' + userId).update({
            withdrawnTournamentEarnings: Math.max(0, currentWithdrawn - amountUsd)
          });
        });
      } else {
        // Refund points to user
        firebase.database().ref('users/' + userId + '/points').once('value').then(snap => {
          const currentPts = snap.val() || 0;
          firebase.database().ref('users/' + userId).update({
            points: currentPts + pointsToRefund
          });

          firebase.database().ref('users/' + userId + '/transactions').push({
            id: Date.now().toString(),
            type: 'deposit',
            amount: 0,
            description: `Devolución por retiro rechazado (+${pointsToRefund} PTS)`,
            date: Date.now()
          });
        });
      }
    }
    showAdminToast('Estado actualizado', 'success');
    renderWithdrawals(document.getElementById('admin-main-content'));
  }).catch(err => {
    alert("Error: " + err.message);
  });
};

window.viewUserTransactions = function (userId) {
           </div>
         </div>
         <div style="font-weight: bold; color: ${color};">${sign}$${parseFloat(tx.amount).toFixed(2)}</div>
      </div>
      `;
    }).join('');
  }

  modal.innerHTML = `
    <div style="background: var(--bg-surface); padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); width: 90%; max-width: 500px; max-height: 80vh; display: flex; flex-direction: column;">
      <h3 style="margin-top: 0; margin-bottom: 20px; display: flex; justify-content: space-between;">
        <span>Movimientos de ${user.name || user.email}</span>
        <span style="color: #0ea5e9;">$${parseFloat(user.wallet || 0).toFixed(2)}</span>
      </h3>
      <div style="overflow-y: auto; flex: 1; padding-right: 10px;">
        ${txHtml}
      </div>
      <div style="margin-top: 25px;">
        <button class="btn-secondary" style="width: 100%;" onclick="document.getElementById('tx-modal').remove()">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

// â”€â”€ Roles and Blocking â”€â”€
window.openCustomerInfoModal = function (uid) {
  showUserDetailsModal(uid);
};

async function showUserDetailsModal(uid) {
  const existingModal = document.getElementById('customer-info-modal-overlay');
  if (existingModal) existingModal.remove();

  const users = adminState.users || {};
  const user = users[uid] || (window.ADMIN_CUSTOMERS ? window.ADMIN_CUSTOMERS.find(u => u.uid === uid) : null);
  if (!user) return;

  const dateStr = user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A';
  const wallet = user.wallet || 0;

  const modalHTML = `
    <div class="modal-overlay active" id="customer-info-modal-overlay">
      <div class="modal" style="max-width: 500px; max-height: 90vh; overflow-y: auto;">
        <h3 style="margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
          <span>Detalles del Cliente</span>
          <button onclick="document.getElementById('customer-info-modal-overlay').remove()" style="background:none; border:none; color: white; cursor: pointer; font-size: 1.2rem;">âœ•</button>
        </h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Nombre</div>
            <div style="font-weight: bold;">${user.name || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Email</div>
            <div style="font-weight: bold;">${user.email || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">WhatsApp</div>
            <div style="font-weight: bold;">${user.whatsapp || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">CÃ©dula (C.I)</div>
            <div style="font-weight: bold;">${user.cedula || 'N/A'}</div>
          </div>
          <div style="grid-column: span 2;">
            <div style="font-size: 0.8rem; color: var(--text-secondary);">DirecciÃ³n</div>
            <div style="font-weight: bold;">${user.direccion || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Fecha de Registro</div>
            <div style="font-weight: bold;">${dateStr}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Saldo (Monedero)</div>
            <div style="font-weight: bold; color: #0ea5e9;">$${wallet.toFixed(2)}</div>
          </div>
        </div>

        <h4 style="margin-bottom: 10px; color: var(--text-secondary);">Historial de Recargas</h4>
        <div id="modal-order-stats-container-${uid}" style="display: flex; gap: 10px; margin-bottom: 20px;">
          <div style="flex: 1; padding: 20px; text-align: center; color: var(--text-secondary); background: rgba(0,0,0,0.2); border-radius: 8px;">
            <i class="ph ph-spinner-gap" style="animation: spin 1s linear infinite; font-size: 1.5rem;"></i><br><small>Cargando historial...</small>
          </div>
        </div>

        <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; margin-bottom: 20px;">
          <h4 style="margin-bottom: 10px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
            <i class="ph ph-lock-key"></i> Forzar Cambio de ContraseÃ±a
          </h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="position: relative;">
              <input type="password" id="admin-force-pass-${uid}" class="admin-form-input" placeholder="Nueva contraseÃ±a (mÃ­nimo 6)" style="width: 100%; padding-right: 40px; background: rgba(0,0,0,0.2);">
              <i class="ph ph-eye" id="toggle-force-pwd-${uid}" onclick="togglePasswordVisibility('admin-force-pass-${uid}', 'toggle-force-pwd-${uid}')" style="position: absolute; right: 15px; top: 14px; cursor: pointer; color: var(--text-secondary);"></i>
            </div>
            <div style="position: relative;">
              <input type="password" id="admin-force-confirm-${uid}" class="admin-form-input" placeholder="Confirmar contraseÃ±a" style="width: 100%; padding-right: 40px; background: rgba(0,0,0,0.2);">
              <i class="ph ph-eye" id="toggle-force-confirm-${uid}" onclick="togglePasswordVisibility('admin-force-confirm-${uid}', 'toggle-force-confirm-${uid}')" style="position: absolute; right: 15px; top: 14px; cursor: pointer; color: var(--text-secondary);"></i>
            </div>
            <button class="btn btn-primary" onclick="forceCustomerPassword('${uid}', this)" style="width: 100%; justify-content: center; margin-top: 5px;">
              ðŸ’¾ Actualizar ContraseÃ±a del Cliente
            </button>
          </div>
        </div>

        <div style="text-align: right;">
          <button class="btn btn-primary" onclick="document.getElementById('customer-info-modal-overlay').remove()">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Fetch true order stats asynchronously
  try {
    const snap = await firebase.database().ref('orders').orderByChild('userId').equalTo(uid).once('value');
    let pending = 0;
    let completed = 0;
    let rejected = 0;
    
    if (snap.exists()) {
      snap.forEach(child => {
        const o = child.val();
        if (o.status === 'pending' || o.status === 'processing' || o.status === 'procesando') pending++;
        else if (o.status === 'completed' || o.status === 'completado') completed++;
        else if (o.status === 'rejected' || o.status === 'rechazado' || o.status === 'cancelado' || o.status === 'invalid-id') rejected++;
      });
    }
    
    const statsContainer = document.getElementById(`modal-order-stats-container-${uid}`);
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div style="flex: 1; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #f59e0b;">${pending}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Pendientes</div>
        </div>
        <div style="flex: 1; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #0ea5e9;">${completed}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Completadas</div>
        </div>
        <div style="flex: 1; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 10px; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #ef4444;">${rejected}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Rechazadas</div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error fetching order stats for modal:", error);
    const statsContainer = document.getElementById(`modal-order-stats-container-${uid}`);
    if (statsContainer) {
      statsContainer.innerHTML = `<div style="color: #ef4444; font-size: 0.8rem; text-align: center;">Error al cargar historial completo.</div>`;
    }
  }
};

window.forceCustomerPassword = async function (uid, btnElement) {
  const passInput = document.getElementById(`admin-force-pass-${uid}`);
  const confirmInput = document.getElementById(`admin-force-confirm-${uid}`);
  const pass = passInput ? passInput.value.trim() : '';
  const confirm = confirmInput ? confirmInput.value.trim() : '';

  if (pass.length < 6) return alert("La contraseÃ±a debe tener al menos 6 caracteres.");
  if (pass !== confirm) return alert("Las contraseÃ±as no coinciden.");

  const btn = btnElement || (typeof event !== 'undefined' ? (event.target || event.srcElement) : null);
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = 'Actualizando...';
    btn.disabled = true;
  }

  try {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) throw new Error("No hay una sesiÃ³n de administrador activa.");

    const idToken = await currentUser.getIdToken();
    const response = await fetch('/api/admin-update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + idToken
      },
      body: JSON.stringify({
        targetUid: uid,
        newPassword: pass
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al actualizar contraseÃ±a.');
    }

    alert("ContraseÃ±a actualizada con Ã©xito.");
    if (passInput) passInput.value = '';
    if (confirmInput) confirmInput.value = '';
  } catch (error) {
    alert("Error guardando la contraseÃ±a: " + error.message);
  } finally {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
};

window.openRoleModal = function (uid, currentRole, currentDiscount, currentReferralLimit, currentAutoProcess) {
  const existingModal = document.getElementById('role-modal-overlay');
  if (existingModal) existingModal.remove();

  const modalHTML = `
    <div class="modal-overlay active" id="role-modal-overlay">
      <div class="modal">
        <h3>Editar Rol de Usuario</h3>
        <div class="form-group" style="margin-top: 15px;">
          <label>Rol</label>
          <select id="role-select" class="form-input" onchange="document.getElementById('discount-group').style.display = this.value === 'revendedor' ? 'block' : 'none'; document.getElementById('referral-limit-group').style.display = this.value === 'influencer' ? 'block' : 'none'">
            <option value="cliente" ${(currentRole !== 'revendedor' && currentRole !== 'influencer') ? 'selected' : ''}>Cliente Normal</option>
            <option value="influencer" ${currentRole === 'influencer' ? 'selected' : ''}>Influencer AccessPlay</option>
            <option value="revendedor" ${currentRole === 'revendedor' ? 'selected' : ''}>Revendedor</option>
          </select>
        </div>
        <div class="form-group" id="discount-group" style="display: ${currentRole === 'revendedor' ? 'block' : 'none'};">
          <label>Margen de Ganancia sobre Costo (%)</label>
          <input type="number" id="discount-input" class="form-input" value="${currentDiscount || 0}" min="0" max="1000">
          <div class="form-hint">El precio para este revendedor serÃ¡: Costo del Producto + Este Porcentaje. (Si el producto no tiene costo configurado, se usarÃ¡ el precio normal).</div>
          
          <div style="margin-top: 15px; background: rgba(14, 165, 233, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(14, 165, 233, 0.2);">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="auto-process-input" ${currentAutoProcess ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
              <span style="font-size: 0.9rem; font-weight: 500;">Auto-procesar pagos externos</span>
            </label>
            <div class="form-hint" style="margin-top: 5px;">Si estÃ¡ activo, los Pagos MÃ³viles y Binance de este revendedor se completarÃ¡n solos SIN tu aprobaciÃ³n. ActÃ­valo solo para revendedores de total confianza.</div>
          </div>
        </div>
        <div class="form-group" id="referral-limit-group" style="display: ${currentRole === 'influencer' ? 'block' : 'none'}; margin-top: 15px;">
          <label>LÃ­mite de Referidos (Cupos)</label>
          <input type="number" id="referral-limit-input" class="form-input" value="${currentReferralLimit || 30}" min="0" max="1000">
          <div class="form-hint">Cantidad mÃ¡xima de amigos que este influencer puede invitar para ganar recompensas.</div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button class="btn btn-secondary" onclick="document.getElementById('role-modal-overlay').remove()">Cancelar</button>
          <button class="btn btn-primary" onclick="saveUserRole('${uid}')">Guardar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.saveUserRole = function (uid) {
  const role = document.getElementById('role-select').value;
  const discount = parseFloat(document.getElementById('discount-input').value) || 0;
  const referralLimit = parseInt(document.getElementById('referral-limit-input').value) || 30;
  const autoProcessExternal = document.getElementById('auto-process-input') ? document.getElementById('auto-process-input').checked : false;

  firebase.database().ref('users/' + uid).update({
    role: role,
    discountPercentage: role === 'revendedor' ? discount : 0,
    referralLimit: role === 'influencer' ? referralLimit : null,
    autoProcessExternal: role === 'revendedor' ? autoProcessExternal : false
  }).then(() => {
    showAdminToast('âœ… Rol actualizado', 'success');
    document.getElementById('role-modal-overlay').remove();
    renderActiveTab();
  });
};

window.toggleBlockUser = function (uid, isBlocked) {
  if (confirm(isBlocked ? 'Â¿Seguro que deseas DESBLOQUEAR a este usuario?' : 'Â¿Seguro que deseas BLOQUEAR a este usuario? Se cerrarÃ¡ su sesiÃ³n y no podrÃ¡ comprar.')) {
    firebase.database().ref('users/' + uid).update({
      isBlocked: !isBlocked
    }).then(() => {
      showAdminToast(isBlocked ? 'âœ… Usuario desbloqueado' : 'ðŸš« Usuario bloqueado', 'success');
      renderActiveTab();
    });
  }
};

// â”€â”€ Banners Management â”€â”€

function renderBanners(container) {
  let html = `
    <div class="admin-header-flex">
      <h2>ðŸ–¼ï¸ GestiÃ³n de Banners</h2>
      <div style="display: flex; gap: 10px;">
        <button class="btn-secondary" onclick="saveToDb('banners', BANNERS); showAdminToast('âœ… Banners guardados', 'success');">ðŸ’¾ Guardar Cambios</button>
        <button class="btn-primary" onclick="adminEditBanner(null)">+ Nuevo Banner</button>
      </div>
    </div>
    <p style="color: var(--text-secondary); margin-bottom: 20px;">
      Configura los banners deslizantes de la pÃ¡gina principal. Opcionalmente sube una imagen para el fondo.
    </p>
    <div class="admin-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
  `;

  if (!BANNERS || BANNERS.length === 0) {
    html += `<p style="color: var(--text-muted); grid-column: 1 / -1;">No hay banners configurados.</p>`;
  } else {
    BANNERS.forEach(banner => {
      const bg = banner.imageUrl
        ? `background: url('${banner.imageUrl}') center/contain no-repeat, ${banner.bgGradient || 'var(--bg-card)'};`
        : `background: ${banner.bgGradient};`;

      html += `
        <div class="admin-card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
          <div style="height: 140px; ${bg} position: relative; border-bottom: 1px solid var(--border-color);">
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 10px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
              <h3 style="color: white; font-size: 1.1rem; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${banner.title || 'Sin TÃ­tulo'}</h3>
            </div>
            ${banner.badge ? `<div style="position: absolute; top: 10px; right: 10px; background: ${banner.badgeColor}; color: #000; font-size: 0.7rem; font-weight: bold; padding: 2px 6px; border-radius: 4px;">${banner.badge}</div>` : ''}
          </div>
          <div style="padding: 15px; flex: 1;">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 15px; line-height: 1.4;">${banner.desc ? (banner.desc.length > 60 ? banner.desc.substring(0, 60) + '...' : banner.desc) : 'Sin descripciÃ³n'}</p>
            <div style="display: flex; gap: 10px;">
              <button class="btn-secondary" style="flex: 1; padding: 6px;" onclick="adminEditBanner('${banner.id}')">Editar</button>
              <button class="btn-danger" style="flex: 1; padding: 6px;" onclick="adminDeleteBanner('${banner.id}')">Eliminar</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  html += `</div>`;
  container.innerHTML = html;
}

function adminEditBanner(id) {
  let b = { id: 'banner-' + Date.now(), title: '', desc: '', badge: '', badgeColor: '#0ea5e9', imageUrl: '', bgGradient: 'linear-gradient(135deg, #111827, #1f2937)', btnText: 'Ver MÃ¡s', btnLink: 'catalog', btnColor: 'var(--accent)', btnTextColor: 'var(--bg-deep)' };
  let isEdit = false;

  if (id) {
    const existing = BANNERS.find(x => x.id === id);
    if (existing) {
      b = { ...existing };
      isEdit = true;
    }
  }

  const modalHtml = `
    <div class="admin-modal-content" style="max-width: 600px;">
      <h3>${isEdit ? 'Editar Banner' : 'Nuevo Banner'}</h3>
      
      <div class="form-group" style="margin-top: 15px;">
        <label>ðŸ–¼ï¸ Imagen de Fondo (Opcional)</label>
        <input type="file" id="banner-file" accept="image/*" class="admin-input" style="padding: 10px;" onchange="handleBannerImageUpload(this)">
        <input type="hidden" id="banner-imageUrl" value="${b.imageUrl || ''}">
        <div id="banner-image-preview" style="margin-top: 10px; height: 120px; border-radius: 8px; border: 1px dashed var(--border-color); background: ${b.imageUrl ? `url('${b.imageUrl}') center/contain no-repeat, ${b.bgGradient || 'rgba(0,0,0,0.2)'}` : 'rgba(0,0,0,0.2)'}; display: flex; align-items: center; justify-content: center;">
          ${!b.imageUrl ? '<span style="color: var(--text-muted); font-size: 0.85rem;">Sin imagen</span>' : ''}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="form-group">
          <label>TÃ­tulo</label>
          <input type="text" id="banner-title" class="admin-input" value="${b.title}">
        </div>
        <div class="form-group">
          <label>Texto del BotÃ³n</label>
          <input type="text" id="banner-btnText" class="admin-input" value="${b.btnText}">
        </div>
      </div>

      <div class="form-group">
        <label>DescripciÃ³n</label>
        <textarea id="banner-desc" class="admin-input" style="height: 60px;">${b.desc}</textarea>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div class="form-group">
          <label>Etiqueta (Badge)</label>
          <input type="text" id="banner-badge" class="admin-input" value="${b.badge || ''}" placeholder="Ej: NUEVO SERVICIO">
        </div>
        <div class="form-group">
          <label>Color Etiqueta</label>
          <input type="color" id="banner-badgeColor" class="admin-input" value="${b.badgeColor || '#0ea5e9'}">
        </div>
      </div>

      <div class="form-group">
        <label>Enlace del BotÃ³n</label>
        <select id="banner-btnLink" class="admin-input">
          <option value="catalog" ${b.btnLink === 'catalog' ? 'selected' : ''}>CatÃ¡logo</option>
          <option value="how-it-works" ${b.btnLink === 'how-it-works' ? 'selected' : ''}>Â¿CÃ³mo Funciona?</option>
          <optgroup label="Productos">
            ${PRODUCTS.map(p => `<option value="product:${p.id}" ${b.btnLink === `product:${p.id}` ? 'selected' : ''}>${p.name}</option>`).join('')}
          </optgroup>
        </select>
      </div>

      <div class="form-group">
        <label>Fondo de Respaldo (Degradado CSS)</label>
        <input type="text" id="banner-bgGradient" class="admin-input" value="${b.bgGradient}" placeholder="Ej: linear-gradient(135deg, #111827, #1f2937)">
        <small style="color: var(--text-muted); font-size: 0.8rem;">Se usa si no subes una imagen.</small>
      </div>

      <div class="admin-modal-actions">
        <button class="btn-secondary" onclick="closeAdminModal()">Cancelar</button>
        <button class="btn-primary" onclick="adminSaveBanner('${b.id}')">Guardar Banner</button>
      </div>
    </div>
  `;
  showAdminModal(modalHtml);
}

function handleBannerImageUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      // Resize to max 800px width/height for base64 storage
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX = 800;

      if (width > height) {
        if (width > MAX) { height *= MAX / width; width = MAX; }
      } else {
        if (height > MAX) { width *= MAX / height; height = MAX; }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      document.getElementById('banner-imageUrl').value = dataUrl;
      const preview = document.getElementById('banner-image-preview');
      const currentGrad = document.getElementById('banner-bgGradient').value || 'rgba(0,0,0,0.2)';
      preview.style.background = `url('${dataUrl}') center/contain no-repeat, ${currentGrad}`;
      preview.innerHTML = '';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function adminSaveBanner(id) {
  const title = document.getElementById('banner-title').value.trim();
  if (!title) { showToast('âš ï¸ El tÃ­tulo es obligatorio'); return; }

  const b = {
    id: id,
    title: title,
    desc: document.getElementById('banner-desc').value.trim(),
    badge: document.getElementById('banner-badge').value.trim(),
    badgeColor: document.getElementById('banner-badgeColor').value,
    imageUrl: document.getElementById('banner-imageUrl').value,
    bgGradient: document.getElementById('banner-bgGradient').value || 'linear-gradient(135deg, #111827, #1f2937)',
    btnText: document.getElementById('banner-btnText').value.trim(),
    btnLink: document.getElementById('banner-btnLink').value,
    btnColor: 'var(--accent)',
    btnTextColor: 'var(--bg-deep)'
  };

  const idx = BANNERS.findIndex(x => x.id === id);
  if (idx >= 0) BANNERS[idx] = b;
  else BANNERS.push(b);

  saveToDb('banners', BANNERS);
  closeAdminModal();
  renderActiveTab();
}

function adminDeleteBanner(id) {
  const modalHtml = `
    <div class="admin-modal-content" style="max-width: 400px; text-align: center;">
      <h3 style="color: #ef5350;">âš ï¸ Eliminar Banner</h3>
      <p style="margin: 15px 0; color: var(--text-secondary);">Â¿EstÃ¡s seguro que deseas eliminar este banner?</p>
      <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
        <button class="btn-secondary" onclick="closeAdminModal()">Cancelar</button>
        <button class="btn-danger" onclick="executeDeleteBanner('${id}')">SÃ­, Eliminar</button>
      </div>
    </div>
  `;
  showAdminModal(modalHtml);
}

function executeDeleteBanner(id) {
  const idx = BANNERS.findIndex(x => x.id === id);
  if (idx >= 0) {
    BANNERS.splice(idx, 1);
    saveToDb('banners', BANNERS);
    closeAdminModal();
    renderActiveTab();
    showToast('ðŸ—‘ï¸ Banner eliminado');
  }
}

