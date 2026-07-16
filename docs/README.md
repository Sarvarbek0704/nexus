# Nexus — Texnik topshiriq (TZ)

> Escrow'li frilanser bozori. NestJS + TypeORM + PostgreSQL + Next.js.
>
> **8 hujjat, ~4 900 qator.** Qisqa — chunki loyiha ham kichik (9 633 qator
> backend). TZ loyihadan katta bo'lishi kerak emas.

---

## Bu TZ qanday yozilgan

**Har da'vo kodda o'lchangan** va `fayl:qator` bilan ko'rsatilgan.
Tekshirib bo'lmagan narsa — **ochiq savol**, taxmin emas. Bozor raqamlari
**to'qib chiqarilmagan**; noma'lum joylar ochiq qoldirilgan.

⚠️ **Kuchli tomonlar ham yozilgan** — tanqid uchun tanqid yo'q: pul
`numeric(10,2)` (Float **yo'q**), JWT Bearer header (CSRF yuzasi yo'q),
tranzaksiya ishlatilgan, 15 modul toza ajratilgan, raw SQL parametrlashtirilgan,
XSS yuzasi nol.

Jarayon **kanonning o'zini ham tuzatdi**: brif "DemoGuard 2 faylda
ishlatiladi" degan edi — u aslida **global**; "8 ta validatsiyasiz endpoint"
degan edi — `@Body('amount')` naqshi sanalmagan edi. Va tekshiruv
agentlarning **uchta da'vosini rad etdi** yozishdan oldin. Fakt kanondan
ustun turadi.

---

## Qayerdan boshlash

| Siz | O'qing |
|---|---|
| **Loyiha bilan tanishyapsiz** | [00-vision-and-market.md](./00-vision-and-market.md) — qisqa va halol |
| **Implementatsiyani boshlayapsiz** | **[07-roadmap.md](./07-roadmap.md)** → [03-money-and-escrow.md](./03-money-and-escrow.md) |
| **Domenni tushunmoqchisiz** | [03-money-and-escrow.md](./03-money-and-escrow.md) — loyihaning yuragi |
| **Nima buzilganini bilmoqchisiz** | [07-roadmap.md](./07-roadmap.md) §1 |

⚠️ **[07-roadmap.md](./07-roadmap.md) dan boshlang.** U **bog'liqlik**
bo'yicha tartiblangan, muhimlik bo'yicha emas — va eng qimmatli ish
**birinchi emas**.

---

## Hujjatlar

| # | Hujjat | Nima haqida |
|---|---|---|
| 00 | [Vizyon va bozor](./00-vision-and-market.md) | ⚠️ **Bu biznes emas, texnik namoyish** — va nega bu halollik kuchli. Ikki tomonlama bozor solo hal qilinmaydi |
| 01 | [Mahsulot spetsifikatsiyasi](./01-product-spec.md) | 4 aktyor, oqimlar, 15 modul. ⚠️ `disputes.resolve` **pul ko'chirmaydi** — domenning yarmi yo'q |
| 02 | [Arxitektura](./02-architecture.md) | Qatlamlar, TypeORM tanlovi, guard'lar. ⚠️ **Migratsiya umuman yo'q** |
| 03 | [**Pul va escrow**](./03-money-and-escrow.md) | **Loyihaning yuragi.** Tuzatilgan poyga va komissiya bagi, `amount: number` yolg'oni, invariantlar |
| 04 | [Ma'lumot modeli](./04-data-model.md) | 25 entity, uuid PK. ⚠️ `amount: number` — 25 entity bo'ylab runtime'da string. Uch yechim taqqoslangan |
| 05 | [Xavfsizlik](./05-security.md) | 🔴 **Admin ro'yxatdan o'tishi** (tuzatildi), validatsiya bo'shliqlari, IDOR auditi. `DemoGuard` — **zaiflik emas** |
| 06 | [Testlar](./06-testing.md) | **0 test.** Escrow invariantlari, Testcontainers, property test |
| 07 | [**Yo'l xaritasi**](./07-roadmap.md) | **Shu yerdan boshlang.** Bog'liqlik tartibi |

---

## Uchta narsa — o'qishdan oldin

### 1. Pul soxta, va bu muhim emas

To'lov provayderi yo'q; `walletBalance` — bazadagi son. Ya'ni bu yerdagi
baglar **hech kimning pulini yo'qotmagan**.

Lekin escrow — **pul bilan bog'liq holat mashinasi**, va uni to'g'ri yozish
poyga holati, atomiklik va aniq arifmetikani talab qiladi. Portfolio uchun
muhimi shu — real pul emas.

### 2. Uchta bag, bitta sabab

```
fundMilestone poygasi  ┐
komissiya pul yaratardi ├──> arifmetika bazadan chiqarib olingan edi
withdraw poygasi       ┘
```

`numeric` ustunlar to'g'ri tanlangan, keyin har qiymat `Number()` orqali
float64'ga tortilgan. Yechim ham bitta: **arifmetikani `numeric` da
qoldirish**. Shartli `UPDATE` poygani ham hal qildi, chunki tekshiruv
o'sha operatorga ko'chdi.

### 3. Eng muhim ish birinchi emas

```
Migratsiya yo'q → sxemani o'zgartirib bo'lmaydi → CHECK constraint yo'q
                → test bazasi productionni tasdiqlamaydi
                → escrow refactoringini hech narsa ushlamaydi
```

---

## Tuzatilgan (TZ yozilayotganda topilgan)

| Nima | Commit |
|---|---|
| 🔴 **Admin ro'yxatdan o'tishi** — `{"role":"admin"}` public endpointda | `0200ad5` |
| `payments.withdraw` poygasi — pul tizimdan chiqadi | `0200ad5` |
| `ThrottlerGuard` ro'yxatdan o'tmagan — rate limit ishlamasdi | `0200ad5` |
| `fundMilestone` check-then-act poygasi | `d412913` |
| Komissiya taqsimoti pul yaratardi | `d412913` |
| `origin: '*'` CORS | `d412913` |
| `backend.log` + `check_users_schema.js` git'da (sir **yo'q edi**) | `d412913` |

---

## Konvensiyalar

| | |
|---|---|
| **TZ tili** | O'zbek (lotin), texnik atamalar ingliz |
| **Kod va kommentlar** | Ingliz |
| **Pul** | `numeric(10,2)` bazada; arifmetika **`numeric` da**, `Number()` **hech qachon** |
| **Migratsiya** | ⚠️ Hali yo'q — [07-roadmap](./07-roadmap.md) §0.1 birinchi ish |
