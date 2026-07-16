# 07 — Yo'l xaritasi

> Bog'liqlik bo'yicha tartiblangan, muhimlik bo'yicha emas.

---

## 0. Nega tartib shunday

```
Migratsiya tizimi yo'q
  └─> sxemani kod bilan o'zgartirib bo'lmaydi
        ├─> CHECK constraint qo'shib bo'lmaydi        (invariantlar)
        ├─> indeks qo'shib bo'lmaydi                  (performans)
        └─> test bazasi production sxemasini isbotlamaydi
              └─> escrow refactoringini hech narsa ushlamaydi
```

Loyihaning eng qimmatli ishi — escrow invariantlarini majburlash — **uch
qadam narida**. Uni birinchi qilishga urinish: `synchronize: true` bilan
qurilgan test bazasida yashil test olish, va u **production haqida hech
narsa aytmaydi**.

**Har bosqichda:** nima qilinadi · nima to'sib turibdi · **tugaganini qanday
bilamiz**.

---

## 1. Bosqich 0 — Sxemani boshqariladigan qilish

### 0.1. Migratsiya tizimi — hamma narsaning old sharti

**Muammo** ([02-architecture](./02-architecture.md), [04-data-model](./04-data-model.md)):

```bash
find backend/src -ipath "*migration*" -name "*.ts" | wc -l   # → 0
grep -n "synchronize" backend/src/config/database.config.ts
# → synchronize: process.env.NODE_ENV !== 'production'
grep -n "migrations" backend/src/config/database.config.ts
# → migrations: [__dirname + '/../database/migrations/*{.ts,.js}']
```

Config migratsiya katalogiga ishora qiladi. **Katalog mavjud emas.**
Productionda `synchronize: false`, migratsiya 0 ta.

**Oqibat:** dev'da TypeORM sxemani **jimgina** o'zgartiradi (entity
o'zgarsa — ustun qo'shiladi/o'chiriladi, ogohlantirishsiz). Productionda
**hech narsa** bo'lmaydi. Ikki muhit hech qachon kafolatlangan tarzda mos
kelmaydi, va **repodan production sxemasini qurishning iloji yo'q**.

⚠️ `synchronize: true` — bu shunchaki qulaylik emas, **ma'lumot yo'qotish
xavfi**: entity'dan maydon olib tashlansa, TypeORM ustunni **o'chiradi**.
Dev'da bu "qayta seed qilaman", productionda bu falokat — va aynan shuning
uchun u productionda o'chirilgan. Lekin o'rniga hech narsa qo'yilmagan.

**Nima to'sib turibdi:** hech narsa. Bu birinchi.

**Nima qilinadi:**
1. `typeorm migration:generate` — mavjud entitylardan **boshlang'ich**
   migratsiya
2. **Toza bazada sinash:** `migration:run` → ilova ko'tariladi → smoke test
3. ⚠️ **Production bazasi bilan solishtirish.** U `synchronize` bilan
   qurilgan, ya'ni generatsiya qilingan migratsiya unga **mos kelmasligi
   mumkin**. `migration:show` va qo'lda diff. Bu — eng nozik qadam
4. `synchronize` ni **dev'da ham o'chirish** — aks holda drift qaytadi
5. CI: har commitda `migration:generate` **bo'sh** natija bersin (drift yo'q)

**Tugaganini qanday bilamiz:**
```bash
docker run -d postgres:15
npm run migration:run     # xatosiz
npm run start             # ko'tariladi
npm run migration:generate -- -n Check   # → "No changes in database schema"
```

⚠️ **Ochiq savol:** production sxemasi hozir **aynan qanday**? U
`synchronize` bilan qurilgan, ya'ni tarixi yo'q. Bu **o'lchov** talab
qiladi, faraz emas.

### 0.2. Balans invariantlari — `CHECK` constraint

**Nima to'sib turibdi:** 0.1.

```sql
ALTER TABLE "users" ADD CONSTRAINT "wallet_non_negative" CHECK ("walletBalance" >= 0);
ALTER TABLE "users" ADD CONSTRAINT "escrow_non_negative" CHECK ("escrowBalance" >= 0);
```

⚠️ **Avval o'lchov** ([03-money-and-escrow](./03-money-and-escrow.md) §8):
```sql
SELECT id, "walletBalance", "escrowBalance" FROM "users"
 WHERE "walletBalance" < 0 OR "escrowBalance" < 0;
```
**Agar qator qaytsa — bu migratsiya emas, hodisa.** Tuzatilgan poyga
(`d412913`) allaqachon ishlagan degani.

**Nega bu qimmat:** `CHECK` — **ikkinchi mudofaa chizig'i**. Kod xato qilsa,
baza tranzaksiyani yiqitadi. Escrow uchun bu arzon va kuchli.

---

## 2. Bosqich 1 — Escrow'ni himoyalash

### 1.1. Testcontainers + escrow invariantlari

**Nima to'sib turibdi:** 0.1 (aks holda test bazasi production sxemasi emas).

To'liq kod — [06-testing](./06-testing.md). Bu yerda **nega birinchi**:

Escrow — **holat mashinasi** (`funded → submitted → approved/rejected →
released/refunded`). Testsiz uni o'zgartirib bo'lmaydi. Va TZ ning qolgan
qismi aynan uni o'zgartirishni talab qiladi.

**Uchta invariant:**
| | |
|---|---|
| `walletBalance >= 0` **har doim** | Tuzatilgan poyganing regression testi: parallel `fundMilestone` × 2 → bittasi yiqilsin |
| `fee + net === amount` **har doim** | Property test (fast-check), tasodifiy `amount` × `feePercent` |
| `SUM(wallet) + SUM(escrow)` o'zgarmas | Tizim yopiq: pul ko'chadi, yaratilmaydi |

**Tugaganini qanday bilamiz:** uchala test yashil, va poyga testi
**tuzatishdan oldingi kodda qizil** (aks holda u hech narsani sinamayapti).

### 1.2. Qolgan float yo'llarini tuzatish

**Nima to'sib turibdi:** 1.1.

[03-money-and-escrow](./03-money-and-escrow.md) §6:

| Joy | Ustuvorlik |
|---|---|
| `milestones.service.ts:183` — `rejectMilestone` | **Yuqori** — pul ko'chiradi |
| `bids.service.ts:237` — `bid.amount * fee` | O'rta — tasodifan ishlaydi |
| `contracts.service.ts:274` — ko'rsatish | Past |

Naqsh `fundMilestone` bilan bir xil: `numeric` da, bitta operatorda.

⚠️ **`rejectMilestone` da ochiq savol** ([03](./03-money-and-escrow.md) S1):
ikki marta chaqirilsa `escrowBalance` manfiy bo'ladimi? `milestone.status`
tekshiruvi to'sadimi? **O'lchov kerak.**

### 1.3. Annotatsiya yolg'onini tuzatish

**Nima to'sib turibdi:** 1.1.

`amount: number` — 25 entity bo'ylab **runtime'da string**
([03](./03-money-and-escrow.md) §3, [04](./04-data-model.md)).

Uch variant va ularning narxi [04-data-model](./04-data-model.md) da.
⚠️ Qisqacha: **`decimal → number` transformer eng oson va eng noto'g'ri** —
u muammoni "hal qiladi" va aniqlikni jimgina yo'qotadi. Bu — hozirgi
holatdan **yomonroq**, chunki hozir yolg'on kamida **ko'rinadi**.

Tuzatilgach, `milestones.service.ts` dagi ikkita `as unknown as number`
cast olib tashlanadi. **Ular — bajarilganlik o'lchovi.**

---

## 3. Bosqich 2 — Chegarani mustahkamlash

### 2.1. Validatsiya — 8 ta endpoint

[05-security](./05-security.md). `@Body() dto: { ... }` inline tip →
`ValidationPipe` metatip ko'rmaydi → **umuman ishlamaydi**.

Eng muhimi — `milestones.controller.ts:51`: **escrow'ni bo'shatadi**, va
`review()` da noma'lum `action` **`else` ga** tushib jimgina rad etadi
([03](./03-money-and-escrow.md) §7).

⚠️ **Lint qoidasi bilan majburlash** — aks holda 9-chisi qo'shiladi:
`@Body()` faqat klass bilan.

### 2.2. IDOR auditi

Marketplace'ning **asosiy** xavfsizlik savoli: frilanser boshqa shartnomani
ko'ra oladimi? [05-security](./05-security.md) da audit.

### 2.3. `DemoGuard` — qo'lda dekodni olib tashlash

⚠️ **Bu zaiflik emas** ([05-security](./05-security.md)) — u faqat
cheklaydi. Lekin u guard **tartibiga** tayanadi, va bu yozilmagan shart.
`request.user.isDemo` yetarli.

---

## 4. Bosqich 3 — Kuzatuv va CI

- **CI** — lint + typecheck + test + migration drift check.
  ⚠️ GitHub Actions **billing lock** — public repolar uchun bepul bo'lishi
  kerak, ya'ni bu **xato**. Support'ga murojaat. Shungacha YAML
  `workflow_dispatch:` bilan tayyor tursin
- **Structured logging** + **Sentry free** + `/health`
- ⚠️ **Escrow uchun alohida:** har pul o'tishi loglansin (`from`, `to`,
  `amount`, `milestoneId`). Pul yo'qolsa — **iz kerak**

---

## 5. Bu xaritada NIMA YO'Q va nega

| Nima | Nega |
|---|---|
| **Real to'lov provayderi** | ⚠️ **Mahsulot qarori, texnik emas.** Portfolio uchun escrow **domen mantiqi** muhim, real pul emas ([00](./00-vision-and-market.md) S3) |
| **Double-entry buxgalteriya** | 7 mezondan 0 tasi bajarilgan. Ortiqcha murakkablik ham xato ([03](./03-money-and-escrow.md) §9) |
| **Mikroservislar** | 15 modul, 1 muallif, 1 baza. Monolit to'g'ri |
| **Prisma'ga ko'chish** | TypeORM'ning `decimal → string` muammosi Prisma'da ham bor (Decimal.js). Ko'chish **hech narsani hal qilmaydi** |
| **Bozor ishi** | Kod bilan hal qilinmaydi ([00](./00-vision-and-market.md)) |

---

## 6. Yakuniy tartib

| # | Ish | To'sib turgan | Nega shu tartibda |
|---|---|---|---|
| **0.1** | Migratsiya tizimi | — | **Hamma narsaning old sharti** |
| **0.2** | `CHECK` invariantlari | 0.1 | Ikkinchi mudofaa chizig'i |
| **1.1** | Testcontainers + escrow testlari | 0.1 | Qolgan hamma narsaning **darvozasi** |
| **1.2** | Qolgan float yo'llari | 1.1 | Pul ko'chiradi |
| **1.3** | Annotatsiya yolg'oni | 1.1 | 25 entity — testsiz xavfli |
| **2.1** | Validatsiya (8 endpoint) | — | Arzon, mustaqil |
| **2.2** | IDOR auditi | — | Marketplace'ning asosiy savoli |
| **2.3** | `DemoGuard` tozalash | — | Arzon |
| **3** | CI + observability | 0.1 | Qolganini ushlab turish uchun |

⚠️ **2.1 va 2.2 hech narsaga bog'liq emas va arzon.** Ular xaritaning
o'rtasida turgani — muhimligi past bo'lgani uchun emas, balki 0.1 va 1.1
**boshqa hamma narsani** to'sib turgani uchun. Xohlasangiz — bugun
qilinadi.

---

## 7. Ochiq savollar — javob TZ dan tashqarida

| # | Savol | Kimga |
|---|---|---|
| S1 | Production sxemasi **aynan qanday**? `synchronize` bilan qurilgan, tarixi yo'q | O'lchov |
| S2 | Bazada manfiy balans bormi? Agar bor — poyga **ishlagan** | O'lchov |
| S3 | Bu loyiha davom etadimi yoki portfolio eksponati bo'lib qoladimi? | Foydalanuvchi |
| S4 | Real to'lov provayderi qo'shiladimi? | Foydalanuvchi |
| S5 | `rejectMilestone` ikki marta — `escrowBalance` manfiy bo'ladimi? | O'lchov |

⚠️ **S3 butun xaritaning qamrovini belgilaydi.** Agar javob "portfolio
eksponati" bo'lsa — bosqich 0, 1, 2 yetarli va bosqich 3 ortiqcha. Agar
"davom etadi" bo'lsa — bosqich 3 ham kerak.

**Bosqich 0 va 1 — har ikki javobda ham kerak.** Ular bugun boshlanishi
mumkin.
