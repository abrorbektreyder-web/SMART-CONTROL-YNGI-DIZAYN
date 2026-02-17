SMART CONTROL v4.0 — FRONTEND ROLE-BASED INTEGRATION TASK
UMUMIY QOIDA (MAJBURIY)

❌ Backend kodiga tegilmaydi

❌ Database strukturasiga tegilmaydi

❌ Yangi feature o‘ylab topilmaydi

✅ Faqat mavjud backend imkoniyatlari frontendga to‘g‘ri ulanadi

❌ “O‘zingcha yaxshilash” qat’iyan taqiqlanadi

- [x] →TASK 1 — LOGIN FLOW NI TO‘G‘RILASH
MAQSAD

Login faqat backend orqali amalga oshsin va role to‘g‘ri aniqlansin.

QILINADI

Login faqat shu endpoint orqali:

POST /auth/login


Javobdan quyidagilar olinadi:

access_token

role

redirect_url

access_token → localStorage ga yoziladi

role → localStorage ga yoziladi

TEKSHIRUV

Agar login/parol noto‘g‘ri bo‘lsa → backend xabari ko‘rsatiladi

Agar token kelmasa → login bekor qilinadi

❌ Agar frontend o‘zi rol o‘ylab topsa → XATO

- [x] →TASK 2 — GLOBAL AUTH CHECK (HAR SAHIFA UCHUN)
MAQSAD

Ruxsatsiz sahifa ochilishini to‘xtatish.

QILINADI

Har bir sahifa (owner, kassir, accountant) yuklanganda:

localStorage dan:

access_token

role
olinadi

Agar token yo‘q bo‘lsa:

Login sahifaga qaytariladi

❌ Token bo‘lmasa sahifa ochilishi → XATO

- [x] →TASK 3 — ROLE BO‘YICHA SAHIFA AJRATISH (ENG MUHIM)
MAQSAD

Owner / Kassir / Buhgalter aralashib ketmasligi.

QILINADI

Login’dan keyin:

Agar role === OWNER

faqat owner oynasi ochiladi

Agar role === CASHIER

faqat kassir oynasi ochiladi

Agar role === ACCOUNTANT

faqat buhgalter oynasi ochiladi

TAQIQLANADI

Owner kassir sahifasida ishlashi

Kassir owner panelini ko‘rishi

Bitta sahifada hamma rol aralashishi

❌ Role mos kelmasa sahifa ochilishi → XATO

- [X] →TASK 4 — OWNER OYNASI (FAQAT KO‘RISH + BOSHQARUV)
OWNER KO‘RA OLADI

Mahsulotlar (to‘liq)

Ombor qoldig‘i (real)

Kassirlar ro‘yxati

Block / Unblock

Sariq savat statistikasi

Kamomadlar

Hisobotlar

OWNER QILA OLADI

User bloklash

Narx / tannarx tahriri

❌ Owner kassir savdosini qilsa → XATO

- [X] →TASK 5 — KASSIR OYNASI (FAQAT SAVDO)
KASSIR KO‘RA OLADI

Mahsulot nomi

Sotuv narxi

Savat

Nasiya

KASSIR KO‘RA OLMAYDI

Ombor qoldig‘i

Tannarx

Foyda

Hisobotlar

User boshqaruvi

❌ Kassir stock yoki tannarx ko‘rsa → XATO

- [X] →TASK 6 — BUHGALTER OYNASI (READ-ONLY)
BUHGALTER QILA OLADI

Hisobot ko‘rish

PDF / Excel export

BUHGALTER QILA OLMAYDI

Savdo qilish

Narx o‘zgartirish

User boshqarish

❌ Tahrirlash imkoniyati bo‘lsa → XATO

- [X] →TASK 7 — ERROR VA DIAGNOSTIKA (MAJBURIY)
HAR BIR XATO HOLATDA:

Console’da aniq xato chiqishi kerak

UI’da tushunarli xabar chiqishi kerak

Masalan:

“Ruxsat yo‘q”

“Role mos emas”

“Login talab qilinadi”

❌ Jim ishlamay qolish → XATO

TASK YAKUNI (CHECKLIST)

 Login faqat backend orqali

 Token va role saqlanadi

 Sahifalar role bo‘yicha ajratilgan

 Owner / Kassir / Buhgalter aralashmagan

 Ruxsatsiz kirish yopilgan

 Xatolar ko‘rinadi

MUHIM ESLATMA

Bu task:

faqat mavjud tizimni to‘g‘rilash

hech qanday yangi biznes logika qo‘shilmaydi

faqat chalkashlikni yo‘qotish uchun
