// ============================================================
// AccessPlay — Torneos Logic
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Inicialización de la vista
  if (typeof renderNavbar === 'function') {
    document.getElementById('navbar-container').innerHTML = renderNavbar();
  }
  
  // Esperar a que Firebase se inicialice
  setTimeout(initTorneos, 1000);
});

let torneosData = [];

function initTorneos() {
  if (typeof firebase === 'undefined') {
    setTimeout(initTorneos, 500);
    return;
  }
  
  const db = firebase.database();
  
  // Escuchar cambios en la autenticación para refrescar la UI
  firebase.auth().onAuthStateChanged(user => {
    if (window.currentUser !== undefined) {
      window.currentUser = user;
    }
    renderTorneos(torneosData);
  });
  
  // Escuchar nodos de torneos
  db.ref('tournaments').orderByChild('createdAt').on('value', snapshot => {
    torneosData = [];
    snapshot.forEach(childSnapshot => {
      torneosData.push(childSnapshot.val());
    });
    
    // Ordenar: Los abiertos primero, luego en curso, luego próximos, luego completados
    torneosData.sort((a, b) => {
      const order = { 'registration_open': 1, 'ongoing': 2, 'upcoming': 3, 'completed': 4 };
      const statusA = order[a.status] || 99;
      const statusB = order[b.status] || 99;
      if (statusA !== statusB) return statusA - statusB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    renderTorneos(torneosData);
  });
}

function renderTorneos(torneos) {
  const container = document.getElementById('torneos-list');
  if (!container) return;
  
  if (torneos.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); width: 100%; padding: 40px; grid-column: 1 / -1;">
        <div style="font-size: 3rem; margin-bottom: 15px;">🏆</div>
        <h3>No hay torneos disponibles</h3>
        <p>Mantente atento a nuestros próximos eventos y torneos.</p>
      </div>
    `;
    return;
  }
  
  const user = firebase.auth().currentUser;
  
  let html = '';
  torneos.forEach(torneo => {
    const participants = torneo.participants || {};
    const count = Object.keys(participants).length;
    const max = torneo.maxParticipants || 100;
    const progress = Math.min((count / max) * 100, 100);
    const isJoined = user && participants[user.uid];
    
    let badgeClass = '';
    let statusText = '';
    
    switch (torneo.status) {
      case 'upcoming': badgeClass = 'badge-upcoming'; statusText = 'Próximo'; break;
      case 'registration_open': badgeClass = 'badge-open'; statusText = 'Inscripciones Abiertas'; break;
      case 'ongoing': badgeClass = 'badge-ongoing'; statusText = 'En Curso'; break;
      case 'completed': badgeClass = 'badge-completed'; statusText = 'Finalizado'; break;
      default: badgeClass = 'badge-upcoming'; statusText = torneo.status;
    }
    
    let actionButton = '';
    if (torneo.status === 'registration_open') {
      if (user) {
        if (isJoined) {
          actionButton = `<button class="torneo-btn btn-joined" disabled>✅ Ya estás inscrito</button>`;
        } else if (count >= max) {
          actionButton = `<button class="torneo-btn" disabled>Cupos Agotados</button>`;
        } else {
          actionButton = `<button class="torneo-btn" onclick="inscribirseTorneo('${torneo.id}')">Inscribirse Ahora</button>`;
        }
      } else {
        actionButton = `<button class="torneo-btn" onclick="showAuthModal()">Inicia Sesión para Inscribirte</button>`;
      }
    } else if (torneo.status === 'ongoing') {
      actionButton = `<button class="torneo-btn" disabled>Torneo en progreso</button>`;
    } else if (torneo.status === 'completed') {
      if (torneo.winnerName) {
        actionButton = `<div style="text-align:center; padding:10px; background:rgba(255,215,0,0.1); border-radius:10px; color:gold; border:1px solid rgba(255,215,0,0.3);">👑 Ganador: ${torneo.winnerName}</div>`;
      } else {
        actionButton = `<button class="torneo-btn" disabled>Torneo Finalizado</button>`;
      }
    }
    
    html += `
      <div class="torneo-card">
        <span class="torneo-badge ${badgeClass}">• ${statusText}</span>
        <h3 class="torneo-title">${torneo.title}</h3>
        
        <div class="torneo-info">
          <div class="torneo-info-item">
            <span>🎁</span> <span>${torneo.prize || 'Premios Especiales'}</span>
          </div>
          <div class="torneo-info-item">
            <span>🎮</span> <span>${torneo.productName}</span>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div class="torneo-progress-container">
            <div class="torneo-progress-bar" style="width: ${progress}%"></div>
          </div>
          <div class="torneo-progress-text">${count} / ${max} Participantes</div>
        </div>
        
        ${actionButton}
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function inscribirseTorneo(tournamentId) {
  const user = firebase.auth().currentUser;
  if (!user) {
    if (typeof showAuthModal === 'function') showAuthModal();
    return;
  }
  
  // Buscar información extra del usuario si está disponible (como el nombre)
  let userName = user.displayName || user.email;
  if (typeof userProfile !== 'undefined' && userProfile && userProfile.name) {
    userName = userProfile.name;
  }
  
  const btn = event.currentTarget;
  btn.disabled = true;
  btn.innerText = 'Inscribiendo...';
  
  firebase.database().ref('tournaments/' + tournamentId + '/participants/' + user.uid).set({
    uid: user.uid,
    name: userName,
    email: user.email,
    joinedAt: new Date().toISOString()
  }).then(() => {
    btn.className = 'torneo-btn btn-joined';
    btn.innerText = '✅ Inscrito con éxito';
  }).catch(err => {
    console.error('Error al inscribirse:', err);
    btn.disabled = false;
    btn.innerText = 'Error. Intenta de nuevo';
    alert('Ocurrió un error al inscribirte. Verifica tu conexión.');
  });
}
