import json

print("Cargando SAFE_IMPORT.json...")
with open('SAFE_IMPORT.json', 'r', encoding='utf-8') as f:
    master_db = json.load(f)

orders = master_db.get('orders', {})
new_orders = {}
fixed_count = 0

for k, v in orders.items():
    if k.isdigit():
        # Get the real ID
        real_id = v.get('id')
        if not real_id:
            real_id = f"AP-OLD-UNKNOWN-{k}"
            v['id'] = real_id
        
        new_orders[real_id] = v
        fixed_count += 1
    else:
        new_orders[k] = v

master_db['orders'] = new_orders

print(f"Se corrigieron {fixed_count} pedidos con claves numéricas.")

with open('SAFE_IMPORT_FIXED.json', 'w', encoding='utf-8') as f:
    json.dump(master_db, f, ensure_ascii=False, indent=2)

print("✅ Guardado en SAFE_IMPORT_FIXED.json. Listo para subir.")
