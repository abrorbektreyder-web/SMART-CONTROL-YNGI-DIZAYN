import psycopg2

try:
    conn = psycopg2.connect('postgresql://postgres:postgres123@localhost/smart_control_dev')
    cursor = conn.cursor()
    
    print("📊 KAMOMAD QARZLARI (Debts):")
    print("="*60)
    
    cursor.execute("""
        SELECT id, customer_name, original_amount, remaining_amount, status, created_at
        FROM debts 
        WHERE customer_name LIKE %s
        ORDER BY id DESC
    """, ('%KASSIR%',))
    
    debts = cursor.fetchall()
    
    if debts:
        for d in debts:
            print(f"ID: {d[0]}")
            print(f"  Nomi: {d[1]}")
            print(f"  Jami qarz: {float(d[2]):,.0f} UZS")
            print(f"  Qolgan: {float(d[3]):,.0f} UZS")
            print(f"  Status: {d[4]}")
            print(f"  Yaratilgan: {d[5]}")
            print("-" * 60)
    else:
        print("  ❌ Kamomad qarzlari topilmadi")
    
    # Get total count
    cursor.execute("SELECT COUNT(*) FROM debts WHERE customer_name LIKE %s", ('%KASSIR%',))
    count = cursor.fetchone()[0]
    print(f"\n✅ JAMI KAMOMAD YOZUVLARI: {count}")
    
    # Get all shifts
    print("\n\n📊 SO'NGGI SHIFTS:")
    print("="*60)
    cursor.execute("""
        SELECT id, user_id, start_cash, end_cash, status, start_time, end_time
        FROM shifts
        ORDER BY id DESC
        LIMIT 5 
    """)
    
    shifts = cursor.fetchall()
    for s in shifts:
        end_cash = f"{float(s[3]):,.0f}" if s[3] else "N/A"
        print(f"Shift ID: {s[0]} | User: {s[1]} | Start: {float(s[2]):,.0f} | End: {end_cash} | Status: {s[4]}")
    
    conn.close()
    print("\n✅ Test completed successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
