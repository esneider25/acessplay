import sqlite3
import json
import base64
import binascii

db_path = r'C:\Users\IK\Documents\accesplay.db'

def run_migration():
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # ... (other mappings skipped here, just user export fix)
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

            pwd = u['password']
            if pwd and pwd.startswith("scrypt:32768:8:1$"):
                parts = pwd.split("$")
                if len(parts) == 3:
                    salt_raw = parts[1]
                    hash_hex = parts[2]
                    
                    # Convert hash from hex to base64
                    try:
                        hash_bytes = binascii.unhexlify(hash_hex)
                        hash_b64 = base64.b64encode(hash_bytes).decode('utf-8')
                    except:
                        continue
                        
                    # Convert salt from utf8 to base64
                    salt_b64 = base64.b64encode(salt_raw.encode('utf-8')).decode('utf-8')

                    firebase_users_list.append({
                        "localId": uid,
                        "email": u['correo'],
                        "displayName": u['nombre'],
                        "passwordHash": hash_b64,
                        "salt": salt_b64
                    })

        with open("users_cli.json", "w", encoding="utf-8") as f:
            json.dump({"users": firebase_users_list}, f, ensure_ascii=False, indent=2)

        with open("users_rtdb.json", "w", encoding="utf-8") as f:
            json.dump({"users": rtdb_users}, f, ensure_ascii=False, indent=2)

        print("Users extracted correctly for CLI import.")

    except Exception as e:
        print(f"Error during migration: {e}")

run_migration()
