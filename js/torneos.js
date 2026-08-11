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
    totalParticipants += Object.keys(t.participants || {}).length;
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
    const count = Object.keys(participants).length;
    const max = torneo.maxParticipants || 100;
    const progress = Math.min((count / max) * 100, 100);
    const isJoined = user && participants[user.uid];
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
    tagsHTML += '</div>';
    
    // Action Button
    let actionButton = '';
    if (torneo.status === 'registration_open') {
      // Check if deadline expired
      const deadlineExpired = torneo.registrationDeadline && new Date(torneo.registrationDeadline) < new Date();
      
      if (user) {
        if (isJoined) {
          actionButton = `<button class="torneo-btn btn-joined" disabled>✅ Ya estás inscrito</button>`;
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
      const winners = torneo.winners || [];
      if (winners.length > 0) {
        let winnersHTML = winners.map((w, i) => {
          const medals = ['👑', '🥈', '🥉', '🏅', '🎖️'];
          return `<span>${medals[i] || '🏅'} ${w.name}</span>`;
        }).join(' · ');
        actionButton = `<div style="text-align:center; padding:12px; background:rgba(255,215,0,0.06); border-radius:var(--radius-sm); color:#fbbf24; border:1px solid rgba(255,215,0,0.2); font-size:0.9rem;">${winnersHTML}</div>`;
      } else if (torneo.winnerName) {
        actionButton = `<div style="text-align:center; padding:12px; background:rgba(255,215,0,0.06); border-radius:var(--radius-sm); color:#fbbf24; border:1px solid rgba(255,215,0,0.2);">👑 Ganador: ${torneo.winnerName}</div>`;
      } else {
        actionButton = `<button class="torneo-btn" disabled>Torneo Finalizado</button>`;
      }
    }
    
    // Description
    const descriptionHTML = torneo.description
      ? `<p class="torneo-description">${torneo.description}</p>`
      : '';
    
    // Leaderboard preview (for completed tournaments)
    let leaderboardPreview = '';
    if (torneo.status === 'completed' && torneo.leaderboard && torneo.leaderboard.length > 0) {
      leaderboardPreview = '<div class="torneo-leaderboard" style="margin-top:12px;"><table>';
      leaderboardPreview += '<tr><th>#</th><th>Jugador</th><th>Kills</th></tr>';
      torneo.leaderboard.slice(0, 3).forEach((entry, i) => {
        const rankClass = i < 3 ? `rank-${i + 1}` : '';
        leaderboardPreview += `<tr class="${rankClass}"><td>${i + 1}</td><td>${entry.playerName || 'Jugador'}</td><td>${entry.kills || 0}</td></tr>`;
      });
      leaderboardPreview += '</table></div>';
    }
    
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

// ── Hall of Fame ──
function renderHallOfFame(torneos) {
  const container = document.getElementById('hall-of-fame-list');
  if (!container) return;
  
  const completed = torneos.filter(t => t.status === 'completed' && (t.winnerName || (t.winners && t.winners.length > 0)));
  
  if (completed.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:var(--text-muted); grid-column:1/-1; padding:20px;">Aún no hay campeones registrados. ¡Sé el primero!</p>';
    return;
  }
  
  let html = '';
  completed.slice(0, 8).forEach(torneo => {
    const winners = torneo.winners || [];
    const winnerDisplay = winners.length > 0
      ? winners.map(w => w.name).join(', ')
      : (torneo.winnerName || 'Sin nombre');
    
    let dateStr = '';
    try { dateStr = new Date(torneo.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }); } catch(e) {}
    
    html += `
      <div class="hall-of-fame-card">
        <div class="hall-of-fame-icon">🏆</div>
        <div class="hall-of-fame-info">
          <h4>${torneo.title}</h4>
          <p><span class="winner-name">${winnerDisplay}</span></p>
          <p>${dateStr}</p>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ── Inscription Modal ──
window.openInscriptionModal = function(tournamentId) {
  const user = firebase.auth().currentUser;
  if (!user) {
    if (typeof showAuthModal === 'function') showAuthModal();
    return;
  }
  
  const torneo = torneosData.find(t => t.id === tournamentId);
  if (!torneo) return;
  
  // Check deadline
  if (torneo.registrationDeadline && new Date(torneo.registrationDeadline) < new Date()) {
    alert('⏰ Las inscripciones para este torneo ya cerraron.');
    return;
  }
  
  const count = Object.keys(torneo.participants || {}).length;
  if (count >= (torneo.maxParticipants || 100)) {
    alert('🚫 Este torneo ya está lleno.');
    return;
  }
  
  let userName = user.displayName || user.email;
  if (typeof userProfile !== 'undefined' && userProfile && userProfile.name) {
    userName = userProfile.name;
  }
  
  const content = document.getElementById('torneo-modal-content');
  content.innerHTML = `
    <h3>⚡ Inscripción</h3>
    <p class="torneo-modal-subtitle">${torneo.title}</p>
    
    <form id="inscription-form">
      <div class="torneo-form-group">
        <label class="torneo-form-label">Tu nombre</label>
        <input class="torneo-form-input" id="insc-name" type="text" value="${userName}" required placeholder="Tu nombre">
      </div>
      <div class="torneo-form-group">
        <label class="torneo-form-label">ID del juego</label>
        <input class="torneo-form-input" id="insc-game-id" type="text" required placeholder="Ej: 123456789">
        <p class="torneo-form-hint">Tu ID numérico dentro del juego (${torneo.productName || 'el juego'})</p>
      </div>
      <div class="torneo-form-group">
        <label class="torneo-form-label">Nombre en el juego (IGN)</label>
        <input class="torneo-form-input" id="insc-game-name" type="text" required placeholder="Ej: ProPlayer99">
        <p class="torneo-form-hint">Tu nombre de usuario visible dentro del juego</p>
      </div>
      
      <div style="display:flex; gap:10px; margin-top:24px;">
        <button type="button" class="torneo-btn btn-login" onclick="closeTorneoModal()" style="flex:1;">Cancelar</button>
        <button type="submit" class="torneo-btn" style="flex:2;">⚡ Confirmar Inscripción</button>
      </div>
    </form>
  `;
  
  document.getElementById('torneo-inscription-modal').classList.add('active');
  
  setTimeout(() => {
    document.getElementById('inscription-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const gameName = document.getElementById('insc-game-name').value.trim();
      const gameId = document.getElementById('insc-game-id').value.trim();
      const name = document.getElementById('insc-name').value.trim();
      
      if (!gameName || !gameId || !name) {
        alert('Por favor completa todos los campos.');
        return;
      }
      
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Inscribiendo...';
      
      firebase.database().ref('tournaments/' + tournamentId + '/participants/' + user.uid).set({
        uid: user.uid,
        name: name,
        email: user.email,
        gameId: gameId,
        gameName: gameName,
        joinedAt: new Date().toISOString()
      }).then(() => {
        closeTorneoModal();
        launchConfetti();
        renderTorneos(torneosData);
      }).catch(err => {
        console.error('Error al inscribirse:', err);
        submitBtn.disabled = false;
        submitBtn.innerText = '⚡ Confirmar Inscripción';
        alert('Ocurrió un error al inscribirte. Verifica tu conexión.');
      });
    });
  }, 100);
};

window.closeTorneoModal = function() {
  document.getElementById('torneo-inscription-modal').classList.remove('active');
};

// ── Detail Modal ──
window.openDetailModal = function(tournamentId) {
  const torneo = torneosData.find(t => t.id === tournamentId);
  if (!torneo) return;
  
  const participants = torneo.participants || {};
  const count = Object.keys(participants).length;
  const max = torneo.maxParticipants || 100;
  
  // Prizes
  let prizesHTML = '';
  const prizes = torneo.prizes || [];
  if (prizes.length > 0) {
    const medals = ['🥇', '🥈', '🥉', '🏅', '🎖️'];
    prizesHTML = prizes.map((p, i) => `<div class="torneo-prize-row"><span class="torneo-prize-medal">${medals[i] || '🎖️'}</span><span class="torneo-prize-text">${p.place ? p.place + ': ' : ''}${p.reward}</span></div>`).join('');
    prizesHTML = `<div class="torneo-detail-section"><h4>🏅 Premios</h4><div class="torneo-prizes">${prizesHTML}</div></div>`;
  } else if (torneo.prize) {
    prizesHTML = `<div class="torneo-detail-section"><h4>🏅 Premios</h4><div class="torneo-prizes"><div class="torneo-prize-row"><span class="torneo-prize-medal">🎁</span><span class="torneo-prize-text">${torneo.prize}</span></div></div></div>`;
  }
  
  // Rules
  const rulesHTML = torneo.description
    ? `<div class="torneo-detail-section"><h4>📋 Descripción y Reglas</h4><div class="torneo-detail-rules">${torneo.description}</div></div>`
    : '';
  
  // Participants
  const participantsList = Object.values(participants);
  let participantsHTML = '';
  if (participantsList.length > 0) {
    participantsHTML = '<div class="torneo-detail-section"><h4>👥 Participantes (' + count + '/' + max + ')</h4><div class="torneo-detail-participants">';
    participantsList.slice(0, 50).forEach(p => {
      participantsHTML += `<span class="torneo-detail-participant">🎮 ${p.gameName || p.name || 'Jugador'}</span>`;
    });
    if (participantsList.length > 50) {
      participantsHTML += `<span class="torneo-detail-participant">+${participantsList.length - 50} más</span>`;
    }
    participantsHTML += '</div></div>';
  }
  
  // Leaderboard
  let leaderboardHTML = '';
  if (torneo.leaderboard && torneo.leaderboard.length > 0) {
    leaderboardHTML = '<div class="torneo-detail-section"><h4>📊 Tabla de Resultados</h4><div class="torneo-leaderboard"><table>';
    leaderboardHTML += '<tr><th>#</th><th>Jugador</th><th>Kills</th></tr>';
    torneo.leaderboard.forEach((entry, i) => {
      const rankClass = i < 3 ? `rank-${i + 1}` : '';
      leaderboardHTML += `<tr class="${rankClass}"><td>${i + 1}</td><td>${entry.playerName || 'Jugador'}</td><td>${entry.kills || 0}</td></tr>`;
    });
    leaderboardHTML += '</table></div></div>';
  }
  
  // Winners
  let winnersHTML = '';
  const winners = torneo.winners || [];
  if (winners.length > 0) {
    const medals = ['👑', '🥈', '🥉', '🏅', '🎖️'];
    winnersHTML = '<div class="torneo-detail-section"><h4>🏆 Ganadores</h4>';
    winners.forEach((w, i) => {
      winnersHTML += `<div style="display:flex; align-items:center; gap:10px; padding:8px; margin-bottom:6px; background:rgba(255,215,0,0.05); border-radius:var(--radius-sm); border:1px solid rgba(255,215,0,0.12);">
        <span style="font-size:1.4rem;">${medals[i] || '🏅'}</span>
        <div>
          <div style="font-weight:600; color:#fbbf24;">${w.name}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${w.place || ''} — ${w.reward || ''}</div>
        </div>
      </div>`;
    });
    winnersHTML += '</div>';
  }
  
  const content = document.getElementById('torneo-detail-content');
  content.innerHTML = `
    <h3>${torneo.title}</h3>
    <p class="torneo-modal-subtitle">${torneo.productName || ''} ${torneo.gameMode ? '· ' + getGameModeLabel(torneo.gameMode) : ''}</p>
    
    ${rulesHTML}
    ${prizesHTML}
    ${winnersHTML}
    ${leaderboardHTML}
    ${participantsHTML}
    
    <div style="margin-top:20px; text-align:right;">
      <button class="torneo-btn btn-login" onclick="closeDetailModal()" style="width:auto; padding:10px 24px;">Cerrar</button>
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
