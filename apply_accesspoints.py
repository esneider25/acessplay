import os
import re

files_to_check = ["js/usuario.js", "js/admin.js", "js/components.js", "index.html", "usuario.html", "admin.html"]

for path in files_to_check:
    if not os.path.exists(path): continue
    
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
        
    original = content
    
    # Text replacements
    content = content.replace("AccessPlay Points", "AccessPoints")
    content = content.replace("AccessPlay points", "AccessPoints")
    content = content.replace("Shark Points", "AccessPoints")
    content = content.replace("Shark points", "AccessPoints")
    content = content.replace("SharkPoints", "AccessPoints")
    content = content.replace("INFLUENCER SHARK", "INFLUENCER ACCESSPLAY")
    content = content.replace("SHARK PARTNER", "ACCESSPLAY PARTNER")
    
    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {path}")
