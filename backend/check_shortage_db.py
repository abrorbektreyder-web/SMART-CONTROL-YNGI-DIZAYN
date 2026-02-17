import psycopg2

try:
    conn = psycopg2.connect('postgresql://postgres:postgres123@localhost/smart_control_dev')
    cursor = conn.cursor()
    
    print("=" * 70)
    print("📊 YANGI SHIFT VA SHORTAGE ITEMS TEKSHIRUVI")
    print("=" * 70)
    
    # Get latest shift
    print("\n1️⃣ SO'NGGI SHIFT:")
    print("-" * 70)
    cursor.execute("""
        SELECT id, user_id, start_cash, end_cash, status, start_time, end_time
        FROM shifts
        ORDER BY id DESC
        LIMIT 1
    """)
    
    shift = cursor.fetchone()
    if shift:
        print(f"Shift ID: {shift[0]}")
        print(f"User ID: {shift[1]}")
        print(f"Start Cash: {float(shift[2]):,.0f} UZS")
        print(f"End Cash: {float(shift[3]):,.0f} UZS")
        print(f"Status: {shift[4]}")
        print(f"Opened: {shift[5]}")
        print(f"Closed: {shift[6]}")
        
        shift_id = shift[0]
        
        # Get shortage items for this shift
        print(f"\n2️⃣ YETMAGAN MAHSULOTLAR (Shift #{shift_id}):")
        print("-" * 70)
        cursor.execute("""
            SELECT id, product_name, barcode, price, quantity, notes, created_at
            FROM shortage_items
            WHERE shift_id = %s
            ORDER BY id
        """, (shift_id,))
        
        shortage_items = cursor.fetchall()
        if shortage_items:
            for item in shortage_items:
                print(f"\n📦 Mahsulot ID: {item[0]}")
                print(f"   Nomi: {item[1]}")
                print(f"   Shtrix-kod: {item[2] or 'N/A'}")
                print(f"   Narx: {float(item[3]):,.0f} UZS")
                print(f"   Miqdor: {item[4]}")
                print(f"   Izoh: {item[5] or '-'}")
                print(f"   Yaratilgan: {item[6]}")
            
            print(f"\n✅ JAMI: {len(shortage_items)} ta mahsulot")
        else:
            print("   ❌ Yetmagan mahsulotlar topilmadi")
    
    # Get latest debt
    print("\n\n3️⃣ SO'NGGI KAMOMAD QARZ:")
    print("-" * 70)
    cursor.execute("""
        SELECT id, customer_name, original_amount, remaining_amount, status, created_at
        FROM debts
        ORDER BY id DESC
        LIMIT 1
    """)
    
    debt = cursor.fetchone()
    if debt:
        print(f"Qarz ID: {debt[0]}")
        print(f"Nomi: {debt[1]}")
        print(f"Jami qarz: {float(debt[2]):,.0f} UZS")
        print(f"Qolgan: {float(debt[3]):,.0f} UZS")
        print(f"Status: {debt[4]}")
        print(f"Yaratilgan: {debt[5]}")
    
    conn.close()
    
    print("\n" + "=" * 70)
    print("✅ DATABASE TEKSHIRUVI YAKUNLANDI")
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Error: {e}")
