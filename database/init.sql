-- =============================================
-- SMART CONTROL - Baza jadvallarini yaratish
-- =============================================

-- 1. USERS jadvali (Foydalanuvchilar)
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

-- 2. AUDIT_LOGS jadvali (Tizim loglari)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Boshlang'ich foydalanuvchilarni qo'shish
-- =============================================

-- Owner (Paroli: admin123)
INSERT INTO users (id, username, password, phone, role)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.Sj4mTdBvKjtW6lNpA0/Y9Ew6vKC1wHm',
    '+998901234567',
    'owner'
) ON CONFLICT (username) DO NOTHING;

-- Kassir (Paroli: kassir123)
INSERT INTO users (id, username, password, phone, role)
VALUES (
    gen_random_uuid(),
    'kassir',
    '$2a$10$wZt9YPHvKr9xFYTMZVZTZOKXQHH8BXMlU.HGtM8aBMGWmT9mvQ6zy',
    '+998901234568',
    'cashier'
) ON CONFLICT (username) DO NOTHING;

-- Buxgalter (Paroli: buxgalter123)
INSERT INTO users (id, username, password, phone, role)
VALUES (
    gen_random_uuid(),
    'buxgalter',
    '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yLrdE5vfqa',
    '+998901234569',
    'accountant'
) ON CONFLICT (username) DO NOTHING;
