import sys

file_path = "c:/Users/IK/Documents/GitHub/acessplay/js/app.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """    // Si es el administrador, redirigirlo automáticamente al panel de admin
    if (user && user.email === 'admin@accesplay.com') {
          authNavItem.innerHTML = `<a onclick="window.location.href='/admin'" class="nav-cta" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); cursor:pointer;">Ir al Panel</a>`;
       }
       return;
    }"""

replacement = """    // Si es el administrador, redirigirlo automáticamente al panel de admin
    if (user && user.email === 'admin@accesplay.com') {
       window.location.href = '/admin';
       return;
    }"""

import re
content = re.sub(r"    // Si es el administrador, redirigirlo automáticamente al panel de admin\n    if \(user && user\.email === 'admin@accesplay\.com'\) \{\s*authNavItem\.innerHTML = `<a onclick=\"window\.location\.href='/admin'\" class=\"nav-cta\" style=\"background: linear-gradient\(135deg, #0ea5e9, #0284c7\); cursor:pointer;\">Ir al Panel</a>`;\s*\}\s*return;\s*\}", replacement, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
