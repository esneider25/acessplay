import json

d = json.load(open('SAFE_IMPORT.json', 'r', encoding='utf-8'))
orders = d.get('orders', {})

print(f"Total orders: {len(orders)}")

numeric_keys = [k for k in orders.keys() if k.isdigit()]
ap_keys = [k for k in orders.keys() if k.startswith('AP-') and not k.startswith('AP-OLD')]
old_keys = [k for k in orders.keys() if k.startswith('AP-OLD')]

print(f"Numeric keys (array-like): {len(numeric_keys)}")
print(f"AP-xxxxx keys (new web orders): {len(ap_keys)}")
print(f"AP-OLD-xxx keys (migrated): {len(old_keys)}")
print()

# Show the new web orders
print("=== NEW WEB ORDERS (AP-xxxxx) ===")
for k in ap_keys:
    o = orders[k]
    print(f"  {k}: status={o.get('status')}, product={o.get('productName','')[:30]}, created={o.get('createdAt','')[:16]}")

print()

# Check for critical issues:
# 1. Orders with numeric keys that have AP-OLD IDs - these create array structure in Firebase
print("=== PROBLEMATIC: Numeric keys with string IDs ===")
problem_count = 0
for k in numeric_keys[:5]:
    o = orders[k]
    real_id = o.get('id', 'NO_ID')
    print(f"  Key={k}, ID={real_id}, status={o.get('status')}")
    problem_count += 1

print(f"  ... and {len(numeric_keys) - 5} more")
print()

# 2. Check for missing fields that admin panel needs
print("=== FIELD COMPLETENESS CHECK (sample of 5) ===")
required = ['id', 'productName', 'packageLabel', 'priceUsd', 'priceBs', 
            'paymentMethodName', 'customerContact', 'status', 'createdAt']
sample_keys = list(orders.keys())[:5]
for k in sample_keys:
    o = orders[k]
    missing = [f for f in required if not o.get(f)]
    if missing:
        print(f"  {o.get('id','?')}: missing -> {missing}")

print()

# 3. Check for order_counter
print(f"order_counter: {d.get('order_counter', 'NOT SET')}")

# 4. Check the priceUsd type for new orders
print("\n=== PRICE TYPE CHECK ===")
for k in list(orders.keys())[:3]:
    o = orders[k]
    print(f"  {o.get('id')}: priceUsd={o.get('priceUsd')} (type={type(o.get('priceUsd')).__name__}), priceBs={o.get('priceBs')} (type={type(o.get('priceBs')).__name__})")
