
// ==========================================
// AccessPlay - Panel de Usuario Independiente
// ==========================================

let currentUser = null;
let userProfile = null;
let dashboardOrders = { active: [], completed: [] };

document.addEventListener('DOMContentLoaded', () => {
  // Manejo de Auth
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      firebase.database().ref('users/' + user.uid).on('value', snap => {
        userProfile = snap.val() || {};
        if (!userProfile.referralCode) {
          const newCode = 'AP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          firebase.database().ref('users/' + user.uid).update({ referralCode: newCode });
          userProfile.referralCode = newCode;
        }
        renderApp();
        initNotifications();
      });
    } else {
      currentUser = null;
      userProfile = null;
      // Redirigir a inicio si no está logueado
      window.location.href = '/';
    }
  });
});


function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;
  
  if (!currentUser) {
    app.innerHTML = `<div style="text-align:center; padding: 150px 20px;"><h2>Por favor inicia sesión.</h2></div>`;
    return;
  }

  // Inject CSS & Structure
  app.innerHTML = `
    <style>
/* User Panel Specific Styles */
.user-panel-layout {
  display: flex;
  min-height: 100vh;
  padding-top: 70px; /* navbar height */
  color: white;
  max-width: 1400px;
  margin: 0 auto;
}

.panel-sidebar {
  width: 280px;
  background: rgba(15, 31, 56, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  padding: 30px 20px;
  position: sticky;
  top: 70px;
  height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 50;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

@media (hover: hover) {
  .nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
    transform: translateX(4px);
  }
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(0, 229, 195, 0.15), rgba(0, 229, 195, 0.05));
  color: var(--accent);
  border: 1px solid rgba(0, 229, 195, 0.2);
  box-shadow: 0 4px 15px rgba(0, 229, 195, 0.05);
}

.nav-item i {
  font-size: 1.4rem;
}

.panel-main {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

.panel-section {
  display: none;
  animation: fadeIn 0.4s ease forwards;
}

.panel-section.active {
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Glass Cards */
.glass-card {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 25px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
@media (hover: hover) {
  .glass-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* Responsive */
@media (max-width: 900px) {
  .user-panel-layout { flex-direction: column; }
  .panel-sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    bottom: 0;
    top: auto;
    flex-direction: row;
    padding: 10px 15px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
    z-index: 100;
    border-right: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(6, 13, 26, 0.95);
    justify-content: flex-start;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 10px;
  }
  /* Hide scrollbar for a cleaner look */
  .panel-sidebar::-webkit-scrollbar { display: none; }
  .panel-sidebar { -ms-overflow-style: none; scrollbar-width: none; }
  
  .nav-item {
    flex-direction: column;
    padding: 8px 10px;
    gap: 4px;
    font-size: 0.65rem;
    text-align: center;
    min-width: 75px;
  }
  .nav-item:hover { transform: none; }
  #nav-spacer { display: none; }
  .panel-main { padding: 20px 20px 100px 20px; }
}

/* Form inputs for profile */
.profile-form-group { margin-bottom: 20px; }
.profile-form-group label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 0.9rem; }
.profile-input { 
  width: 100%; padding: 14px; border-radius: 12px;
  background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);
  color: white; outline: none; transition: 0.3s;
}
.profile-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
</style>
    <div class="bg-ocean-grid">${typeof renderBubbles === 'function' ? renderBubbles() : ''}</div>
    
    <div class="user-panel-layout">
      
      <aside class="panel-sidebar">
        <div style="padding: 0 20px 20px; text-align: center; display: none;" id="mobile-hide-avatar">
          <img src="${currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + currentUser.email + '&background=0D8ABC&color=fff'}" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--accent); margin-bottom: 10px;">
          <h3 style="margin:0; font-size: 1.1rem;">${currentUser.displayName || 'Usuario'}</h3>
        </div>
        
        <div class="nav-item active" onclick="switchSection('dashboard')" id="nav-dashboard">
          <i class="ph ph-squares-four"></i> <span>Resumen</span>
        </div>
        <div class="nav-item" onclick="switchSection('orders')" id="nav-orders">
          <i class="ph ph-package"></i> <span>Mis Pedidos</span>
        </div>
        <div class="nav-item" onclick="switchSection('tournaments')" id="nav-tournaments">
          <i class="ph ph-trophy"></i> <span>Mis Torneos</span>
        </div>
        <div class="nav-item" onclick="switchSection('wallet')" id="nav-wallet">
          <i class="ph ph-wallet"></i> <span>Billetera</span>
        </div>
        <div class="nav-item" onclick="switchSection('ids')" id="nav-ids">
          <i class="ph ph-address-book"></i> <span>IDs</span>
        </div>
        <div class="nav-item" onclick="switchSection('support')" id="nav-support">
          <i class="ph ph-chat-circle-dots"></i> <span>Soporte</span>
        </div>
        <div class="nav-item" onclick="switchSection('profile')" id="nav-profile">
          <i class="ph ph-user-circle-gear"></i> <span>Mi Perfil</span>
        </div>
        <div style="flex:1" id="nav-spacer"></div>
        <div class="nav-item" onclick="navigateTo('home')" style="color: var(--text-secondary);" id="nav-home">
          <i class="ph ph-storefront"></i> <span>Tienda</span>
        </div>
        <div class="nav-item" onclick="logout()" style="color: #ff5252;" id="nav-logout">
          <i class="ph ph-sign-out"></i> <span>Salir</span>
        </div>
      </aside>

      <main class="panel-main">
        ${renderDashboardContent()}
      </main>

    </div>
    <div id="terms-modal-container"></div>
  `;
  
  // Ocultar avatar en sidebar movil
  if(window.innerWidth > 900) {
     const av = document.getElementById('mobile-hide-avatar');
     if(av) av.style.display = 'block';
  } else {
     const sp = document.getElementById('nav-spacer');
     if(sp) sp.style.display = 'none';
  }

  // Cargar datos
  setTimeout(() => { if (typeof loadDashboardData === 'function') loadDashboardData(); }, 100);
}

window.switchSection = function(sectionId) {
  // Update Nav
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navBtn = document.getElementById('nav-' + sectionId);
  if(navBtn) navBtn.classList.add('active');

  // Update Sections
  document.querySelectorAll('.panel-section').forEach(el => el.classList.remove('active'));
  const sec = document.getElementById('sec-' + sectionId);
  if(sec) sec.classList.add('active');
  
  window.scrollTo(0,0);
}



function navigateTo(view) {
  if (view === 'home') {
    window.location.href = '/';
  } else if (view === 'wallet-recharge') {
    // Si queremos que la recarga sea en la tienda, mandamos a index.html?recharge=true
    // Pero por ahora, podemos mandarlos al home
    window.location.href = '/';
  }
}

function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = '/';
  }).catch(error => {
    console.error("Error al cerrar sesión", error);
  });
}

async function loadDashboardData() {
  if (!currentUser) return;
  
  try {
    let allOrders = [];
    const snap = await firebase.database().ref('orders').orderByChild('userId').equalTo(currentUser.uid).once('value');
    
    if (snap.exists()) {
      snap.forEach(child => {
        allOrders.push(child.val());
      });
    }
    
    allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    dashboardOrders.active = allOrders.filter(o => o.status === 'pending' || o.status === 'processing');
    dashboardOrders.completed = allOrders.filter(o => o.status !== 'pending' && o.status !== 'processing');
    
    switchDashboardTab('active');

  } catch (error) {
    console.error("Error loading dashboard orders:", error);
  }

  renderDashboardSavedIds();
  renderDashboardTransactions();
  renderDashboardTournaments();
  initUserChat();
}


function switchDashboardTab(tab) {
  const activeBtn = document.getElementById('tab-active-orders');
  const completedBtn = document.getElementById('tab-completed-orders');
  const container = document.getElementById('dashboard-orders-container');
  
  if (!activeBtn || !completedBtn || !container) return;

  if (tab === 'active') {
    activeBtn.style.color = 'var(--accent)';
    activeBtn.style.borderBottom = '2px solid var(--accent)';
    completedBtn.style.color = 'var(--text-secondary)';
    completedBtn.style.borderBottom = 'none';
    container.innerHTML = renderDashboardOrders(dashboardOrders.active, 'active');
  } else {
    completedBtn.style.color = 'var(--accent)';
    completedBtn.style.borderBottom = '2px solid var(--accent)';
    activeBtn.style.color = 'var(--text-secondary)';
    activeBtn.style.borderBottom = 'none';
    container.innerHTML = renderDashboardOrders(dashboardOrders.completed, 'completed');
  }
}




function renderDashboardSavedIds() {
  const container = document.getElementById('dashboard-saved-ids');
  if (!container) return;
  
  let idsList = [];
  if (userProfile && userProfile.savedIds) {
    idsList = Array.isArray(userProfile.savedIds) ? userProfile.savedIds : Object.values(userProfile.savedIds);
  }
  
  if (idsList.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-secondary);">
        <i class="ph ph-address-book" style="font-size: 3rem; opacity: 0.3; margin-bottom: 10px; display: block;"></i>
        No tienes cuentas guardadas.<br>Guárdalas para comprar más rápido.
      </div>`;
    return;
  }
  container.innerHTML = idsList.map((item, index) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 10px; transition: 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'">
      <div style="display: flex; gap: 15px; align-items: center;">
        <div style="width: 40px; height: 40px; border-radius: 10px; background: var(--accent-glow); display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 1.4rem;">
          <i class="ph ph-game-controller"></i>
        </div>
        <div>
          <div style="font-weight: bold; margin-bottom: 5px;">${item.alias || item.gameName}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">
            ${item.alias ? `<span style="color: var(--accent); font-size: 0.8rem; margin-right: 5px;">${item.gameName}</span> ` : ''}
            UID: <span style="color: white;">${item.uid}</span> ${item.zoneId ? `| Zona: <span style="color: white;">${item.zoneId}</span>` : ''}
          </div>
        </div>
      </div>
      <button onclick="removeSavedId(${index})" style="background: rgba(255, 82, 82, 0.1); border: 1px solid rgba(255,82,82,0.3); border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: #ff5252; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='#ff5252'; this.style.color='white'" onmouseout="this.style.background='rgba(255,82,82,0.1)'; this.style.color='#ff5252'" title="Eliminar">
        <i class="ph ph-trash" style="font-size: 1.1rem;"></i>
      </button>
    </div>
  `).join('');
}

function showAddIdModal() {
  const modal = document.createElement('div');
  modal.id = 'add-id-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0'; modal.style.left = '0'; modal.style.width = '100%'; modal.style.height = '100%';
  modal.style.background = 'rgba(0,0,0,0.8)'; 
  modal.style.backdropFilter = 'blur(8px)';
  modal.style.zIndex = '1000';
  modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center';
  
  modal.innerHTML = `
    <div style="background: var(--bg-surface); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); width: 90%; max-width: 400px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); animation: fadeIn 0.3s ease;">
      <h3 style="margin-top: 0; margin-bottom: 24px; font-size: 1.3rem; display: flex; align-items: center; gap: 8px;"><i class="ph-fill ph-game-controller" style="color: var(--accent);"></i> Añadir Cuenta</h3>
      
      <div class="form-group">
        <label style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 8px; display: block;">Juego</label>
        <select id="new-id-game" class="form-input" style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px;">
          <option value="Free Fire">Free Fire</option>
          <option value="Mobile Legends">Mobile Legends</option>
          <option value="PUBG Mobile">PUBG Mobile</option>
          <option value="Call of Duty Mobile">Call of Duty Mobile</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      
      <div class="form-group" style="margin-top: 15px;">
        <label style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 8px; display: block;">Nombre / Alias (Opcional)</label>
        <input type="text" id="new-id-alias" class="form-input" style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px;" placeholder="Ej. Mi cuenta principal">
      </div>
      
      <div class="form-group" style="margin-top: 15px;">
        <label style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 8px; display: block;">Player ID / UID</label>
        <input type="text" id="new-id-uid" class="form-input" style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px;" placeholder="Ej. 12345678">
      </div>
      
      <div class="form-group" style="margin-top: 15px;">
        <label style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 8px; display: block;">Zone ID (Opcional)</label>
        <input type="text" id="new-id-zone" class="form-input" style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px;" placeholder="Ej. 1234 (Solo MLBB)">
      </div>
      
      <div style="display: flex; gap: 10px; margin-top: 30px;">
        <button class="btn-secondary" style="flex: 1; border-radius: 12px;" onclick="closeAddIdModal()">Cancelar</button>
        <button class="btn-primary" style="flex: 1; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="submitAddId()"><i class="ph ph-check"></i> Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}



function removeSavedId(index) {
  if (!currentUser || !userProfile || !userProfile.savedIds) return;
  let newIds = Array.isArray(userProfile.savedIds) ? [...userProfile.savedIds] : Object.values(userProfile.savedIds);
  newIds.splice(index, 1);
  firebase.database().ref('users/' + currentUser.uid + '/savedIds').set(newIds);
}



function closeAddIdModal() {
  const modal = document.getElementById('add-id-modal');
  if (modal) modal.remove();
}

function submitAddId() {
  if (!currentUser) return;
  const game = document.getElementById('new-id-game').value;
  const uid = document.getElementById('new-id-uid').value.trim();
  const zone = document.getElementById('new-id-zone').value.trim();
  const alias = document.getElementById('new-id-alias').value.trim();
  
  if (!uid) { alert('El UID es obligatorio'); return; }
  
  let currentIds = [];
  if (userProfile && userProfile.savedIds) {
    currentIds = Array.isArray(userProfile.savedIds) ? [...userProfile.savedIds] : Object.values(userProfile.savedIds);
  }
  
  currentIds.push({ gameName: game, uid: uid, zoneId: zone, alias: alias || null });
  
  firebase.database().ref('users/' + currentUser.uid + '/savedIds').set(currentIds).then(() => {
    closeAddIdModal();
  });
}

function startWalletRecharge() {
  // Redirigir a tienda con parámetro
  window.location.href = '/?recharge=true';
}

function usuarioToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.style.position = 'fixed';
  t.style.bottom = '20px';
  t.style.left = '50%';
  t.style.transform = 'translateX(-50%) translateY(100px)';
  t.style.background = type === 'success' ? '#0ea5e9' : (type === 'error' ? '#ef4444' : '#3b82f6');
  t.style.color = '#fff';
  t.style.padding = '12px 24px';
  t.style.borderRadius = '30px';
  t.style.zIndex = '99999';
  t.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
  t.style.fontWeight = 'bold';
  t.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.style.transform = 'translateX(-50%) translateY(0)', 10);
  setTimeout(() => {
    t.style.transform = 'translateX(-50%) translateY(100px)';
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

function redeemPoints() {
  if (!currentUser || !userProfile) return;
  const currentPoints = userProfile.points || 0;
  const maxDollars = Math.floor(currentPoints / 100);
  
  const modalContainer = document.createElement('div');
  modalContainer.id = 'redeem-points-modal';
  modalContainer.innerHTML = `
    <div class="modal-overlay active" style="z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="this.parentElement.remove()">
      <div class="modal" style="max-width: 400px; padding: 0; overflow: hidden; animation: slideInUp 0.3s ease; position: relative; width: 90%; background: var(--bg-surface);" onclick="event.stopPropagation()">
        <div style="background: linear-gradient(135deg, var(--bg-surface), #1a2a40); padding: 30px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">
          <div style="width: 70px; height: 70px; background: rgba(59,130,246,0.1); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 2.5rem; color: #3b82f6; margin: 0 auto 15px auto; box-shadow: 0 0 20px rgba(59,130,246,0.2);">
            <i class="ph-fill ph-star"></i>
          </div>
          <h2 style="margin: 0; font-size: 1.5rem; color: #3b82f6;">Canjear AccessPoints</h2>
          <p style="margin: 10px 0 0 0; color: var(--text-secondary); font-size: 0.95rem;">Tienes <strong style="color: white;">${currentPoints}</strong> puntos disponibles.</p>
        </div>
        
        <div style="padding: 30px;">
          ${maxDollars > 0 ? `
          <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
            <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 10px;">¿Cuántos dólares deseas canjear?</div>
            <div style="display: flex; justify-content: center; align-items: center; gap: 15px;">
              <button onclick="changeRedeemAmount(-1)" style="width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.05); border: none; color: white; font-size: 1.2rem; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'"><i class="ph ph-minus"></i></button>
              <div style="font-size: 2.5rem; font-weight: 900; color: #0ea5e9; min-width: 80px;">
                $<span id="redeem-usd-amount">1</span>
              </div>
              <button onclick="changeRedeemAmount(1)" style="width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.05); border: none; color: white; font-size: 1.2rem; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'"><i class="ph ph-plus"></i></button>
            </div>
            <div style="margin-top: 10px; font-size: 0.85rem; color: #3b82f6; font-weight: bold;">
              Costo: <span id="redeem-points-cost">100</span> PTS
            </div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button onclick="this.closest('#redeem-points-modal').remove()" class="btn-secondary" style="flex: 1; padding: 14px; border-radius: 12px;">
              Cancelar
            </button>
            <button onclick="confirmRedeemPoints()" class="btn-primary" style="flex: 1; padding: 14px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 15px rgba(59,130,246,0.3); border: none;">
              Canjear Ahora
            </button>
          </div>
          ` : `
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px; color: #ef4444;">
            <i class="ph ph-warning" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
            Necesitas al menos <strong>100 AccessPoints</strong> para realizar un canje. (100 PTS = $1)
          </div>
          <button onclick="this.closest('#redeem-points-modal').remove()" class="btn-secondary" style="width: 100%; padding: 14px; border-radius: 12px;">
            Entendido
          </button>
          `}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalContainer);

  window.currentRedeemDollars = 1;
  window.maxRedeemDollars = maxDollars;
}

window.changeRedeemAmount = function(delta) {
  let newValue = window.currentRedeemDollars + delta;
  if (newValue < 1) newValue = 1;
  if (newValue > window.maxRedeemDollars) {
    usuarioToast('⚠️ No tienes suficientes puntos', 'error');
    newValue = window.maxRedeemDollars;
  }
  
  window.currentRedeemDollars = newValue;
  const amountEl = document.getElementById('redeem-usd-amount');
  const costEl = document.getElementById('redeem-points-cost');
  if (amountEl) amountEl.innerText = newValue;
  if (costEl) costEl.innerText = newValue * 100;
};

window.confirmRedeemPoints = function() {
  const dollars = window.currentRedeemDollars;
  const cost = dollars * 100;
  
  const modal = document.getElementById('redeem-points-modal');
  if (modal) modal.remove();
  
  firebase.auth().currentUser.getIdToken().then(idToken => {
    return fetch('/api/wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        action: 'redeem',
        amount: dollars,
        cost: cost
      })
    });
  }).then(res => res.json()).then(data => {
    if (data.error) {
      usuarioToast(`❌ Error: ${data.error}`, 'error');
    } else {
      firebase.database().ref('users/' + currentUser.uid + '/transactions').push({
        id: Date.now().toString(),
        type: 'deposit',
        amount: dollars,
        description: `Canje de ${cost} AccessPoints`,
        date: Date.now()
      });
      usuarioToast(`🎉 ¡Canje exitoso! Se agregaron $${dollars} a tu billetera.`, 'success');
    }
  }).catch(err => {
    console.error(err);
    usuarioToast('❌ Hubo un error al canjear.', 'error');
  });
};

// ==========================================
// Componentes HTML
// ==========================================
// (Se extrajeron de components.js)

function renderDashboardContent() {
  const wallet = userProfile?.wallet || 0;
  const spent = userProfile?.totalSpent || 0;
  const points = userProfile?.points || 0;
  const vip = typeof getVipLevel === 'function' ? getVipLevel(spent) : { name: 'Bronce', color: '#cd7f32', gradient: 'linear-gradient(135deg, #d4a373 0%, #a68a64 100%)', nextThreshold: 50 };
  
  let progressHtml = '';
  if (vip.nextThreshold) {
     const percent = Math.min(100, (spent / vip.nextThreshold) * 100);
     progressHtml = `
       <div style="margin-top: 15px; font-size: 0.85rem; color: var(--text-secondary);">
         <div style="display:flex; justify-content: space-between; margin-bottom: 6px;">
           <span>Progreso a siguiente nivel</span>
           <span style="color: white; font-weight: bold;">$${spent.toFixed(2)} / $${vip.nextThreshold}</span>
         </div>
         <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
           <div style="width: ${percent}%; height: 100%; background: ${vip.gradient}; box-shadow: 0 0 10px ${vip.color}; transition: width 1s ease;"></div>
         </div>
       </div>
     `;
  } else {
     progressHtml = `<div style="margin-top: 15px; font-size: 0.9rem; color: ${vip.color}; font-weight: bold; display: flex; align-items: center; gap: 5px;"><i class="ph-fill ph-star"></i> ¡Has alcanzado el nivel máximo!</div>`;
  }

  const currentName = currentUser.displayName || (typeof userProfile !== 'undefined' && userProfile ? userProfile.name : '') || '';
  const currentWhatsapp = (typeof userProfile !== 'undefined' && userProfile ? userProfile.whatsapp : '') || '';
  const currentCedula = (typeof userProfile !== 'undefined' && userProfile ? userProfile.cedula : '') || '';
  const currentDireccion = (typeof userProfile !== 'undefined' && userProfile ? userProfile.direccion : '') || '';
  const currentRole = (typeof userProfile !== 'undefined' && userProfile && userProfile.role) ? userProfile.role : 'cliente';

  let roleBadge = '';
  if (currentRole === 'revendedor') {
    roleBadge = `<span style="font-size: 0.8rem; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); display: flex; align-items: center; gap: 4px;"><i class="ph-fill ph-star"></i> REVENDEDOR</span>`;
  } else if (currentRole === 'partner') {
    roleBadge = `<span style="font-size: 0.8rem; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; letter-spacing: 0.5px; box-shadow: 0 0 10px rgba(14, 165, 233, 0.6), 0 0 20px rgba(14, 165, 233, 0.4); border: 1px solid #7dd3fc; display: flex; align-items: center; gap: 4px;"><i class="ph-fill ph-crown"></i> ACCESS PARTNER</span>`;
  } else if (currentRole === 'influencer') {
    roleBadge = `<span style="font-size: 0.8rem; background: linear-gradient(135deg, #1d4ed8, #3b82f6); color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; letter-spacing: 0.5px; box-shadow: 0 0 10px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.4); border: 1px solid #93c5fd; display: flex; align-items: center; gap: 4px;"><i class="ph-fill ph-sparkle"></i> INFLUENCER ACCESSPLAY</span>`;
  } else {
    roleBadge = `<span style="font-size: 0.8rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); padding: 4px 12px; border-radius: 20px; font-weight: bold; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;"><i class="ph-fill ph-user"></i> CLIENTE</span>`;
  }

  return `
    <!-- SECTION: DASHBOARD RESUMEN -->
    <section id="sec-dashboard" class="panel-section active">
      <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 24px;">
        <h2 style="font-family: var(--font-display); font-size: 2rem; margin: 0;">Hola, ${currentName || 'AccessPlay'} 👋</h2>
        ${roleBadge}
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px;">
        ${currentRole === 'revendedor' ? `
        <!-- Pedidos Totales Card -->
        <div class="glass-card" style="border-color: rgba(245, 158, 11, 0.2);">
          <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: #f59e0b; filter: blur(60px); opacity: 0.15;"></div>
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 15px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: #fff; box-shadow: 0 4px 15px rgba(245,158,11,0.3);">
              <i class="ph-fill ph-package"></i>
            </div>
            <div>
              <div style="color: var(--text-secondary); font-size: 0.9rem;">Pedidos Totales</div>
              <div style="font-size: 2.2rem; font-weight: 800; color: #f59e0b;">${(dashboardOrders.active.length + dashboardOrders.completed.length) || (userProfile?.orders ? Object.keys(userProfile.orders).length : 0)}</div>
            </div>
          </div>
        </div>

        <!-- Wallet Card -->
        <div class="glass-card" style="border-color: rgba(16, 185, 129, 0.2);">
          <div style="position: absolute; bottom: -50px; left: -50px; width: 150px; height: 150px; background: #0ea5e9; filter: blur(60px); opacity: 0.15;"></div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;"><i class="ph ph-wallet"></i> Saldo Monedero</div>
              <div style="font-size: 2.5rem; font-weight: 800; color: #0ea5e9; text-shadow: 0 0 20px rgba(16, 185, 129, 0.4);">\$${wallet.toFixed(2)}</div>
            </div>
            <button onclick="startWalletRecharge()" class="btn-primary" style="padding: 10px; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: linear-gradient(135deg, #0ea5e9, #0284c7); box-shadow: 0 4px 15px rgba(16,185,129,0.3);" title="Recargar">
              <i class="ph ph-plus" style="font-size: 1.2rem;"></i>
            </button>
          </div>
        </div>

        <!-- Saldo Gastado Card -->
        <div class="glass-card" style="border-color: rgba(14, 165, 233, 0.2);">
          <div style="position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; background: #0ea5e9; filter: blur(60px); opacity: 0.15;"></div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;"><i class="ph ph-chart-line-up"></i> Total Gastado</div>
              <div style="font-size: 2.5rem; font-weight: 800; color: #0ea5e9; text-shadow: 0 0 20px rgba(14, 165, 233, 0.4);">\$${spent.toFixed(2)}</div>
            </div>
          </div>
        </div>
        ` : `
        <!-- VIP Card -->
        <div class="glass-card">
          <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: ${vip.gradient}; filter: blur(60px); opacity: 0.2;"></div>
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 15px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: ${vip.gradient}; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: #000; box-shadow: 0 4px 15px ${vip.color}40;">
              <i class="ph-fill ph-crown"></i>
            </div>
            <div>
              <div style="color: var(--text-secondary); font-size: 0.9rem;">Nivel Actual</div>
              <div style="font-size: 1.8rem; font-weight: 800; background: ${vip.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">VIP ${vip.name}</div>
            </div>
          </div>
          ${progressHtml}
          <button onclick="if(typeof showVipBenefits === 'function') showVipBenefits()" style="margin-top: 15px; width: 100%; padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: var(--text-secondary); cursor: pointer; transition: 0.3s; font-size: 0.85rem; display: flex; justify-content: center; align-items: center; gap: 5px;">
            <i class="ph ph-info"></i> Ver Beneficios VIP
          </button>
        </div>

        <!-- Wallet Card -->
        <div class="glass-card" style="border-color: rgba(16, 185, 129, 0.2);">
          <div style="position: absolute; bottom: -50px; left: -50px; width: 150px; height: 150px; background: #0ea5e9; filter: blur(60px); opacity: 0.15;"></div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;"><i class="ph ph-wallet"></i> Saldo Monedero</div>
              <div style="font-size: 2.5rem; font-weight: 800; color: #0ea5e9; text-shadow: 0 0 20px rgba(16, 185, 129, 0.4);">\$${wallet.toFixed(2)}</div>
            </div>
            <button onclick="startWalletRecharge()" class="btn-primary" style="padding: 10px; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: linear-gradient(135deg, #0ea5e9, #0284c7); box-shadow: 0 4px 15px rgba(16,185,129,0.3);" title="Recargar">
              <i class="ph ph-plus" style="font-size: 1.2rem;"></i>
            </button>
          </div>
        </div>

        <!-- Points Card -->
        <div class="glass-card" style="border-color: rgba(59, 130, 246, 0.2);">
          <div style="position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; background: #3b82f6; filter: blur(60px); opacity: 0.15;"></div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;"><i class="ph ph-star"></i> AccessPoints</div>
              <div style="font-size: 2.5rem; font-weight: 800; color: #3b82f6; text-shadow: 0 0 20px rgba(59, 130, 246, 0.4);">${points}</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="if(typeof redeemPoints==='function')redeemPoints()" class="btn-secondary" style="padding: 10px 15px; border-radius: 12px; font-size: 0.85rem; border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,0.1);" title="Canjear 100 PTS = $1 para tienda">
                Canjear
              </button>
              ${(currentRole === 'cliente' || currentRole === 'influencer' || currentRole === 'partner') ? `
              <button onclick="requestCashout()" class="btn-primary" style="padding: 10px 15px; border-radius: 12px; font-size: 0.85rem; background: linear-gradient(135deg, #0ea5e9, #0284c7);" title="Retirar a Binance o Pago Móvil">
                Retirar Dinero
              </button>
              ` : ''}
            </div>
          </div>
        </div>
        `}
      </div>
      
      ${(currentRole === 'cliente' || currentRole === 'influencer' || currentRole === 'partner') ? `
      <!-- Referral Banner -->
      <div class="glass-card" style="background: linear-gradient(90deg, rgba(15,31,56,0.8), rgba(0,229,195,0.1)); border-color: var(--accent); padding: 20px 30px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
        <div style="flex: 1; min-width: 250px;">
          <h3 style="margin: 0 0 5px 0; color: var(--accent); display: flex; align-items: center; gap: 8px;"><i class="ph-fill ph-users-three"></i> ¡Invita y Gana!</h3>
          <p style="margin: 0 0 10px 0; color: var(--text-secondary); font-size: 0.9rem;">Gana AccessPoints cada vez que tus invitados realicen compras.</p>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; font-size: 0.85rem;">
            <div style="background: rgba(0,0,0,0.3); padding: 6px 12px; border-radius: 8px;"><span style="color: var(--accent); font-weight: bold;">${userProfile.referralsCount || 0} / ${(currentRole === 'influencer' || currentRole === 'partner') ? (userProfile.referralLimit || 100) : 10}</span> Amigos</div>
            <div style="background: rgba(0,0,0,0.3); padding: 6px 12px; border-radius: 8px;"><span style="color: #3b82f6; font-weight: bold;">${userProfile.referralsEarnedPoints || 0}</span> Puntos Ganados</div>
          </div>
        </div>
        <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
          <input type="text" readonly value="${window.location.origin}/?ref=${userProfile.referralCode || ''}" style="flex: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px 15px; border-radius: 10px; font-size: 0.9rem; outline: none;">
          <button onclick="navigator.clipboard.writeText('${window.location.origin}/?ref=${userProfile.referralCode || ''}'); usuarioToast('¡Enlace copiado!', 'success')" class="btn-primary" style="padding: 10px 20px; font-size: 0.9rem; border-radius: 10px; display: flex; align-items: center; gap: 6px;">
            <i class="ph ph-copy"></i> Copiar
          </button>
        </div>
      </div>
      ` : ''}

    </section>

    <!-- SECTION: MIS PEDIDOS -->
    <section id="sec-orders" class="panel-section">
      <div class="glass-card" style="min-height: 400px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
          <h2 style="margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;"><i class="ph ph-package"></i> Historial de Pedidos</h2>
          <div style="display: flex; gap: 15px;">
            <button id="tab-active-orders" onclick="switchDashboardTab('active')" style="background:none; border:none; color: var(--accent); border-bottom: 2px solid var(--accent); padding-bottom: 5px; cursor: pointer; font-weight: bold; transition: 0.3s;">En Proceso</button>
            <button id="tab-completed-orders" onclick="switchDashboardTab('completed')" style="background:none; border:none; color: var(--text-secondary); padding-bottom: 5px; cursor: pointer; font-weight: bold; transition: 0.3s;">Completados</button>
          </div>
        </div>
        <div id="dashboard-orders-container">
          <div style="text-align:center; padding: 60px;"><span class="tracking-spinner" style="display:inline-block; width:30px; height:30px; border:3px solid var(--accent); border-bottom-color:transparent; border-radius:50%; animation:spin 1s linear infinite;"></span></div>
        </div>
      </div>
    </section>

    <!-- SECTION: BILLETERA -->
    <section id="sec-wallet" class="panel-section">
      <div class="glass-card" style="min-height: 400px;">
         <h2 style="margin: 0 0 20px 0; font-size: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; display: flex; align-items: center; gap: 10px;"><i class="ph ph-wallet"></i> Historial de Movimientos</h2>
         <div id="dashboard-transactions-container" style="max-height: 500px; overflow-y: auto; padding-right: 10px;">
            <div style="text-align:center; padding: 40px; color: var(--text-secondary);">Cargando movimientos...</div>
         </div>
      </div>
    </section>

    <!-- SECTION: LIBRETA DE IDS -->
    <section id="sec-ids" class="panel-section">
      <div class="glass-card" style="min-height: 400px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
          <h2 style="margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;"><i class="ph ph-address-book"></i> Libreta de IDs</h2>
          <button onclick="showAddIdModal()" class="btn-primary" style="padding: 8px 16px; font-size: 0.9rem; border-radius: 12px; display: flex; align-items: center; gap: 6px;"><i class="ph ph-plus"></i> Añadir ID</button>
        </div>
        <div id="dashboard-saved-ids">
          <div style="text-align:center; color:var(--text-secondary); padding: 40px;">Cargando...</div>
        </div>
      </div>
    </section>

    <!-- SECTION: PERFIL -->
    <section id="sec-profile" class="panel-section">
      <div class="glass-card" style="max-width: 600px; margin: 0 auto;">
        <h2 style="margin: 0 0 24px 0; font-size: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; display: flex; align-items: center; gap: 10px;"><i class="ph ph-user-circle-gear"></i> Ajustes de Cuenta</h2>
        
        <div class="profile-form-group">
          <label><i class="ph ph-envelope"></i> Correo Electrónico</label>
          <input type="email" class="profile-input" value="${currentUser.email || ''}" disabled style="opacity: 0.7; cursor: not-allowed; background: rgba(0,0,0,0.2);" title="El correo electrónico no se puede cambiar">
        </div>
        
        <div class="profile-form-group">
          <label><i class="ph ph-user"></i> Nombre a Mostrar</label>
          <input type="text" id="setting-name" class="profile-input" value="${currentName}" placeholder="Tu nombre">
        </div>
        
        <div class="profile-form-group">
          <label><i class="ph ph-whatsapp-logo"></i> Número de WhatsApp</label>
          <input type="text" id="setting-whatsapp" class="profile-input" value="${currentWhatsapp}" placeholder="Ej. 04120000000">
        </div>
        
        <div class="profile-form-group">
          <label><i class="ph ph-identification-card"></i> Cédula del Titular</label>
          <input type="text" id="setting-cedula" class="profile-input" value="${currentCedula}" placeholder="Ej. V-12345678">
        </div>

        <div class="profile-form-group" style="margin-bottom: 30px;">
          <label><i class="ph ph-map-pin"></i> Dirección</label>
          <input type="text" id="setting-direccion" class="profile-input" value="${currentDireccion}" placeholder="Tu dirección completa">
        </div>
        
        <button class="btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 1.05rem;" id="btn-save-settings" onclick="saveProfileSettings()">
          <i class="ph ph-floppy-disk"></i> Guardar Cambios
        </button>

        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
        <h3 style="margin: 0 0 15px 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; color: var(--text-secondary);"><i class="ph ph-lock-key"></i> Cambiar Contraseña</h3>
        
        <div class="profile-form-group" style="position: relative; margin-bottom: 15px;">
          <input type="password" id="setting-new-password" class="profile-input" placeholder="Nueva contraseña (mínimo 6 caracteres)" style="padding-right: 40px;">
          <i class="ph ph-eye" id="toggle-pwd" onclick="togglePasswordVisibility('setting-new-password', 'toggle-pwd')" style="position: absolute; right: 15px; top: 14px; font-size: 1.2rem; color: var(--text-secondary); cursor: pointer; transition: 0.3s;" title="Mostrar/Ocultar contraseña"></i>
        </div>

        <div class="profile-form-group" style="position: relative; margin-bottom: 25px;">
          <input type="password" id="setting-confirm-password" class="profile-input" placeholder="Confirmar nueva contraseña" style="padding-right: 40px;">
          <i class="ph ph-eye" id="toggle-confirm-pwd" onclick="togglePasswordVisibility('setting-confirm-password', 'toggle-confirm-pwd')" style="position: absolute; right: 15px; top: 14px; font-size: 1.2rem; color: var(--text-secondary); cursor: pointer; transition: 0.3s;" title="Mostrar/Ocultar contraseña"></i>
        </div>

        <button class="btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 1.05rem;" id="btn-change-password" onclick="changeUserPassword()">
          <i class="ph ph-key"></i> Actualizar Contraseña
        </button>
      </div>
    </section>

    <!-- SECTION: MIS TORNEOS -->
    <section id="sec-tournaments" class="panel-section">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px;">
        <h2 style="margin:0; display:flex; align-items:center; gap:10px;"><i class="ph-fill ph-trophy" style="color:#fbbf24;"></i> Mis Torneos</h2>
      </div>
      <div id="dashboard-tournaments-container">
        <div style="text-align:center; padding:40px; color:var(--text-muted);">Cargando torneos...</div>
      </div>
    </section>

    <!-- SECTION: SOPORTE -->
    <section id="sec-support" class="panel-section">
      <div class="glass-card" style="max-width: 800px; margin: 0 auto; height: 600px; display: flex; flex-direction: column; padding: 0; overflow: hidden;">
        <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); display: flex; align-items: center; gap: 15px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-color), var(--accent-hover)); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;"><i class="ph-fill ph-robot"></i></div>
          <div>
            <h3 style="margin: 0; font-size: 1.1rem;">Soporte AccessPlay</h3>
            <div style="font-size: 0.8rem; color: #10b981; display: flex; align-items: center; gap: 4px;"><div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 5px #10b981;"></div> En línea</div>
          </div>
        </div>
        
        <div id="user-chat-messages" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px;">
          <div style="text-align: center; color: var(--text-secondary); margin-top: auto; margin-bottom: auto;">
            <i class="ph ph-chat-circle-text" style="font-size: 3rem; opacity: 0.5; margin-bottom: 10px; display: block;"></i>
            Envíanos un mensaje y te responderemos pronto.
          </div>
        </div>
        
        <div style="padding: 15px; border-top: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); display: flex; gap: 10px;">
          <input type="text" id="user-chat-input" placeholder="Escribe tu mensaje aquí..." style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 12px 15px; border-radius: 12px; outline: none; font-size: 0.95rem;" onkeydown="if(event.key==='Enter') sendUserChatMessage()">
          <button onclick="sendUserChatMessage()" class="btn-primary" style="border-radius: 12px; width: 45px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));">
            <i class="ph-fill ph-paper-plane-right"></i>
          </button>
        </div>
      </div>
    </section>
  `;
}





window.togglePasswordVisibility = function(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input || !icon) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('ph-eye');
    icon.classList.add('ph-eye-slash');
    icon.style.color = 'var(--accent, #0ea5e9)';
  } else {
    input.type = 'password';
    icon.classList.remove('ph-eye-slash');
    icon.classList.add('ph-eye');
    icon.style.color = 'var(--text-secondary)';
  }
};

window.changeUserPassword = async function() {
  if (!currentUser) return;
  const btn = document.getElementById('btn-change-password');
  const newPass = document.getElementById('setting-new-password').value.trim();
  const confirmPass = document.getElementById('setting-confirm-password').value.trim();
  
  if (newPass.length < 6) {
    if (typeof usuarioToast === 'function') usuarioToast('La contraseña debe tener al menos 6 caracteres', 'error');
    else alert('La contraseña debe tener al menos 6 caracteres');
    return;
  }

  if (newPass !== confirmPass) {
    if (typeof usuarioToast === 'function') usuarioToast('Las contraseñas no coinciden', 'error');
    else alert('Las contraseñas no coinciden');
    return;
  }

  btn.innerHTML = 'Actualizando...';
  btn.disabled = true;

  try {
    await currentUser.updatePassword(newPass);
    if (typeof usuarioToast === 'function') usuarioToast('Contraseña actualizada con éxito', 'success');
    else alert('Contraseña actualizada con éxito');
    document.getElementById('setting-new-password').value = '';
    document.getElementById('setting-confirm-password').value = '';
  } catch (error) {
    console.error(error);
    let msg = 'Error al actualizar contraseña. Es posible que debas cerrar sesión y volver a entrar.';
    if (error.code === 'auth/requires-recent-login') {
      msg = 'Por seguridad, debes cerrar sesión y volver a iniciarla para cambiar tu contraseña.';
    }
    if (typeof usuarioToast === 'function') usuarioToast(msg, 'error');
    else alert(msg);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-key"></i> Actualizar Contraseña';
  }
};

async function saveProfileSettings() {
  if (!currentUser) return;
  const btn = document.getElementById('btn-save-settings');
  const name = document.getElementById('setting-name').value.trim();
  const whatsapp = document.getElementById('setting-whatsapp').value.trim();
  const cedula = document.getElementById('setting-cedula').value.trim();
  const direccion = document.getElementById('setting-direccion').value.trim();

  btn.innerHTML = 'Guardando...';
  btn.disabled = true;

  try {
    const promises = [];
    
    if (name !== currentUser.displayName) {
      promises.push(currentUser.updateProfile({ displayName: name }));
    }

    promises.push(firebase.database().ref('users/' + currentUser.uid).update({
      name: name,
      whatsapp: whatsapp,
      cedula: cedula,
      direccion: direccion
    }));

    await Promise.all(promises);
    
    // Update local profile object
    if (typeof userProfile !== 'undefined' && userProfile) {
      userProfile.name = name;
      userProfile.whatsapp = whatsapp;
      userProfile.cedula = cedula;
      userProfile.direccion = direccion;
    }


    alert('Ajustes guardados correctamente.');
    renderApp();
    setTimeout(() => switchSection('profile'), 150); // Keep in profile tab
  } catch (err) {

    if (err.code === 'auth/requires-recent-login') {
      alert('Por seguridad, debes cerrar sesión y volver a entrar para cambiar tu contraseña.');
    } else {
      alert('Error al guardar: ' + err.message);
    }
    btn.innerHTML = 'Guardar';
    btn.disabled = false;
  }
}

function openOrderTracking(orderId) {
  const modal = document.getElementById('profile-modal-container');
  if(modal) modal.remove();
  
  window.location.href = '/?tracking=' + orderId;
}


function renderDashboardOrders(orders, type) {
  if (orders.length === 0) {
    return `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
        <i class="${type === 'active' ? 'ph ph-package' : 'ph ph-check-circle'}" style="font-size: 4rem; opacity: 0.3; margin-bottom: 15px; display: block;"></i>
        <h3 style="font-weight: 500; font-size: 1.2rem;">No tienes pedidos ${type === 'active' ? 'en proceso' : 'completados'}.</h3>
        <button class="btn-primary" onclick="navigateTo('home')" style="margin-top: 20px; padding: 10px 24px; border-radius: 12px; font-size: 0.9rem;">Hacer un pedido</button>
      </div>
    `;
  }
  
  return orders.map(order => {
    let statusColor = '#f59e0b';
    let statusIcon = 'ph-clock-countdown';
    if (order.status === 'processing' || order.status === 'procesando') { statusColor = '#3b82f6'; statusIcon = 'ph-spinner-gap'; }
    if (order.status === 'completed' || order.status === 'completado') { statusColor = '#0ea5e9'; statusIcon = 'ph-check-circle'; }
    if (order.status === 'rejected' || order.status === 'rechazado') { statusColor = '#ef4444'; statusIcon = 'ph-x-circle'; }

    const STATUS_ES = {
      'pending': 'PENDIENTE',
      'processing': 'PROCESANDO',
      'completed': 'COMPLETADO',
      'rejected': 'RECHAZADO'
    };
    const statusText = STATUS_ES[order.status] || order.status.toUpperCase();

    return `
    <div onclick="openOrderTracking('${order.id}')" style="cursor: pointer; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid ${statusColor}; border-radius: 12px; padding: 20px; margin-bottom: 16px; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.3)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div style="display: flex; gap: 15px; align-items: center;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: ${statusColor}15; display: flex; align-items: center; justify-content: center; color: ${statusColor}; font-size: 1.5rem;">
            <i class="ph ${statusIcon}"></i>
          </div>
          <div>
            <span style="font-weight: 800; color: #fff; font-size: 1.1rem;">${order.productName || 'Producto'}</span>
            <div style="color: var(--accent); font-weight: bold; margin-top: 2px; font-size: 0.9rem;">${order.packageLabel || ''}</div>
          </div>
        </div>
        <div style="text-align: right;">
           <span style="background: ${statusColor}20; color: ${statusColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; border: 1px solid ${statusColor}40; letter-spacing: 0.5px;">${statusText}</span>
           <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px; font-family: monospace;">#${order.id}</div>
        </div>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 15px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 12px; display: flex; align-items: center; gap: 6px;">
        <i class="ph ph-calendar-blank"></i> ${new Date(order.createdAt).toLocaleString()}
      </div>

      ${order.status === 'rejected' && order.rejectReason ? `
      <div style="margin-bottom: 15px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px; color: #ef4444; font-size: 0.85rem;">
        <i class="ph-fill ph-warning"></i> <strong>Tu pedido fue rechazado:</strong>
        <div style="color: white; margin-top: 4px; font-size: 0.95rem; font-weight: 500;">${order.rejectReason}</div>
      </div>
      ` : ''}
      
      ${type === 'active' ? `
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px; font-weight: bold;">
        <span style="color: ${order.status === 'pending' || order.status === 'processing' ? 'var(--accent)' : 'var(--text-secondary)'}">1. Recibido</span>
        <span style="color: ${order.status === 'processing' ? '#3b82f6' : 'var(--text-secondary)'}">2. Procesando</span>
        <span>3. Entregado</span>
      </div>
      <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
        <div style="width: ${order.status === 'pending' ? '33%' : (order.status === 'processing' ? '66%' : '100%')}; height: 100%; background: ${statusColor}; box-shadow: 0 0 10px ${statusColor}; transition: width 0.5s ease;"></div>
      </div>
      ` : ''}
    </div>
  `}).join('');
}




function renderDashboardTransactions() {
  const container = document.getElementById('dashboard-transactions-container');
  if (!container) return;
  
  let txList = [];
  if (userProfile && userProfile.transactions) {
    txList = Array.isArray(userProfile.transactions) ? userProfile.transactions : Object.values(userProfile.transactions);
  }
  
  if (txList.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-secondary);">
        <i class="ph ph-receipt" style="font-size: 3rem; opacity: 0.3; margin-bottom: 10px; display: block;"></i>
        No hay movimientos recientes.
      </div>`;
    return;
  }
  
  const sortedTx = [...txList].sort((a,b) => b.date - a.date);
  
  container.innerHTML = sortedTx.map(tx => {
    let sign = tx.amount >= 0 ? '+' : '';
    let color = tx.amount >= 0 ? '#0ea5e9' : '#ff5252';
    let icon = tx.type === 'deposit' ? 'ph-arrow-down-left' : (tx.type === 'purchase' ? 'ph-shopping-cart' : 'ph-arrows-left-right');
    return `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 12px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.03); transition: 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'">
       <div style="display: flex; align-items: center; gap: 15px;">
         <div style="width: 40px; height: 40px; border-radius: 50%; background: ${color}15; display: flex; align-items: center; justify-content: center; color: ${color}; font-size: 1.2rem;">
            <i class="ph ${icon}"></i>
         </div>
         <div>
           <div style="font-weight: bold; font-size: 0.95rem;">${tx.description || 'Movimiento'}</div>
           <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; display: flex; align-items: center; gap: 4px;"><i class="ph ph-clock"></i> ${new Date(tx.date).toLocaleString()}</div>
         </div>
       </div>
       <div style="font-weight: 900; color: ${color}; font-size: 1.1rem;">${sign}\$${parseFloat(tx.amount).toFixed(2)}</div>
    </div>
    `;
  }).join('');
}

function showVipBenefits() {
  const modalContainer = document.createElement('div');
  modalContainer.id = 'vip-benefits-modal';
  modalContainer.innerHTML = `
    <div class="modal-overlay active" style="z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="this.parentElement.remove()">
      <div class="modal" style="max-width: 500px; padding: 0; overflow: hidden; animation: slideInUp 0.3s ease; position: relative; width: 90%; background: var(--bg-surface);" onclick="event.stopPropagation()">
        <div style="background: linear-gradient(135deg, var(--bg-surface), #1a2a40); padding: 30px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">
          <div style="width: 70px; height: 70px; background: rgba(0,229,195,0.1); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 2rem; color: var(--accent); margin: 0 auto 15px auto;">
            <i class="ph-fill ph-star"></i>
          </div>
          <h2 style="margin: 0; font-size: 1.5rem;">Beneficios Exclusivos</h2>
          <p style="margin: 10px 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">Mientras más compras, mejores recompensas obtienes.</p>
        </div>
        
        <div style="padding: 30px; max-height: 60vh; overflow-y: auto;">
          <h3 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px; color: #3b82f6;"><i class="ph-fill ph-coin"></i> AccessPoints por Compra</h3>
          <ul style="list-style: none; padding: 0; margin: 0 0 25px 0; display: grid; gap: 10px;">
            <li style="display: flex; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; font-size: 0.9rem;">
              <span>Recargas menores a $5</span> <strong style="color: #3b82f6;">2 Puntos</strong>
            </li>
            <li style="display: flex; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; font-size: 0.9rem;">
              <span>Recargas entre $5 y $12</span> <strong style="color: #3b82f6;">4 Puntos</strong>
            </li>
            <li style="display: flex; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; font-size: 0.9rem;">
              <span>Recargas mayores a $12</span> <strong style="color: #3b82f6;">7 Puntos</strong>
            </li>
          </ul>

          <h3 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px; color: #0ea5e9;"><i class="ph-fill ph-wallet"></i> Cashback VIP (Reembolso)</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 15px; background: rgba(16,185,129,0.1); padding: 10px; border-radius: 8px; border-left: 3px solid #0ea5e9;">Obtén un porcentaje de tu compra de vuelta a tu billetera automáticamente. <br><em>Nota: No aplica si usas un código de descuento.</em></p>
          
          <ul style="list-style: none; padding: 0; margin: 0 0 25px 0; display: grid; gap: 8px;">
            <li style="display: flex; justify-content: space-between; padding: 10px 15px; border-radius: 8px; border-left: 4px solid #cd7f32; background: linear-gradient(90deg, rgba(205,127,50,0.1), transparent);">
              <span style="font-weight: bold; color: #cd7f32;">Bronce</span> <strong>0%</strong>
            </li>
            <li style="display: flex; justify-content: space-between; padding: 10px 15px; border-radius: 8px; border-left: 4px solid #c0c0c0; background: linear-gradient(90deg, rgba(192,192,192,0.1), transparent);">
              <span style="font-weight: bold; color: #c0c0c0;">Plata</span> <strong>1%</strong>
            </li>
            <li style="display: flex; justify-content: space-between; padding: 10px 15px; border-radius: 8px; border-left: 4px solid #ffd700; background: linear-gradient(90deg, rgba(255,215,0,0.1), transparent);">
              <span style="font-weight: bold; color: #ffd700;">Oro</span> <strong>2%</strong>
            </li>
            <li style="display: flex; justify-content: space-between; padding: 10px 15px; border-radius: 8px; border-left: 4px solid #e5e4e2; background: linear-gradient(90deg, rgba(229,228,226,0.1), transparent);">
              <span style="font-weight: bold; color: #e5e4e2;">Platino</span> <strong>3%</strong>
            </li>
            <li style="display: flex; justify-content: space-between; padding: 10px 15px; border-radius: 8px; border-left: 4px solid #b9f2ff; background: linear-gradient(90deg, rgba(185,242,255,0.1), transparent);">
              <span style="font-weight: bold; color: #b9f2ff;">Diamante</span> <strong>4%</strong>
            </li>
          </ul>

          <button onclick="this.closest('#vip-benefits-modal').remove()" class="btn-primary" style="width: 100%; padding: 14px; border-radius: 12px; font-size: 1rem; margin-top: 10px;">
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalContainer);
}


window.requestCashout = function() {
  if (!userProfile) return;
  const currentPoints = userProfile.points || 0;
  if (currentPoints < 100) {
    usuarioToast('Necesitas al menos 100 AccessPoints para retirar.', 'error');
    return;
  }
  
  const modalHTML = `
    <div class="modal-overlay active" id="cashout-modal">
      <div class="modal" style="background: var(--bg-surface); padding: 30px; border-radius: 16px; width: 90%; max-width: 450px;">
        <h3 style="margin-top:0; color: var(--accent);"><i class="ph-fill ph-money"></i> Retirar Ganancias</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Tienes <strong>${currentPoints}</strong> puntos disponibles.</p>
        
        <div class="form-group" style="margin-top: 15px;">
          <label>Cantidad de puntos a retirar (Min. 100)</label>
          <input type="number" id="cashout-amount" class="form-input" min="100" max="${currentPoints}" value="${currentPoints}">
          <div style="font-size: 0.8rem; color: #0ea5e9; margin-top: 5px;" id="cashout-usd-preview">Recibirás: $${(currentPoints * 0.01).toFixed(2)} USD</div>
        </div>

        <div class="form-group">
          <label>Método de Pago</label>
          <select id="cashout-method" class="form-input" onchange="
            const method = this.value;
            if(method === 'binance') {
              document.getElementById('cashout-binance-fields').style.display = 'block';
              document.getElementById('cashout-pagomovil-fields').style.display = 'none';
            } else {
              document.getElementById('cashout-binance-fields').style.display = 'none';
              document.getElementById('cashout-pagomovil-fields').style.display = 'block';
            }
          ">
            <option value="binance">Binance Pay</option>
            <option value="pagomovil">Pago Móvil</option>
          </select>
        </div>
        
        <div id="cashout-binance-fields">
          <div class="form-group">
            <label>Correo / PayID / Binance ID</label>
            <input type="text" id="cashout-binance-id" class="form-input" placeholder="ej. usuario@gmail.com o 12345678">
          </div>
        </div>
        
        <div id="cashout-pagomovil-fields" style="display:none;">
          <div class="form-group">
            <label>Banco</label>
            <input type="text" id="cashout-pm-bank" class="form-input" placeholder="ej. Banesco, Mercantil...">
          </div>
          <div class="form-group">
            <label>Teléfono</label>
            <input type="text" id="cashout-pm-phone" class="form-input" placeholder="0414-XXXXXXX">
          </div>
          <div class="form-group">
            <label>Cédula</label>
            <input type="text" id="cashout-pm-cedula" class="form-input" placeholder="V-12345678">
          </div>
        </div>
        
        <div style="display:flex; gap:10px; margin-top: 25px;">
          <button class="btn btn-secondary" onclick="document.getElementById('cashout-modal').remove()">Cancelar</button>
          <button class="btn btn-primary" onclick="submitCashout()">Confirmar Retiro</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  document.getElementById('cashout-amount').addEventListener('input', function() {
    const val = parseInt(this.value) || 0;
    document.getElementById('cashout-usd-preview').innerText = 'Recibirás: $' + (val * 0.01).toFixed(2) + ' USD';
  });
};

window.submitCashout = function() {
  const amount = parseInt(document.getElementById('cashout-amount').value) || 0;
  const currentPoints = userProfile.points || 0;
  
  if (amount < 100) return usuarioToast('Mínimo de retiro: 100 puntos', 'error');
  if (amount > currentPoints) return usuarioToast('No tienes suficientes puntos', 'error');
  
  const method = document.getElementById('cashout-method').value;
  let details = {};
  
  if (method === 'binance') {
    const binanceId = document.getElementById('cashout-binance-id').value.trim();
    if (!binanceId) return usuarioToast('Ingresa tu ID de Binance', 'error');
    details = { type: 'binance', account: binanceId };
  } else {
    const bank = document.getElementById('cashout-pm-bank').value.trim();
    const phone = document.getElementById('cashout-pm-phone').value.trim();
    const cedula = document.getElementById('cashout-pm-cedula').value.trim();
    if (!bank || !phone || !cedula) return usuarioToast('Completa todos los datos del Pago Móvil', 'error');
    details = { type: 'pagomovil', bank, phone, cedula };
  }
  
  // Submit
  const withdrawRef = firebase.database().ref('withdrawals').push();
  const withdrawalData = {
    id: withdrawRef.key,
    userId: currentUser.uid,
    userEmail: currentUser.email,
    userName: userProfile.name || '',
    amountPoints: amount,
    amountUsd: parseFloat((amount * 0.01).toFixed(2)),
    method: method,
    details: details,
    status: 'pending',
    createdAt: Date.now()
  };
  
  firebase.auth().currentUser.getIdToken().then(idToken => {
    return fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({ action: 'cashout', amount: amount })
    });
  }).then(res => res.json()).then(data => {
    if (data.error) throw new Error(data.error);
    
    // Save transaction record in user's history
    firebase.database().ref('users/' + currentUser.uid + '/transactions').push({
      id: Date.now().toString(),
      type: 'withdrawal',
      amount: 0,
      description: `Retiro a ${method === 'binance' ? 'Binance' : 'Pago Móvil'} (-${amount} PTS)`,
      date: Date.now()
    });
    
    // Save withdrawal request
    withdrawRef.set(withdrawalData).then(() => {
      document.getElementById('cashout-modal').remove();
      usuarioToast('¡Solicitud de retiro enviada! El equipo la procesará pronto.', 'success');
      if (typeof renderDashboard === 'function') renderDashboard();
    });
  }).catch(err => {
    usuarioToast('Error: ' + err.message, 'error');
  });
};

// ==========================================
// CHAT DE SOPORTE
// ==========================================

let userChatLoaded = false;
let userUnreadMessages = 0;

function initUserChat() {
  if (!currentUser || userChatLoaded) return;
  userChatLoaded = true;
  
  // Escuchar a la rama individual del usuario
  firebase.database().ref('messages/' + currentUser.uid).on('value', snap => {
    const userConv = snap.val();
    const container = document.getElementById('user-chat-messages');
    if (!container) return;
    
    if (!userConv || !userConv.messages || userConv.messages.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); margin-top: auto; margin-bottom: auto;">
          <i class="ph ph-chat-circle-text" style="font-size: 3rem; opacity: 0.5; margin-bottom: 10px; display: block;"></i>
          Envíanos un mensaje y te responderemos pronto.
        </div>
      `;
      return;
    }
    
    let html = '';
    let hasUnreadAdmin = userConv.hasUnreadUser; // In data.js, admin sets hasUnreadUser = true when sending to user
    
    userConv.messages.forEach(msg => {
      const isUser = msg.sender === 'user';
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      html += `
        <div style="display: flex; flex-direction: column; align-items: ${isUser ? 'flex-end' : 'flex-start'};">
          <div style="max-width: 80%; padding: 12px 16px; border-radius: 15px; ${isUser ? 'background: linear-gradient(135deg, var(--accent-color), var(--accent-hover)); color: white; border-bottom-right-radius: 4px;' : 'background: rgba(255,255,255,0.05); color: white; border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.1);'}">
            ${escapeHTML(msg.text)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 5px; margin-${isUser ? 'right' : 'left'}: 5px;">
            ${time}
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
    
    // Mark as read if section is open
    const secSupport = document.getElementById('sec-support');
    if (secSupport && secSupport.classList.contains('active') && hasUnreadAdmin) {
      markChatAsRead();
    } else if (hasUnreadAdmin) {
      // Show badge on nav item
      const navSupport = document.getElementById('nav-support');
      if (navSupport && !navSupport.innerHTML.includes('badge')) {
        navSupport.innerHTML += '<div class="badge" style="background:#ef4444; width:10px; height:10px; border-radius:50%; margin-left:auto;"></div>';
      }
    }
  });
}

function sendUserChatMessage() {
  const input = document.getElementById('user-chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text || !currentUser) return;
  
  input.value = '';
  
  // Usar la función addMessage global de data.js que administra el array MESSAGES y Firebase
  if (typeof addMessage === 'function') {
    const contactName = (typeof userProfile !== 'undefined' && userProfile?.name) ? userProfile.name : (currentUser.displayName || currentUser.email);
    addMessage(currentUser.uid, 'user', text, contactName);
    
    // Notify Telegram using global TELEGRAM_CONFIG (Ahora manejado por el Robot Tiendas)
    // fetch API removido porque el Cerebro Central procesa los mensajes

  }
}

function markChatAsRead() {
  if (!currentUser) return;
  
  // Usar la función markMessagesAsRead global de data.js
  if (typeof markMessagesAsRead === 'function') {
    markMessagesAsRead(currentUser.uid, 'user'); // user = el usuario lee los mensajes
  }
  
  // Remove badge
  const navSupport = document.getElementById('nav-support');
  if (navSupport) {
    const badge = navSupport.querySelector('.badge');
    if (badge) badge.remove();
  }
}

// Interceptar switchSection para marcar como leido si abren soporte
const originalSwitchSection = window.switchSection;
window.switchSection = function(sectionId) {
  if (originalSwitchSection) originalSwitchSection(sectionId);
  if (sectionId === 'support') {
    markChatAsRead();
  }
}

// ==========================================
// NOTIFICACIONES WEB API
// ==========================================

let notificationsInitialized = false;
let previousOrdersState = {};

function initNotifications() {
  if (notificationsInitialized || !currentUser) return;
  
  if (!('Notification' in window)) {
    console.log('El navegador no soporta notificaciones');
    return;
  }
  
  // Solicitar permiso
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
  
  notificationsInitialized = true;
  
  // Escuchar cambios en los pedidos del usuario
  firebase.database().ref('users/' + currentUser.uid + '/orders').on('value', async snap => {
    const ordersMap = snap.val();
    if (!ordersMap) return;
    
    // Check for status changes
    for (const orderId of Object.keys(ordersMap)) {
      const orderSnap = await firebase.database().ref('orders/' + orderId).once('value');
      const orderData = orderSnap.val();
      if (!orderData) continue;
      
      const prevStatus = previousOrdersState[orderId];
      const newStatus = orderData.status;
      
      if (prevStatus && prevStatus !== newStatus && newStatus !== 'pending') {
        // Status changed, trigger notification
        triggerNotification('Actualización de Pedido', `Tu pedido de ${orderData.productName || 'producto'} ahora está: ${newStatus.toUpperCase()}`);
      }
      
      previousOrdersState[orderId] = newStatus;
    }
  });
  
  // Escuchar mensajes nuevos en el chat (si está cerrado)
  firebase.database().ref('messages/' + currentUser.uid).on('value', snap => {
    const userConv = snap.val();
    
    // Only notify if message is from admin and not yet read (hasUnreadUser=true)
    if (userConv && userConv.hasUnreadUser) {
      // Check if chat is currently open
      const secSupport = document.getElementById('sec-support');
      if (!(secSupport && secSupport.classList.contains('active'))) {
         const lastMsg = userConv.messages[userConv.messages.length - 1];
         if (lastMsg && lastMsg.sender === 'admin') {
           triggerNotification('Nuevo mensaje de Soporte', lastMsg.text);
         }
      }
    }
  });
}

window.renderDashboardTournaments = async function() {
  const container = document.getElementById('dashboard-tournaments-container');
  if (!container || !currentUser) return;
  
  try {
    const snap = await firebase.database().ref('tournaments').once('value');
    const allTournaments = snap.val() || {};
    
    const myTournaments = [];
    Object.keys(allTournaments).forEach(key => {
      const t = allTournaments[key];
      t.id = key;
      if (t.participants && t.participants[currentUser.uid]) {
        myTournaments.push(t);
      }
    });
    
    // Sort so most recent (ongoing/registration_open) are first
    myTournaments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (myTournaments.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:50px 20px; background:rgba(255,255,255,0.02); border-radius:var(--radius-lg); border:1px dashed rgba(255,255,255,0.1);">
          <i class="ph ph-trophy" style="font-size:3rem; color:var(--text-muted); margin-bottom:15px;"></i>
          <h3 style="color:var(--text-secondary);">No estás inscrito en ningún torneo</h3>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">Explora la sección de torneos para encontrar partidas activas.</p>
          <button class="btn btn-primary" onclick="window.location.href='/torneos.html'">Ir a Torneos</button>
        </div>
      `;
      return;
    }
    
    let html = '<div style="display:grid; gap:20px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">';
    
    myTournaments.forEach(t => {
      const statusLabels = {
        'upcoming': { text: 'Próximo', color: '#ffb74d' },
        'registration_open': { text: 'Inscripción Abierta', color: '#42a5f5' },
        'ongoing': { text: 'En Curso', color: '#8b5cf6' },
        'completed': { text: 'Finalizado', color: '#66bb6a' }
      };
      
      const st = statusLabels[t.status] || { text: t.status, color: '#fff' };
      
      // Credentials box
      let credsHtml = '';
      if (t.credentials && t.credentials.roomId && t.status !== 'completed') {
        credsHtml = `
          <div style="margin-top: 15px; background: linear-gradient(135deg, rgba(0, 229, 195, 0.1), rgba(0, 229, 195, 0.02)); border: 1px solid rgba(0, 229, 195, 0.3); border-radius: var(--radius-sm); padding: 15px; position:relative; overflow:hidden;">
            <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:var(--accent);"></div>
            <h4 style="margin:0 0 10px 0; color:var(--accent-light); font-size:0.95rem; display:flex; align-items:center; gap:6px;"><i class="ph-fill ph-key"></i> Credenciales de la Sala</h4>
            
            <div style="display:flex; gap:10px; margin-bottom:8px;">
              <div style="flex:1;">
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:3px;">ID de la Sala</div>
                <div style="background:rgba(0,0,0,0.3); padding:8px 10px; border-radius:6px; font-family:monospace; font-size:1.1rem; color:#fff; display:flex; justify-content:space-between; align-items:center;">
                  ${t.credentials.roomId}
                  <i class="ph ph-copy" style="cursor:pointer; opacity:0.7;" onclick="navigator.clipboard.writeText('${t.credentials.roomId}'); this.style.color='var(--accent)';"></i>
                </div>
              </div>
            </div>
            
            <div style="display:flex; gap:10px;">
              <div style="flex:1;">
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:3px;">Contraseña</div>
                <div style="background:rgba(0,0,0,0.3); padding:8px 10px; border-radius:6px; font-family:monospace; font-size:1.1rem; color:#fff; display:flex; justify-content:space-between; align-items:center;">
                  ${t.credentials.password || 'Sin contraseña'}
                  <i class="ph ph-copy" style="cursor:pointer; opacity:0.7;" onclick="navigator.clipboard.writeText('${t.credentials.password || ''}'); this.style.color='var(--accent)';"></i>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (t.status === 'upcoming' || t.status === 'registration_open') {
        credsHtml = `
          <div style="margin-top: 15px; background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: var(--radius-sm); padding: 12px; text-align: center;">
            <i class="ph ph-lock-key" style="font-size: 1.5rem; color: var(--text-muted); margin-bottom: 5px;"></i>
            <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">Las credenciales se publicarán cuando inicie el torneo.</p>
          </div>
        `;
      } else if (t.status === 'completed') {
         credsHtml = `
          <div style="margin-top: 15px; background: rgba(102, 187, 106, 0.05); border: 1px solid rgba(102, 187, 106, 0.2); border-radius: var(--radius-sm); padding: 12px; text-align: center;">
            <p style="margin: 0; font-size: 0.85rem; color: #66bb6a;">El torneo ha finalizado.</p>
          </div>
        `;
      }
      
      let dateStr = '';
      try { if (t.createdAt) dateStr = new Date(t.createdAt).toLocaleDateString(); } catch(e) {}
      
      html += `
        <div class="glass-card" style="padding: 20px; border-top: 2px solid ${st.color};">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
            <h3 style="margin:0; font-family:var(--font-display); font-size:1.2rem;">${t.title}</h3>
            <span style="background:${st.color}20; color:${st.color}; padding:3px 8px; border-radius:12px; font-size:0.75rem; border:1px solid ${st.color}40; white-space:nowrap;">${st.text}</span>
          </div>
          <p style="margin:0 0 5px 0; color:var(--text-secondary); font-size:0.85rem;">🎮 ${t.productName || ''}</p>
          <p style="margin:0; color:var(--text-muted); font-size:0.8rem;">📅 Creado: ${dateStr}</p>
          
          ${credsHtml}
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
  } catch(err) {
    console.error("Error rendering tournaments:", err);
    container.innerHTML = `<div style="color:red; padding:20px;">Error al cargar tus torneos.</div>`;
  }
};
