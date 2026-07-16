# 04 — Ma'lumotlar modeli

> **Hujjat maqomi:** Loyiha · **Oxirgi yangilanish:** 2026-07-16
> **Asos:** o'qilgan real kod — `backend/src/database/entities/` (25 entity)
>
> **O'lchangan:** 25 entity · 25 uuid PK · **53** `numeric` · **34** enum ·
> 20 `jsonb` · **43** `@ManyToOne` · 8 `@OneToOne` · 5 M2M · 10 unique ·
> **4** `@Index` · **0** `onDelete` · **0** transformer · **0** migratsiya
>
> Har da'vo `fayl:qator` bilan. → `./02-architecture.md` · `./03-money-and-escrow.md`

---

## 1. Xarita — 25 entity, 6 domen

| Domen | Entity |
|---|---|
| **Identity/profil** (6) | `user` · `freelancer-profile` · `client-profile` · `agency-profile` · `agency` · `agency-member` |
| **Loyiha→bid→shartnoma** (4) | `project` · `bid` · `bid-milestone` · `contract` |
| **Milestone/to'lov** (5) | `milestone` · `milestone-submission` · `payment` · `invoice` ⚠️ · `invoice-item` ⚠️ |
| **Nizo** (2) | `dispute` · `dispute-message` |
| **Aloqa** (3) | `conversation` · `message` · `notification` |
| **Yordamchi** (5) | `skill` · `category` · `portfolio` · `time-log` ⚠️ · `review` |

Diqqatga sazovor: `user` (3 decimal / 3 enum) — markaz, 9 modulda `forFeature` da ·
`project` (4/5) — eng ko'p enum · `contract` (6/2) — ⚠️ `agencyId` **yo'q** ·
`payment` (3/3) — append-only jurnal · `review` (6/1) — 6 reyting ustuni ·
`agency-member` (1/2) — `revenueShare` **o'qilmaydi**.

⚠️ **3 entity o'lik:** `invoice`, `invoice-item`, `time-log` — 12 `numeric`
ustun, ularni yozadigan modul **yo'q**. `grep -rn "TimeLog\|Invoice"
backend/src/modules` faqat `contracts.service.ts:31` `relations` da uchraydi:
o'qiladi (har doim bo'sh), hech qachon yozilmaydi. → `./01-product-spec.md` §6

---

## 2. ER diagramma

### 2.1. Identity va profil

```
                    ┌──────────────┐ role: client|freelancer|agency_owner|admin
                    │     user     │ ⚠️ walletBalance/escrowBalance numeric(10,2),
                    │   (uuid PK)  │    CHECK >= 0 YO'Q
                    └─┬────┬────┬──┘
           1:1 ┌──────┘ 1:1│    └──────┐ 1:1
    ┌──────────▼───┐ ┌─────▼────────┐ ┌▼──────────────┐
    │freelancer_pr.│ │client_profile│ │agency_profile │
    └──────┬───────┘ └──────────────┘ └───────┬───────┘
           │ N:1 (nullable)                   │ 1:1
    ┌──────▼───────────────────────────────────▼───┐
    │  agency   ⚠️ ownerId — oddiy ustun, FK EMAS  │
    └──────────────────┬───────────────────────────┘  (:103-104)
                       │ 1:N
              ┌────────▼────────┐ role: owner|manager|member
              │  agency_member  │ ⚠️ revenueShare — hech qayerda o'qilmaydi
              └─────────────────┘

⚠️ user.entity.ts:140-147 UCHTA 1:1 profil e'lon qiladi, `role` bilan
   bog'lanmagan → sxema bo'yicha bitta odamda 3 profil ham mumkin.
   auth.service.ts:442 bittasini yaratadi. Taqiq — kodda, sxemada emas.
```

### 2.2. Loyiha → bid → shartnoma → milestone → to'lov

```
 category ◄─N:1─ skill ─M:N─┐  (project_skills)
    │ N:1                   │
 ┌──▼───────────────────────▼──┐  status: draft|open|in_review|in_progress|
 │          project            │          paused|completed|cancelled|closed
 │ budgetMin/Max numeric       │  ⚠️ visibility — findOne'da tekshirilmaydi (:108)
 └──┬──────────────────────────┘  ⚠️ type — shartnomada o'qilmaydi
    │ 1:N
 ┌──▼──────────────────┐ 1:N  ┌──────────────────────┐
 │        bid          │─────►│    bid_milestone     │ (frilanser taklifi)
 │ amount numeric      │      │ amount ⚠️ validatsiyasiz│
 │ ⚠️ agencyId — a'zolik tekshirilmaydi └────────────┘
 └──┬──────────────────┘
    │ 1:1 (nullable)
 ┌──▼──────────────────────────────────────┐ status: pending|active|paused|
 │              contract                   │  disputed|completed|cancelled|
 │ clientId ────► user                     │  terminated
 │ freelancerId ► user                     │
 │ ⚠️ agencyId YO'Q → agentlik yo'qoladi   │
 │ totalAmount · paidAmount · escrowAmount │
 │ ✅ platformFeePercent shartnomada (:135)│
 └──┬─────────┬──────────┬──────────┬──────┘
    │1:N      │1:N       │1:N       │1:N
 ┌──▼──────┐ ┌▼────────┐ ┌▼───────┐ ┌▼─────────┐
 │milestone│ │ invoice │ │dispute │ │ time_log │
 │ amount  │ │ ⚠️ o'lik │ │        │ │ ⚠️ o'lik  │
 │escrowAmt│ └──┬──────┘ └──┬─────┘ └──────────┘
 │isEscrow │    │1:N        │1:N
 │ Funded  │ ┌──▼────────┐ ┌▼─────────────────┐
 └─┬────┬──┘ │invoice_it.│ │ dispute_message  │
   │1:N │1:N └ ⚠️ o'lik ──┘ └──────────────────┘
   │  ┌─▼────────────────────┐
   │  │ milestone_submission │
   │  └──────────────────────┘
 ┌─▼────────────────────────────────────────┐
 │                payment                   │ ← MOLIYAVIY JURNAL (append-only)
 │ payerId ──► user  ⚠️ 'platform' yoziladi │
 │ payeeId ──► user  ⚠️      → §8.4         │
 │ type: milestone_payment|escrow_deposit|  │
 │   escrow_release|refund|bonus|withdrawal|│
 │   platform_fee|subscription              │
 │ amount · platformFee · netAmount         │
 └──────────────────────────────────────────┘
```

### 2.3. Aloqa

```
 user ─M:N─► conversation ─1:N─► message  (⚠️ replyToId — FK EMAS, :69)
      │           (conversation_participants)
      └─1:N─► notification  (relatedEntityId + relatedEntityType
                             ⚠️ polimorf — ataylab, FK mumkin emas)
```

---

## 3. Birlamchi kalit: `uuid`

**25/25 entity** — `@PrimaryGeneratedColumn('uuid')`. Nol istisno. Izchillik
o'zi qiymat.

### 3.1. Nega uuid — to'g'ri sabablar

1. **ID sanab chiqib bo'lmaydi.** Bu Nexus'da **aniq muhim**:
   `projects.controller.ts:59-60` `@Public() @Get(':id')`, va u
   **bidlarni ham qaytaradi** (`projects.service.ts:112`). Ketma-ket ID bo'lsa —
   `/projects/1,2,3…` bilan **butun bozor razvedkasi**. uuid bilan — faqat
   havolasi bor odam. → `./05-security.md`
2. ID tranzaksiyadan **oldin** yaratiladi — `RETURNING` kutilmaydi.
3. Muhitlar ma'lumotini birlashtirishda **to'qnashuv yo'q**.

### 3.2. Narxi — halol

- **16 bayt** (bigint 8 ga qarshi) — 43 FK ustun bo'ylab real, bu hajmda ahamiyatsiz
- ⚠️ **Indeks lokalligi — asosiy narx.** uuid v4 **tasodifiy**: B-tree'ga har
  kiritish **tasodifiy sahifaga** tushadi; ketma-ket `bigint` esa har doim
  **o'ng chekkaga** (append-only)
- **Sahifa bo'linishi** — tasodifiy kiritish sahifalarni bo'ladi → indeks
  shishadi, `VACUUM` ko'proq ishlaydi
- **Kesh** — issiq indeks sahifasi yo'q → katta jadvalda har `INSERT` disk
  o'qishi bo'lishi mumkin

⚠️ **Halol xulosa:** narx **real**, lekin u **yozish hajmiga** bog'liq. Nexus —
portfolio loyihasi, real foydalanuvchisi yo'q → narx **hozir nolga teng** va
ehtimol hech qachon sezilmaydi. Hajm o'ssa — **uuid v7** (vaqt bo'yicha
tartiblangan) sanab bo'lmaslikni **lokallikni yo'qotmasdan** beradi.

**Baho: to'g'ri qaror, to'g'ri sabablarga ko'ra** — domen (§3.1.1) uni talab
qiladi, bu o'ylanmagan default emas.

---

## 4. ✅ Pul bazada TO'G'RI — kuchli tomon

```bash
grep -rh "type: 'decimal'" entities/*.ts | wc -l    # 53
grep -rhn "float\|double\|real" entities/*.ts       # 0
```

**53 pul/o'lchov ustuni — hammasi `numeric`. Float — NOL.**

```ts
// milestone.entity.ts:39-40
@Column({ type: 'decimal', precision: 10, scale: 2 })
amount: number;
```

`numeric(10,2)` — **aniq o'nlik**, IEEE-754 emas. `0.1 + 0.2 === 0.3` bu yerda
**rost**. Maksimum **99 999 999.99**. Ko'p portfolio loyihasi aynan shu yerda
yiqiladi. Nexus qilmagan, va bu **tasodif emas** — `precision`/`scale` ataylab,
53 marta, izchil.

Yordamchi to'g'ri qarorlar: `contract.platformFeePercent`
(`contract.entity.ts:135-136`) — komissiya **shartnomada** saqlanadi, global
konstanta emas → stavka o'zgarsa eski shartnomalar **o'z stavkasini eslab
qoladi** (moliyaviy tizimda to'g'ri naqsh). `payment` — **append-only jurnal**
(`milestones.service.ts:299`, `:325`, `contracts.service.ts:239`).

### 4.1. ⚠️ Muammo — annotatsiyada, sxemada emas

```bash
grep -rn "transformer" entities/*.ts   # → 0
```

TypeORM `numeric` ni **`string`** qaytaradi. Ya'ni `amount: number` —
**YOLG'ON**, runtime'da `"1000.00"`. **53 ustun.**

Bu xatoni **yashiradi**:

| Ifoda | Natija |
|---|---|
| `bid.amount * 0.1` | ✅ **tasodifan ishlaydi** — `*` majburlaydi |
| `bid.amount + fee` | ❌ **`"1000.00100"`** — satr birikmasi |
| `[a,b].reduce((s,x)=>s+x, 0)` | ❌ **`"0500.00250.00"`** — `frontend/app/(main)/bids/page.tsx:135`, **real bug** |

⚠️ **Bu TypeORM ayb EMAS.** Prisma ham `Decimal` obyekti qaytaradi, `number`
emas — chunki `number` (float64) pulni saqlay olmaydi. Farq: Prisma **rost
gapiradi** (`+` → kompilyatsiya xatosi), TypeORM `number` deb yozishga **ruxsat
beradi**. → `./02-architecture.md` §4.1

**Sxema to'g'ri, TypeScript yolg'on gapiradi.** Tuzatish — §5.

### 4.2. Hali float'da qolgan joylar

```
milestones.service.ts:183   Number(milestone.escrowAmount || milestone.amount)
bids.service.ts:237         bid.amount * (PLATFORM_FEE_PERCENT / 100)   ← string × number
contracts.service.ts:274    Number(totalAmount) - Number(paidAmount)
payments.service.ts:60-61   parseFloat(totalReceived.total)
```
va **4 cast** `milestones.service.ts:317`, `:318`, `:334`, `:335` — izohlangan
(`:309-316`), annotatsiya yolg'onining ko'rinadigan uchi.

⚠️ `bids.service.ts:237` eng jiddiy: `contract.platformFeeAmount` **float
orqali** hisoblanadi, `milestones.service.ts:274-279` esa keyin **numeric'da
qayta** hisoblaydi → ikki qiymat **ajralishi mumkin**. → `./03-money-and-escrow.md`

### 4.3. ⚠️ Bitta pul ustuni `numeric` EMAS

```ts
// freelancer-profile.entity.ts:59-60
@Column({ default: 0 })
totalEarned: number;      // ← int! TypeORM `number` dan `int` chiqaradi

// agency.entity.ts:90-91  — taqqoslang
@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
totalEarned: number;      // ← numeric(10,2)
```

**Bir xil nom, ikki tur.** `freelancer_profiles.totalEarned` butun son → tiyin
**yo'qoladi**. Hozir zararsiz (`grep -rn "totalEarned" backend/src/modules` →
**hech qayerda yozilmaydi**), lekin yozila boshlansa — jimgina yaxlitlanadi.

**53 ta "hammasi numeric" da bitta istisno bor.** Halol qayd.

---

## 5. ⚠️ YECHIM TAQQOSLASH — eng muhim qism

Muammo: 53 `numeric` ustun `number` deb annotatsiya qilingan, runtime'da
`string`. **Qaror qabul qilinmaydi — tavsiya beriladi.**

### (a) — pul maydonlarini `string` qilish

```ts
@Column({ type: 'decimal', precision: 10, scale: 2 })
amount: string;        // ← rost
```

| | |
|---|---|
| **Beradi** | **Rost.** `a * b` → kompilyator **xato** beradi |
| **Narx** | 53 ustun × 25 entity + har o'qish joyi + `frontend/types/index.ts` (393 qator qo'lda nusxa) |
| **Migratsiya** | ❌ yo'q — faqat TypeScript |
| **⚠️ Xavf** | **`+` hamon jim.** `amount + fee` string'da **to'liq to'g'ri TypeScript** — va satr birikmasini beradi. Eng xavfli operator **ushlanmaydi** |
| **⚠️ Xavf 2** | Har arifmetikada qo'lda konvertatsiya → `Number()` o'ramlari **ko'payadi** |
| **Baho** | **Rost, lekin foydasiz rost** |

### (b) — `ColumnNumericTransformer` (`decimal → number`)

```ts
export class ColumnNumericTransformer {
  to(data: number): number { return data; }
  from(data: string): number { return parseFloat(data); }
}
@Column({ type: 'decimal', precision: 10, scale: 2,
         transformer: new ColumnNumericTransformer() })
amount: number;        // ← endi ROST
```

| | |
|---|---|
| **Beradi** | Annotatsiya **rost**. `+`,`-`,`*` kutilganday. JSON endi `500.00` yuboradi → **frontend'dagi 2 bug va barcha `Number()` o'ramlari yo'qoladi** |
| **Narx** | 53 ustunga `transformer:`. Mexanik. **Xizmat kodi o'zgarmaydi** |
| **Migratsiya** | ❌ yo'q |
| **⚠️ XAVF — ASOSIY** | **Aniqlikni yo'qotadi.** `parseFloat` → float64. Butun qism aniq (2^53 ≫ 10^8), **lekin o'nlik kasr emas**: `0.1 + 0.2 !== 0.3`. **§4 da qo'lga kiritilgan narsa qaytib yo'qoladi** |
| **⚠️ Xavf 2** | Yo'qotish **jim** — bir `0.01` ko'rinmaydi; ming tranzaksiyadan keyin balans ajraladi |
| **Yumshatuvchi** | **Kritik arifmetika allaqachon SQL'da** (`milestones.service.ts:274-279`, `contracts.service.ts:219-227`) → float faqat **ko'rsatish/taqqoslash** ga tegadi |
| **Baho** | **Eng arzon — va u chekinish.** Yashirmaslik kerak |

### (c) — transformer `decimal → Decimal.js`

```ts
import { Decimal } from 'decimal.js';
export class DecimalTransformer {
  to(d: Decimal): string { return d?.toString(); }
  from(d: string): Decimal { return new Decimal(d); }
}
@Column({ type: 'decimal', precision: 10, scale: 2,
         transformer: new DecimalTransformer() })
amount: Decimal;
```

| | |
|---|---|
| **Beradi** | **Rost VA aniq.** `amount + fee` → **kompilyatsiya xatosi** → `.plus()` yozishga majbur. Eng xavfli bug **kompilyatorda** ushlanadi |
| **Narx** | 53 ustun + **har arifmetika joyi qayta yoziladi** (`bids.service.ts:237`, `milestones.service.ts:183`, `contracts.service.ts:274`, `payments.service.ts:60-61`…) + `decimal.js` (~32 KB) |
| **⚠️ Serializatsiya** | JSON'da `Decimal` → `{"s":1,"e":2,"d":[500]}`! `toJSON` yoki response DTO **shart**. Hozir kontrollerlar entity'ni **to'g'ridan-to'g'ri** qaytaradi (`./02-architecture.md` §2) → **API javob shakli buziladi**, 15 RTK Query fayli ta'sirlanadi |
| **Yumshatuvchi** | Prisma aynan shuni qiladi → **sanoat standarti**, ekzotika emas |
| **Baho** | **Yagona to'liq to'g'ri — va eng qimmat** |

### 5.1. Taqqoslash

| | (a) `string` | (b) `→number` | (c) `→Decimal` |
|---|---|---|---|
| Annotatsiya rostmi | ✅ | ✅ | ✅ |
| `a * b` | ❌ xato | ✅ | ✅ `.mul()` |
| **`a + b` ushlanadimi** | ❌ **jim buzadi** | ✅ ishlaydi | ✅ **kompilyator** |
| Aniqlik | ✅ | ❌ **yo'qoladi** | ✅ |
| Frontend `$NaN` tuzaladimi | ❌ | ✅ | ⚠️ DTO kerak |
| Xizmat kodi | ⚠️ ko'p joy | ✅ **o'zgarmaydi** | ❌ hamma joy |
| API shakli buziladimi | ✅ yo'q | ✅ yo'q | ❌ **ha** |
| Mehnat | ~1 kun | **~2 soat** | ~3-4 kun |

### 5.2. Tavsiya (qaror emas)

**Bosqichma-bosqich: avval (b), keyin (c) — agar kerak bo'lsa.**

**Nega (b) birinchi:**
- **~2 soat**, **darhol 2 real bug'ni** tuzatadi (`bids/page.tsx:135` va uch
  joydagi `$NaN` — `./02-architecture.md` §8.3)
- **Xizmat kodi tegilmaydi** → testlar **0** bo'lgan loyihada **hal qiluvchi**:
  regressiyani hech narsa ushlamaydi, ya'ni o'zgarish maydoni kichik bo'lishi shart
- Aniqlik yo'qotishi **cheklangan** — kritik arifmetika **SQL'da**
- (a) dan **qat'iy yaxshi**: ko'proq mehnat, va `+` ni baribir ushlamaydi

**Nega (c) oxirida:** u **API javob shaklini buzadi** → 15 RTK Query fayli.
Testlarsiz **xavfli**. Shart: **avval testlar** (`./06-testing.md`) → **response
DTO** (`./02-architecture.md` §2) → **keyin (c)**.

⚠️ **Halol qayd:** (b) — **chekinish**. U §4 dagi aniqlikni **JS chegarasida**
qaytarib beradi. Oqlanishi — **arifmetika JS'da emas**. Shuning uchun (b) bilan
birga **qoida** yozilsin: *"pul arifmetikasi faqat SQL'da"*. Kimdir JS'da pul
hisoblay boshlasa — (b) **darhol yetarli bo'lmay qoladi**.

**Yakuniy tanlov — loyiha egasiniki.**

---

## 6. ⚠️ INDEKSLAR — AUDIT

```bash
grep -rn "@Index" entities/*.ts   # → 4
```

**25 entity, 4 indeks:**

| Fayl:qator | Ustun | Baho |
|---|---|---|
| `user.entity.ts:37` | `email` | ⚠️ **ortiqcha** — `:38` `unique: true` allaqachon indeks yaratadi |
| `user.entity.ts:50` | `username` | ⚠️ **ortiqcha** — `:51` `unique` |
| `skill.entity.ts:12` | `name` | ⚠️ **ortiqcha** — `:13` `unique` |
| `project.entity.ts:53` | `title` | ⚠️ **noto'g'ri tur** — `projects.service.ts:75` `ILIKE '%…%'` B-tree'dan **foydalanmaydi** (GIN/trigram kerak) |

⚠️ **4 indeksning 3 tasi ortiqcha, 1 tasi noto'g'ri turda. Foydali qo'lda
qo'shilgan indeks — NOL.**

Bu **diagnostika**: `@Index` va `unique` munosabati bilinmagan → indeks
strategiyasi **noldan** yozilishi kerak, mavjudini to'ldirish emas.

### 6.1. FK ustida indeks — Postgres AVTOMATIK YARATMAYDI

Keng tarqalgan noto'g'ri tushuncha. Postgres `PRIMARY KEY` va `UNIQUE` uchun
indeks **yaratadi**, **`FOREIGN KEY` uchun — YO'Q** (MySQL/InnoDB yaratadi,
Postgres yo'q). TypeORM ham `@ManyToOne` uchun qo'shmaydi — `@JoinColumn` faqat
ustun yaratadi. **43 `@ManyToOne` × 0 indeks.**

### 6.2. Yetishmayotgan indekslar — real so'rovlardan

| Indeks | Chaqiruv joyi |
|---|---|
| `milestones(contractId)` | `milestones.service.ts:40`, `:391`, `contracts.service.ts:280` |
| `bids(projectId, status)` · `bids(bidderId)` | `bids.service.ts:51` takroriy tekshiruv, `:217` `UPDATE…WHERE` |
| `contracts(clientId)` · `(freelancerId)` | `contracts.service.ts:54` |
| `payments(payerId)` · `(payeeId)` · `(contractId)` | `payments.service.ts:23`, `:39`, `:49`, `:150`; `contracts.service.ts:281` |
| `notifications(userId, isRead)` | `notifications.service.ts:35`, `:48` — **eng tez o'sadigan jadval** |
| `messages(conversationId)` · `disputes(contractId)` | `messages.service.ts:121`; `disputes.service.ts:45` |
| `milestone_submissions(milestoneId)` | `milestones.service.ts:74`, `:134` |
| `reviews(revieweeId)` | `reviews.service.ts:161` `updateUserRating` |
| `projects(status, visibility)` · `(clientId)` | `projects.service.ts:71-72` — **har ro'yxat so'rovi** |

⚠️ **`stats` (555 qator) — eng ta'sirlangan.** `stats.service.ts:37-483` jonli
agregat (`SUM`, `COUNT`, oylik guruhlash), **kesh yo'q**. Indekssiz har admin
dashboard yuklanishi — **to'liq jadval skani**, har jadval bo'yicha.

Hozir sezilmaydi (seed kichik); **~1000 shartnomada sezila boshlaydi**.

⚠️ **Va bu §9 ning bolasi:** indeks qo'shish **migratsiya** talab qiladi.
`@Index` yozib `synchronize` ga tayanish — dev'da ishlaydi, **prodda yo'q**.

### 6.3. Yetishmayotgan UNIQUE — check-then-act ning yana 3 nusxasi

10 unique cheklov bor (`user.email`/`username`, `contract.contractNumber`,
`dispute.disputeNumber`, `payment.transactionId`, `invoice.invoiceNumber`,
`agency.slug`, `skill.name`, `category.name`/`slug`) — **hammasi o'rinli**.

⚠️ **Lekin uch joyda kod DB o'rniga tekshiradi:**

| Kod tekshiruvi | Kerakli DB cheklovi |
|---|---|
| `reviews.service.ts:51-54` | `UNIQUE (contractId, reviewerId, type)` |
| `bids.service.ts:50-53` | `UNIQUE (projectId, bidderId) WHERE status='pending'` |
| `disputes.service.ts:45-48` | `UNIQUE (contractId) WHERE status='open'` |

Uchalasi — `findOne` → `if (existing) throw` → `save`: **ikki bir vaqtdagi
so'rov ikkalasi ham o'tadi**. Bu `fundEscrow` da tuzatilgan naqshning **yana
uch nusxasi** (`./02-architecture.md` §7.2).

`reviews` da oqibat aniq: ikki sharh → `updateUserRating` (`:161`) **ikki
marta** → reyting buziladi.

Postgres qisman unique indeksni qo'llab-quvvatlaydi:
```sql
CREATE UNIQUE INDEX ON bids ("projectId","bidderId") WHERE status = 'pending';
```

---

## 7. Enum'lar — native Postgres enum

```bash
grep -rh "type: 'enum'" entities/*.ts | wc -l   # 34
```

**34 enum ustun — hammasi TypeORM `type: 'enum'`, string EMAS** →
native `CREATE TYPE ... AS ENUM`.

### 7.1. ✅ Foydasi

1. **Baza noto'g'ri qiymatni rad etadi** (`status = 'typo'` → xato). Bu
   **hozir haqiqatan kerak**: 8 endpoint validatsiyasiz va
   `milestones.controller.ts:51` `action` ni tekshirmaydi (`./05-security.md`).
   Enum bo'lmasa `milestone.status` ixtiyoriy axlat bo'lardi. **Baza — oxirgi himoya.**
2. **Ixcham** — 4 bayt, `varchar` emas.
3. TypeScript enum bilan **bir manbadan** (`enum: MilestoneStatus`).

### 7.2. ⚠️ Narxi — §9 bilan qo'shilib xavfli

Qiymat qo'shish `ALTER TYPE ... ADD VALUE` **tranzaksiyada ishlamaydi**;
**o'chirish umuman mumkin emas** (yangi tur → ustunni ko'chirish → eskisini
tashlash). Va ⚠️ **`synchronize` buni ishonchli bajarmaydi** — TypeORM'ning enum
sinxronizatsiyasi tarixan muammoli (ustunni `varchar` ga o'tkazib, turni qayta
yaratib, orqaga o'tkazadi).

**34 enum + `synchronize` + migratsiya yo'q** = enum o'zgarishi prodda
**qo'lda SQL** talab qiladi — aynan `isDemo` bilan bo'lganidek (§9.3).

**Baho: enum tanlovi TO'G'RI** (va hozir **kerak**), **lekin u migratsiyani
ixtiyoriydan majburiyga aylantiradi.** 34 enum bilan migratsiyasiz yashab
bo'lmaydi.

---

## 8. ⚠️ Kaskad o'chirish — `onDelete` NOL TA

```bash
grep -rn "onDelete" entities/*.ts   # → 0
```

**43 `@ManyToOne` — `onDelete` birortasida yo'q.** TypeORM default'i
`NO ACTION` ≈ `RESTRICT`.

### 8.1. Foydalanuvchi o'chirilsa? — **o'chmaydi**

`DELETE FROM users WHERE id=…` → `contracts.clientId` FK **rad etadi** → xato.

⚠️ **Va bu TO'G'RI natija.** Moliyaviy yozuv **o'chmasligi kerak**: `payment` —
audit izi, `contract` — huquqiy hujjat, `invoice` — hisob-faktura.

Agar kimdir `onDelete: 'CASCADE'` yozganida — foydalanuvchi o'chirilganda uning
**butun to'lov tarixi**, **shu jumladan boshqa tomonning yozuvi ham**
(`payment.payeeId` ham `user` ga ishora qiladi) yo'q bo'lardi.

**Halol baho: bu himoya, lekin ONGLI QAROR EMAS** — shunchaki hech kim
`onDelete` yozmagan.

⚠️ **Dalil va chalkashlik manbai:** `cascade: true` **4 joyda bor** —
`user.entity.ts:140`, `:143`, `:146`, `invoice.entity.ts:94`. Bu **butunlay
boshqa narsa**: `cascade: true` — **TypeORM**, ilova qatlamida, `save()` da
bog'liqni ham **saqlaydi**; `onDelete: 'CASCADE'` — **Postgres**, DDL da,
`DELETE` da bog'liqni ham **o'chiradi**. Nexus'da birinchisi 4 joyda,
ikkinchisi **0 joyda**. `user.entity.ts:140-147` — bu **saqlash** kaskadi
(profil user bilan birga yaratiladi, `auth.service.ts:442`), o'chirish emas.

### 8.2. Kerakli siyosat — ataylab yozilsin

Hozir "hech narsa o'chmaydi" ishlaydi, lekin **foydalanuvchini o'chirish
umuman imkonsiz** → GDPR/"hisobni o'chirish" talabi bo'lsa muammo.

| Munosabat | Siyosat | Nega |
|---|---|---|
| `payment.payerId/payeeId`, `contract.clientId/freelancerId`, `bid.bidderId` → `user` | **`RESTRICT`** (ataylab) | Moliyaviy jurnal · huquqiy hujjat · shartnoma tarixi |
| `milestone.contractId`, `milestone_submission.milestoneId`, `bid_milestone.bidId`, `dispute_message.disputeId`, `portfolio.freelancerProfileId` | `CASCADE` | Ota-yozuvsiz ma'nosiz (ota o'zi `RESTRICT`) |
| `notification.userId → user` | `CASCADE` | Vaqtinchalik ma'lumot |
| `message.senderId → user` | `SET NULL` | Xabar qolsin, muallif anonim |

**Ya'ni: o'chirish o'rniga — `UserStatus.INACTIVE`** (`user.entity.ts:25-30` da
**allaqachon bor**, ishlatilmaydi) yoki anonimlashtirish. Sxema buni
**qo'llab-quvvatlaydi**.

### 8.3. ⚠️ FK bo'lmagan "FK"lar

`@ManyToOne` yo'q → **FK cheklovi ham yo'q** → **osilgan havola** mumkin:
`agency.entity.ts:103-104` `ownerId` → `users.id` (**eng jiddiy**) ·
`project.entity.ts:147-148` `selectedFreelancerId` → `users.id` ·
`message.entity.ts:69-70` `replyToId` → `messages.id` ·
`agency-member.entity.ts:52-53` `invitedBy` → `users.id` ·
`time-log.entity.ts:55-56` `approvedBy` → `users.id`.

`notification.entity.ts:71-75` `relatedEntityId`+`relatedEntityType` —
**ataylab polimorf** (6 xil entity'ga ishora), FK mumkin emas, bu **oqlangan**.
Qolgan 5 tasi — **e'tiborsizlik**.

### 8.4. ⚠️ `payment.payerId = 'platform'` — sxema buzilishi

```ts
// payment.entity.ts:45-57
@ManyToOne(() => User)
@JoinColumn({ name: 'payerId' })
payer: User;
@Column()
payerId: string;      // ← NOT NULL, User ga FK
```
Lekin:
```ts
milestones.service.ts:193    payerId: 'platform',    // rejectMilestone, REFUND
milestones.service.ts:328    payeeId: 'platform',    // approveMilestone, PLATFORM_FEE
```

**`'platform'` — uuid emas, `users` da bunday qator yo'q.** Ikki ehtimoldan
biri rost:

1. **FK mavjud** → `INSERT` **yiqiladi** → butun `approveMilestone` tranzaksiyasi
   rollback → **milestone qabul qilish umuman ishlamaydi**.
2. **FK yo'q** (`@Column() payerId: string` → `varchar`, `users.id` → `uuid`;
   turlar mos kelmagani uchun TypeORM FK yarata olmagan bo'lishi mumkin) →
   yozuv saqlanadi, lekin `payments.service.ts:166`
   `leftJoinAndSelect('payment.payer', 'payer')` **`null`** qaytaradi va `:176`
   dagi `payer.email ILIKE` qidiruvi bu yozuvlarni **ko'rmaydi**.

⚠️ **Qaysi biri — TEKSHIRILMAGAN.** (2) **ehtimolroq**, lekin bu **taxmin** —
tasdiqlash uchun `\d payments` kerak. **Ochiq savol, 1-darajali** (§11.1).

**Har ikki holda ham bug.** Yechim variantlari:
- `payerId`/`payeeId` **nullable** + platforma uchun `NULL` (**eng arzon**, va
  `payment.type` allaqachon `PLATFORM_FEE`/`REFUND` deb aytadi — kim ekanligi
  yozilgan)
- yoki seed'da **haqiqiy** "platform" tizim hisobi
- yoki alohida `platform_ledger` jadvali

---

## 9. ⚠️ Migratsiya yo'qligi — bu hujjatga ham tegadi

`./02-architecture.md` §3 ning ma'lumot modeliga tegishli qismi.

### 9.1. Sxema faqat entity fayllarida yashaydi

**Bu hujjatdagi butun sxema — 25 TypeScript faylining hozirgi holatidan
chiqarilgan hosila.** Boshqa manba yo'q. **Tarix yo'q** (`platformFeePercent`
qachon qo'shilgan, nega `precision: 5`? — javob yo'q) · **rollback yo'q** ·
**review yo'q** (sxema o'zgarishi PR'da **entity diff**, `ALTER TABLE` emas →
reviewer `DROP COLUMN` ni **ko'rmaydi**) · **prod sxemasi noma'lum** (faqat
prod bazasiga ulanib bilish mumkin).

### 9.2. ⚠️ Infratuzilma — uch qavatli buzilish

**Niyat bor edi:**

**1-qavat — `package.json:19-22` skriptlar BOR:**
```json
"typeorm": "npx typeorm -d src/database/data-source.ts",
"migration:generate": "npm run typeorm -- migration:generate",
"migration:run": "npm run typeorm -- migration:run",
"migration:revert": "npm run typeorm -- migration:revert",
```

**2-qavat — `src/database/data-source.ts` MAVJUD EMAS:**
```bash
find backend -name "data-source*" -not -path "*/node_modules/*"   # → 0
ls backend/src/database/                                          # → entities/  seed.ts
```
Ya'ni **to'rtala skript ham darhol yiqiladi**: *"Cannot find module data-source.ts"*.

**3-qavat — `database.config.ts:14` ko'rsatgan katalog ham yo'q:**
```ts
migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
```

⚠️ **Xulosa: migratsiya tizimi "yozilmagan" emas — YOZILGAN, lekin hech qachon
ISHLATILMAGAN.** Skriptlar qo'shilgan, `data-source.ts` hech qachon
yaratilmagan → **birorta migratsiya bir marta ham generatsiya qilinmagan**.

Va `seed.ts` buni **yashirgan**: u `data-source.ts` ga tayanmaydi — o'z
`DataSource` ini inline yaratadi (`seed.ts:11`). Shuning uchun `npm run seed`
**ishlaydi**, va yo'qlik sezilmagan.

**Tuzatish arzon:** `data-source.ts` (~20 qator, `database.config.ts` ni qayta
ishlatadi) + `migration:generate` bir marta. → `./02-architecture.md` §3.5

### 9.3. Dalil: DDL seed ichida

`seed.ts:112-116`:
```ts
// Add isDemo column if missing
await AppDataSource.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS "isDemo" boolean NOT NULL DEFAULT false
`).catch(() => {});
```
Qo'lda yozilgan migratsiya, seed'ga yashiringan, `.catch(() => {})` bilan
jimlantirilgan. → `./02-architecture.md` §3.3

### 9.4. Bu hujjatdagi har tavsiya migratsiyani talab qiladi

| Tavsiya | Migratsiya? |
|---|---|
| §5 pul transformer'i | ❌ **Yo'q** |
| §6.2 ~13 indeks | ✅ |
| §6.3 3 unique cheklov | ✅ |
| §8.2 `onDelete` siyosati | ✅ |
| §8.4 `payerId` nullable | ✅ |
| §4.3 `totalEarned` → numeric | ✅ |
| `walletBalance >= 0` CHECK | ✅ |

**7 tavsiyadan 6 tasi migratsiyani talab qiladi** → migratsiya bu hujjatning
**oldsharti**, parallel ish emas. Shuning uchun **§5 birinchi qilinishi
mumkin** — u yagona migratsiyasiz tavsiya.

---

## 10. Kuchli tomonlar

1. **53 `numeric`, 0 Float** (§4) — eng muhim to'g'ri qaror
2. **`platformFeePercent` shartnomada** (`contract.entity.ts:135`) — stavka tarixi buzilmaydi
3. **`payment` — append-only jurnal**, har harakat yozuv qoldiradi
4. **34 native enum** (§7) — baza oxirgi himoya, va **hozir kerak**
5. **25/25 uuid PK** (§3) — domen uni **talab qiladi**
6. **10 unique cheklov** — `transactionId`, `contractNumber`, `disputeNumber`, `invoiceNumber` — to'g'ri joyda
7. **`onDelete` yo'qligi moliyaviy yozuvni saqlaydi** (§8.1) — tasodifan, lekin to'g'ri
8. **20 `jsonb` o'rinli** — hammasi sxemasiz ma'lumot (`education`, `socialLinks`), **munosabat o'rniga emas**
9. **`user.password` `select: false`** (`user.entity.ts:41`) + 6 maxfiy maydon (`:81-97`)
10. **Nomlash izchil** — `*Id` FK, `createdAt`/`updatedAt` hamma joyda

---

## 11. Ochiq savollar

1. ⚠️ **`payments` da `payerId` FK cheklovi bormi?** (§8.4) `\d payments` kerak.
   Bundan **`approveMilestone` umuman ishlaydimi** degan savol kelib chiqadi —
   **1-darajali**.
2. **`freelancer_profiles.totalEarned` `int` ataylabmi?** (§4.3)
3. **`client_profiles.hireRate` `int` — foizmi yoki ulushmi?** (`:62-63`)
4. **Foydalanuvchini o'chirish kerakmi?** (§8.2) `UserStatus.INACTIVE`
   allaqachon bor, ishlatilmaydi.
5. **`invoice`, `invoice-item`, `time-log` qoladimi?** (§1) 3 entity, 12
   `numeric` ustun, moduli yo'q.
6. **Bir odamda 3 profil bo'lishi mumkinmi?** (§2.1) Sxema taqiqlamaydi.
7. **`walletBalance >= 0` CHECK qo'shilsinmi?** Hozir sxema manfiy balansni
   taqiqlamaydi — `withdraw` poygasi (`./02-architecture.md` §7.2) aynan
   shundan foydalanadi.
8. **`attachments` uch xil turda:** `project.entity.ts:105-106` `string`,
   `bid.entity.ts:77-78` `string`, `dispute.entity.ts:100-101` `jsonb string[]`.
   Nega?
9. **`review.overallRating` `numeric(3,2)`** — `4.75` mumkin, lekin
   `reviews.service.ts:56-58` faqat 1-5 oralig'ini tekshiradi. Kasr reyting
   ataylabmi?

---

## 12. Ustuvorlik

1. **`data-source.ts` + baseline migratsiya** (§9.2) — ~1 kun.
   ⚠️ **#2 dan tashqari hamma narsaning oldsharti**
2. **Pul transformer'i, variant (b)** (§5.2) — ~2 soat · migratsiyasiz
3. `payerId` 'platform' (§8.4) — ~2 soat
4. 3 unique cheklov (§6.3) — ~1 soat
5. `walletBalance >= 0` CHECK (§11.7) — ~30 daq
6. ~13 FK indeksi (§6.2) — ~2 soat
7. `onDelete` siyosati (§8.2) — ~4 soat
8. `totalEarned` → `numeric` (§4.3) — ~30 daq
9. O'lik entity'lar qarori (§1)

3-9 — migratsiya talab qiladi. To'liq reja → `./07-roadmap.md`
