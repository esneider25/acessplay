import sqlite3

p = r'C:\Users\IK\Documents\accesplay.db'
conn = sqlite3.connect(p)
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute("PRAGMA table_info(pedidos)")
print([row['name'] for row in c.fetchall()])
