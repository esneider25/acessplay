// ════════════════════════════════════════
// 2.5 CUSTOMERS (CRM)
// ════════════════════════════════════════
async function renderCustomers(container) {
  const titleText = adminState.showHistoricalOrders ? 'Clientes VIP (Histórico)' : 'Clientes VIP (Últimos 150)';
  const historyBtn = adminState.showHistoricalOrders 
    ? `<button class="btn btn-secondary" onclick="adminState.showHistoricalOrders = false; renderActiveTab();" style="padding: 8px 16px; font-size: 0.85rem;">⬅️ Volver a Recientes</button>`
    : `<button class="btn btn-secondary" onclick="loadHistoricalOrdersList()" style="padding: 8px 16px; font-size: 0.85rem; border: 1px solid var(--accent); color: var(--accent);">📚 Calcular con Historial Completo</button>`;

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">${titleText}</h1>
        <p class="admin-subtitle">Usuarios registrados y mejores compradores</p>
      </div>
      <div style="display: flex; gap: 8px;">
        ${historyBtn}
        <button class="btn btn-secondary" onclick="exportCustomersCSV()">
          <span>📥</span> Exportar a CSV
        </button>
      </div>
    </div>
    
    <div style="margin-bottom: 20px; display: flex; gap: 8px;">
      <input type="text" id="customers-search-input" value="${adminState.customersSearch || ''}" onkeyup="if(event.key==='Enter') filterCrmSearch(this.value)" placeholder="🔍 Buscar por nombre, correo o teléfono... (Presiona Enter)" style="flex: 1; padding: 14px 20px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: #fff; font-size: 1rem; outline: none;">
      <button class="btn btn-secondary" onclick="filterCrmSearch(document.getElementById('customers-search-input').value)" style="padding: 0 20px;">Buscar</button>
      ${adminState.customersSearch ? `<button class="btn btn-danger" onclick="filterCrmSearch('')" style="padding: 0 20px;">✕</button>` : ''}
    </div>

    <div id="customers-loading" style="padding: 40px; text-align: center; color: var(--text-muted);">Cargando clientes...</div>
    <div id="customers-content" style="display: none;"></div>
  `;

  let users = [];
  try {
    const snap = await firebase.database().ref('users').once('value');
    if (snap.exists()) {
      const data = snap.val();
      users = Object.keys(data).map(uid => ({ uid, ...data[uid] }));
      window.ADMIN_CUSTOMERS = users;
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }

  const allOrders = adminState.showHistoricalOrders && adminState.historicalOrders ? adminState.historicalOrders : getOrders();
  const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'completado');

  const customersMap = {};

  users.forEach(u => {
    customersMap[u.uid] = {
      uid: u.uid,
      contact: u.email || 'Sin correo',
      whatsapp: u.whatsapp || '',
      name: u.name || '',
      totalOrders: u.totalOrders || 0,
      hasTotalOrders: !!u.totalOrders,
      totalSpent: u.totalSpent || 0,
      hasTotalSpent: !!u.totalSpent,
      firstOrder: null,
      lastOrder: null,
      role: u.role || 'cliente',
      discountPercentage: u.discountPercentage || 0,
      isBlocked: !!u.isBlocked,
      wallet: u.wallet || 0
    };
  });

  completedOrders.forEach(o => {
    let key = o.userId;
    if (!key) {
      if (!o.customerContact) return;
      key = o.customerContact.toLowerCase().trim();
    }

    if (!customersMap[key]) {
      customersMap[key] = {
        uid: null,
        contact: o.customerContact,
        whatsapp: '',
        name: '',
        totalOrders: 0,
        hasTotalOrders: false,
        totalSpent: 0,
        hasTotalSpent: false,
        firstOrder: o.createdAt,
        lastOrder: o.createdAt
      };
    }
    
    // Only count if it's a guest or if the database doesn't have it yet
    if (!customersMap[key].hasTotalOrders) {
      customersMap[key].totalOrders += 1;
    }
    
    // Si no tiene UID (guest) o no se migró el totalSpent, sumar lo gastado aquí
    if (!customersMap[key].uid || !customersMap[key].hasTotalSpent) {
      if (o.productType !== 'wallet-recharge') {
        customersMap[key].totalSpent += (o.priceUsd || 0);
      }
    }
    if (!customersMap[key].firstOrder || o.createdAt < customersMap[key].firstOrder) customersMap[key].firstOrder = o.createdAt;
    if (!customersMap[key].lastOrder || o.createdAt > customersMap[key].lastOrder) customersMap[key].lastOrder = o.createdAt;
  });

  let customers = Object.values(customersMap).sort((a, b) => b.totalSpent - a.totalSpent);

  const searchTerm = (adminState.customersSearch || '').toLowerCase().trim();
  if (searchTerm) {
    customers = customers.filter(c =>
      c.contact.toLowerCase().includes(searchTerm) ||
      (c.whatsapp && c.whatsapp.toLowerCase().includes(searchTerm)) ||
      (c.name && c.name.toLowerCase().includes(searchTerm))
    );
  }

    // Pagination Logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(customers.length / itemsPerPage) || 1;
  if (!adminState.crmVipPage) adminState.crmVipPage = 1;
  if (adminState.crmVipPage > totalPages) adminState.crmVipPage = totalPages;
  if (adminState.crmVipPage < 1) adminState.crmVipPage = 1;

  const startIndex = (adminState.crmVipPage - 1) * itemsPerPage;
  const paginatedCustomers = customers.slice(startIndex, startIndex + itemsPerPage);

  const customersHtml = paginatedCustomers.map(c => `
    <div class="admin-crm-row" data-search="${(c.name || '').toLowerCase()} ${(c.contact || '').toLowerCase()} ${(c.whatsapp || '').toLowerCase()}">
      <div style="font-weight: 500; display: flex; align-items: center; gap: 10px;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; color: var(--bg-deep); font-weight: bold; flex-shrink: 0;">
          ${(c.name || c.contact || '?').charAt(0).toUpperCase()}
        </div>
        <div style="display: flex; flex-direction: column;">
          <span style="word-break: break-all;">${c.name ? c.name + ' (' + c.contact + ')' : c.contact}</span>
          ${c.whatsapp ? `<span style="font-size: 0.8rem; color: #25D366; margin-top: 2px;">WhatsApp: ${c.whatsapp}</span>` : ''}
          ${c.uid ? `<button onclick="navigator.clipboard.writeText('${c.uid}'); showAdminToast('UID Copiado', 'success')" style="background: none; border: none; color: #a78bfa; cursor: pointer; padding: 0; font-size: 0.75rem; margin-top: 4px; display:flex; align-items:center; gap:4px; width:fit-content;"><i class="ph ph-copy"></i> Copiar UID</button>` : ''}
        </div>
      </div>
      <div style="color: var(--text-secondary);">
        Pedidos: <b>${c.totalOrders}</b><br>
        <span style="font-size: 0.8rem; color: #0ea5e9;">Gasto: $${c.totalSpent.toFixed(2)}</span>
      </div>
      <div style="font-weight: bold; color: #10b981; font-size: 1.1rem;">
        $${(parseFloat(c.wallet) || 0).toFixed(2)}
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${c.uid ? `
          <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; width: fit-content;" onclick="openRoleModal('${c.uid}', '${c.role || 'cliente'}', ${c.discountPercentage || 0}, ${c.referralLimit || 30}, ${!!c.autoProcessExternal})">
              ${c.role === 'revendedor' ? '💼 Revend (' + c.discountPercentage + '%)' : (c.role === 'influencer' ? '🌟 Influencer' : '👤 Cliente')}
            </button>
            <button class="btn ${c.isBlocked ? 'btn-danger' : 'btn-secondary'}" style="padding: 4px 10px; font-size: 0.75rem; width: fit-content;" onclick="toggleBlockUser('${c.uid}', ${c.isBlocked})">
              ${c.isBlocked ? '🚫 Bloqueado' : '✅ Activo'}
            </button>
          </div>
          <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            <button class="btn btn-primary" style="padding: 4px 10px; font-size: 0.75rem; width: fit-content;" onclick="openEditWalletModal('${c.uid}', '${c.contact}', ${c.wallet})">
              💰 Saldo
            </button>
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; width: fit-content;" onclick="openCustomerInfoModal('${c.uid}')">
              ℹ️ Info
            </button>
            <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; width: fit-content;" onclick="sendCustomerPasswordReset('${c.contact}')" title="Enviar enlace de restablecimiento de contraseña">
              🔑 Restablecer Clave
            </button>
          </div>
        ` : `<span style="font-size: 0.8rem; color: var(--text-muted);">Invitado</span>`}
      </div>
    </div>
  `).join('') || '<div style="text-align: center; padding: 40px; color: var(--text-muted);">No se encontraron clientes.</div>';

  const loadingEl = document.getElementById('customers-loading');
  if (loadingEl) loadingEl.style.display = 'none';

  const paginationHtml = totalPages > 1 ? `
    <div style="display: flex; justify-content: center; align-items: center; gap: 16px; padding: 16px; background: var(--bg-surface); border-top: 1px solid var(--border);">
      <button class="btn btn-secondary" onclick="changeCrmPage(-1)" ${adminState.crmVipPage === 1 ? 'disabled style="opacity:0.5"' : ''}>Anterior</button>
      <span style="font-size: 0.9rem; color: var(--text-secondary);">Página <strong>${adminState.crmVipPage}</strong> de ${totalPages}</span>
      <button class="btn btn-secondary" onclick="changeCrmPage(1)" ${adminState.crmVipPage === totalPages ? 'disabled style="opacity:0.5"' : ''}>Siguiente</button>
    </div>
  ` : '';

  const contentEl = document.getElementById('customers-content');
  if (contentEl) {
    contentEl.style.display = 'block';
    contentEl.innerHTML = `
      <div class="admin-card" style="padding: 0; overflow: hidden;">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; background: rgba(0,0,0,0.2); padding: 16px; font-weight: 600; color: var(--text-muted); border-bottom: 1px solid var(--border);">
          <div>Cliente</div>
          <div>Pedidos / Gasto</div>
          <div>Saldo (Monedero)</div>
          <div>Gestión</div>
        </div>
        <div style="padding: 16px;">
          ${customersHtml}
        </div>
        ${paginationHtml}
      </div>
    `;
  }
}

window.filterCrmSearch = function (query) {
  adminState.customersSearch = query.trim();
  adminState.crmVipPage = 1;
  const main = document.getElementById('admin-main-content');
  if (main) renderCustomers(main);
};

window.changeCrmPage = function (delta) {
  adminState.crmVipPage += delta;
  const main = document.getElementById('admin-main-content');
  if (main) {
    renderCustomers(main);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.sendCustomerPasswordReset = async function (email) {
  if (!email || !email.includes('@')) {
    alert('El cliente no tiene un correo válido registrado. Si se registró con WhatsApp o un correo falso, no es posible enviarle el enlace.');
    return;
  }
  if (!confirm(`¿Enviar enlace de recuperación de contraseña a ${email}?`)) return;

  try {
    await firebase.auth().sendPasswordResetEmail(email);
    alert(`Correo de restablecimiento enviado exitosamente a ${email}`);
  } catch (error) {
    console.error("Error enviando reset:", error);
    alert("Hubo un error al intentar enviar el correo. Asegúrate de que el usuario exista en Auth.");
  }
};

async function exportCustomersCSV() {
  let users = [];
  try {
    const snap = await firebase.database().ref('users').once('value');
    if (snap.exists()) {
      const data = snap.val();
      users = Object.keys(data).map(uid => ({ uid, ...data[uid] }));
    }
  } catch (error) {
    console.error("Error fetching users for CSV:", error);
  }

  const allOrders = getOrders();
  const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'completado');
  const customersMap = {};

  users.forEach(u => {
    customersMap[u.uid] = {
      uid: u.uid,
      contact: u.email || 'Sin correo',
      whatsapp: u.whatsapp || '',
      name: u.name || '',
      totalOrders: 0,
      totalSpent: u.totalSpent || 0,
      hasTotalSpent: !!u.totalSpent,
      lastOrder: null
    };
  });

  completedOrders.forEach(o => {
    let key = o.userId;
    if (!key) {
      if (!o.customerContact) return;
      key = o.customerContact.toLowerCase().trim();
    }

    if (!customersMap[key]) {
      customersMap[key] = {
        uid: null,
        contact: o.customerContact,
        whatsapp: '',
        name: '',
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: o.createdAt
      };
    }
    customersMap[key].totalOrders += 1;
    if (!customersMap[key].uid || !customersMap[key].hasTotalSpent) {
      if (o.productType !== 'wallet-recharge') {
        customersMap[key].totalSpent += (o.priceUsd || 0);
      }
    }
    if (!customersMap[key].lastOrder || o.createdAt > customersMap[key].lastOrder) customersMap[key].lastOrder = o.createdAt;
  });

  const customers = Object.values(customersMap).sort((a, b) => b.totalSpent - a.totalSpent);

  if (customers.length === 0) return showAdminToast('No hay clientes para exportar', 'error');

  let csv = 'Nombre,Contacto,WhatsApp,Total Pedidos,Total Gastado (USD),Ultima Compra\n';
  customers.forEach(c => {
    const lastOrd = c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('es-VE') : '';
    csv += `"${c.name}","${c.contact}","${c.whatsapp}",${c.totalOrders},${c.totalSpent.toFixed(2)},"${lastOrd}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `clientes_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showAdminToast('¡Base de clientes exportada!', 'success');
}

