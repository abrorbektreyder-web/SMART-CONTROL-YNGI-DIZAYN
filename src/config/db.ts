import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// DATABASE_URL mavjud bo'lsa (Render, Supabase, Neon) - uni ishlatamiz
// Aks holda alohida variable'lardan foydalanamiz (lokal development)
const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  : new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined,
  });

// Xavfsizlik qatlami: DELETE so'rovini bloklaydi
export const query = async (text: string, params?: any[]) => {
  if (text.trim().toUpperCase().startsWith('DELETE')) {
    throw new Error('XAVFSIZLIK: Tizimda DELETE operatsiyasi taqiqlangan!');
  }
  return pool.query(text, params);
};

// =============================================
// AVTOMATIK JADVAL YARATISH
// =============================================
export const initDatabase = async () => {
  try {
    // 1. USERS jadvali
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'cashier',
        is_blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ users jadvali tayyor');

    // 2. AUDIT_LOGS jadvali
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100),
        record_id VARCHAR(100),
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ audit_logs jadvali tayyor');

    // 3. Admin foydalanuvchisini QAYTA yaratish (eski hashni yangilash uchun)
    // TARTIB MUHIM: Foreign key xatosini oldini olish uchun

    // 1. Avval admin bilan bog'liq audit loglarini o'chiramiz
    await pool.query(`DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE username = 'admin')`);

    // 2. Keyin adminni o'chiramiz
    await pool.query(`DELETE FROM users WHERE username = 'admin'`);

    // 3. Yangi admin yaratamiz - kuchli parol bilan
    const hashedPassword = bcrypt.hashSync('SmartControl_2026!', 10);
    await pool.query(`
      INSERT INTO users (username, password, phone, role)
      VALUES ($1, $2, $3, $4)
    `, ['admin', hashedPassword, '+998901234567', 'owner']);
    console.log('✅ Admin foydalanuvchi yaratildi (login: admin, parol: SmartControl_2026!)');

    console.log('🚀 Baza muvaffaqiyatli ishga tushirildi!');
  } catch (error) {
    console.error('❌ Bazani ishga tushirishda xatolik:', error);
  }
};

export default pool;
