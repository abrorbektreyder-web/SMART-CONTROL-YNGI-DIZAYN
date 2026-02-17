# JORIY HOLAT
- Backend: Tayyor (Block/Unblock API bor).
- Frontend: Hali API ga ulanmagan.
- Auth: Login qilish va Token olish kerak.

# NAVBATDAGI VAZIFA (PRIORITY 1: FRONTEND INTEGRATION)

**Maqsad:** Frontenddagi "Login" va "Users" oynasini real Backendga ulash.

**1. Login (Kirish) Integratsiyasi:**
- `frontend/login.html` (yoki mos fayl) dagi formani `POST /auth/login` ga ulang.
- Javobdan kelgan `access_token` ni `localStorage` ga saqlang.
- Javobdan kelgan `role` ni tekshiring:
  - Agar `role` yo'q bo'lsa yoki xato bo'lsa -> Kirish taqiqlansin.

**2. Xavfsizlik (Security Check):**
- Har bir sahifa yuklanganda (`app.js` boshida) token borligini tekshirish.
- Agar token yo'q bo'lsa -> Login sahifasiga haydash (`window.location.href`).

**3. Admin Panel (Users):**
- Foydalanuvchilar ro'yxatini backenddan (`GET /auth/users`) olib chiqish.
- Har bir foydalanuvchi yoniga "Block" tugmasini qo'yish.
- Tugma bosilganda `PATCH /block` API sini chaqirish.