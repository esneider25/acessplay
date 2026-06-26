import json

with open('firebase_live_now.json', 'r', encoding='utf-8', errors='ignore') as f:
    d = json.load(f)

orders = d.get('orders', {})
users = d.get('users', {})
products = d.get('products', [])

print(f"Pedidos en vivo: {len(orders)}")
print(f"Usuarios en vivo: {len(users)}")
print(f"Productos en vivo: {len(products)}")

numeric = [k for k in orders if k.isdigit()]
ap_old = [k for k in orders if k.startswith('AP-OLD')]
ap_new = [k for k in orders if k.startswith('AP-') and not k.startswith('AP-OLD')]
rs = [k for k in orders if k.startswith('RS-')]
print(f"\nClaves numéricas: {len(numeric)}")
print(f"Claves AP-OLD-*: {len(ap_old)}")  
print(f"Claves AP-xxxxx (web): {len(ap_new)}")
print(f"Claves RS-* (web): {len(rs)}")

if rs:
    print(f"\nPedidos RS: {rs}")
if ap_new:
    print(f"Pedidos AP nuevos: {ap_new}")

# Verify config is intact
with open('firebase_backup_actual.json', 'r', encoding='utf-8') as f:
    backup = json.load(f)

config_keys = ['products', 'categories', 'payment_methods', 'exchange_rate', 
               'settings', 'landing_config', 'banners', 'telegram_config',
               'api_configs', 'discounts']

print("\n=== CONFIG CHECK (Live vs Backup original) ===")
for key in config_keys:
    b = json.dumps(backup.get(key), sort_keys=True, ensure_ascii=False)
    l = json.dumps(d.get(key), sort_keys=True, ensure_ascii=False)
    status = "✅ IDÉNTICO" if b == l else "❌ DIFERENTE"
    print(f"  {key}: {status}")
