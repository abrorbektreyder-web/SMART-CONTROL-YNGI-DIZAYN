SMART CONTROL v4.0 — MIYYA (LOYIHA KONSTITUTSIYASI)
1. MIYYA NIMA UCHUN?

Bu hujjat:

loyihaning aqli

o‘zgarmas qonunlar to‘plami

qarorlar uchun yakuniy manba

👉 MIYYA bahs qilinmaydi. MIYYA o‘zgartirilmaydi.

2. ASOSIY MAQSAD

Kichik va o‘rta savdo nuqtalari uchun:

o‘g‘irlikni imkonsiz qiladigan

offline ishlaydigan

ownerga to‘liq nazorat beradigan
Anti-Fraud POS tizimi yaratish

3. OLTIN QOIDALAR (BUZISH TAQIQLANADI)
3.1. DELETE IS DEAD

Bazadan hech narsa o‘chirilmaydi

Faqat status o‘zgaradi
(ACTIVE → VOIDED / BLOCKED / CLOSED)

❌ DELETE ishlatilsa — bu xato

3.2. SERVER AUTHORITY

Barcha:

role

ruxsat

tekshiruv
faqat backendda

Frontendga ishonilmaydi

Frontend:

faqat ko‘rsatadi

qaror qabul qilmaydi

3.3. ROLE — QONUN

Har bir foydalanuvchi bitta role ga ega

Role aralashmaydi

Rolelar:

OWNER

CASHIER

ACCOUNTANT

❌ Kassir owner ishini qilsa — xato
❌ Owner kassir interfeysida ishlasa — xato

3.4. OFFLINE ≠ ERKINLIK

Offline — bu imtiyoz emas

Offline — bu cheklov

Offline holatda:

xavfli amallar yopiladi

nazorat kuchayadi

3.5. SARIQ SAVAT — MAJBURIY

Bekor qilingan har bir amal:

yashirilmaydi

sariq savatga tushadi

Owner har doim xabardor bo‘ladi

4. FRONTEND QOIDALARI

Frontend:

backendga bo‘ysunadi

o‘zi logika o‘ylab topmaydi

Role bo‘yicha:

alohida oynalar

alohida ruxsatlar

❌ Bitta universal UI — taqiqlanadi

5. BACKEND QOIDALARI

Backend:

yakuniy haqiqat manbai

barcha tekshiruv shu yerda

Frontend xato qilsa ham:

backend xatoni to‘xtatishi shart

6. DATABASE QOIDALARI

Har bir o‘zgarish:

auditda qoladi

Tarix:

yo‘qolmaydi

Bahs bo‘lsa:

DB haqiqat

7. AGENT / DASTURCHI QOIDALARI

❌ O‘zingcha qo‘shimcha qilish mumkin emas

❌ “Yaxshilab qo‘ydim” degan bahona yo‘q

❌ MIYYA ga zid ish qilinmaydi

✅ Faqat TASKS.md bo‘yicha ishlanadi

Agar taskda yo‘q bo‘lsa:
👉 qilinmaydi

8. MIYYA VA TASK ALOQASI

MIYYA.md — qonun

TASKS.md — ish rejasi

TASK:

MIYYA ga zid bo‘la olmaydi
Agar zid bo‘lsa:

TASK bekor qilinadi

9. YAKUNIY QOIDA (LOCK)

Bu loyiha:

tez emas

chiroyli emas

lekin xavfsiz va nazoratli

Avval nazorat.
Keyin qulaylik.
Hech qachon teskarisi emas.