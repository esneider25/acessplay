import sqlite3
import json
import base64

db_path = r'C:\Users\IK\Documents\accesplay.db'

def run_migration():
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Monedas -> Exchange Rate
        cursor.execute("SELECT * FROM monedas WHERE codigo='VES'")
        ves_row = cursor.fetchone()
        exchange_rate = {
            "usdToBs": float(ves_row['tasa']) if ves_row else 58.0,
            "lastUpdated": "2026-06-24"
        }

        # 2. Metodos de pago
        cursor.execute("SELECT * FROM metodos_pago")
        pago_rows = cursor.fetchall()
        payment_methods = []
        for r in pago_rows:
            try:
                datos = json.loads(r['datos']) if r['datos'] else []
                details = {}
                for d in datos:
                    label = d.get('label', '').lower()
                    val = d.get('valor', '')
                    if 'telefono' in label or 'tel' in label:
                        details['telefono'] = val
                    elif 'cedula' in label or 'rif' in label:
                        details['cedula'] = val
                    elif 'id' in label:
                        details['binanceId'] = val
                    elif 'usuario' in label:
                        details['titular'] = val
                    else:
                        details['nota'] = val
                
                currency = 'VES'
                if r['moneda_id'] == 1: currency = 'USD'
                elif r['moneda_id'] == 3: currency = 'COP'

                payment_methods.append({
                    "id": f"pm-{r['id']}",
                    "name": r['nombre'],
                    "currency": currency,
                    "icon": r['icono'] or 'fas fa-money-bill',
                    "details": details,
                    "active": bool(r['activo'])
                })
            except Exception as e:
                print(f"Error parseando metodo de pago {r['id']}: {e}")

        # 3. Servicios y Productos -> Categories y Products
        cursor.execute("SELECT DISTINCT categoria FROM servicios WHERE categoria != ''")
        cat_rows = cursor.fetchall()
        categories = []
        for i, c in enumerate(cat_rows):
            cat_name = c['categoria']
            categories.append({
                "id": cat_name.lower(),
                "name": cat_name.capitalize(),
                "icon": "🎮",
                "position": i + 1
            })

        cursor.execute("SELECT * FROM servicios")
        servicios = cursor.fetchall()
        products = []
        for s in servicios:
            prod_id = s['nombre'].lower().replace(' ', '-').replace('+', '').replace('(', '').replace(')', '')
            if not prod_id: prod_id = f"prod-{s['id']}"

            cursor.execute("SELECT * FROM productos WHERE servicio_id=?", (s['id'],))
            paquetes = cursor.fetchall()
            packages_list = []
            for idx, p in enumerate(paquetes):
                # Try to extract amount from string like "100+5 GOLD"
                amount = 0
                import re
                nums = re.findall(r'\d+', p['nombre'])
                if nums:
                    amount = int(nums[0])
                if amount == 0:
                    amount = idx + 1
                
                packages_list.append({
                    "amount": amount,
                    "priceUsd": float(p['precio']),
                    "label": p['nombre'],
                    "apiServiceId": str(p['api_monto']) if p['api_monto'] else "",
                    "isOutofStock": not bool(p['activo'])
                })

            products.append({
                "id": prod_id,
                "name": s['nombre'],
                "category": s['categoria'].lower() if s['categoria'] else "otros",
                "type": "game",
                "currency": "DIAMANTES",
                "currencyIcon": "💎",
                "imageUrl": s['imagen_url'] if s['imagen_url'] else "",
                "color": s['color'] if s['color'] else "#0ea5e9",
                "colorGradient": f"linear-gradient(135deg, {s['color'] or '#0ea5e9'}, #111)",
                "description": s['descripcion'] or "",
                "position": s['orden'] or 999,
                "popular": bool(s['destacado']),
                "isNew": False,
                "apiProvider": "api-1" if s['api_tipo'] == "freefire" else "",
                "packages": packages_list
            })

        # 4. Codigos Descuento
        cursor.execute("SELECT * FROM codigos_descuento")
        desc_rows = cursor.fetchall()
        discounts = []
        for d in desc_rows:
            discounts.append({
                "id": f"discount-{d['id']}",
                "code": d['codigo'],
                "type": d['tipo'],
                "value": float(d['valor']),
                "maxUses": d['uso_maximo'] or 0,
                "currentUses": d['usos'] or 0,
                "expirationDate": d['fecha_expiracion'] or "",
                "active": bool(d['activo'])
            })

        # 5. Pedidos -> Orders
        cursor.execute("SELECT p.*, u.correo, u.whatsapp FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id = u.id")
        pedido_rows = cursor.fetchall()
        orders = []
        for p in pedido_rows:
            # Parse dates
            # SQLite format: 2026-05-31 14:28 -> target: 2026-05-31T14:28:00.000Z
            date_str = p['fecha']
            if len(date_str) == 16:
                date_str += ":00.000Z"
            elif len(date_str) == 19:
                date_str += ".000Z"
            date_str = date_str.replace(' ', 'T')

            data_cli = {}
            try:
                if p['datos_cliente']:
                    data_cli = json.loads(p['datos_cliente'])
            except:
                pass

            orders.append({
                "id": f"RS-OLD-{p['id']}",
                "userId": f"uid-{p['usuario_id']}",
                "userEmail": p['correo'] or "",
                "userPhone": p['whatsapp'] or "",
                "productDetails": p['producto'],
                "productId": "legacy",
                "packageAmount": 0,
                "playerId": list(data_cli.values())[0] if data_cli else "",
                "zoneId": "",
                "priceUsd": float(p['precio']),
                "priceBs": float(p['precio_pagado']) if p['moneda_pago'] == 'VES' else 0,
                "currency": p['moneda_pago'],
                "paymentMethod": p['metodo_pago'],
                "reference": p['referencia'] or "",
                "status": "completado" if p['estado'] == 'completado' else ("rechazado" if p['estado'] == 'rechazado' else "pendiente"),
                "createdAt": date_str,
                "updatedAt": date_str,
                "apiData": {
                    "result": p['api_resultado'] or "",
                    "ref": p['api_referencia'] or ""
                }
            })

        # Generate Realtime DB Object
        db_export = {
            "exchange_rate": exchange_rate,
            "payment_methods": payment_methods,
            "categories": categories,
            "products": products,
            "discounts": discounts,
            "orders": orders
        }

        with open("migration_db.json", "w", encoding="utf-8") as f:
            json.dump(db_export, f, ensure_ascii=False, indent=2)

        # 6. Usuarios
        cursor.execute("SELECT * FROM usuarios")
        usuarios = cursor.fetchall()
        firebase_users_list = []
        rtdb_users = {}

        for u in usuarios:
            uid = f"uid-{u['id']}"
            rtdb_users[uid] = {
                "uid": uid,
                "email": u['correo'],
                "displayName": u['nombre'],
                "phone": u['whatsapp'],
                "role": "reseller" if u['rol'] == 'reseller' else ("admin" if u['rol'] == 'admin' else "user"),
                "createdAt": u['fecha_registro'] + "T00:00:00.000Z" if len(u['fecha_registro']) == 10 else u['fecha_registro'],
                "walletBalance": 0
            }

            # Werkzeug scrypt format: scrypt:32768:8:1$<salt>$<hash>
            pwd = u['password']
            if pwd and pwd.startswith("scrypt:32768:8:1$"):
                parts = pwd.split("$")
                if len(parts) == 3:
                    salt_raw = parts[1]
                    hash_hex = parts[2]
                    # firebase-admin importUsers supports standard SCRYPT
                    firebase_users_list.append({
                        "uid": uid,
                        "email": u['correo'],
                        "displayName": u['nombre'],
                        "passwordHash": hash_hex, # Will convert to base64 buffer in Node
                        "passwordSalt": salt_raw  # Will convert to base64 buffer in Node
                    })

        with open("users_to_import.json", "w", encoding="utf-8") as f:
            json.dump({
                "users": firebase_users_list,
                "rtdb_profiles": rtdb_users
            }, f, ensure_ascii=False, indent=2)

        print("Migration data exported successfully!")

    except Exception as e:
        print(f"Error during migration: {e}")
        import traceback
        traceback.print_exc()

run_migration()
