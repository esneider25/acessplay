import os
import re

admin_path = "js/admin.js"

with open(admin_path, "r", encoding="utf-8") as f:
    admin_content = f.read()

# Replace the role badge logic
old_badge = """<span class="admin-badge" style="background: ${u.role === 'revendedor' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 229, 195, 0.15)'}; color: ${u.role === 'revendedor' ? '#d8b4fe' : '#0ea5e9'};">${(u.role === 'user' ? 'cliente' : u.role).toUpperCase()}</span>"""

new_badge = """<span class="admin-badge" style="${
  u.role === 'revendedor' ? 'background: rgba(168, 85, 247, 0.2); color: #d8b4fe;' : 
  (u.role === 'influencer' ? 'background: rgba(239, 68, 68, 0.2); color: #f87171;' : 
  (u.role === 'admin' ? 'background: rgba(234, 179, 8, 0.2); color: #facc15;' : 
  'background: rgba(0, 229, 195, 0.15); color: #0ea5e9;'))
}">${(u.role === 'user' ? 'cliente' : u.role).toUpperCase()}</span>"""

admin_content = admin_content.replace(old_badge, new_badge)

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(admin_content)
