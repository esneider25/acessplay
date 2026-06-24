import os

admin_path = "js/admin.js"

with open(admin_path, "r", encoding="utf-8") as f:
    admin_content = f.read()

# 1. Add search input to renderCustomers header
new_header = """    <div class="admin-header">
      <div>
        <h1 class="admin-title">Clientes VIP (CRM)</h1>
        <p class="admin-subtitle">Usuarios registrados y mejores compradores</p>
      </div>
      <button class="btn btn-secondary" onclick="exportCustomersCSV()">
        <span>📥</span> Exportar a CSV
      </button>
    </div>
    
    <div style="margin-bottom: 20px;">
      <input type="text" id="customers-search-input" onkeyup="filterCrmTable(this.value)" placeholder="🔍 Buscar por nombre, correo o teléfono..." style="width: 100%; padding: 14px 20px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: #fff; font-size: 1rem; outline: none;">
    </div>
"""

admin_content = admin_content.replace("""    <div class="admin-header">
      <div>
        <h1 class="admin-title">Clientes VIP (CRM)</h1>
        <p class="admin-subtitle">Usuarios registrados y mejores compradores</p>
      </div>
      <button class="btn btn-secondary" onclick="exportCustomersCSV()">
        <span>📥</span> Exportar a CSV
      </button>
    </div>""", new_header)

# 2. Add data-search attribute to admin-crm-row
old_row = """<div class="admin-crm-row">"""
new_row = """<div class="admin-crm-row" data-search="${(c.name || '').toLowerCase()} ${(c.contact || '').toLowerCase()} ${(c.whatsapp || '').toLowerCase()}">"""
admin_content = admin_content.replace(old_row, new_row)

# 3. Add the filterCrmTable function at the end
new_func = """
window.filterCrmTable = function(val) {
  const query = val.toLowerCase().trim();
  const rows = document.querySelectorAll('.admin-crm-row');
  let visibleCount = 0;
  
  rows.forEach(row => {
    if (row.getAttribute('data-search').includes(query)) {
      row.style.display = 'grid'; // because admin-crm-row uses CSS grid
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });
  
  const noRes = document.getElementById('crm-no-results');
  if (noRes) {
    noRes.style.display = visibleCount === 0 ? 'block' : 'none';
  }
};
"""
admin_content += "\n" + new_func

# 4. Add crm-no-results div
old_html_injection = """        <div style="padding: 16px;">
          ${customersHtml}
        </div>"""
new_html_injection = """        <div style="padding: 16px;">
          ${customersHtml}
          <div id="crm-no-results" style="display: none; text-align: center; padding: 40px; color: var(--text-muted);">No se encontró ningún cliente con esa búsqueda.</div>
        </div>"""
admin_content = admin_content.replace(old_html_injection, new_html_injection)

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(admin_content)
