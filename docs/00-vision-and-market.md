# 00 — Vizyon va bozor

> Bu hujjat qisqa, chunki halol javob qisqa.

---

## 1. Nexus nima

Frilanser bozori: mijoz loyiha e'lon qiladi → frilanserlar va agentliklar
taklif (bid) yuboradi → shartnoma tuziladi → ish **milestone**'larga bo'linadi
→ har milestone uchun pul **escrow**'ga qo'yiladi → ish topshiriladi va qabul
qilinadi → pul bo'shatiladi. Kelishmovchilik bo'lsa — **nizо (dispute)**
admin panelida hal qilinadi.

| | |
|---|---|
| Backend | NestJS + TypeORM + PostgreSQL — **9 633** qator |
| Frontend | Next.js (app router) — **56** `.tsx` |
| Modullar | **15** · Entitylar **25** |
| Commit | **25** · **Testlar: 0** |
| Deploy | Vercel (frontend) + Render (backend) |

---

## 2. ⚠️ Bu biznes rejasi emas — va shuni boshdan aytamiz

**Nexus — texnik mahorat namoyishi. Biznes emas.**

Bu — kamchilikni tan olish emas, **maqsadni aniq aytish**. Farqi katta.

### Nega bu domen tanlangan

Escrow'li marketplace — **texnik jihatdan zich domen**:

- **Escrow** — pul bilan bog'liq holat mashinasi. Uni to'g'ri yozish
  poyga holati, atomiklik va aniq arifmetikani talab qiladi
  ([03-money-and-escrow](./03-money-and-escrow.md))
- **Uch tomonli munosabat** — mijoz, frilanser, platforma. Har birining
  o'z manfaati, va ular **zid**
- **Nizо** — tizim ikki tomon kelishmaganda nima qiladi
- **Rol modeli** — client, freelancer, agency, admin. Agency esa jamoa
  sifatida bid yuboradi, ya'ni rol ichida rol

Bularning hammasi **CRUD emas**. Aynan shuning uchun bu loyiha qiziq.

### Nega bu biznes bo'lolmaydi (solo)

**Ikki tomonlama bozor** — startup modellarining eng qiyini:

```
Mijoz yo'q  →  frilanser kelmaydi  →  mijoz kelmaydi  →  ...
```

Bu — tovuq va tuxum muammosi, va u **kod bilan hal qilinmaydi**. Uni hal
qilish uchun uchtadan biri kerak:
- **Pul** — bir tomonni subsidiya qilish (Uber haydovchilarga to'lagandek)
- **Mavjud auditoriya** — allaqachon qo'lda ikki tomon bo'lishi
- **Juda tor nisha** — shunchalik torki, likvidlik kichik sonda yetadi

Sarvarbekda uchtasi ham yo'q. Raqiblar: **Upwork, Fiverr, Freelancer.com** —
o'n yillar va yuz millionlab dollar likvidlik qurishga sarflagan.

⚠️ **Shuning uchun bu TZ "Upwork'ni yengamiz" deb yozmaydi.** Bunday da'vo
ish beruvchiga **kuchsizlik** ko'rsatadi — u bozorni tushunmaydigan yosh
dasturchini ko'p ko'rgan.

**Halollik kuchliroq:** *"Men bu domenni tanladim, chunki unda escrow, nizо,
ko'p tomonli tranzaksiya va rol modeli bor — bular texnik jihatdan qiziq.
Bozor tomonini solo hal qilib bo'lmaydi va men buni bilaman."*

Bu — o'z ishining chegarasini biladigan muhandisning gapi.

---

## 3. Bozor — nima bilamiz va nima bilmaymiz

| | |
|---|---|
| **Global raqiblar** | Upwork, Fiverr, Freelancer.com, Toptal (premium nisha) |
| **O'zbekistonda mahalliy platforma bormi?** | ⚠️ **TEKSHIRILMAGAN — ochiq savol** |
| **Bozor hajmi** | ⚠️ **NOMA'LUM.** To'qib chiqarilmadi |

⚠️ **Bu jadvaldagi bo'shliqlar ataylab bo'sh.** Raqam yozish oson bo'lardi
va u yolg'on bo'lardi. Tekshirilmagan narsa — ochiq savol, taxmin emas.

### Agar kimdir baribir bozorni sinamoqchi bo'lsa

Yagona ishonchli yo'l — **nishani shunchalik toraytirish**ki, likvidlik
kichik sonda yetsin. Masalan: bitta shahar, bitta kasb, yoki bitta hamjamiyat
ichida. Umumiy marketplace emas.

Bu — TZ ning tavsiyasi **emas**. Bu — agar savol tug'ilsa, javob.

---

## 4. Loyihada nima yaxshi qilingan

⚠️ Halol TZ faqat tanqid qilmaydi. O'lchangan kuchli tomonlar:

| | |
|---|---|
| **Pul `numeric(10,2)`** | Float **yo'q**. Baza to'g'ri tanlangan — ko'p loyiha buni buzadi |
| **JWT Bearer header** | Cookie emas → **CSRF yuzasi yo'q** |
| **Tranzaksiya ishlatilgan** | `queryRunner` + rollback. Ko'p yosh loyihada bu umuman yo'q |
| **15 modul toza ajratilgan** | Domen chegaralari mantiqiy |
| **Next.js app router** | Zamonaviy, to'g'ri tanlov |
| **`payments` jurnali** | Har harakat yoziladi (`ESCROW_DEPOSIT`, `PLATFORM_FEE`, `REFUND`) |

---

## 5. Loyihada nima buzuq

| Fakt | Hujjat |
|---|---|
| **Migratsiya umuman yo'q** — repodan production sxemasini qurib bo'lmaydi | [02](./02-architecture.md), [07](./07-roadmap.md) |
| **Testlar 0** — escrow holat mashinasi testsiz | [06](./06-testing.md) |
| **19 endpointdan 8 tasida validatsiya yo'q** — `@Body()` inline tip | [05](./05-security.md) |
| **`amount: number` runtime'da yolg'on** — TypeORM `decimal` ni string qaytaradi | [03](./03-money-and-escrow.md), [04](./04-data-model.md) |
| Escrow poygasi va komissiya bagi | ✅ **tuzatildi** (`d412913`) — [03](./03-money-and-escrow.md) |
| `origin: '*'` CORS | ✅ **tuzatildi** (`d412913`) |

---

## 6. Bu loyiha ish beruvchiga nima ko'rsatadi

Agar TZ dagi ish bajarilsa:

1. **Domenni tushunish** — escrow'ni to'g'ri modellashtirish CRUD emas
2. **Pul bilan ishlash intizomi** — aniq arifmetika, atomik o'tishlar,
   invariantlar
3. **Poyga holatini ko'ra olish** — check-then-act bagi
   ([03](./03-money-and-escrow.md) §4) klassik va ko'pchilik uni ko'rmaydi
4. **O'z ishini tanqid qila olish** — bu TZ ning o'zi shuning dalili
5. **Chegarani bilish** — "bu biznes emas" deb ayta olish

⚠️ **5-band 1–4 dan kam emas.** Texnik mahorat ko'p, o'z chegarasini
biladigan odam kam.

---

## 7. Ochiq savollar

| # | Savol |
|---|---|
| S1 | O'zbekistonda mahalliy frilanser platformasi bormi? Tekshirilmagan |
| S2 | Agar nisha tanlansa — qaysi? (Bu **mahsulot** qarori, texnik emas) |
| S3 | Real to'lov provayderi qo'shiladimi? Agar yo'q — escrow **abadiy soxta** qoladi, va bu **yomon emas**: portfolio uchun domen mantiqi muhim, pul emas |
| S4 | Bu loyiha davom etadimi yoki portfolio eksponati bo'lib qoladimi? Javob TZ ning qamrovini belgilaydi |

---

## 8. Bu TZ hal qila olmaydigan narsa

**Bozor.** Likvidlik, sotuv, birinchi mijoz — bularning hech biri kodda yo'q.

TZ **muhandislik** hujjati. U Nexus'ni **texnik jihatdan ideal** qila oladi —
va bu, portfolio maqsadi uchun, **yetarli**.
