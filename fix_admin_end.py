import os

file_path = "js/admin.js"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Truncate up to line 3840 (0-indexed 3839)
# Let's find exactly where "<!-- 3. ¿Por qué AccessPlay?" starts.
start_idx = -1
for i, line in enumerate(lines):
    if "<!-- 3." in line and "AccessPlay" in line:
        start_idx = i
        break

if start_idx != -1:
    lines = lines[:start_idx]

append_text = """    <!-- 3. ¿Por qué AccessPlay? (Ventajas) -->
    <div class="admin-card" style="margin-bottom: 20px;">
      <h2 class="admin-card-title">¿Por qué AccessPlay? (Ventajas)</h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">Edita las 6 ventajas competitivas.</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
        ${[0, 1, 2, 3, 4, 5].map(i => `
          <div class="admin-form-group" style="background: var(--bg-deep); padding: 15px; border-radius: 8px;">
            <label style="font-size: 0.8rem; color: var(--text-secondary);">Icono (Emoji) ${i+1}</label>
            <input type="text" id="landing-feat-icon-${i}" class="admin-form-input" value="${features[i] && features[i].icon ? features[i].icon : ''}" placeholder="Ej: ⚡">
            <label style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">Título Ventaja ${i+1}</label>
            <input type="text" id="landing-feat-title-${i}" class="admin-form-input" value="${features[i] && features[i].title ? features[i].title : ''}">
            <label style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">Descripción Ventaja ${i+1}</label>
            <textarea id="landing-feat-desc-${i}" class="admin-form-textarea" rows="2">${features[i] && features[i].desc ? features[i].desc : ''}</textarea>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 4. Preguntas Frecuentes (FAQ) -->
    <div class="admin-card" style="margin-bottom: 20px;">
      <h2 class="admin-card-title">Preguntas Frecuentes (FAQ)</h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">Edita las 4 preguntas más frecuentes.</p>
      <div style="display: flex; flex-direction: column; gap: 15px;">
        ${[0, 1, 2, 3].map(i => `
          <div class="admin-form-group" style="background: var(--bg-deep); padding: 15px; border-radius: 8px;">
            <label style="font-size: 0.8rem; color: var(--text-secondary);">Pregunta ${i+1}</label>
            <input type="text" id="landing-faq-q-${i}" class="admin-form-input" value="${faq[i] && faq[i].q ? faq[i].q : ''}">
            <label style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">Respuesta ${i+1}</label>
            <textarea id="landing-faq-a-${i}" class="admin-form-textarea" rows="2">${faq[i] && faq[i].a ? faq[i].a : ''}</textarea>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 5. Footer -->
    <div class="admin-card">
      <h2 class="admin-card-title">Pie de Página (Footer)</h2>
      <div class="admin-form-group">
        <label style="font-size: 0.8rem; color: var(--text-secondary);">Texto Legal / Descargo de Responsabilidad</label>
        <textarea id="landing-footer-disc" class="admin-form-textarea" rows="3">${footer.disclaimer || ''}</textarea>
      </div>
    </div>
  `;
}

function adminSaveLanding() {
  const newConfig = {
    heroStats: [0, 1, 2, 3].map(i => ({
      value: document.getElementById(`landing-hero-val-${i}`).value,
      label: document.getElementById(`landing-hero-lbl-${i}`).value
    })),
    howItWorks: [0, 1, 2].map(i => ({
      icon: document.getElementById(`landing-how-icon-${i}`).value,
      title: document.getElementById(`landing-how-title-${i}`).value,
      desc: document.getElementById(`landing-how-desc-${i}`).value
    })),
    features: [0, 1, 2, 3, 4, 5].map(i => ({
      icon: document.getElementById(`landing-feat-icon-${i}`).value,
      title: document.getElementById(`landing-feat-title-${i}`).value,
      desc: document.getElementById(`landing-feat-desc-${i}`).value
    })),
    faq: [0, 1, 2, 3].map(i => ({
      q: document.getElementById(`landing-faq-q-${i}`).value,
      a: document.getElementById(`landing-faq-a-${i}`).value
    })),
    footer: {
      disclaimer: document.getElementById('landing-footer-disc').value
    }
  };
  
  if (typeof saveLandingConfig === 'function') {
    saveLandingConfig(newConfig);
    showAdminToast('✅ Diseño Web guardado', 'success');
  } else {
    showAdminToast('❌ Error: Función de guardado no encontrada', 'error');
  }
}

window.normalizeLegacyData = async function() {
  if (!confirm("¿Deseas normalizar y actualizar todos los datos antiguos al nuevo formato? Esto puede tardar unos segundos y solo debe hacerse una vez.")) return;
  
  const btn = document.getElementById('btn-normalize');
  if(btn) { 
    btn.innerHTML = `<span style="display:inline-block; width:16px; height:16px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; margin-right:8px; vertical-align:middle;"></span> Normalizando...`; 
    btn.disabled = true; 
  }

  try {
    const ordersSnap = await firebase.database().ref('orders').once('value');
    const ordersData = ordersSnap.val() || {};
    
    let updatedOrders = 0;
    const batchUpdates = {};
    
    for (const key in ordersData) {
      let changed = false;
      const o = ordersData[key];
      
      // 1. Fix Status History
      if (!o.statusHistory || !Array.isArray(o.statusHistory)) {
        o.statusHistory = [{ status: o.status || 'pending', timestamp: o.createdAt || new Date().toISOString() }];
        changed = true;
      }
      
      // 2. Fix legacy product and cost
      let correctPkg = null;
      let correctProd = null;
      const searchLabel = String(o.packageLabel || o.productDetails || o.productName || '').toLowerCase();
      const orderPrice = Number(o.priceUsd) || 0;

      // Try to find the real product by matching name in the label
      let matchedProds = PRODUCTS.filter(p => searchLabel.includes(p.name.toLowerCase()));
      if (matchedProds.length === 0) {
         if (o.productId && o.productId !== 'legacy') {
            matchedProds = PRODUCTS.filter(p => p.id === o.productId);
         } else {
            matchedProds = PRODUCTS;
         }
      }

      for (let i = 0; i < matchedProds.length; i++) {
        if (matchedProds[i].packages) {
          // STRICT: Cost must be less than or equal to price to prevent bug
          correctPkg = matchedProds[i].packages.find(p => Number(p.priceUsd) === orderPrice && (parseFloat(p.costUsd) || 0) <= orderPrice);
          if (correctPkg) { correctProd = matchedProds[i]; break; }
        }
      }
      
      if (!correctPkg) {
        const nums = searchLabel.match(/\d+/g);
        if (nums && nums.length > 0) {
          const targetNum = nums[0];
          for (let i = 0; i < matchedProds.length; i++) {
            if (matchedProds[i].packages) {
              correctPkg = matchedProds[i].packages.find(p => (String(p.amount) === targetNum || String(p.label).includes(targetNum)) && (parseFloat(p.costUsd) || 0) <= orderPrice);
              if (correctPkg) { correctProd = matchedProds[i]; break; }
            }
          }
        }
      }
      
      if (correctProd && correctPkg) {
        const correctCost = parseFloat(correctPkg.costUsd) || 0;
        
        // If we found a valid package, update details
        if (o.productId === 'legacy' || o.costUsd > orderPrice || o.costUsd === undefined || o.costUsd === 0) {
          if (o.productId !== correctProd.id) { o.productId = correctProd.id; changed = true; }
          if (!o.packageLabel || o.packageLabel !== correctPkg.label) { o.packageLabel = correctPkg.label; changed = true; }
          if (o.costUsd !== correctCost) { o.costUsd = correctCost; changed = true; }
          if (o.productName !== correctProd.name) { o.productName = correctProd.name; changed = true; }
        }
      } else {
        // Fallback for severely corrupted orders where no valid package is found
        if (o.costUsd === undefined || o.costUsd === 0 || o.costUsd > orderPrice) {
          // Set a safe fallback cost (e.g., 85% of price)
          o.costUsd = orderPrice * 0.85; 
          changed = true;
        }
      }
      
      if (changed) {
        batchUpdates['orders/' + key] = o;
        updatedOrders++;
      }
    }
    
    // 3. Fix Users totalSpent and role
    const usersSnap = await firebase.database().ref('users').once('value');
    const usersData = usersSnap.val() || {};
    
    const freshOrders = Object.values(ordersData);
    const spentMap = {};
    freshOrders.filter(o => o.status === 'completed' || o.status === 'completado').forEach(o => {
      if (o.userId) spentMap[o.userId] = (spentMap[o.userId] || 0) + (Number(o.priceUsd) || 0);
    });
    
    let updatedUsers = 0;
    for (const uid in usersData) {
      let uChanged = false;
      const actualSpent = spentMap[uid] || 0;
      if (usersData[uid].totalSpent !== actualSpent) {
        batchUpdates['users/' + uid + '/totalSpent'] = actualSpent;
        uChanged = true;
      }
      if (!usersData[uid].role) {
        batchUpdates['users/' + uid + '/role'] = 'cliente';
        uChanged = true;
      }
      if (uChanged) updatedUsers++;
    }
    
    if (Object.keys(batchUpdates).length > 0) {
      await firebase.database().ref().update(batchUpdates);
    }
    
    alert(`¡Normalización completada con éxito!\\n\\nPedidos reparados: ${updatedOrders}\\nUsuarios actualizados: ${updatedUsers}`);
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Hubo un error normalizando la base de datos. Revisa la consola.");
    if(btn) { btn.innerText = "Error - Reintentar"; btn.disabled = false; }
  }
};
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(lines)
    f.write(append_text)
