\# SMART CONTROL v4.0 — TEXNIK KONSTITUTSIYA



\## 1. LOYIHA PASPORTI

\- \*\*Maqsad:\*\* Anti-Fraud POS tizimi (O'g'rilikka qarshi).

\- \*\*Backend:\*\* Python (FastAPI).

\- \*\*Database:\*\* PostgreSQL (Prisma yoki SQLModel).

\- \*\*Frontend:\*\* HTML/JS Dashboard (Backendga ulanishi kerak).

\- \*\*Muhim:\*\* Loyiha noldan yozilmayapti! Mavjud `backend/app` kodi asosida davom ettiriladi.



\## 2. OLTIN QOIDALAR (BUZISH TAQIQLANADI)

1\.  \*\*DELETE is Dead:\*\* Bazadan hech qanday ma'lumot o'chirilmaydi. Faqat `status` o'zgaradi (Active -> Voided/Blocked).

2\.  \*\*Server Authority:\*\* Barcha huquqlar (Role) va tekshiruvlar (Validation) faqat Backendda bo'ladi. Frontendga ishonilmaydi.

3\.  \*\*Sariq Savat:\*\* Bekor qilingan har bir chek 'YELLOW\_BASKET' statusiga tushadi va egasiga xabar ketadi.



\## 3. ROLLLAR VA XAVFSIZLIK

\- \*\*OWNER:\*\* Mutloq huquq. Xodimlarni bloklay oladi.

\- \*\*ACCOUNTANT:\*\* Faqat ko'rish (Read-only) va Export.

\- \*\*CASHIER:\*\* Faqat Savdo va Void. Hisobot ko'ra olmaydi.

\- \*\*BLOCK:\*\* Agar `is\_blocked=True` bo'lsa, foydalanuvchi tizimga kira olmasligi shart.

