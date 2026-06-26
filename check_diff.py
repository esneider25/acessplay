import json

with open('firebase_live_now.json', 'r', encoding='utf-8', errors='ignore') as f:
    live = json.load(f)

with open('firebase_backup_actual.json', 'r', encoding='utf-8') as f:
    backup = json.load(f)

# Compare settings
live_settings = live.get('settings', {})
backup_settings = backup.get('settings', {})

print("=== DIFERENCIAS EN SETTINGS ===")
all_keys = set(list(live_settings.keys()) + list(backup_settings.keys()))
for k in sorted(all_keys):
    lv = live_settings.get(k)
    bv = backup_settings.get(k)
    if json.dumps(lv, sort_keys=True, ensure_ascii=False) != json.dumps(bv, sort_keys=True, ensure_ascii=False):
        print(f"\n  KEY: {k}")
        print(f"    EN VIVO: {json.dumps(lv, ensure_ascii=False)[:200]}")
        print(f"    BACKUP:  {json.dumps(bv, ensure_ascii=False)[:200]}")

# Also check: are there new orders in live that weren't in the uploaded file?
live_orders = set(live.get('orders', {}).keys())

with open('SAFE_IMPORT_FIXED.json', 'r', encoding='utf-8') as f:
    uploaded = json.load(f)
uploaded_orders = set(uploaded.get('orders', {}).keys())

new_in_live = live_orders - uploaded_orders
if new_in_live:
    print(f"\n=== PEDIDOS NUEVOS EN VIVO (creados después de la subida) ===")
    for oid in new_in_live:
        o = live['orders'][oid]
        print(f"  {oid}: status={o.get('status')}, product={str(o.get('productName',''))[:30]}, created={str(o.get('createdAt',''))[:16]}")
