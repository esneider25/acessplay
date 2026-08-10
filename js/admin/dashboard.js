// ════════════════════════════════════════
// 1. DASHBOARD
// ════════════════════════════════════════
function renderDashboard(container, forcedOrders = null) {
  let allOrders = forcedOrders || getOrders();

  // Date filtering
  if (adminState.dashboardStartDate) {
    const start = new Date(adminState.dashboardStartDate).getTime();
    allOrders = allOrders.filter(o => o.createdAt >= start);
  }
  if (adminState.dashboardEndDate) {
    const end = new Date(adminState.dashboardEndDate);
    end.setHours(23, 59, 59, 999);
    allOrders = allOrders.filter(o => o.createdAt <= end.getTime());
  }

  const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'completado');
  const rejectedOrders = allOrders.filter(o => o.status === 'rejected' || o.status === 'invalid-id' || o.status === 'rechazado');
  const pendingCount = allOrders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'pendiente').length;
  const completedCount = completedOrders.length;
  const totalProcessed = completedCount + rejectedOrders.length;
  const rejectionRate = totalProcessed > 0 ? ((rejectedOrders.length / totalProcessed) * 100).toFixed(1) : 0;

  let totalResponseTimeMs = 0;
  let validResponseCount = 0;
  let totalRevenue = 0;
  let totalCost = 0;

  completedOrders.forEach(o => {
    totalRevenue += Number(o.priceUsd) || 0;
    let cost = 0;
    if (o.costUsd !== undefined && o.costUsd !== null && parseFloat(o.costUsd) > 0) {
      cost = parseFloat(o.costUsd) || 0;
    } else {
      let pkg = null;
      const searchLabel = String(o.packageLabel || o.productDetails || '').toLowerCase();
      const orderPrice = Number(o.priceUsd) || 0;
      let prodList = o.productId && o.productId !== 'legacy' ? PRODUCTS.filter(p => p.id === o.productId) : PRODUCTS;

      // First pass: try to find a package that matches the exact sales price (as requested by user)
      for (let i = 0; i < prodList.length; i++) {
        if (prodList[i].packages) {
          pkg = prodList[i].packages.find(p => Number(p.priceUsd) === orderPrice);
          if (pkg) break;
        }
      }

      // Second pass: if price doesn't match (e.g. because of discounts), try to extract the amount number (e.g. "1166")
      if (!pkg) {
        const nums = searchLabel.match(/\d+/g);
        // Find the most prominent number (usually the first large number)
        if (nums && nums.length > 0) {
          const targetNum = nums[0];
          for (let i = 0; i < prodList.length; i++) {
            if (prodList[i].packages) {
              pkg = prodList[i].packages.find(p => {
                return String(p.amount) === targetNum || String(p.label).includes(targetNum);
              });
              if (pkg) break;
            }
          }
        }
      }

      if (pkg && pkg.costUsd) {
        cost = parseFloat(pkg.costUsd) || 0;
      }
    }
    totalCost += cost;

    const created = new Date(o.createdAt).getTime();
    const completedHistory = o.statusHistory && o.statusHistory.find(h => h.status === 'completed');
    if (completedHistory && completedHistory.timestamp) {
      const completedTime = new Date(completedHistory.timestamp).getTime();
      totalResponseTimeMs += (completedTime - created);
      validResponseCount++;
    }
  });

  const totalProfit = totalRevenue - totalCost;
  const marginPercentage = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  let avgResponseText = '--';
  if (validResponseCount > 0) {
    const avgMs = totalResponseTimeMs / validResponseCount;
    const avgMins = Math.round(avgMs / 60000);
    if (avgMins < 60) avgResponseText = `${avgMins} min`;
    else avgResponseText = `${(avgMins / 60).toFixed(1)} h`;
  }

  // Recent orders (last 5 from the filtered set)
  const recentOrders = allOrders.slice(0, 5);
  const recentOrdersHtml = recentOrders.length > 0 ? recentOrders.map(order => {
    const status = order.status || 'pending';
    const statusInfo = ORDER_STATUSES[status] || ORDER_STATUSES['pending'];
    const statusClass = status.replace('-', '-');
    const date = new Date(order.createdAt);
    return `
      <div class="admin-cat-row" style="cursor: pointer;" onclick="switchTab('orders'); setTimeout(() => openOrderDetailModal('${order.id}'), 100);">
        <span style="display: flex; align-items: center; gap: 8px;">
          <span class="admin-order-ref" style="font-size: 0.75rem; padding: 3px 8px;">${order.id}</span>
          <span style="font-size: 0.82rem;">${escapeHTML(order.productName)}</span>
        </span>
        <span class="admin-status-badge admin-status-${statusClass}" style="font-size: 0.7rem; padding: 3px 10px;">${statusInfo.icon} ${statusInfo.label}</span>
      </div>
    `;
  }).join('') : '<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">No hay pedidos aún</div>';

  const titleText = forcedOrders ? 'Panel Financiero (Histórico Completo)' : 'Panel Financiero (Últimos 150)';
  const btnHtml = forcedOrders ? `<button class="btn btn-secondary" style="margin-left: 10px; padding: 4px 8px; font-size: 0.75rem;" onclick="adminState.showHistorical = false; renderActiveTab();">Volver a Recientes</button>` : `<button id="btn-calc-history" onclick="calculateHistoricalStats()" style="background: none; border: 1px solid var(--accent); color: var(--accent); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; margin-left: 10px;">Calcular Histórico Completo</button>`;

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">${titleText}</h1>
        <p class="admin-subtitle">Resumen de ganancias ${btnHtml}</p>
      </div>
      <div style="display: flex; gap: 8px; align-items: center; background: var(--bg-surface); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);">
        <input type="date" id="dash-start-date" class="admin-form-input" style="margin-bottom: 0; padding: 6px;" value="${adminState.dashboardStartDate}" onchange="updateDashboardDates()">
        <span style="color: var(--text-muted);">hasta</span>
        <input type="date" id="dash-end-date" class="admin-form-input" style="margin-bottom: 0; padding: 6px;" value="${adminState.dashboardEndDate}" onchange="updateDashboardDates()">
        ${adminState.dashboardStartDate || adminState.dashboardEndDate ? `<button class="btn btn-secondary" style="padding: 6px 12px;" onclick="clearDashboardDates()">✕</button>` : ''}
      </div>
    </div>

    <!-- Financial Core Widgets -->
    <div class="admin-stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom: 24px;">
      <div class="admin-stat-card" style="background: linear-gradient(135deg, rgba(66, 165, 245, 0.1), rgba(66, 165, 245, 0.02)); border-color: rgba(66, 165, 245, 0.3);">
        <div class="admin-stat-icon">💰</div>
        <div class="admin-stat-value" id="dash-total-revenue" style="color: #42a5f5;">$${totalRevenue.toFixed(2)}</div>
        <div class="admin-stat-label">Ingresos Brutos</div>
      </div>
      <div class="admin-stat-card" style="background: linear-gradient(135deg, rgba(239, 83, 80, 0.1), rgba(239, 83, 80, 0.02)); border-color: rgba(239, 83, 80, 0.3);">
        <div class="admin-stat-icon">📉</div>
        <div class="admin-stat-value" id="dash-total-cost" style="color: #ef5350;">$${totalCost.toFixed(2)}</div>
        <div class="admin-stat-label">Costos Proveedor</div>
      </div>
      <div class="admin-stat-card" style="background: linear-gradient(135deg, rgba(102, 187, 106, 0.1), rgba(102, 187, 106, 0.02)); border-color: rgba(102, 187, 106, 0.3);">
        <div class="admin-stat-icon">💎</div>
        <div class="admin-stat-value" id="dash-total-profit" style="color: #66bb6a;">$${totalProfit.toFixed(2)}</div>
        <div class="admin-stat-label">Ganancia Neta</div>
      </div>
    </div>

    <!-- General Stats -->
    <div class="admin-stats-grid" style="margin-bottom: 24px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
      <div class="admin-stat-card" style="cursor: pointer;" onclick="switchTab('orders')">
        <div class="admin-stat-icon">📋</div>
        <div class="admin-stat-value" style="color: #ffb74d;">${pendingCount}</div>
        <div class="admin-stat-label">Pendientes</div>
      </div>
      <div class="admin-stat-card" onclick="switchTab('orders')" style="cursor: pointer;">
        <div class="admin-stat-icon">✅</div>
        <div class="admin-stat-value" style="color: #66bb6a;">${completedCount}</div>
        <div class="admin-stat-label">Completados</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-icon">⏱️</div>
        <div class="admin-stat-value" style="color: #29b6f6;">${avgResponseText}</div>
        <div class="admin-stat-label">Tiempo Promedio</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-icon">❌</div>
        <div class="admin-stat-value" style="color: #ef5350;">${rejectionRate}%</div>
        <div class="admin-stat-label">Tasa Rechazo</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-icon">📈</div>
        <div class="admin-stat-value" style="color: var(--accent);">${marginPercentage}%</div>
        <div class="admin-stat-label">Margen Promedio</div>
      </div>
      <div class="admin-stat-card" style="cursor: pointer;" onclick="switchTab('customers')">
        <div class="admin-stat-icon">👥</div>
        <div class="admin-stat-value" id="dash-total-users">...</div>
        <div class="admin-stat-label">Usuarios</div>
      </div>
    </div>

    <div class="admin-dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 24px;">
      <div class="admin-card" style="grid-column: 1 / -1;">
        <div class="admin-card-header">
          <h2 class="admin-card-title">📈 Ingresos de Pedidos Completados (USD)</h2>
        </div>
        <div style="height: 300px; width: 100%; position: relative;">
          <canvas id="earningsChart"></canvas>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">📋 Pedidos Recientes</h2>
          ${allOrders.length > 0 ? `<button class="btn btn-secondary" onclick="switchTab('orders')" style="padding: 6px 14px; font-size: 0.82rem;">Ver todos →</button>` : ''}
        </div>
        <div class="admin-category-breakdown">
          ${recentOrdersHtml}
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">Acciones Rápidas</h2>
        </div>
        <div class="admin-quick-actions">
          <button class="btn btn-primary" onclick="switchTab('orders')">
            <span>📋</span> Ver Pedidos
          </button>
          <button class="btn btn-secondary" onclick="switchTab('products'); setTimeout(()=>openProductModal(), 100);">
            <span>➕</span> Nuevo Producto
          </button>
          <button class="btn btn-secondary" onclick="switchTab('exchange')">
            <span>💵</span> Tasa de Cambio
          </button>
          <button class="btn btn-secondary" onclick="switchTab('apis')">
            <span>📡</span> Configurar APIs
          </button>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">📊 Ventas por Producto</h2>
        </div>
        <div style="height: 300px; width: 100%; position: relative;">
          <canvas id="ordersChart"></canvas>
        </div>
      </div>
      
      <div class="admin-card">
        <div class="admin-card-header">
          <h2 class="admin-card-title">💳 Métodos de Pago Usados</h2>
        </div>
        <div style="height: 300px; width: 100%; position: relative;">
          <canvas id="paymentsChart"></canvas>
        </div>
      </div>
      
      <div class="admin-card" style="grid-column: 1 / -1;">
        <div class="admin-card-header">
          <h2 class="admin-card-title">🌟 Top Clientes VIP</h2>
        </div>
        <div id="dash-top-clients" style="min-height: 100px; position: relative;">
          <div class="admin-loading-spinner" style="margin: 40px auto;"></div>
        </div>
      </div>
    </div>
  `;

  // Initialize Chart.js
  setTimeout(() => {
    if (window.Chart) {
      const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'completado');

      // 1. Orders Chart Data
      const ctxOrders = document.getElementById('ordersChart');
      if (ctxOrders) {
        const salesByProduct = {};
        completedOrders.forEach(o => {
          salesByProduct[o.productName] = (salesByProduct[o.productName] || 0) + 1;
        });

        new Chart(ctxOrders, {
          type: 'bar',
          data: {
            labels: Object.keys(salesByProduct).length > 0 ? Object.keys(salesByProduct) : ['Sin Datos'],
            datasets: [{
              label: 'Pedidos Completados',
              data: Object.keys(salesByProduct).length > 0 ? Object.values(salesByProduct) : [0],
              backgroundColor: 'rgba(0, 229, 195, 0.6)',
              borderColor: 'rgba(0, 229, 195, 1)',
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#a0b1cc' } } },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#a0b1cc', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.1)' } },
              x: { ticks: { color: '#a0b1cc' }, grid: { display: false } }
            }
          }
        });
      }

      // 2. Earnings Chart Data
      const ctxEarnings = document.getElementById('earningsChart');
      if (ctxEarnings) {
        const earningsByDate = {};
        completedOrders.forEach(o => {
          const date = new Date(o.createdAt).toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
          earningsByDate[date] = (earningsByDate[date] || 0) + (o.priceUsd || 0);
        });

        const dates = Object.keys(earningsByDate).reverse();
        const amounts = Object.values(earningsByDate).reverse();

        new Chart(ctxEarnings, {
          type: 'line',
          data: {
            labels: dates.length > 0 ? dates : ['Sin Datos'],
            datasets: [{
              label: 'Ingresos (USD)',
              data: amounts.length > 0 ? amounts : [0],
              borderColor: '#42a5f5',
              backgroundColor: 'rgba(66, 165, 245, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#42a5f5',
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#a0b1cc' } } },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#a0b1cc' }, grid: { color: 'rgba(255,255,255,0.1)' } },
              x: { ticks: { color: '#a0b1cc' }, grid: { display: false } }
            }
          }
        });
      }

      // 3. Payments Chart Data
      const ctxPayments = document.getElementById('paymentsChart');
      if (ctxPayments) {
        const pmCounts = {};
        completedOrders.forEach(o => {
          pmCounts[o.paymentMethodName || 'Monedero'] = (pmCounts[o.paymentMethodName || 'Monedero'] || 0) + 1;
        });

        new Chart(ctxPayments, {
          type: 'doughnut',
          data: {
            labels: Object.keys(pmCounts).length > 0 ? Object.keys(pmCounts) : ['Sin Datos'],
            datasets: [{
              data: Object.keys(pmCounts).length > 0 ? Object.values(pmCounts) : [1],
              backgroundColor: ['#42a5f5', '#66bb6a', '#ffb74d', '#ef5350', '#ab47bc', '#26c6da'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#a0b1cc' } } }
          }
        });
      }
    }
    // Fetch total users and top VIPs dynamically
    firebase.database().ref('users').once('value').then(snap => {
      const usersData = snap.val() || {};
      const elUsers = document.getElementById('dash-total-users');
      if (elUsers) elUsers.innerText = snap.numChildren();

      const elTopClients = document.getElementById('dash-top-clients');
      if (elTopClients) {
        const userSpentMap = {};
        completedOrders.forEach(o => {
          if (o.userId && o.productType !== 'wallet-recharge') {
            userSpentMap[o.userId] = (userSpentMap[o.userId] || 0) + (Number(o.priceUsd) || 0);
          }
        });

        const usersArray = Object.keys(userSpentMap).map(uid => {
          const u = usersData[uid] || {};
          const fallbackOrder = completedOrders.find(o => o.userId === uid) || {};
          return {
            uid,
            name: u.name || u.displayName || fallbackOrder.userEmail || 'Usuario',
            email: u.email || fallbackOrder.userEmail || '',
            role: u.role || 'cliente',
            spent: userSpentMap[uid] || 0
          };
        }).filter(u => u.spent > 0);

        usersArray.sort((a, b) => b.spent - a.spent);
        const top5 = usersArray.slice(0, 5);

        if (top5.length === 0) {
          elTopClients.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">Aún no hay clientes con compras.</div>`;
        } else {
          elTopClients.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); text-align: left; font-size: 0.85rem;">
                  <th style="padding: 10px;">#</th>
                  <th style="padding: 10px;">Cliente</th>
                  <th style="padding: 10px;">Rol</th>
                  <th style="padding: 10px; text-align: right;">Total Comprado</th>
                </tr>
              </thead>
              <tbody>
                ${top5.map((u, i) => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px 10px; color: var(--text-secondary);">${i + 1}</td>
                    <td style="padding: 12px 10px;">
                      <div style="font-weight: bold; color: #fff;">${u.name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${u.email}</div>
                    </td>
                    <td style="padding: 12px 10px;">
                      <span class="admin-badge" style="${u.role === 'revendedor' ? 'background: rgba(168, 85, 247, 0.2); color: #d8b4fe;' :
              (u.role === 'influencer' ? 'background: rgba(239, 68, 68, 0.2); color: #f87171;' :
                (u.role === 'admin' ? 'background: rgba(234, 179, 8, 0.2); color: #facc15;' :
                  'background: rgba(0, 229, 195, 0.15); color: #0ea5e9;'))
            }">${(u.role === 'user' ? 'cliente' : u.role).toUpperCase()}</span>
                    </td>
                    <td style="padding: 12px 10px; text-align: right; font-weight: bold; color: #42a5f5;">$${u.spent.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }
      }
    }).catch(e => console.error("Error fetching users data:", e));
  }, 100);
}

window.calculateHistoricalStats = async function() {
  if (!confirm("¿Deseas descargar y calcular el historial completo? Esto puede demorar unos segundos dependiendo de la cantidad de pedidos.")) return;
  const btn = document.getElementById('btn-calc-history');
  if (btn) {
    btn.innerHTML = 'Calculando... ⏳';
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

    // Sort descending by date
    allHistoricalOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Almacenar en el estado temporalmente
    adminState.showHistorical = true;
    adminState.historicalOrders = allHistoricalOrders;

    const main = document.getElementById('admin-main-content');
    if (main) {
      renderDashboard(main, allHistoricalOrders);
    }
  } catch(e) {
    console.error(e);
    alert('Error al calcular el histórico');
    if (btn) {
      btn.innerHTML = 'Calcular Histórico Completo';
      btn.disabled = false;
    }
  }
};

