import json

# Lo que estaba en Firebase antes (tu backup original)
with open('firebase_backup_actual.json', 'r', encoding='utf-8') as f:
    backup = json.load(f)

# Lo que se subió (SAFE_IMPORT_FIXED)
with open('SAFE_IMPORT_FIXED.json', 'r', encoding='utf-8') as f:
    uploaded = json.load(f)

# Comparar cada nodo de configuración
config_keys = ['products', 'categories', 'payment_methods', 'exchange_rate', 
               'settings', 'landing_config', 'banners', 'telegram_config',
               'api_configs', 'discounts', 'spam_tracker', 'order_counter',
               'quick_replies', 'messages']

print("=== COMPARACIÓN: Backup Original vs Lo Subido ===\n")
for key in config_keys:
    b = backup.get(key)
    u = uploaded.get(key)
    
    b_json = json.dumps(b, sort_keys=True, ensure_ascii=False) if b else 'NULL'
    u_json = json.dumps(u, sort_keys=True, ensure_ascii=False) if u else 'NULL'
    
    if b_json == u_json:
        print(f"  ✅ {key}: IDÉNTICO")
    else:
        if b is None and u is not None:
            print(f"  ⚠️  {key}: NO existía en backup, SÍ existe en lo subido")
        elif b is not None and u is None:
            print(f"  ❌ {key}: EXISTÍA en backup, NO existe en lo subido (PERDIDO)")
        else:
            b_len = len(b) if isinstance(b, (list, dict)) else 0
            u_len = len(u) if isinstance(u, (list, dict)) else 0
            print(f"  ⚠️  {key}: DIFERENTE (backup={b_len} items, subido={u_len} items)")

# Usuarios
b_users = backup.get('users', {})
u_users = uploaded.get('users', {})
print(f"\n  Usuarios: backup={len(b_users)}, subido={len(u_users)}")

# Orders
b_orders = backup.get('orders', {})
u_orders = uploaded.get('orders', {})
print(f"  Pedidos: backup={len(b_orders)}, subido={len(u_orders)}")
