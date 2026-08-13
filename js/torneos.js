// ============================================================
// AccessPlay — Torneos Logic (Rediseño Profesional v2)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  if (typeof renderNavbar === 'function') {
    document.getElementById('navbar-container').innerHTML = renderNavbar();
  }
  setTimeout(initTorneos, 1000);
});

let torneosData = [];
let currentFilter = 'all';
let countdownIntervals = [];

// ── Game Banner Helpers ──
function getGameBannerClass(productName) {
  const name = (productName || '').toLowerCase();
  if (name.includes('free') && name.includes('fire')) return 'torneo-banner-freefire';
  if (name.includes('blood') && name.includes('strike')) return 'torneo-banner-bloodstrike';
  if (name.includes('mobile') && name.includes('legend')) return 'torneo-banner-mobilelegends';
  if (name.includes('legend') && name.includes('mobile')) return 'torneo-banner-mobilelegends';
  return 'torneo-banner-default';
}

function getGameModeIcon(mode) {
  switch(mode) {
    case 'solo': return '👤';
    case 'duo': return '👥';
    case 'squad': return '🎯';
    default: return '🎮';
  }
}

function getGameModeLabel(mode) {
  switch(mode) {
    case 'solo': return 'Solo';
    case 'duo': return 'Dúo';
    case 'squad': return 'Escuadras';
    default: return 'Libre';
  }
}

// ── Init ──
function initTorneos() {
  if (typeof firebase === 'undefined') {
    setTimeout(initTorneos, 500);
    return;
  }
  
  const db = firebase.database();
  
  firebase.auth().onAuthStateChanged(user => {
    if (window.currentUser !== undefined) {
      window.currentUser = user;
    }
    renderTorneos(torneosData);
  });
  
  // Listen for tournaments
  db.ref('tournaments').orderByChild('createdAt').on('value', snapshot => {
    torneosData = [];
    snapshot.forEach(childSnapshot => {
      torneosData.push(childSnapshot.val());
    });
    
    torneosData.sort((a, b) => {
      const order = { 'registration_open': 1, 'ongoing': 2, 'upcoming': 3, 'completed': 4 };
      const statusA = order[a.status] || 99;
      const statusB = order[b.status] || 99;
      if (statusA !== statusB) return statusA - statusB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    updateStats(torneosData);
    renderTorneos(torneosData);
    renderHallOfFame(torneosData);
  });
  
  // Filter buttons
  document.getElementById('torneos-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.torneos-filter-btn');
    if (!btn) return;
    document.querySelectorAll('.torneos-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTorneos(torneosData);
  });
}

// ── Stats ──
function updateStats(torneos) {
  const active = torneos.filter(t => t.status === 'registration_open' || t.status === 'ongoing').length;
  const completed = torneos.filter(t => t.status === 'completed').length;
  let totalParticipants = 0;
  torneos.forEach(t => {
    totalParticipants += Object.values(t.participants || {}).reduce((acc, p) => acc + 1 + (p.teamMembers ? p.teamMembers.length : 0), 0);
  });
  
  animateCounter('stat-active', active);
  animateCounter('stat-participants', totalParticipants);
  animateCounter('stat-completed', completed);
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  
  const duration = 800;
  const step = (target - current) / (duration / 16);
  let val = current;
  
  const timer = setInterval(() => {
    val += step;
    if ((step > 0 && val >= target) || (step < 0 && val <= target)) {
      val = target;
      clearInterval(timer);
    }
    el.textContent = Math.round(val);
  }, 16);
}

// ── Countdown ──
function getCountdownHTML(deadline) {
  if (!deadline) return '';
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diff = deadlineDate - now;
  
  if (diff <= 0) {
    return '<span class="torneo-countdown-expired">⏰ Inscripciones cerradas</span>';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  let html = '<div class="torneo-countdown">';
  if (days > 0) {
    html += `<div class="torneo-countdown-unit"><div class="torneo-countdown-value">${days}</div><div class="torneo-countdown-label">Días</div></div>`;
  }
  html += `<div class="torneo-countdown-unit"><div class="torneo-countdown-value">${hours}</div><div class="torneo-countdown-label">Hrs</div></div>`;
  html += `<div class="torneo-countdown-unit"><div class="torneo-countdown-value">${String(mins).padStart(2,'0')}</div><div class="torneo-countdown-label">Min</div></div>`;
  html += '</div>';
  return html;
}

function startCountdowns() {
  // Clear previous intervals
  countdownIntervals.forEach(id => clearInterval(id));
  countdownIntervals = [];
  
  document.querySelectorAll('[data-countdown-deadline]').forEach(el => {
    const deadline = el.dataset.countdownDeadline;
    const intervalId = setInterval(() => {
      el.innerHTML = getCountdownHTML(deadline);
      // Auto-close if expired
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) {
        clearInterval(intervalId);
      }
    }, 60000); // Update every minute
    countdownIntervals.push(intervalId);
  });
}

// ── Render Tournaments ──
function renderTorneos(torneos) {
  const container = document.getElementById('torneos-list');
  if (!container) return;
  
  // Apply filter
  let filtered = torneos;
  if (currentFilter !== 'all') {
    filtered = torneos.filter(t => t.status === currentFilter);
  }
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="torneos-empty">
        <div class="torneos-empty-icon">🏆</div>
        <h3>${currentFilter === 'all' ? 'No hay torneos disponibles' : 'No hay torneos en esta categoría'}</h3>
        <p>Mantente atento a nuestros próximos eventos y copas.</p>
      </div>
    `;
    return;
  }
  
  const user = firebase.auth().currentUser;
  let html = '';
  
  filtered.forEach(torneo => {
    const participants = torneo.participants || {};
    const count = Object.values(participants).reduce((acc, p) => {
      if (p.paymentStatus === 'rejected') return acc;
      return acc + 1 + (p.teamMembers ? p.teamMembers.length : 0);
    }, 0);
    const max = torneo.maxParticipants || 100;
    const progress = Math.min((count / max) * 100, 100);
    const isJoined = user && participants[user.uid] && participants[user.uid].paymentStatus !== 'rejected';
    const bannerClass = getGameBannerClass(torneo.productName);
    
    // Badge
    let badgeClass = '', statusText = '';
    switch (torneo.status) {
      case 'upcoming': badgeClass = 'badge-upcoming'; statusText = '📅 Próximo'; break;
      case 'registration_open': badgeClass = 'badge-open'; statusText = '📝 Inscripciones Abiertas'; break;
      case 'ongoing': badgeClass = 'badge-ongoing'; statusText = '⚔️ En Curso'; break;
      case 'completed': badgeClass = 'badge-completed'; statusText = '✅ Finalizado'; break;
      default: badgeClass = 'badge-upcoming'; statusText = torneo.status;
    }
    
    // Countdown
    let countdownHTML = '';
    if (torneo.registrationDeadline && (torneo.status === 'registration_open' || torneo.status === 'upcoming')) {
      countdownHTML = `<div data-countdown-deadline="${torneo.registrationDeadline}">${getCountdownHTML(torneo.registrationDeadline)}</div>`;
    }
    
    // Prizes
    let prizesHTML = '';
    const prizes = torneo.prizes || [];
    if (prizes.length > 0) {
      const medals = ['🥇', '🥈', '🥉', '🏅', '🎖️'];
      const classes = ['gold', 'silver', 'bronze', '', ''];
      prizesHTML = '<div class="torneo-prizes">';
      prizes.forEach((p, i) => {
        prizesHTML += `<div class="torneo-prize-row"><span class="torneo-prize-medal">${medals[i] || '🎖️'}</span><span class="torneo-prize-text ${classes[i] || ''}">${p.place ? p.place + ': ' : ''}${p.reward}</span></div>`;
      });
      prizesHTML += '</div>';
    } else if (torneo.prize) {
      prizesHTML = `<div class="torneo-prizes"><div class="torneo-prize-row"><span class="torneo-prize-medal">🎁</span><span class="torneo-prize-text gold">${torneo.prize}</span></div></div>`;
    }
    
    // Tags
    let tagsHTML = '<div class="torneo-tags">';
    tagsHTML += `<span class="torneo-tag">🎮 ${torneo.productName || 'Juego'}</span>`;
    if (torneo.gameMode) {
      tagsHTML += `<span class="torneo-tag">${getGameModeIcon(torneo.gameMode)} ${getGameModeLabel(torneo.gameMode)}</span>`;
    }
    if (torneo.entryFee && torneo.entryFee > 0) {
      const exchangeRate = typeof EXCHANGE_RATE !== 'undefined' ? (EXCHANGE_RATE.tournamentsUsdToBs || EXCHANGE_RATE.usdToBs || 1) : 1;
      const feeBs = (torneo.entryFee * exchangeRate).toFixed(2);
      tagsHTML += `<span class="torneo-tag" style="color:#fbbf24; border-color:rgba(251,191,36,0.3); background:rgba(251,191,36,0.1);">💎 Bs. ${feeBs}</span>`;
    } else {
      tagsHTML += `<span class="torneo-tag" style="color:#4ade80; border-color:rgba(74,222,128,0.3); background:rgba(74,222,128,0.1);">🆓 GRATIS</span>`;
    }
    tagsHTML += '</div>';
    
    // Action Button
    let actionButton = '';
    if (torneo.status === 'registration_open') {
      // Check if deadline expired
      const deadlineExpired = torneo.registrationDeadline && new Date(torneo.registrationDeadline) < new Date();
      
      if (user) {
        if (isJoined) {
          const myP = participants[user.uid];
          if (myP.paymentStatus === 'pending_payment') {
            actionButton = `<button class="torneo-btn" style="background: rgba(251, 191, 36, 0.1); color: #fbbf24; border-color: rgba(251, 191, 36, 0.3);" disabled>⏳ Inscripción Pendiente</button>`;
          } else {
            actionButton = `<button class="torneo-btn btn-joined" disabled>✅ Ya estás inscrito</button>`;
          }
        } else if (count >= max) {
          actionButton = `<button class="torneo-btn" disabled>🚫 Cupos Agotados</button>`;
        } else if (deadlineExpired) {
          actionButton = `<button class="torneo-btn" disabled>⏰ Inscripciones Cerradas</button>`;
        } else {
          actionButton = `<button class="torneo-btn" onclick="openInscriptionModal('${torneo.id}')">⚡ Inscribirse Ahora</button>`;
        }
      } else {
        actionButton = `<button class="torneo-btn btn-login" onclick="showAuthModal()">🔑 Inicia Sesión para Inscribirte</button>`;
      }
    } else if (torneo.status === 'ongoing') {
      actionButton = `<button class="torneo-btn" disabled>⚔️ Torneo en progreso</button>`;
    } else if (torneo.status === 'completed') {
      const leaderboard = torneo.leaderboard || [];
      if (leaderboard.length > 0) {
        actionButton = `<button class="torneo-btn" style="background: rgba(251, 191, 36, 0.1); color: #fbbf24; border-color: rgba(251, 191, 36, 0.3);" onclick="viewTournamentResults('${torneo.id}')">🏆 Ver Resultados</button>`;
      } else {
        actionButton = `<button class="torneo-btn" disabled>Torneo Finalizado</button>`;
      }
    }
    
    // Description
    const descriptionHTML = torneo.description
      ? `<p class="torneo-description">${torneo.description}</p>`
      : '';
      
    // Rules
    const rulesHTML = torneo.rules
      ? `<div onclick="event.stopPropagation();" style="position: relative; z-index: 10;"><button class="torneo-btn" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 5px; font-size: 0.8rem; margin-bottom: 10px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'" onclick="viewTournamentRules('${torneo.id}')">⚠️ Ver Reglas</button></div>`
      : '';
    
    // Leaderboard preview (removed to save space, user can open modal to see it)
    let leaderboardPreview = '';
    
    html += `
      <div class="torneo-card" onclick="openDetailModal('${torneo.id}')" style="cursor:pointer;">
        <div class="torneo-card-banner ${bannerClass}">
          ${torneo.bannerUrl ? `<img src="${torneo.bannerUrl}" alt="${torneo.title}" onerror="this.style.display='none'">` : ''}
          <div class="torneo-card-banner-content">
            <span class="torneo-badge ${badgeClass}">${statusText}</span>
            ${countdownHTML}
          </div>
        </div>
        <div class="torneo-card-body">
          <h3 class="torneo-title">${torneo.title}</h3>
          ${descriptionHTML}
          ${rulesHTML}
          ${tagsHTML}
          ${prizesHTML}
          
          <div class="torneo-progress-section">
            <div class="torneo-progress-header">
              <span class="torneo-progress-text">${count} / ${max} Participantes</span>
              <span class="torneo-progress-percent">${Math.round(progress)}%</span>
            </div>
            <div class="torneo-progress-container">
              <div class="torneo-progress-bar" style="width: ${progress}%"></div>
            </div>
          </div>
          
          ${leaderboardPreview}
          
          <div onclick="event.stopPropagation();">
            ${actionButton}
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  startCountdowns();
}

// ── Hall of Fame (Global Top 10) ──
window.switchHofTab = function(type) {
  const premiumBtn = document.getElementById('tab-hof-premium');
  const freeBtn = document.getElementById('tab-hof-free');
  const premiumContainer = document.getElementById('hall-of-fame-premium');
  const freeContainer = document.getElementById('hall-of-fame-free');
  
  if (type === 'premium') {
    premiumBtn.style.background = 'var(--accent)';
    premiumBtn.style.color = 'white';
    premiumBtn.style.border = 'none';
    
    freeBtn.style.background = 'rgba(255,255,255,0.05)';
    freeBtn.style.color = 'var(--text-muted)';
    freeBtn.style.border = '1px solid rgba(255,255,255,0.1)';
    
    premiumContainer.style.display = 'block';
    freeContainer.style.display = 'none';
  } else {
    freeBtn.style.background = 'var(--accent)';
    freeBtn.style.color = 'white';
    freeBtn.style.border = 'none';
    
    premiumBtn.style.background = 'rgba(255,255,255,0.05)';
    premiumBtn.style.color = 'var(--text-muted)';
    premiumBtn.style.border = '1px solid rgba(255,255,255,0.1)';
    
    freeContainer.style.display = 'block';
    premiumContainer.style.display = 'none';
  }
};

function renderHallOfFame(torneos) {
  const premiumContainer = document.getElementById('hall-of-fame-premium');
  const freeContainer = document.getElementById('hall-of-fame-free');
  if (!premiumContainer || !freeContainer) return;
  
  const playerStatsPremium = {};
  const playerStatsFree = {};
  
  // Aggregate stats across all completed tournaments
  torneos.forEach(t => {
    if (t.status === 'completed' && t.leaderboard && t.leaderboard.length > 0) {
      const isFree = !t.entryFee || parseFloat(t.entryFee) === 0;
      const targetStats = isFree ? playerStatsFree : playerStatsPremium;
      
      t.leaderboard.forEach(entry => {
        if (!entry.playerName) return;
        const name = entry.playerName.trim();
        if (!targetStats[name]) {
          targetStats[name] = { name: name, kills: 0, gamesPlayed: 0 };
        }
        targetStats[name].kills += (parseInt(entry.kills) || 0);
        targetStats[name].gamesPlayed += 1;
      });
    }
  });
  
  const topPremium = Object.values(playerStatsPremium).sort((a, b) => b.kills - a.kills).slice(0, 10);
  const topFree = Object.values(playerStatsFree).sort((a, b) => b.kills - a.kills).slice(0, 10);
  
  premiumContainer.innerHTML = buildHofHtml(topPremium, 'Aún no hay campeones en torneos premium. ¡Sé el primero!');
  freeContainer.innerHTML = buildHofHtml(topFree, 'Aún no hay campeones en torneos gratuitos. ¡Sé el primero!');
}

function buildHofHtml(topPlayers, emptyMessage) {
  if (topPlayers.length === 0) {
    return `<p style="text-align:center; color:var(--text-muted); grid-column:1/-1; padding:20px;">${emptyMessage}</p>`;
  }
  
  let html = '<div class="hof-global-leaderboard" style="grid-column:1/-1; display:flex; flex-direction:column; gap:10px;">';
  
  topPlayers.forEach((player, i) => {
    let rankBadge = '';
    let cardStyle = 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);';
    let nameStyle = 'color: white; font-weight: 600;';
    
    if (i === 0) {
      rankBadge = '👑';
      cardStyle = 'background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.02)); border: 1px solid rgba(255, 215, 0, 0.3);';
      nameStyle = 'color: #fbbf24; font-weight: 800; font-size: 1.2rem;';
    } else if (i === 1) {
      rankBadge = '🥈';
      nameStyle = 'color: #9ca3af; font-weight: 700;';
    } else if (i === 2) {
      rankBadge = '🥉';
      nameStyle = 'color: #b45309; font-weight: 700;';
    } else {
      rankBadge = `<span style="color:var(--text-muted); font-size:1.2rem; font-weight:bold;">#${i+1}</span>`;
    }
    
    html += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-radius:12px; ${cardStyle} transition: 0.3s; cursor:default;" onmouseover="this.style.transform='scale(1.01)'" onmouseout="this.style.transform='scale(1)'">
        
        <div style="display:flex; align-items:center; gap:20px;">
          <div style="width:30px; text-align:center; font-size:1.5rem;">${rankBadge}</div>
          <div style="${nameStyle}">${player.name}</div>
        </div>
        
        <div style="display:flex; gap:30px; align-items:center;">
          <div style="text-align:center;">
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Partidas</div>
            <div style="font-weight:600; color:var(--text-secondary);">${player.gamesPlayed}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Kills Totales</div>
            <div style="font-weight:800; color:var(--accent); font-size:1.2rem;">${player.kills}</div>
          </div>
        </div>
        
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// ── Inscription Modal ──
window.openInscriptionModal = function(tournamentId) {
  const user = firebase.auth().currentUser;
  if (!user) {
    if (typeof showAuthModal === 'function') showAuthModal();
    else if (typeof openAuthModal === 'function') openAuthModal();
    else Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Debes iniciar sesión para inscribirte.', confirmButtonColor: '#fbbf24' });
    return;
  }
  
  const torneo = torneosData.find(t => t.id === tournamentId);
  if (!torneo) return;
  
  // Check deadline
  if (torneo.registrationDeadline && new Date(torneo.registrationDeadline) < new Date()) {
    Swal.fire({ icon: 'info', title: 'Cerrado', text: 'Las inscripciones para este torneo ya cerraron.', confirmButtonColor: '#fbbf24' });
    return;
  }
  
  const userName = user.displayName || user.email.split('@')[0];
  const content = document.getElementById('torneo-modal-content');
  const gm = torneo.gameMode || 'solo';
  
  let extraMembersHtml = '';
  if (gm === 'duo') {
    extraMembersHtml = `
      <h4 style="margin-top: 15px; margin-bottom: 10px; color: var(--accent); font-size: 0.9rem;">👥 Miembro 2</h4>
      <div class="torneo-form-group">
        <div style="display:flex; gap:5px;">
          <input class="torneo-form-input tm-id" type="text" required placeholder="ID del Juego (Miembro 2)">
          <input class="torneo-form-input tm-ign" type="text" required placeholder="Jugador (Miembro 2)">
        </div>
      </div>
    `;
  } else if (gm === 'squad') {
    extraMembersHtml = `
      <h4 style="margin-top: 15px; margin-bottom: 10px; color: var(--accent); font-size: 0.9rem;">🎯 Miembros del Escuadrón</h4>
      <div class="torneo-form-group">
        <label class="torneo-form-label" style="font-size: 0.8rem; margin-bottom:4px;">Miembro 2</label>
        <div style="display:flex; gap:5px;"><input class="torneo-form-input tm-id" type="text" required placeholder="ID"><input class="torneo-form-input tm-ign" type="text" required placeholder="Jugador"></div>
      </div>
      <div class="torneo-form-group">
        <label class="torneo-form-label" style="font-size: 0.8rem; margin-bottom:4px;">Miembro 3</label>
        <div style="display:flex; gap:5px;"><input class="torneo-form-input tm-id" type="text" required placeholder="ID"><input class="torneo-form-input tm-ign" type="text" required placeholder="Jugador"></div>
      </div>
      <div class="torneo-form-group">
        <label class="torneo-form-label" style="font-size: 0.8rem; margin-bottom:4px;">Miembro 4</label>
        <div style="display:flex; gap:5px;"><input class="torneo-form-input tm-id" type="text" required placeholder="ID"><input class="torneo-form-input tm-ign" type="text" required placeholder="Jugador"></div>
      </div>
    `;
  }
  
  let paymentHtml = '';
  if (torneo.entryFee && torneo.entryFee > 0) {
    const exchangeRate = typeof EXCHANGE_RATE !== 'undefined' ? (EXCHANGE_RATE.tournamentsUsdToBs || EXCHANGE_RATE.usdToBs || 1) : 1;
    const feeBs = (torneo.entryFee * exchangeRate).toFixed(2);
    
    let pmOptions = '<option value="wallet">Mi Billetera Virtual</option>';
    if (typeof PAYMENT_METHODS !== 'undefined') {
      PAYMENT_METHODS.forEach(pm => {
        if (pm.id !== 'wallet') pmOptions += `<option value="${pm.id}">${pm.name}</option>`;
      });
    } else {
      pmOptions += '<option value="pagomovil">Pago Móvil / Transferencia</option>';
    }

    paymentHtml = `
      <h4 style="margin-top: 20px; margin-bottom: 10px; color: var(--accent); font-size: 0.9rem;">💳 Pago de Inscripción</h4>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px;">Costo del torneo: <strong style="color:var(--text-primary);">Bs. ${feeBs}</strong> (Aprox. $${torneo.entryFee.toFixed(2)} USD)</p>
      
      <div class="torneo-form-group">
        <label class="torneo-form-label">Método de Pago</label>
        <select class="torneo-form-input" id="insc-payment-method" onchange="toggleInscPaymentMethod()" required>
          ${pmOptions}
        </select>
      </div>
      
      <div id="insc-pm-details" style="display:none; background:rgba(0,0,0,0.2); padding:12px; border-radius:8px; border:1px dashed var(--border); margin-bottom:15px;">
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">Realiza el pago a los siguientes datos y escribe la referencia:</p>
        <div id="insc-pm-dynamic-info" style="font-size:0.85rem; font-family:var(--font-mono); color:var(--text-primary); margin-bottom:10px; background:rgba(255,255,255,0.05); padding:8px; border-radius:4px;">
          <!-- Loaded dynamically -->
        </div>
        <p style="font-size:0.75rem; color:var(--accent); margin-bottom:6px; font-weight:600;"><i class="ph-fill ph-info"></i> Coloca los últimos 6 dígitos de la referencia</p>
        <input class="torneo-form-input" id="insc-payment-ref" type="text" placeholder="Número de Referencia / ID">
      </div>
    `;
  }
  
  content.innerHTML = `
    <h3>⚡ Inscripción</h3>
    <p class="torneo-modal-subtitle">${torneo.title} - ${gm.toUpperCase()}</p>
    
    <form id="inscription-form" style="max-height: 60vh; overflow-y: auto; padding-right: 5px; margin-right: -5px;">
      <h4 style="margin-top: 10px; margin-bottom: 10px; color: var(--accent); font-size: 0.9rem;">👑 Lider (Tú)</h4>
      <div class="torneo-form-group">
        <label class="torneo-form-label">Tu nombre</label>
        <input class="torneo-form-input" id="insc-name" type="text" value="${userName}" required placeholder="Tu nombre">
      </div>
      <div class="torneo-form-group">
        <label class="torneo-form-label">ID del juego</label>
        <input class="torneo-form-input" id="insc-game-id" type="text" required placeholder="Ej: 123456789">
        <p class="torneo-form-hint" style="margin-top:2px;">Tu ID numérico dentro del juego</p>
      </div>
      <div class="torneo-form-group">
        <label class="torneo-form-label">Nombre en el juego (Jugador)</label>
        <input class="torneo-form-input" id="insc-game-name" type="text" required placeholder="Ej: ProPlayer99">
      </div>
      
      ${extraMembersHtml}
      ${paymentHtml}
      
      <div style="display:flex; gap:10px; margin-top:24px;">
        <button type="button" class="torneo-btn btn-login" onclick="closeTorneoModal()" style="flex:1;">Cancelar</button>
        <button type="submit" class="torneo-btn" id="insc-submit-btn" style="flex:2;">⚡ Confirmar Inscripción</button>
      </div>
    </form>
  `;
  
  window.toggleInscPaymentMethod = function() {
    const methodId = document.getElementById('insc-payment-method').value;
    const pmDetails = document.getElementById('insc-pm-details');
    const refInput = document.getElementById('insc-payment-ref');
    const dynamicInfo = document.getElementById('insc-pm-dynamic-info');
    
    if (methodId !== 'wallet') {
      pmDetails.style.display = 'block';
      refInput.required = true;
      
      let html = '';
      if (typeof PAYMENT_METHODS !== 'undefined') {
        const pm = PAYMENT_METHODS.find(m => m.id === methodId);
        if (pm && pm.details) {
          for (const [key, val] of Object.entries(pm.details)) {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            html += `
              <div style="display:flex; justify-content:space-between; align-items:center; padding: 6px 10px; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 6px; background: rgba(0,0,0,0.2);">
                <div style="text-align: left;">
                  <span style="color:var(--text-muted); font-size:0.75rem; display:block; margin-bottom:2px; text-transform: uppercase; letter-spacing: 0.5px;">${formattedKey}</span>
                  <span style="font-weight:600; font-size:0.95rem; color:var(--text-primary); user-select: all;">${val}</span>
                </div>
                <button type="button" onclick="navigator.clipboard.writeText('${val}'); if(typeof showToast !== 'undefined') showToast('✅ Copiado al portapapeles'); this.innerText='✔️'; setTimeout(()=>this.innerText='📋', 1500);" style="background:rgba(255,255,255,0.1); border:none; color:var(--text-primary); padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.9rem; transition:0.2s; hover:background:rgba(255,255,255,0.2);" title="Copiar ${formattedKey}">
                  📋
                </button>
              </div>
            `;
          }
        }
      }
      if (!html) html = 'Datos de pago no configurados.';
      dynamicInfo.innerHTML = html;
    } else {
      pmDetails.style.display = 'none';
      refInput.required = false;
    }
  };
  
  document.getElementById('torneo-inscription-modal').classList.add('active');
  
  setTimeout(() => {
    document.getElementById('inscription-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const gameName = document.getElementById('insc-game-name').value.trim();
      const gameId = document.getElementById('insc-game-id').value.trim();
      const name = document.getElementById('insc-name').value.trim();
      
      if (!gameName || !gameId || !name) {
        Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: 'Por favor completa todos los campos del líder.', confirmButtonColor: '#fbbf24' });
        return;
      }
      
      const teamMembers = [];
      const idInputs = document.querySelectorAll('.tm-id');
      const ignInputs = document.querySelectorAll('.tm-ign');
      for (let i = 0; i < idInputs.length; i++) {
        const tId = idInputs[i].value.trim();
        const tIgn = ignInputs[i].value.trim();
        if (!tId || !tIgn) {
          Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: 'Por favor completa los datos de todos los miembros del equipo.', confirmButtonColor: '#fbbf24' });
          return;
        }
        teamMembers.push({ gameId: tId, gameName: tIgn });
      }
      
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Procesando...';
      
      const processInscription = function(paymentStatus, paymentMethod, paymentRef = null) {
        const participantData = {
          uid: user.uid,
          name: name,
          email: user.email,
          gameId: gameId,
          gameName: gameName,
          teamMembers: teamMembers.length > 0 ? teamMembers : null,
          joinedAt: new Date().toISOString(),
          paymentStatus: paymentStatus,
          paymentMethod: paymentMethod,
          paymentRef: paymentRef
        };
        
        firebase.database().ref('tournaments/' + tournamentId + '/participants/' + user.uid).set(participantData)
          .then(() => {
            closeTorneoModal();
            
            firebase.database().ref('users/' + user.uid + '/notifications').push({
              title: 'Inscripción a Torneo 🏆',
              body: `Tu solicitud de inscripción al torneo ha sido registrada. Estado: ${paymentStatus === 'approved' || paymentStatus === 'free' ? 'Confirmado ✅' : 'Pendiente de Pago ⏳'}`,
              type: 'tournament',
              timestamp: new Date().toISOString(),
              read: false
            });

            if (paymentStatus === 'approved' || paymentStatus === 'free') {
              launchConfetti();
              Swal.fire({ icon: 'success', title: '¡Inscripción exitosa!', text: 'Tu cupo ha sido confirmado.', confirmButtonColor: '#4ade80' });
            } else {
              Swal.fire({ icon: 'info', title: 'Inscripción pendiente', text: 'En breve un administrador validará tu pago y confirmará tu cupo.', confirmButtonColor: '#fbbf24' });
            }
            renderTorneos(torneosData);
          }).catch(err => {
            console.error('Error al inscribirse:', err);
            submitBtn.disabled = false;
            submitBtn.innerText = '⚡ Confirmar Inscripción';
            Swal.fire({ icon: 'error', title: 'Error', text: 'Ocurrió un error al inscribirte. Verifica tu conexión.', confirmButtonColor: '#ef4444' });
          });
      };
      
      if (torneo.entryFee && torneo.entryFee > 0) {
        const paymentMethod = document.getElementById('insc-payment-method').value;
        
        if (paymentMethod === 'wallet') {
          // Check balance and deduct
          firebase.database().ref('users/' + user.uid + '/wallet/balance').once('value').then(snap => {
            const currentBalance = snap.val() || 0;
            if (currentBalance >= torneo.entryFee) {
              const newBalance = currentBalance - torneo.entryFee;
              const updates = {};
              updates['users/' + user.uid + '/wallet/balance'] = newBalance;
              
              const txId = 'tx_' + Date.now();
              updates['users/' + user.uid + '/wallet/transactions/' + txId] = {
                type: 'tournament_fee',
                amount: -torneo.entryFee,
                description: 'Inscripción a ' + torneo.title,
                timestamp: new Date().toISOString()
              };
              
              firebase.database().ref().update(updates).then(() => {
                processInscription('approved', 'wallet');
              }).catch(err => {
                submitBtn.disabled = false;
                submitBtn.innerText = '⚡ Confirmar Inscripción';
                Swal.fire({ icon: 'error', title: 'Error', text: 'Error al procesar pago: ' + err.message, confirmButtonColor: '#ef4444' });
              });
            } else {
              submitBtn.disabled = false;
              submitBtn.innerText = '⚡ Confirmar Inscripción';
              Swal.fire({ icon: 'error', title: 'Saldo insuficiente', text: 'Saldo insuficiente en tu Billetera Virtual. Tienes $' + currentBalance.toFixed(2), confirmButtonColor: '#ef4444' });
            }
          });
        } else if (paymentMethod !== 'wallet') {
          const paymentRef = document.getElementById('insc-payment-ref').value.trim();
          if (!paymentRef) {
            Swal.fire({ icon: 'warning', title: 'Referencia requerida', text: 'Por favor ingresa el número de referencia del pago.', confirmButtonColor: '#fbbf24' });
            submitBtn.disabled = false;
            submitBtn.innerText = '⚡ Confirmar Inscripción';
            return;
          }
          
          processInscription('pending_payment', paymentMethod, paymentRef);
          
        }
      } else {
        // Free tournament
        processInscription('free', 'none');
      }
    });
  }, 100);
};

window.closeTorneoModal = function() {
  document.getElementById('torneo-inscription-modal').classList.remove('active');
};

// ── Detail Modal ──
window.switchTab = function(btn, tabId) {
  const tabs = btn.parentElement.querySelectorAll('.torneo-tab-btn');
  tabs.forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  
  const contents = btn.parentElement.parentElement.querySelectorAll('.torneo-tab-content');
  contents.forEach(c => c.classList.remove('active'));
  
  const target = btn.parentElement.parentElement.querySelector('#' + tabId);
  if (target) target.classList.add('active');
};

window.viewTournamentResults = function(id) {
  const torneo = torneosData.find(t => t.id === id);
  if (!torneo) return;
  const leaderboard = torneo.leaderboard || [];
  const sorted = [...leaderboard].sort((a, b) => (b.kills || 0) - (a.kills || 0));
  
  let rows = '';
  sorted.forEach((l, i) => {
    let medal = '';
    if (i === 0) medal = '🥇';
    else if (i === 1) medal = '🥈';
    else if (i === 2) medal = '🥉';
    else medal = `<span style="opacity:0.6;">${i+1}º</span>`;
    
    rows += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(255,255,255,0.03); margin-bottom:8px; border-radius:8px;">
        <div style="font-size:1.05rem;"><strong style="color:var(--accent); font-size:1.2rem; display:inline-block; width:30px; text-align:center;">${medal}</strong> <span style="margin-left:10px; font-weight:600;">${l.playerName}</span></div>
        <div style="color:var(--text-secondary); font-size:0.95rem; font-family:var(--font-mono);"><strong style="color:white;">${l.kills}</strong> Kills</div>
      </div>
    `;
  });
  
  Swal.fire({
    title: `<h3 style="color:var(--text-primary); margin:0;">🏆 Clasificación Final</h3><p style="font-size:0.9rem; color:var(--text-muted); font-weight:normal; margin-top:5px;">${torneo.title}</p>`,
    html: `<div style="max-height: 400px; overflow-y:auto; text-align:left; margin-top:15px; padding-right:5px;">${rows}</div>`,
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    confirmButtonColor: 'var(--accent)',
    confirmButtonText: 'Cerrar',
    width: '450px'
  });
};

window.viewTournamentRules = function(id) {
  const torneo = torneosData.find(t => t.id === id);
  if (!torneo || !torneo.rules) return;
  
  const formattedRules = torneo.rules.replace(/\n/g, '<br>');
  
  Swal.fire({
    title: `<h3 style="color:var(--text-primary); margin:0; display: flex; align-items: center; justify-content: center; gap: 10px;"><i class="ph-fill ph-warning-circle" style="color:#ef4444;"></i> Reglamento</h3><p style="font-size:0.9rem; color:var(--text-muted); font-weight:normal; margin-top:5px;">${torneo.title}</p>`,
    html: `<div style="max-height: 400px; overflow-y:auto; text-align:left; margin-top:15px; font-family:var(--font-body); font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); background: rgba(220, 38, 38, 0.05); border-left: 4px solid #dc2626; padding: 15px; border-radius: 0 8px 8px 0;">${formattedRules}</div>`,
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    confirmButtonColor: 'var(--accent)',
    confirmButtonText: 'Cerrar',
    width: '500px'
  });
};

window.openDetailModal = function(tournamentId) {
  const torneo = torneosData.find(t => t.id === tournamentId);
  if (!torneo) return;
  
  const participants = torneo.participants || {};
  const count = Object.values(participants).reduce((acc, p) => acc + 1 + (p.teamMembers ? p.teamMembers.length : 0), 0);
  const max = torneo.maxParticipants || 100;
  const avatars = ['👾', '🤠', '🥷', '🤖', '🦸‍♂️', '🧟', '🧙‍♂️', '🧛', '🦹', '👽'];
  
  // Prizes
  let prizesHTML = '';
  const prizes = torneo.prizes || [];
  if (prizes.length > 0) {
    const medals = ['🥇', '🥈', '🥉', '🏅', '🎖️'];
    prizesHTML = prizes.map((p, i) => `<div class="torneo-prize-row"><span class="torneo-prize-medal">${medals[i] || '🎖️'}</span><span class="torneo-prize-text">${p.place ? p.place + ': ' : ''}${p.reward}</span></div>`).join('');
    prizesHTML = `<div class="torneo-detail-section"><h4>🏅 Premios</h4><div class="torneo-prizes" style="margin-top: 10px;">${prizesHTML}</div></div>`;
  } else if (torneo.prize) {
    prizesHTML = `<div class="torneo-detail-section"><h4>🏅 Premios</h4><div class="torneo-prizes" style="margin-top: 10px;"><div class="torneo-prize-row"><span class="torneo-prize-medal">🎁</span><span class="torneo-prize-text">${torneo.prize}</span></div></div></div>`;
  }
  
  // Rules and Description
  const formattedDesc = torneo.description ? torneo.description.replace(/\n/g, '<br>') : '';
  let rulesHTML = formattedDesc
    ? `<div class="torneo-detail-section" style="margin-top:20px;"><h4>📋 Descripción</h4><div class="torneo-detail-rules" style="margin-top:10px; line-height: 1.5;">${formattedDesc}</div></div>`
    : '';
    
  const formattedRulesText = torneo.rules ? torneo.rules.replace(/\n/g, '<br>') : '';
  if (formattedRulesText) {
    rulesHTML += `<div class="torneo-detail-section" style="margin-top:20px;">
        <div style="background: rgba(220, 38, 38, 0.05); border-left: 4px solid #dc2626; padding: 15px; border-radius: 0 8px 8px 0;">
          <h4 style="color: #ef4444; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; font-size:0.95rem; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.8px;">
            <i class="ph-fill ph-warning-circle"></i> Reglas del Torneo
          </h4>
          <div style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6;">
            ${formattedRulesText}
          </div>
        </div>
       </div>`;
  }
  
  // Participants
  const participantsList = Object.values(participants);
  let participantsHTML = '';
  if (participantsList.length > 0) {
    participantsHTML = '<div class="torneo-detail-participants-grouped" style="display:flex; flex-direction:column; gap:10px; margin-top: 15px;">';
    
    // Solo players can be grouped together, or we can list every entry as its own block.
    // It's better to list every registration entry as a block to show the team context.
    participantsList.forEach((p, i) => {
      const avatarCap = avatars[i % avatars.length];
      const teamType = (p.teamMembers && p.teamMembers.length > 0) ? (p.teamMembers.length === 1 ? 'Dúo' : 'Escuadra') : 'Solo';
      const capName = p.gameName || p.name || 'Jugador';
      
      if (teamType === 'Solo') {
        participantsHTML += `
          <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <span class="torneo-detail-participant"><span class="avatar">${avatarCap}</span> <span>${capName}</span></span>
            </div>
          </div>
        `;
      } else {
        let membersHTML = `<span class="torneo-detail-participant"><span class="avatar">${avatarCap}</span> <span>${capName} <span style="font-size:0.65rem; opacity:0.6;">(Líder)</span></span></span>`;
        p.teamMembers.forEach((tm, tmIdx) => {
          const avatarTm = avatars[(i + tmIdx + 1) % avatars.length];
          const tmName = tm.gameName || 'Compañero';
          membersHTML += `<span class="torneo-detail-participant"><span class="avatar">${avatarTm}</span> <span>${tmName}</span></span>`;
        });
        
        participantsHTML += `
          <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size:0.75rem; color:var(--accent); text-transform:uppercase; font-weight:bold; margin-bottom:8px; display:flex; align-items:center; gap:5px;">
              👥 Equipo ${teamType}
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              ${membersHTML}
            </div>
          </div>
        `;
      }
    });
    
    participantsHTML += '</div>';
  } else {
    participantsHTML = '<p style="color:var(--text-muted); margin-top:15px; text-align:center;">Aún no hay inscritos en este torneo.</p>';
  }
  
  // Clasificación (Tabla de líderes y Capturas)
  let leaderboardHTML = '';
  let hasContent = false;
  
  // 1. Mostrar tabla de posiciones manual (leaderboard) si existe
  if (torneo.leaderboard && torneo.leaderboard.length > 0) {
    hasContent = true;
    const sorted = [...torneo.leaderboard].sort((a, b) => (b.kills || 0) - (a.kills || 0));
    
    let tableRows = '';
    sorted.forEach((entry, i) => {
      let rankStyle = '';
      if (i === 0) rankStyle = 'color:#fbbf24; font-weight:bold;';
      else if (i === 1) rankStyle = 'color:#9ca3af; font-weight:bold;';
      else if (i === 2) rankStyle = 'color:#b45309; font-weight:bold;';
      
      tableRows += `
        <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); background: ${i%2===0?'rgba(255,255,255,0.02)':'transparent'}">
          <div style="display:flex; gap:15px; align-items:center;">
            <span style="width:25px; text-align:center; ${rankStyle}">${i+1}</span>
            <span style="font-weight:600; color:var(--text-primary);">${entry.playerName || 'Jugador'}</span>
          </div>
          <div style="color:var(--accent); font-weight:bold;">
            ${entry.kills || 0} kills
          </div>
        </div>
      `;
    });
    
    leaderboardHTML += `
      <div style="margin-top: 15px;">
        <h4 style="margin-bottom:10px; color:var(--accent-light);">📋 Tabla de Posiciones</h4>
        <div style="border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(0,0,0,0.3); font-size:0.85rem; color:var(--text-muted); font-weight:bold; text-transform:uppercase;">
            <div style="display:flex; gap:15px;"><span style="width:25px; text-align:center;">#</span> <span>Jugador</span></div>
            <div>Kills</div>
          </div>
          ${tableRows}
        </div>
      </div>
    `;
  }
  
  // 2. Mostrar capturas de resultados si existen
  if (torneo.resultImages && torneo.resultImages.length > 0) {
    hasContent = true;
    let imagesHTML = '<div class="results-images-container" style="display:flex; flex-direction:column; gap:15px; margin-top:15px;">';
    torneo.resultImages.forEach((imgUrl, i) => {
      imagesHTML += `
        <div style="border-radius:var(--radius-md); overflow:hidden; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.2);">
          <img src="${imgUrl}" style="width:100%; height:auto; display:block;" alt="Resultado ${i+1}">
        </div>
      `;
    });
    imagesHTML += '</div>';
    
    leaderboardHTML += `
      <div style="margin-top: ${torneo.leaderboard && torneo.leaderboard.length > 0 ? '25px' : '15px'};">
        <h4 style="margin-bottom:10px; color:var(--accent-light);">📸 Capturas de Resultados</h4>
        ${imagesHTML}
      </div>
    `;
  }
  
  if (!hasContent) {
    leaderboardHTML = '<p style="color:var(--text-muted); margin-top:15px; text-align:center;">Resultados no disponibles o el torneo está en curso.</p>';
  }
  
  // Winners 
  let winnersHTML = '';
  if (torneo.status === 'completed' && torneo.winners && torneo.winners.length > 0) {
    const medals = ['👑', '🥈', '🥉', '🏅', '🎖️'];
    
    winnersHTML = '<div class="torneo-detail-section"><h4>🏆 Campeones del Torneo</h4><div style="margin-top:10px;">';
    torneo.winners.forEach((p, i) => {
      const rewardStr = p.reward ? ' — ' + p.reward : '';
      winnersHTML += `<div style="display:flex; align-items:center; gap:10px; padding:8px 12px; margin-bottom:8px; background:linear-gradient(90deg, rgba(255,215,0,0.1), transparent); border-left:3px solid #fbbf24; border-radius:4px;">
        <span style="font-size:1.6rem;">${medals[i] || '🏅'}</span>
        <div>
          <div style="font-weight:700; color:#fbbf24; font-size:1.1rem; font-family:var(--font-display);">${p.name || p.playerName || 'Jugador'}</div>
          <div style="font-size:0.85rem; color:var(--text-secondary);">${p.place || (i + 1) + '° Lugar'}${rewardStr}</div>
        </div>
      </div>`;
    });
    winnersHTML += '</div></div>';
  }
  
  const content = document.getElementById('torneo-detail-content');
  content.innerHTML = `
    <h3 style="font-family: var(--font-display); text-transform: uppercase; letter-spacing: -0.5px; margin-bottom: 5px; font-size: 1.8rem; line-height: 1.1;">${torneo.title}</h3>
    <p class="torneo-modal-subtitle">${torneo.productName || ''} ${torneo.gameMode ? '· ' + getGameModeLabel(torneo.gameMode) : ''}</p>
    
    <div class="torneo-tabs">
      <button class="torneo-tab-btn active" onclick="switchTab(this, 'tab-resumen')">Resumen</button>
      <button class="torneo-tab-btn" onclick="switchTab(this, 'tab-participantes')">Participantes (${count}/${max})</button>
      <button class="torneo-tab-btn" onclick="switchTab(this, 'tab-leaderboard')">Clasificación</button>
    </div>
    
    <div id="tab-resumen" class="torneo-tab-content active">
      ${winnersHTML}
      ${prizesHTML}
      ${rulesHTML}
    </div>
    
    <div id="tab-participantes" class="torneo-tab-content">
      ${participantsHTML}
    </div>
    
    <div id="tab-leaderboard" class="torneo-tab-content">
      ${leaderboardHTML}
    </div>
    
    <div style="margin-top:30px; text-align:right;">
      <button class="torneo-btn btn-login" onclick="closeDetailModal()" style="width:auto; padding:10px 30px;">Volver</button>
    </div>
  `;
  
  document.getElementById('torneo-detail-modal').classList.add('active');
};

window.closeDetailModal = function() {
  document.getElementById('torneo-detail-modal').classList.remove('active');
};

// ── Confetti ──
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const pieces = [];
  const colors = ['#fbbf24', '#38bdf8', '#4ade80', '#f87171', '#a78bfa', '#fb923c'];
  
  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }
  
  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;
    
    let allDone = true;
    pieces.forEach(p => {
      if (p.opacity <= 0) return;
      allDone = false;
      
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.rotation += p.rotationSpeed;
      
      if (frame > 60) p.opacity -= 0.015;
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    
    if (!allDone) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  
  animate();
}
