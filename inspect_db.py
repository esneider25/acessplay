import sqlite3

db_path = r'C:\Users\IK\Documents\accesplay.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print("=== TABLES ===")
    for table in tables:
        table_name = table[0]
        print(f"\n--- Table: {table_name} ---")
        
        # Get schema
        cursor.execute(f"PRAGMA table_info('{table_name}')")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
            
        # Get sample data
        try:
            cursor.execute(f"SELECT * FROM '{table_name}' LIMIT 3")
            rows = cursor.fetchall()
            print("  Sample Data:")
            for row in rows:
                print(f"    {row}")
        except Exception as e:
            print(f"  Could not read data: {e}")
            
    conn.close()
except Exception as e:
    print(f"Error accessing DB: {e}")
