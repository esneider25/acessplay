// ════════════════════════════════════════
// 3. CATEGORIES
// ════════════════════════════════════════
function renderCategories(container) {
  const catCards = CATEGORIES.map(cat => {
    const count = PRODUCTS.filter(p => p.category === cat.id).length;
    return `
      <div class="admin-category-card" style="--cat-color: ${cat.color}">
        <div class="admin-category-card-header" style="background: ${cat.gradient}">
          <span class="admin-category-card-icon">${cat.icon}</span>
        </div>
        <div class="admin-category-card-body">
          <h3>${cat.name}</h3>
          <p>${count} producto${count !== 1 ? 's' : ''}</p>
          <div class="admin-category-card-id">ID: ${cat.id}</div>
        </div>
        <div class="admin-category-card-actions">
          <button class="btn btn-secondary" onclick="openCategoryModal('${cat.id}')" style="padding: 6px 14px; font-size: 0.82rem;">
            ✏️ Editar
          </button>
          <button class="btn btn-danger" onclick="deleteCategory('${cat.id}')" style="padding: 6px 14px; font-size: 0.82rem; background: rgba(220,53,69,0.15); color: #ff6b6b; border: 1px solid rgba(220,53,69,0.3);">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="admin-header">
      <div>
        <h1 class="admin-title">Categorías</h1>
        <p class="admin-subtitle">Organiza tus productos en categorías para una mejor navegación</p>
      </div>
      <button class="btn btn-primary" onclick="openCategoryModal()">
        <span>➕</span> Nueva Categoría
      </button>
    </div>
    <div class="admin-categories-grid">${catCards}</div>
  `;
}

function openCategoryModal(catId = null) {
  const overlay = document.getElementById('admin-modal-overlay');
  const modalContent = document.getElementById('admin-modal-content');
  if (!overlay || !modalContent) return;

  let cat = { id: '', name: '', icon: '📦', color: '#0ea5e9', gradient: 'linear-gradient(135deg, #0ea5e9, #00b89c)' };
  if (catId) {
    const found = CATEGORIES.find(c => c.id === catId);
    if (found) cat = JSON.parse(JSON.stringify(found));
  }

  modalContent.innerHTML = `
    <div class="admin-modal-header">
      <h2 class="admin-modal-title">${catId ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
      <button class="admin-modal-close" onclick="closeAdminModal()">✕</button>
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label" for="m-cat-name">Nombre</label>
      <input type="text" class="admin-form-input" id="m-cat-name" value="${cat.name}" placeholder="Ej. Gift Cards">
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label" for="m-cat-id">ID (slug)</label>
      <input type="text" class="admin-form-input" id="m-cat-id" value="${cat.id}" placeholder="ej. gift-card" ${catId ? 'disabled' : ''}>
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label" for="m-cat-icon">Icono (emoji)</label>
      <input type="text" class="admin-form-input" id="m-cat-icon" value="${cat.icon}" placeholder="Ej. 🎁">
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label" for="m-cat-color">Color</label>
      <input type="color" class="admin-form-input" id="m-cat-color" value="${cat.color}" style="height: 40px; padding: 4px;">
    </div>
    <div class="admin-modal-footer">
      <button class="btn btn-secondary" onclick="closeAdminModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveCategory('${catId || ''}')">💾 Guardar</button>
    </div>
  `;

  overlay.classList.add('active');
}

function saveCategory(editId) {
  const name = document.getElementById('m-cat-name').value.trim();
  const id = document.getElementById('m-cat-id').value.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
  const icon = document.getElementById('m-cat-icon').value.trim() || '📦';
  const color = document.getElementById('m-cat-color').value;

  if (!name || !id) {
    showAdminToast('❌ Nombre e ID son obligatorios', 'error');
    return;
  }

  const gradient = `linear-gradient(135deg, ${color}, ${adjustColor(color, -40)})`;

  if (editId) {
    const idx = CATEGORIES.findIndex(c => c.id === editId);
    if (idx !== -1) {
      CATEGORIES[idx] = { id: editId, name, icon, color, gradient };
      showAdminToast('✅ Categoría actualizada', 'success');
    }
  } else {
    if (CATEGORIES.some(c => c.id === id)) {
      showAdminToast('❌ Ya existe una categoría con ese ID', 'error');
      return;
    }
    CATEGORIES.push({ id, name, icon, color, gradient });
    showAdminToast('✅ Categoría creada', 'success');
  }

  saveToDb('categories', CATEGORIES);
  closeAdminModal();
  renderActiveTab();
}

function deleteCategory(catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat) return;
  const count = PRODUCTS.filter(p => p.category === catId).length;
  if (confirm(`¿Eliminar categoría "${cat.name}"? ${count > 0 ? `Hay ${count} producto(s) asociados.` : ''}`)) {
    const idx = CATEGORIES.findIndex(c => c.id === catId);
    if (idx !== -1) {
      CATEGORIES.splice(idx, 1);
      saveToDb('categories', CATEGORIES);
      showAdminToast(`🗑️ Categoría "${cat.name}" eliminada`, 'success');
      renderActiveTab();
    }
  }
}

