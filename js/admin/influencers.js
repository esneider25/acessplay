// ============================================================
// AccessPlay Admin - Influencer Applications
// ============================================================

window.renderInfluencers = function(container) {
  const rules = (window.SITE_SETTINGS && window.SITE_SETTINGS.influencerRules) 
    ? window.SITE_SETTINGS.influencerRules 
    : [
      'Deben tener una base de seguidores real (al menos 1,000 en su red principal) y subir contenido de videojuegos regularmente.',
      'Tienen que colocar su link de referido en sus biografías o descripciones.',
      'Se espera que mencionen a AccessPlay en sus videos o directos al menos un par de veces al mes.',
      'Cero toxicidad, sin promover el uso de hacks, y no deben promocionar competencia directa simultáneamente.',
      'Las cuentas que generen referidos falsos (multicuentas) serán bloqueadas y perderán sus puntos y rol.'
    ];

  let rulesHtml = rules.map(r => `<li>${escapeHTML(r)}</li>`).join('');

  container.innerHTML = `
    <div class="admin-card" style="margin-bottom: 20px;">
      <h2 class="admin-card-title" style="display: flex; align-items: center; gap: 10px;">
        <i class="ph-fill ph-sparkle" style="color: var(--accent);"></i> Solicitudes de Influencers
      </h2>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">Gestiona las postulaciones de creadores de contenido que quieren ser Influencers VIP.</p>
      
      <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px; position: relative;">
        <button onclick="editInfluencerRules()" class="btn-secondary" style="position: absolute; top: 15px; right: 15px; padding: 6px 12px; font-size: 0.8rem; border-color: rgba(139, 92, 246, 0.5); color: #a78bfa;">
          <i class="ph-fill ph-pencil"></i> Editar Normas
        </button>
        <h4 style="color: #a78bfa; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
          <i class="ph-fill ph-check-circle"></i> Normas "Ganar-Ganar" (Recordatorio)
        </h4>
        <ul style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin-left: 20px; display: flex; flex-direction: column; gap: 8px;">
          ${rulesHtml}
        </ul>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="renderInfluencers(document.getElementById('admin-main-content'))">
            <i class="ph ph-arrows-clockwise"></i> Actualizar
          </button>
        </div>
      </div>

      <div style="overflow-x: auto; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid var(--border);">
        <table class="admin-table" style="width: 100%; text-align: left; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 0.85rem; background: rgba(255,255,255,0.02);">
              <th style="padding: 12px 15px; font-weight: 500;">Fecha</th>
              <th style="padding: 12px 15px; font-weight: 500;">Usuario</th>
              <th style="padding: 12px 15px; font-weight: 500;">Red Social</th>
              <th style="padding: 12px 15px; font-weight: 500;">Juego & Motivo</th>
              <th style="padding: 12px 15px; font-weight: 500; text-align: center;">Estado</th>
              <th style="padding: 12px 15px; font-weight: 500; text-align: center;">Acciones</th>
            </tr>
          </thead>
          <tbody id="influencers-tbody">
            <tr>
              <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                <div class="tracking-spinner" style="font-size: 1.5rem; margin-bottom: 10px;">⏳</div>
                Cargando solicitudes...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  loadInfluencerApplications();
};

function loadInfluencerApplications() {
  firebase.database().ref('influencer_applications').once('value').then(snap => {
    const tbody = document.getElementById('influencers-tbody');
    if (!tbody) return;

    if (!snap.exists()) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">No hay solicitudes actualmente.</td></tr>';
      return;
    }

    const apps = [];
    snap.forEach(child => {
      apps.push({ id: child.key, ...child.val() });
    });

    // Ordenar de más reciente a más antiguo en Javascript para evitar errores de índice en Firebase
    apps.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    if (apps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">No hay solicitudes actualmente.</td></tr>';
      return;
    }

    let html = '';
    apps.forEach(app => {
      let date = 'Fecha desconocida';
      try {
        if (app.timestamp) {
          date = new Date(app.timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
        }
      } catch(e) {
        console.warn("Invalid date for app", app.id);
      }
      
      let statusBadge = '';
      if (app.status === 'pending') {
        statusBadge = '<span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;">⏳ Pendiente</span>';
      } else if (app.status === 'approved') {
        statusBadge = '<span style="background: rgba(34, 197, 94, 0.2); color: #4ade80; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;">✅ Aprobado</span>';
      } else {
        statusBadge = '<span style="background: rgba(239, 68, 68, 0.2); color: #f87171; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;">❌ Rechazado</span>';
      }

      let followersText = app.followers || 'N/A';
      if(followersText === '1k-5k') followersText = '1,000 - 5,000';
      else if(followersText === '5k-15k') followersText = '5,000 - 15,000';
      else if(followersText === '15k-50k') followersText = '15,000 - 50,000';
      else if(followersText === '+50k') followersText = 'Más de 50,000';

      const safeSocial = (app.social || '').startsWith('http') ? app.social : 'https://' + (app.social || '');

      html += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s; hover:background:rgba(255,255,255,0.02);">
          <td style="padding: 12px 15px; font-size: 0.85rem; color: var(--text-muted);">${date}</td>
          <td style="padding: 12px 15px;">
            <div style="font-weight: 500; color: var(--text-primary);">${escapeHTML(app.name || 'Sin Nombre')}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(app.email || '')}</div>
            <button onclick="navigator.clipboard.writeText('${app.id}'); showAdminToast('UID Copiado', 'success')" style="background: none; border: none; color: #a78bfa; cursor: pointer; padding: 0; font-size: 0.75rem; margin-top: 4px; display:flex; align-items:center; gap:4px;"><i class="ph ph-copy"></i> Copiar UID</button>
          </td>
          <td style="padding: 12px 15px;">
            <a href="${escapeHTML(safeSocial)}" target="_blank" style="color: #0ea5e9; text-decoration: none; font-weight: 500; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;"><i class="ph ph-link"></i> Ver Perfil</a>
            <div style="font-size: 0.75rem; color: #a78bfa; margin-top: 4px;"><i class="ph-fill ph-users"></i> ${followersText}</div>
          </td>
          <td style="padding: 12px 15px; max-width: 250px;">
            <div style="font-size: 0.8rem; color: var(--accent); margin-bottom: 4px;">🎮 ${escapeHTML(app.game || 'Varios')}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${escapeHTML(app.reason || '')}">
              "${escapeHTML(app.reason || 'Sin motivo')}"
            </div>
          </td>
          <td style="padding: 12px 15px; text-align: center;">${statusBadge}</td>
          <td style="padding: 12px 15px; text-align: center;">
            ${app.status === 'pending' ? `
              <div style="display: flex; gap: 6px; justify-content: center;">
                <button onclick="approveInfluencer('${app.id}', '${app.uid}')" class="btn-primary" style="padding: 6px 10px; font-size: 0.8rem; background: rgba(34, 197, 94, 0.2); border: 1px solid #4ade80; color: #4ade80;" title="Aprobar y dar rol">✅</button>
                <button onclick="rejectInfluencer('${app.id}')" class="btn-secondary" style="padding: 6px 10px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); border: 1px solid #f87171; color: #f87171;" title="Rechazar">❌</button>
                <button onclick="deleteInfluencerApplication('${app.id}')" class="btn-secondary" style="padding: 6px 10px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.1); border: 1px solid #f87171; color: #f87171;" title="Eliminar registro permanentemente">🗑️</button>
              </div>
            ` : `
              <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                <span style="font-size: 0.85rem; color: var(--text-muted);">Procesado</span>
                <button onclick="deleteInfluencerApplication('${app.id}')" class="btn-secondary" style="padding: 4px 8px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.1); border: 1px solid #f87171; color: #f87171; border-radius: 6px; cursor: pointer;" title="Eliminar registro permanentemente">🗑️</button>
              </div>
            `}
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }).catch(err => {
    console.error("Error loading influencers:", err);
    document.getElementById('influencers-tbody').innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #f87171;">Error al cargar datos.</td></tr>';
  });
}

window.approveInfluencer = function(appId, uid) {
  Swal.fire({
    title: '¿Aprobar Influencer?',
    text: "Esto cambiará su rol a 'influencer' y le enviará una notificación de bienvenida.",
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, Aprobar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#4ade80',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)'
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({ title: 'Aprobando...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
      
      const updates = {};
      updates[`influencer_applications/${appId}/status`] = 'approved';
      updates[`users/${uid}/role`] = 'influencer';
      
      const notifRef = firebase.database().ref(`users/${uid}/notifications`).push();
      updates[`users/${uid}/notifications/${notifRef.key}`] = {
        title: '¡Felicidades! Eres Influencer 🌟',
        body: 'Tu solicitud ha sido aprobada. Ahora tienes un límite mayor de referidos y beneficios VIP.',
        type: 'system',
        timestamp: new Date().toISOString(),
        read: false
      };

      firebase.database().ref().update(updates).then(() => {
        Swal.fire({ icon: 'success', title: '¡Aprobado!', text: 'El usuario ahora es Influencer.', confirmButtonColor: '#0ea5e9' });
        loadInfluencerApplications();
      }).catch(err => {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo aprobar.' });
      });
    }
  });
};

window.rejectInfluencer = function(appId) {
  Swal.fire({
    title: '¿Rechazar solicitud?',
    text: "La solicitud quedará marcada como rechazada.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, Rechazar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#f87171',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)'
  }).then((result) => {
    if (result.isConfirmed) {
      firebase.database().ref(`influencer_applications/${appId}/status`).set('rejected').then(() => {
        Swal.fire({ icon: 'success', title: 'Rechazada', text: 'La solicitud ha sido rechazada.', confirmButtonColor: '#0ea5e9' });
        loadInfluencerApplications();
      });
    }
  });
};

// Helper function just in case
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

window.editInfluencerRules = function() {
  const currentRules = (window.SITE_SETTINGS && window.SITE_SETTINGS.influencerRules) 
    ? window.SITE_SETTINGS.influencerRules.join('\n')
    : "Escribe aquí cada norma en una nueva línea...";

  Swal.fire({
    title: 'Editar Normas de Influencers',
    html: `
      <div style="text-align: left; font-size: 0.9rem; margin-bottom: 10px; color: var(--text-secondary);">
        Cada línea representará un punto en la lista de normas que verán los usuarios al aplicar.
      </div>
      <textarea id="influencer-rules-input" class="admin-form-input" style="width: 100%; height: 200px; padding: 12px; border-radius: 8px; font-size: 0.9rem; font-family: monospace; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: white; resize: vertical;" spellcheck="false">${escapeHTML(currentRules)}</textarea>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar Normas',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#8b5cf6',
    cancelButtonColor: 'rgba(255,255,255,0.1)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    preConfirm: () => {
      const val = document.getElementById('influencer-rules-input').value.trim();
      if (!val) {
        Swal.showValidationMessage('Las normas no pueden estar vacías.');
        return false;
      }
      return val.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }
  }).then(result => {
    if (result.isConfirmed) {
      const newRules = result.value;
      if (typeof saveSettings === 'function') {
        Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading(), allowOutsideClick: false, background: 'var(--bg-surface)' });
        saveSettings({ influencerRules: newRules });
        Swal.fire({ icon: 'success', title: 'Guardado', text: 'Las normas se han actualizado.', confirmButtonColor: '#0ea5e9', background: 'var(--bg-surface)', color: 'var(--text-primary)' })
        .then(() => {
          if(document.getElementById('admin-main-content')) {
             renderInfluencers(document.getElementById('admin-main-content'));
          }
        });
      }
    }
  });
};

