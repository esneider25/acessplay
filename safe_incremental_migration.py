import sqlite3
import json
import base64
import binascii
import os
import sys

# Buscar la base de datos automáticamente en las rutas más comunes de tu PC
possible_paths = [
    'accesplay.db',
    r'C:\Users\IK\Downloads\accesplay.db',
    r'C:\Users\IK\Documents\accesplay.db',
    r'C:\Users\IK\Desktop\accesplay.db'
]

DB_PATH = None
for path in possible_paths:
    if os.path.exists(path):
        DB_PATH = path
        break

if not DB_PATH:
    print("❌ ERROR CRÍTICO: No se encontró el archivo 'accesplay.db'.")
    print("Por favor, copia la base de datos en esta carpeta (C:\\Users\\IK\\Documents\\GitHub\\acessplay)")
    sys.exit(1)

BACKUP_PATH = 'firebase_backup_actual.json' # Tu respaldo de Firebase actual
OUTPUT_PATH = 'SAFE_IMPORT.json' # El resultado que subirás a Firebase RTDB
AUTH_OUTPUT_PATH = 'USERS_AUTH_IMPORT.json' # El archivo que usarás para la consola CLI de Firebase Auth

def safe_migration():
    if not os.path.exists(DB_PATH):
        print(f"❌ ERROR: No se encontró el archivo '{DB_PATH}'. Por favor colócalo en esta carpeta.")
        return
        
    if not os.path.exists(BACKUP_PATH):
        print(f"❌ ERROR: No se encontró el archivo '{BACKUP_PATH}'. Descarga tu base de datos de Firebase y nómbrala así.")
        return

    print("✅ Archivos encontrados. Iniciando migración incremental ultra-segura...")

    # 1. Cargar el ecosistema actual (Intacto)
    with open(BACKUP_PATH, 'r', encoding='utf-8') as f:
        master_db = json.load(f)

    for node in ['users', 'orders', 'products', 'categories', 'payment_methods', 'discounts']:
        if node not in master_db:
            master_db[node] = {} if node in ['users', 'orders'] else []

    current_users = master_db['users']
    current_orders = master_db['orders']
    
    current_categories_ids = [str(c.get('id', '')) for c in master_db['categories']]
    current_products_ids = [str(p.get('id', '')) for p in master_db['products']]
    current_pm_names = [str(pm.get('name', '')).lower() for pm in master_db['payment_methods']]

    # 2. Conectar a SQLite
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    stats = {
        "usuarios_nuevos": 0, "pedidos_nuevos": 0, "productos_nuevos": 0, 
        "categorias_nuevas": 0, "metodos_nuevos": 0, "passwords_exportados": 0
    }

    firebase_users_auth_list = []
    sqlite_product_map = {}
    
    # Extraemos info de base antigua para mapear
    cursor.execute("SELECT * FROM servicios")
    servicios = cursor.fetchall()
    for s in servicios:
        s_nombre = str(s['nombre'] or '')
        prod_firebase_id = s_nombre.lower().replace(' ', '-').replace('+', '').replace('(', '').replace(')', '')
        if not prod_firebase_id: prod_firebase_id = f"prod-{s['id']}"

        cursor.execute("SELECT * FROM productos WHERE servicio_id=?", (s['id'],))
        paquetes = cursor.fetchall()
        
        packages_list = []
        for idx, p in enumerate(paquetes):
            p_nombre = str(p['nombre'] or '')
            p_precio = float(p['precio']) if p['precio'] else 0.0
            p_cost = float(p['precio_original']) if p['precio_original'] else 0.0

            sqlite_product_map[p['id']] = {
                "firebase_product_id": prod_firebase_id,
                "servicio_name": s_nombre,
                "package_label": p_nombre,
                "price": p_precio,
                "costUsd": p_cost
            }

            amount = 0
            nums = re.findall(r'\d+', p_nombre)
            if nums: amount = int(nums[0])
            if amount == 0: amount = idx + 1
            
            packages_list.append({
                "amount": amount,
                "priceUsd": p_precio,
                "costUsd": p_cost,
                "label": p_nombre,
                "apiServiceId": str(p['api_monto'] or ''),
                "isOutofStock": not bool(p['activo'])
            })

        # MIGRACIÓN DE PRODUCTOS NUEVOS
        if prod_firebase_id not in current_products_ids:
            cat_raw = str(s['categoria'] or 'otros')
            master_db['products'].append({
                "id": prod_firebase_id,
                "name": s_nombre,
                "category": cat_raw.lower().replace(' ', '-'),
                "type": "",
                "currency": "DIAMANTES",
                "currencyIcon": "💎",
                "imageUrl": str(s['imagen_url'] or ''),
                "color": str(s['color'] or '#0ea5e9'),
                "colorGradient": f"linear-gradient(135deg, {str(s['color'] or '#0ea5e9')}, #111)",
                "description": str(s['descripcion'] or ''),
                "position": int(s['orden'] or 999),
                "popular": bool(s['destacado']),
                "isNew": False,
                "apiProvider": "api-1" if s['api_tipo'] == "freefire" else "",
                "packages": packages_list
            })
            current_products_ids.append(prod_firebase_id)
            stats["productos_nuevos"] += 1

    # --- CATEGORÍAS ---
    cursor.execute("SELECT DISTINCT categoria FROM servicios WHERE categoria IS NOT NULL AND categoria != ''")
    for c in cursor.fetchall():
        cat_raw = str(c['categoria'] or '').strip()
        if not cat_raw: continue
        cat_id = cat_raw.lower().replace(' ', '-')
        if cat_id not in current_categories_ids:
            master_db['categories'].append({"id": cat_id, "name": cat_raw.capitalize(), "icon": "🎮", "position": len(master_db['categories']) + 1})
            current_categories_ids.append(cat_id)
            stats["categorias_nuevas"] += 1

    # --- MÉTODOS DE PAGO ---
    cursor.execute("SELECT * FROM metodos_pago")
    for r in cursor.fetchall():
        pm_name = str(r['nombre'] or '')
        if pm_name.lower() in current_pm_names: continue
        
        datos = []
        if r['datos']:
            try: datos = json.loads(r['datos'])
            except: pass
            
        details = {}
        for d in datos:
            label = str(d.get('label', '')).lower()
            val = str(d.get('valor', ''))
            if 'telefono' in label or 'tel' in label: details['telefono'] = val
            elif 'cedula' in label or 'rif' in label: details['cedula'] = val
            elif 'id' in label: details['binanceId'] = val
            elif 'usuario' in label: details['titular'] = val
            else: details['nota'] = val

        master_db['payment_methods'].append({"id": f"pm-{r['id']}", "name": pm_name, "currency": 'USD' if r['moneda_id'] == 1 else 'VES', "icon": str(r['icono'] or '💵'), "details": details, "active": bool(r['activo'])})
        current_pm_names.append(pm_name.lower())
        stats["metodos_nuevos"] += 1

    # --- USUARIOS E IMPORTACIÓN DE CONTRASEÑAS (AUTH CLI) ---
    cursor.execute("SELECT * FROM usuarios")
    for u in cursor.fetchall():
        uid = f"uid-{u['id']}"
        rol_db = str(u['rol'] or '').lower()
        rol_firebase = 'cliente'
        if rol_db in ['admin', 'administrador']: rol_firebase = 'admin'
        elif rol_db in ['reseller', 'revendedor', 'mayorista']: rol_firebase = 'revendedor'
        elif rol_db in ['influencer', 'partner']: rol_firebase = 'influencer'

        fecha_raw = str(u['fecha_registro'] or '')
        if len(fecha_raw) == 10: fecha_raw += "T00:00:00.000Z"
        elif len(fecha_raw) == 16: fecha_raw += ":00.000Z"
        elif len(fecha_raw) == 19: fecha_raw += ".000Z"
        fecha = fecha_raw.replace(' ', 'T') if fecha_raw else ''

        if uid not in current_users:
            cedula = str(u['cedula'] or '') if 'cedula' in u.keys() else ""
            
            wallet_val = 0.0
            if 'saldo' in u.keys() and u['saldo']:
                try: wallet_val = float(u['saldo'])
                except: pass
            elif 'wallet' in u.keys() and u['wallet']:
                try: wallet_val = float(u['wallet'])
                except: pass

            current_users[uid] = {
                "uid": uid,
                "email": str(u['correo'] or ''), 
                "displayName": str(u['nombre'] or ''), 
                "phone": str(u['whatsapp'] or ''),
                "cedula": cedula, 
                "role": rol_firebase, 
                "createdAt": fecha, 
                "walletBalance": wallet_val, 
                "totalSpent": 0
            }
            stats["usuarios_nuevos"] += 1

            # Extraemos la contraseña para exportarla al archivo CLI de Firebase Authentication
            pwd = u['password']
            if pwd and pwd.startswith("scrypt:32768:8:1$"):
                parts = pwd.split("$")
                if len(parts) == 3:
                    salt_raw = parts[1]
                    hash_hex = parts[2]
                    try:
                        hash_bytes = binascii.unhexlify(hash_hex)
                        hash_b64 = base64.b64encode(hash_bytes).decode('utf-8')
                        salt_b64 = base64.b64encode(salt_raw.encode('utf-8')).decode('utf-8')
                        
                        firebase_users_auth_list.append({
                            "localId": uid,
                            "email": str(u['correo'] or ''),
                            "displayName": str(u['nombre'] or ''),
                            "passwordHash": hash_b64,
                            "salt": salt_b64
                        })
                        stats["passwords_exportados"] += 1
                    except:
                        pass
        else:
            w_app = str(u['whatsapp'] or '')
            if w_app and ('phone' not in current_users[uid] or not current_users[uid]['phone']):
                current_users[uid]['phone'] = w_app
            if current_users[uid].get('role') in ['user', 'usuario']:
                current_users[uid]['role'] = rol_firebase

    # --- PEDIDOS ---
    cursor.execute("SELECT * FROM pedidos")
    for p in cursor.fetchall():
        order_id = str(p['id'])
        fb_order_key = f"AP-OLD-{order_id}"
        
        if fb_order_key in current_orders or f"RS-OLD-{order_id}" in current_orders or order_id in current_orders:
            continue

        status_raw = str(p['estado'] or '').lower().strip()
        status_mapped = 'pending'
        if status_raw in ['completado', 'completada', 'aprobado', 'exitoso', 'completed']: status_mapped = 'completed'
        elif status_raw in ['cancelado', 'cancelada', 'rechazado', 'rechazada', 'fallido', 'rejected']: status_mapped = 'rejected'
        elif status_raw in ['procesando', 'en proceso', 'processing']: status_mapped = 'processing'

        acc_id, acc_zone, acc_email, acc_pass = "", "", "", ""
        
        # Corrección: la columna en SQLite se llama datos_cliente (no detalles)
        datos_cliente_raw = p['datos_cliente'] if 'datos_cliente' in p.keys() else ''
        if datos_cliente_raw:
            try:
                detalles_json = json.loads(datos_cliente_raw)
                for key, val in detalles_json.items():
                    k_lower = str(key).lower()
                    v_str = str(val)
                    if 'id' in k_lower and 'zone' not in k_lower and 'zona' not in k_lower: acc_id = v_str
                    elif 'zone' in k_lower or 'zona' in k_lower or 'servidor' in k_lower: acc_zone = v_str
                    elif 'correo' in k_lower or 'email' in k_lower or 'usuario' in k_lower: acc_email = v_str
                    elif 'clave' in k_lower or 'contraseña' in k_lower or 'password' in k_lower: acc_pass = v_str
            except: pass

        old_paquete_id = p['producto_id']
        pkg_info = sqlite_product_map.get(old_paquete_id)
        
        # Corrección: la columna en SQLite se llama precio (no monto)
        precio_val = p['precio'] if 'precio' in p.keys() else 0.0
        final_price = float(precio_val) if precio_val else 0.0
        
        if pkg_info:
            final_product_id = pkg_info['firebase_product_id']
            final_package_name = pkg_info['package_label']
            final_cost = pkg_info['costUsd']
            if final_cost == 0 or final_cost > final_price:
                final_cost = final_price * 0.85
        else:
            final_product_id = "legacy"
            final_package_name = "Paquete Desconocido"
            final_cost = final_price * 0.85

        # Corrección: la columna en SQLite se llama fecha (no fecha_creacion)
        # y debe tener formato ISO 8601 estricto
        fecha_raw = str(p['fecha'] or '') if 'fecha' in p.keys() else ''
        if len(fecha_raw) == 16: fecha_raw += ":00.000Z"
        elif len(fecha_raw) == 19: fecha_raw += ".000Z"
        fecha_iso = fecha_raw.replace(' ', 'T') if fecha_raw else ''
        
        # Determinar el tipo de producto para el panel
        p_type = 'account' if (acc_email or acc_pass) else 'game-id'

        userId_str = f"uid-{p['usuario_id']}" if p['usuario_id'] else ''
        u_email = current_users[userId_str].get("email", "") if userId_str in current_users else ""
        u_phone = current_users[userId_str].get("whatsapp", "") if userId_str in current_users else ""
        
        precio_bs = float(p['precio_pagado']) if ('moneda_pago' in p.keys() and p['moneda_pago'] == 'VES' and 'precio_pagado' in p.keys() and p['precio_pagado']) else 0.0

        current_orders[fb_order_key] = {
            "id": fb_order_key,
            "userId": userId_str,
            "userName": current_users[userId_str].get("displayName", "") if userId_str in current_users else "",
            "userEmail": u_email,
            "userPhone": u_phone,
            "customerContact": str(p['whatsapp'] or '') if 'whatsapp' in p.keys() else u_phone,
            "productId": final_product_id,
            "productName": correct_prod_name if 'correct_prod_name' in locals() else final_package_name,
            "packageLabel": final_package_name,
            "productType": p_type,
            "gameId": acc_id,
            "priceUsd": final_price, 
            "priceBs": precio_bs,
            "costUsd": final_cost, 
            "status": status_mapped,
            "statusHistory": [{"status": status_mapped, "timestamp": fecha_iso}],
            "createdAt": fecha_iso,
            "updatedAt": fecha_iso,
            "accountId": acc_id,
            "accountZone": acc_zone,
            "accountEmail": acc_email,
            "accountPassword": acc_pass,
            "paymentMethodName": str(p['metodo_pago'] or '') if 'metodo_pago' in p.keys() else "Migración",
            "paymentCurrency": str(p['moneda_pago'] or '') if 'moneda_pago' in p.keys() else "USD",
            "reference": str(p['referencia'] or '') if 'referencia' in p.keys() else '',
            "apiData": {
                "result": str(p['api_resultado'] or '') if 'api_resultado' in p.keys() else '',
                "ref": str(p['api_referencia'] or '') if 'api_referencia' in p.keys() else ''
            }
        }
        stats["pedidos_nuevos"] += 1

    # --- CÓDIGOS DE DESCUENTO ---
    try:
        current_discount_codes = [str(d.get('code', '')).lower() for d in master_db['discounts']]
        cursor.execute("SELECT * FROM codigos_descuento")
        for d in cursor.fetchall():
            d_code = str(d['codigo'] or '')
            if not d_code or d_code.lower() in current_discount_codes: continue
            
            exp_raw = str(d['fecha_expiracion'] or '')
            if len(exp_raw) == 10: exp_raw += "T00:00:00.000Z"
            elif len(exp_raw) == 16: exp_raw += ":00.000Z"
            elif len(exp_raw) == 19: exp_raw += ".000Z"
            exp_iso = exp_raw.replace(' ', 'T') if exp_raw else ''
            
            master_db['discounts'].append({
                "id": f"discount-{d['id']}",
                "code": d_code,
                "type": str(d['tipo'] or 'fijo'),
                "value": float(d['valor']) if d['valor'] else 0.0,
                "maxUses": int(d['uso_maximo'] or 0) if d['uso_maximo'] else 0,
                "currentUses": int(d['usos'] or 0) if d['usos'] else 0,
                "expirationDate": exp_iso,
                "active": bool(d['activo'])
            })
            current_discount_codes.append(d_code.lower())
    except: pass

    # --- RECALCULAR TOTAL_SPENT ---
    spent_map = {}
    for o_val in current_orders.values():
        if o_val.get('status') in ['completed', 'completado'] and o_val.get('userId'):
            uid = str(o_val['userId'])
            spent_map[uid] = spent_map.get(uid, 0.0) + float(o_val.get('priceUsd', o_val.get('price', 0.0)))

    for uid, total in spent_map.items():
        if uid in current_users:
            current_users[uid]['totalSpent'] = total

    # 3. Guardar Resultado RTDB
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(master_db, f, ensure_ascii=False, indent=2)

    # 4. Guardar Archivo de Autenticación CLI (Si hubo usuarios nuevos)
    if firebase_users_auth_list:
        with open(AUTH_OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump({"users": firebase_users_auth_list}, f, ensure_ascii=False, indent=2)

    print("\n✅ MIGRACIÓN INCREMENTAL INTELIGENTE FINALIZADA CON ÉXITO")
    print(f"Usuarios agregados:  {stats['usuarios_nuevos']}")
    print(f"Contraseñas extraídas: {stats['passwords_exportados']} (Archivo {AUTH_OUTPUT_PATH})")
    print(f"Pedidos agregados:   {stats['pedidos_nuevos']}")
    print(f"Productos nuevos:    {stats['productos_nuevos']}")
    print(f"Categorías nuevas:   {stats['categorias_nuevas']}")
    print(f"Métodos de pago:     {stats['metodos_nuevos']}")
    print(f"\n📁 Sube '{OUTPUT_PATH}' a la base de datos (Firebase Console).")
    if stats['passwords_exportados'] > 0:
        print(f"🔑 Usa el archivo '{AUTH_OUTPUT_PATH}' con Firebase CLI para subir las contraseñas de los usuarios nuevos.")

if __name__ == "__main__":
    safe_migration()
