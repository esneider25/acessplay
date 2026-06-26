import sqlite3

db_path = r'C:\Users\IK\Downloads\accesplay.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

c.execute("SELECT id, producto FROM pedidos ORDER BY id DESC LIMIT 5")
print("Recent orders:")
for row in c.fetchall():
    print(dict(row))

c.execute("SELECT id, nombre, servicio_id FROM productos LIMIT 5")
print("\nProducts:")
for row in c.fetchall():
    print(dict(row))
