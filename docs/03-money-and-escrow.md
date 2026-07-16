# 03 — Pul va escrow

> Bu — Nexus'ning yuragi. Marketplace'ning butun mavjudlik sababi shu:
> **notanish ikki odam bir-biriga ishonmasdan ish qila olsin.**
>
> Escrow shuni beradi. Shuning uchun bu yerdagi har bag — domenning o'zidagi
> bag, chekkadagi emas.

---

## 0. Bitta narsani boshdan aytamiz

**Pul soxta.** Hech qanday to'lov provayderi ulanmagan (`payme|click|uzum|
paycom|merchant` bo'yicha grep — hech narsa). `walletBalance` — bazadagi son,
undan orqada real pul yo'q.

Ya'ni bu yerda tasvirlangan baglar **hech kimning pulini yo'qotmagan**.

**Lekin ular baribir muhim, va aynan shu sababdan:** portfolio loyihasining
maqsadi — *domenni to'g'ri modellashtira olishni ko'rsatish*. Escrow —
pul bilan bog'liq holat mashinasi. Uni float'da yozish yoki poyga holatini
ochiq qoldirish, real pul bo'lmasa ham, **domenni tushunmaslikni ko'rsatadi**.

Va teskarisi ham rost: bu baglarni **topib, tushunib, tuzatish** — real pul
bo'lmasa ham, o'sha tushunishning dalili.

---

## 1. Domen: pul qanday harakat qiladi

```
                  ┌──────────────────────────────────────────┐
                  │  MIJOZ (client)                          │
                  │  walletBalance   escrowBalance           │
                  └────┬─────────────────────▲───────────────┘
                       │                     │
      fundMilestone    │                     │  rejectMilestone
      (wallet→escrow)  │                     │  (escrow→wallet, qaytarish)
                       ▼                     │
                  ┌──────────────────────────┴───────────────┐
                  │  ESCROW — pul band, lekin hali hech kimniki emas │
                  └────┬─────────────────────────────────────┘
                       │
      approveMilestone │  escrow → freelancer.wallet (net)
                       │           + platforma (fee)
                       ▼
                  ┌──────────────────────────────────────────┐
                  │  FRILANSER          PLATFORMA            │
                  │  walletBalance      platformFee          │
                  └──────────────────────────────────────────┘
```

Uchta o'tish, uchtasi ham `milestones`/`contracts` servislarida:

| O'tish | Kod | Nima qiladi |
|---|---|---|
| **Escrow'ni to'ldirish** | `contracts.service.ts` `fundMilestone` | mijoz hamyoni → escrow |
| **Qabul qilish** | `milestones.service.ts` `approveMilestone` | escrow → frilanser (net) + platforma (fee) |
| **Rad etish** | `milestones.service.ts` `rejectMilestone` | escrow → mijoz hamyoni |

**Invariant — butun tizimning asosi:**

```
SUM(walletBalance) + SUM(escrowBalance) = o'zgarmas
```

Pul **ko'chadi**, yaratilmaydi va yo'qolmaydi. Quyidagi baglarning hammasi —
shu invariantning buzilishi.

---

## 2. Baza to'g'ri. Muammo undan yuqorida.

```bash
grep -n "Float\|float\|real" backend/src/database/entities/*.ts   # → hech narsa
```

Har pul ustuni:
```ts
@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
walletBalance: number;
```

**`numeric(10,2)` — to'g'ri qaror.** Postgres'da `numeric` — aniq o'nlik
arifmetika, float emas. Maksimum: 99 999 999.99.

⚠️ **Shuning uchun "pul float bilan saqlangan" tanqidi bu loyihaga TEGISHLI
EMAS.** Agar boshqa TZ'da shunday yozilgan bo'lsa — u boshqa loyiha haqida.
Bu yerda baza to'g'ri qilingan va buni tan olish kerak.

Zarar **TypeScript'da** bo'lgan.

---

## 3. ⚠️ `amount: number` — runtime'da yolg'on

```bash
grep -rn "transformer" backend/src/database/entities/*.ts   # → bo'sh
```

**TypeORM Postgres'dan `decimal` ni `string` qaytaradi.** Bu — ataylab: `numeric`
JS `number` ga sig'maydi (`numeric` ixtiyoriy aniqlikda, `number` esa float64).
Transformer qo'shilmagan.

Ya'ni:

```ts
@Column({ type: 'decimal', precision: 10, scale: 2 })
amount: number;              // ← annotatsiya
// runtime: "1000.00"        // ← haqiqat
```

**Butun loyihada har pul maydoni — `number` annotatsiyasini kiygan string.**

### Nega bu shunchaki noqulaylik emas

Tur tizimi **izchil yolg'on gapiradi**, ya'ni u xatoni **yashiradi**:

```ts
bid.amount * 0.1     // "1000.00" * 0.1 → 100      ✅ ishlaydi — `*` majburlaydi
bid.amount + fee     // "1000.00" + 100 → "1000.00100"  ❌ satr birikmasi
```

Birinchisi **tasodifan** to'g'ri. Kompilyator ikkalasini ham qabul qiladi,
chunki u ikkalasini ham `number` deb biladi.

Va eng yomoni: **to'g'ri qiymat yozmoqchi bo'lsangiz — kompilyator to'sadi.**
Escrow tuzatishida (`d412913`) `numeric` dan kelgan aniq string'ni `Payment`
ga yozmoqchi bo'lganda `tsc` xato berdi:

```
error TS2769: Type 'string' is not assignable to type 'number'
```

Ya'ni tur tizimi **yolg'onni qabul qilib, haqiqatni rad etdi**. Shuning uchun
kodda ikkita izohli cast qoldi:

```ts
platformFee: platformFee as unknown as number,
netAmount:   netAmount   as unknown as number,
```

Bular — **annotatsiya yolg'onining ko'rinadigan uchi**. Ular yashirilmasin.

### Yechim — `04-data-model.md` §"Yechim taqqoslash" da

Uch variant bor (maydonlarni `string` qilish · `decimal→number` transformer ·
`decimal→Decimal.js` transformer) va ularning narxi o'sha hujjatda
taqqoslanadi. ⚠️ Qisqacha: **`decimal→number` transformer eng oson va eng
noto'g'ri** — u muammoni "hal qiladi" va aniqlikni jimgina yo'qotadi.

---

## 4. ✅ TUZATILGAN — `fundMilestone` poygasi (`d412913`)

### Nima bo'lgan

```ts
const client = await this.userRepo.findOne({ where: { id: clientId } });
if (Number(client.walletBalance) < Number(milestone.amount)) {   // ← tekshiruv
  throw new BadRequestException('Insufficient wallet balance');
}

const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction();                             // ← tranzaksiya KEYIN

try {
  await queryRunner.manager.decrement(User, { id: clientId }, 'walletBalance', ...);
  await queryRunner.manager.increment(User, { id: clientId }, 'escrowBalance', ...);
```

**Klassik check-then-act.** Tekshiruv tranzaksiyadan **tashqarida va undan
oldin**, debet esa **shartsiz**.

Ikki bir vaqtdagi so'rov:

```
T1: balansni o'qidi → 100
T2: balansni o'qidi → 100
T1: 100 >= 100 ✓ → tranzaksiya → -100 → balans 0
T2: 100 >= 100 ✓ → tranzaksiya → -100 → balans -100   ← escrow yo'q puldan
```

Va sxemada **manfiy balansni taqiqlovchi `CHECK` yo'q** — qator bemalol
noldan pastga tushadi.

⚠️ **Diqqat:** `decrement()` ning o'zi atomik (`SET x = x - 1` bitta operator).
Muammo unda emas — **tekshiruv bilan debet orasidagi bo'shliqda**.

### Endi

```ts
const debited: Array<{ walletBalance: string }> = await queryRunner.query(
  `UPDATE "users"
      SET "walletBalance" = "walletBalance" - $1::numeric,
          "escrowBalance" = "escrowBalance" + $1::numeric
    WHERE "id" = $2
      AND "walletBalance" >= $1::numeric
RETURNING "walletBalance"`,
  [milestone.amount, clientId],
);

if (debited.length === 0) {
  throw new BadRequestException('Insufficient wallet balance');
}
```

**Tekshiruv va debet — bitta operator.** Postgres `WHERE` ni o'zi qulflayotgan
qatorga nisbatan baholaydi, shuning uchun yutqazgan yozuvchi **allaqachon
yechilgan** balansni ko'radi va hech qanday qatorga mos kelmaydi. 0 qator =
mablag' yetarli emas.

⚠️ **Bu `READ COMMITTED` ga tayanadi** — Postgres'ning default'i, va bu yerda
o'zgartirilmagan. Yuqoriroq izolyatsiya darajasida (`REPEATABLE READ`) bu
naqsh **boshqacha** ishlaydi: `UPDATE` serialization xatosi bilan yiqiladi,
jim o'tmaydi. Ya'ni xavfsiz, lekin xato turi boshqa. Agar kimdir izolyatsiya
darajasini oshirsa — bu joyni qayta ko'rish kerak.

Va arifmetika `numeric` da qoldi: `Number()` orqali float64'ga tushmaydi.

**Bu ikkala bagni bitta yechim hal qildi** — chunki ikkalasining sababi bitta
edi: **arifmetika bazadan chiqarib olingan**.

---

## 5. ✅ TUZATILGAN — komissiya taqsimoti pul yaratardi (`d412913`)

### Nima bo'lgan

```ts
const platformFee = Number(milestone.amount) * (Number(contract.platformFeePercent) / 100);
const netAmount   = Number(milestone.amount) - platformFee;
```

`fee` va `net` **mustaqil** hisoblanardi, keyin Postgres ikkalasini **alohida**
`numeric(10,2)` ga yaxlitlardi.

**Invariant `fee + net = amount` buzildi.** Misol — `$0.05` milestone, 10%:

| | Hisoblangan | `numeric(10,2)` ga yaxlitlangan |
|---|---|---|
| `fee` | 0.005 | **0.01** |
| `net` | 0.045 | **0.05** |
| **Jami to'lov** | 0.05 | **0.06** |
| **Escrow'dan yechilgan** | | **0.05** |

**Platforma bir tiyin yaratdi.** Har milestone'da. Yopiq tizim invarianti
buzildi.

⚠️ **Halol tashxis: float sabab EMAS.** Float uni yomonlashtiradi, lekin
asosiy sabab — **ikkita mustaqil yaxlitlash**. `Decimal.js` bilan yozilganda
ham xuddi shu bo'lardi, agar `net` `amount - fee` deb ta'riflanmasa.

### Endi

```ts
const [split]: Array<{ platformFee: string; netAmount: string }> =
  await queryRunner.query(
    `SELECT round($1::numeric * $2::numeric / 100, 2) AS "platformFee",
            $1::numeric - round($1::numeric * $2::numeric / 100, 2) AS "netAmount"`,
    [milestone.amount, contract.platformFeePercent],
  );
```

**`fee` bir marta yaxlitlanadi. `net` — qoldiq deb ta'riflanadi.** Yig'indi
`amount` ga teng — hisoblab emas, **konstruksiya bo'yicha**.

Bu — Farzin va Kelvin'dagi `Money.allocate()` ning aynan o'zi: qoldiqni
taqsimla, hech qachon mustaqil yaxlitlama.

---

## 6. ⚠️ Hali float'da qolgan — TZ hal qiladi

| Joy | Kod | Baho |
|---|---|---|
| `milestones.service.ts:183` | `Number(milestone.escrowAmount \|\| milestone.amount)` — `rejectMilestone` | **Pul ko'chiradi.** Poyga yo'q (escrow allaqachon band), lekin float. Tuzatilsin |
| `bids.service.ts:237` | `bid.amount * (PLATFORM_FEE_PERCENT / 100)` | String × number. **Tasodifan ishlaydi.** `+` bo'lganda satr birikardi |
| `contracts.service.ts:274` | `Number(totalAmount) - Number(paidAmount)` | Faqat **ko'rsatish** uchun. Xavfi past, lekin izchillik uchun tuzatilsin |

⚠️ **`rejectMilestone` ni tuzatish — bu ro'yxatdagi eng muhimi**, chunki u
pulni ko'chiradi. Yechim `fundMilestone` bilan bir xil: `numeric` da, bitta
operatorda.

⚠️ Va unda **teskari poyga** bor: escrow'dan yechish `walletBalance >= x`
shartiga muhtoj emas (escrow allaqachon band), **lekin** `escrowBalance` ham
manfiy bo'lishi mumkin, agar `rejectMilestone` ikki marta chaqirilsa.
`milestone.status` tekshiruvi buni to'sadimi — **TEKSHIRILSIN**. Bu ochiq
savol.

---

## 7. ⚠️ `review()` — noma'lum qiymat eng buzg'unchi shohobchaga tushadi

```ts
// milestones.controller.ts:51 — validatsiya YO'Q (inline tip, klass emas)
@Body() dto: { action: 'approve' | 'reject' | 'request_revision'; feedback?: string }

// milestones.service.ts — review()
if (dto.action === 'approve')                { return this.approveMilestone(...) }
else if (dto.action === 'request_revision')  { ... }
else                                          { return this.rejectMilestone(...) }
```

`action: "typo"` → `else` → **jimgina rad etadi va escrow'ni qaytaradi**.

**Halol baho — oshirmang:** bu **imtiyoz oshirish EMAS**. Mijoz baribir
`reject` yubora oladi; bu uning huquqi va o'z puli. Muammo boshqa: **mijoz
kodidagi xato yoki yozuv xatosi pulni ko'chiradi va hech qanday xato
qaytmaydi.**

TypeScript literal union'i (`'approve' | 'reject' | ...`) bu yerda **hech
narsa qilmaydi** — u kompilyatsiya vaqtidagi tur, HTTP tanasi esa runtime'da
keladi. Va `@Body() dto: {...}` inline tip bo'lgani uchun `ValidationPipe`
metatip ko'rmaydi va **umuman ishga tushmaydi** (`05-security.md` §validatsiya).

**Yechim:**
```ts
export class ReviewMilestoneDto {
  @IsIn(['approve', 'reject', 'request_revision'])
  action: 'approve' | 'reject' | 'request_revision';

  @IsOptional() @IsString() @MaxLength(2000)
  feedback?: string;
}
```
Va `review()` da `else` o'rniga aniq `else if (action === 'reject')` +
oxirida `throw` — **noma'lum qiymat jimgina biror narsa qilmasin**.

---

## 8. Yetishmayotgan invariantlar

Bazada **hech narsa** quyidagilarni majburlamaydi:

| Invariant | Hozir | Kerak |
|---|---|---|
| `walletBalance >= 0` | ❌ hech narsa | `CHECK ("walletBalance" >= 0)` |
| `escrowBalance >= 0` | ❌ hech narsa | `CHECK ("escrowBalance" >= 0)` |
| `paidAmount <= totalAmount` | ❌ | `CHECK` |
| `fee + net = amount` (payments) | ❌ | Kod invarianti + test |
| Tizim yopiq: `SUM(wallet) + SUM(escrow)` o'zgarmas | ❌ | Test (`06-testing.md`) |

⚠️ **`CHECK` constraint — arzon va kuchli.** U tuzatilgan poyga qaytib kelsa
ham **bazani** himoya qiladi: kod xato qilsa, tranzaksiya yiqiladi. Bu —
"ikkinchi mudofaa chizig'i".

⚠️ **Lekin qo'shishdan oldin o'lchov:** agar bazada allaqachon manfiy balans
bo'lsa, `ALTER TABLE ... ADD CHECK` **yiqiladi**. Avval:
```sql
SELECT id, "walletBalance", "escrowBalance" FROM "users"
 WHERE "walletBalance" < 0 OR "escrowBalance" < 0;
```
Agar qator qaytsa — bu **migratsiya emas, hodisa**: poyga allaqachon ishlagan.

⚠️ Va `CHECK` qo'shish uchun **migratsiya kerak** — u esa yo'q
(`02-architecture.md`, `07-roadmap.md` §0). Ya'ni bu ish **migratsiya
tizimidan keyin**.

---

## 9. Double-entry buxgalteriya kerakmi?

**Halol javob: hozir yo'q.**

Nexus'da `payments` jadvali bor va u har harakatni yozadi (`ESCROW_DEPOSIT`,
`MILESTONE_PAYMENT`, `PLATFORM_FEE`, `REFUND`). Bu — **jurnal**, va u
yetarli darajada yaxshi.

Double-entry qo'shish (har tranzaksiya debet+kredit, `SUM(debit) =
SUM(credit)`) **haqiqiy buxgalteriya tizimi** uchun kerak: soliq hisoboti,
audit, ko'p valyuta, kechiktirilgan hisob-kitob. Nexus'da bularning
**hech biri yo'q**.

⚠️ **Ortiqcha murakkablik ham xato.** "Double-entry ishlatdim" degan
portfolio loyihasi, agar u kerak bo'lmasa, **domenni tushunmaslikni**
ko'rsatadi — xuddi float bilan pul yozgandek.

**O'rniga: invariantlar (§8) + testlar (`06-testing.md`).** Ular xuddi shu
kafolatni beradi va o'qilishi oson.

**Qachon qayta ko'riladi:** real to'lov provayderi ulanganda. O'shanda
tashqi tizim bilan **reconciliation** kerak bo'ladi va jurnal yetarli
bo'lmaydi.

---

## 10. To'lov provayderi — qachon va nima

Hozir yo'q. Qo'shilsa:

⚠️ **Eng muhim qoida:** summa **provayderning callback'idan** kelsin,
**hech qachon so'rov tanasidan**. Hozirgi `fundMilestone` mijoz aytgan
summani oladi — soxta pulda bu muhim emas, real pulda bu **falokat**.

⚠️ **Idempotentlik majburiy.** Provayder callback'ni **bir necha marta**
yuborishi mumkin (bu ularning dizayni, bag emas). `payments.transactionId`
bor — unique constraint bormi? **TEKSHIRILSIN**.

⚠️ **Valyuta.** `contract.currency || 'USD'` — default `USD`. Lekin
`walletBalance` da valyuta **yo'q**. Ya'ni hamyon valyutasiz son. Ko'p
valyuta qo'shilsa — bu buziladi. Ochiq savol.

---

## 11. Ochiq savollar

| # | Savol | Nega muhim |
|---|---|---|
| S1 | `rejectMilestone` ikki marta chaqirilsa `escrowBalance` manfiy bo'ladimi? `milestone.status` tekshiruvi buni to'sadimi? | §6 — tuzatilmagan poyga bo'lishi mumkin |
| S2 | `payments.transactionId` da unique constraint bormi? | Idempotentlikning asosi |
| S3 | Bazada allaqachon manfiy balans bormi? | §8 — `CHECK` qo'shishdan oldin. Agar bor bo'lsa — poyga **ishlagan** |
| S4 | `walletBalance` valyutasiz. Ko'p valyuta rejadami? | §10 |
| S5 | Dispute yechilganda pul qanday ko'chadi? `disputes` moduli escrow'ga tegadimi — **tekshirilmagan** | Escrow holat mashinasidagi bo'shliq |
| S6 | `bid-milestone` va `milestone` — ikki entity. Bid qabul qilinganda ko'chiriladimi? Summalar mos keladimi? | Yig'indi invarianti |

---

## 12. Xulosa — bu hujjatdan nima olinadi

Uchta bag topildi, ikkitasi tuzatildi, va uchalasining **sababi bitta**:

> **Arifmetika bazadan chiqarib olingan edi.**

`numeric` ustunlar to'g'ri tanlangan, keyin har qiymat `Number()` orqali
float64'ga tortilgan, JS'da hisoblangan, va yaxlitlanib qaytarilgan. Baza
aniqlikni saqlashga tayyor edi — kod undan foydalanmadi.

Yechim ham bitta: **arifmetikani `numeric` da qoldirish.** Shartli `UPDATE`
poygani ham hal qildi, chunki tekshiruv ham o'sha operatorga ko'chdi.

Qolgani — §6 dagi uchta joy, §7 dagi validatsiya, va §8 dagi
`CHECK` constraint'lar. Ular **migratsiya tizimidan keyin**
([07-roadmap](./07-roadmap.md) §0).
