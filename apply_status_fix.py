import os
import re

admin_path = "js/admin.js"

with open(admin_path, "r", encoding="utf-8") as f:
    admin_content = f.read()

new_func = """window.normalizeLegacyData = async function() {
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
      let o = ordersData[key];
      
      // Migrate RS-OLD keys to AP-OLD
      let newKey = key;
      if (key.startsWith("RS-OLD-")) {
        newKey = key.replace("RS-OLD-", "AP-OLD-");
        o.id = newKey;
        batchUpdates['orders/' + key] = null; // Delete old key
        changed = true;
      }

      // 0. Translate old statuses
      if (o.status === 'completado') { o.status = 'completed'; changed = true; }
      if (o.status === 'rechazado') { o.status = 'rejected'; changed = true; }
      if (o.status === 'pendiente') { o.status = 'pending'; changed = true; }
      if (o.status === 'procesando') { o.status = 'processing'; changed = true; }
      
      // 1. Fix Status History
      if (!o.statusHistory || !Array.isArray(o.statusHistory)) {
        o.statusHistory = [{ status: o.status || 'pending', timestamp: o.createdAt || new Date().toISOString() }];
        changed = true;
      } else {
        // Also fix inside history
        o.statusHistory.forEach(h => {
          if (h.status === 'completado') { h.status = 'completed'; changed = true; }
          if (h.status === 'rechazado') { h.status = 'rejected'; changed = true; }
          if (h.status === 'pendiente') { h.status = 'pending'; changed = true; }
          if (h.status === 'procesando') { h.status = 'processing'; changed = true; }
        });
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
        batchUpdates['orders/' + newKey] = o;
        updatedOrders++;
      }
    }
    
    // 3. Fix Users totalSpent and roles (user -> cliente, reseller -> revendedor)
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
      
      // Translate old English roles
      const currentRole = usersData[uid].role;
      if (!currentRole || currentRole === 'user') {
        batchUpdates['users/' + uid + '/role'] = 'cliente';
        uChanged = true;
      } else if (currentRole === 'reseller') {
        batchUpdates['users/' + uid + '/role'] = 'revendedor';
        uChanged = true;
      }
      
      if (uChanged) updatedUsers++;
    }
    
    if (Object.keys(batchUpdates).length > 0) {
      await firebase.database().ref().update(batchUpdates);
    }
    
    alert(`¡Normalización completada con éxito!\\n\\nPedidos reparados/renombrados: ${updatedOrders}\\nUsuarios actualizados: ${updatedUsers}`);
    location.reload();
  } catch (err) {
    console.error(err);
    alert("Hubo un error normalizando la base de datos. Revisa la consola.");
    if(btn) { btn.innerText = "Error - Reintentar"; btn.disabled = false; }
  }
};
"""

start_idx = admin_content.find("window.normalizeLegacyData")
if start_idx != -1:
    admin_content = admin_content[:start_idx] + new_func
else:
    admin_content += "\n" + new_func

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(admin_content)
