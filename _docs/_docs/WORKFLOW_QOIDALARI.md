WORKFLOW_QOIDALARI.md

Vibe Coding: Git Ishlash Qoidalari
1. Asosiy Qoida: “Main”ni Asrab Avaylang!

“Main” branch — bu sizning ilovangizning ishlaydigan “Oltin Nusxasi”. Unga to‘g‘ridan-to‘g‘ri o‘zgartirish kiritmang.

2. Yangi Ish = Yangi Branch

Har qanday yangilik (yangi funksiya, xatoni to‘g‘rilash, eksperiment) uchun yangi branch oching.

Buyruq: git checkout -b <branch-nomi>

Masalan: git checkout -b yangi-dizayn

3. Erkin Eksperiment Qiling

Yangi branchda xohlagan narsangizni qiling. Buzilib qolsa ham qo‘rqinchli emas, chunki “Main” butun turibdi.

4. Muvaffaqiyatsizlik? O‘chiring!

Agar yangi g‘oya o‘xshamasa yoki AI adashib qolsa:

“Main”ga qayting: git checkout main

Branchni o‘chirib tashlang: git branch -D <branch-nomi>

5. Muvaffaqiyat? Birlashtiring (Merge)!

Agar hammasi zo‘r ishlasa:

“Main”ga qayting: git checkout main

Yangilikni qo‘shing: git merge <branch-nomi>
