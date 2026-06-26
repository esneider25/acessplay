import json
try:
    with open('FIREBASE_RESTORE_CLEAN.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
    orders = d.get('orders', {})
    keys = list(orders.keys())
    numeric = [k for k in keys if k.isdigit()]
    ap = [k for k in keys if k.startswith('AP')]
    rs = [k for k in keys if k.startswith('RS')]
    print(f'Total: {len(keys)}, Numeric: {len(numeric)}, AP: {len(ap)}, RS: {len(rs)}')
    
    # List new web orders:
    new_web = [k for k in keys if k.startswith('AP-') and not k.startswith('AP-OLD')]
    print("New web orders:", new_web)
    for n in new_web:
        print(f"{n} status: {orders[n].get('status')}")
    
except Exception as e:
    print(f"File not found or error: {e}")
