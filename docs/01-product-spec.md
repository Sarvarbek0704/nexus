# 01 — Mahsulot spetsifikatsiyasi

> **Hujjat maqomi:** Loyiha · **Oxirgi yangilanish:** 2026-07-16
> **Asos:** o'qilgan real kod — `backend/src/` (9 633 qator, 15 modul, 25 entity), `frontend/app/` (36 sahifa, 56 `.tsx`)
>
> ⚠️ **Nexus — portfolio loyihasi. Real foydalanuvchi yo'q, real pul yo'q.**
> Hamyon (`walletBalance`) — bazadagi raqam, to'lov provayderi ulanmagan.
> Bu hujjat ishlab turgan mahsulotni emas, **yozilgan kodni** tavsiflaydi.
>
> Har bir da'vo `fayl:qator` bilan. Tekshirib bo'lmagan narsa — **ochiq savol**.
> Bozor tahlili → `./00-vision-and-market.md` · Pul mexanikasi → `./03-money-and-escrow.md`

---

## 1. Nexus nima

Frilanser bozori: mijoz loyiha e'lon qiladi → frilanser yoki agentlik taklif
(bid) beradi → mijoz birini qabul qiladi → shartnoma tug'iladi → ish
**milestone**larga bo'linadi → har milestone uchun pul **escrow**ga qo'yiladi →
frilanser topshiradi → mijoz qabul qiladi → pul chiqadi. Kelishmovchilik bo'lsa —
**nizo (dispute)**, uni admin hal qiladi.

Domen aynan shu sababdan tanlangan: unda **escrow**, **ko'p tomonli tranzaksiya**,
**rol modeli** va **holat mashinasi** bir joyda uchraydi. Bular texnik jihatdan
qiziq. Bu **biznes rejasi emas** — sababi `./00-vision-and-market.md` da.

### 1.1. O'lchangan hajm

| | |
|---|---|
| Backend | **9 633** qator TypeScript · **15** modul · **25** entity |
| Frontend | **36** sahifa (`page.tsx`) · **56** `.tsx` · Next.js **app router** |
| Commit | **25** |
| **Testlar** | **0** — `find . -name '*.spec.*' -o -name '*.test.*'` → bo'sh |
| Stack | NestJS · TypeORM · PostgreSQL · Next.js · JWT (Bearer header) |

---

## 2. Aktyorlar

Rollar `backend/src/database/entities/user.entity.ts:12-17` da, **bitta enum**da:

```ts
export enum UserRole {
  CLIENT = 'client',
  FREELANCER = 'freelancer',
  AGENCY_OWNER = 'agency_owner',
  ADMIN = 'admin',
}
```

⚠️ **Rol — foydalanuvchida bitta maydon** (`user.entity.ts:66-67`), ro'yxatda emas.
Ya'ni bir odam bir vaqtda mijoz **ham**, frilanser **ham** bo'la olmaydi. Upwork'da
bu mumkin. Bu — bilib qilingan soddalashtirish emas, shunchaki shunday chiqqan;
oqibati 8-bo'limda.

### 2.1. Client (mijoz)

| Nima qiladi | Qayerda |
|---|---|
| Loyiha e'lon qiladi, tahrirlaydi, holatini o'zgartiradi | `projects.service.ts:27`, `:147`, `:166` |
| Kelgan bidlarni ko'radi, shortlist qiladi, qabul/rad etadi | `bids.service.ts` → `bids.controller.ts:53` |
| Shartnomani imzolaydi | `contracts.service.ts:68` |
| Milestone escrow'ini to'ldiradi | `contracts.service.ts:185` `fundEscrow` |
| Topshiriqni qabul qiladi / qayta ishlashga qaytaradi / rad etadi | `milestones.service.ts:122` `review` |
| Nizo ochadi | `disputes.service.ts:28` |
| Frilanserga sharh yozadi | `reviews.service.ts:32` |
| Hamyonni to'ldiradi / yechadi | `payments.service.ts:65`, `:102` |

**Profili:** `client-profile.entity.ts` — `companyName`, `industry`, `totalSpent`,
`isPaymentVerified`. Ro'yxatdan o'tishda avtomatik yaratiladi
(`auth.service.ts:442` `createProfileForRole`).

### 2.2. Freelancer

| Nima qiladi | Qayerda |
|---|---|
| Loyihalarni qidiradi, filtrlaydi | `projects.service.ts:62` `findAll` |
| Bid yuboradi (+ o'z milestone taklifi bilan) | `bids.service.ts:36` |
| Bidni qaytarib oladi | `bids.service.ts` → `bids.controller.ts:64` |
| Shartnomani imzolaydi | `contracts.service.ts:68` |
| Milestone topshiradi | `milestones.service.ts:55` `submit` |
| Nizo ochadi, xabar yozadi | `disputes.service.ts:28`, `:113` |
| Mijozga sharh yozadi | `reviews.service.ts:32` |

**Profili:** `freelancer-profile.entity.ts` — `hourlyRate`, `experienceLevel`,
`skills` (M2M, `eager: true` — `:115`), `portfolioItems`, `education`,
`certifications`, `employmentHistory` (uchalasi `jsonb`).

### 2.3. Agency owner

| Nima qiladi | Qayerda |
|---|---|
| Agentlik yaratadi | `agencies.service.ts:26` |
| A'zo taklif qiladi | `agencies.service.ts:113` `inviteMember` |
| Taklifga javob beradi | `agencies.service.ts:148` `respondToInvite` |
| A'zoni chiqaradi | `agencies.service.ts:177` |
| **Agentlik nomidan bid beradi** | `bids.service.ts:63` — `dto.agencyId` bo'lsa `BidType.AGENCY` |

⚠️ **`AGENCY_OWNER` — eng cheklanmagan rol.** Kontrollerlarda u deyarli hamma
joyda uchraydi: `bids.controller.ts:23` (bid bera oladi, frilanser kabi),
`bids.controller.ts:37` (bidlarni ko'ra oladi, mijoz kabi),
`milestones.controller.ts:35` (topshira oladi) **va** `milestones.controller.ts:46`
(qabul qila oladi — mijoz kabi). Ya'ni agentlik egasi milestone'ni **ham topshira,
ham qabul qila oladi**. Xizmat qatlami buni to'xtatadi (`milestones.service.ts:62`
va `:129` shartnoma tomonini tekshiradi), lekin **rol darajasida** chegara yo'q.
Bu — kod ishlaydi, ammo himoya faqat bitta qatlamda. → `./05-security.md`

### 2.4. Admin

| Nima qiladi | Qayerda |
|---|---|
| Platforma statistikasi | `stats.service.ts:37`, `stats.controller.ts:18` `@Roles(ADMIN)` |
| Barcha loyihalar | `projects.service.ts:125` `adminFindAll` |
| Barcha shartnomalar | `contracts.service.ts:309` |
| Barcha to'lovlar (qidiruv bilan) | `payments.service.ts:160` |
| **Nizoni hal qiladi** | `disputes.service.ts:148` `resolve` — `@Roles(ADMIN)` `disputes.controller.ts:64` |

Admin — **yagona mediator**. `dispute.entity.ts:62-67` da `mediatorId` bor,
lekin alohida "mediator" roli yo'q; `disputes.service.ts:170` mediator sifatida
hal qilgan adminni yozadi.

### 2.5. Demo foydalanuvchi (rol emas, bayroq)

`user.entity.ts:120-121` `isDemo: boolean`. Seed 4 ta demo hisob yaratadi —
har rol uchun bittadan (`seed.ts:299-302`). `DemoGuard` (`common/guards/demo.guard.ts`)
ularga **faqat o'qishga** ruxsat beradi. Batafsil → `./02-architecture.md` §5.

---

## 3. Asosiy oqimlar

### 3.1. Ro'yxatdan o'tish → OTP → login

```
POST /api/auth/register    auth.service.ts:54
  └→ 6 xonali OTP (:67), 10 daqiqa (:68) → email (:91)
  └→ rolga qarab profil (:442 createProfileForRole)
POST /api/auth/verify-otp  auth.service.ts:110
POST /api/auth/login       auth.service.ts:187
  └→ accessToken (7d) + refreshToken (30d)      :425-439
     payload: { sub, email, role, isDemo }      :426
```
OAuth ham bor — Google va GitHub (`auth.controller.ts:120-146`,
`auth.service.ts:252`).

⚠️ **OTP hech qanday cheklovsiz.** 6 xonali kod = 1 000 000 variant, 10 daqiqa
oynasi. `ThrottlerModule` sozlangan (`app.module.ts:48-58`), lekin
**`ThrottlerGuard` hech qayerda ro'yxatdan o'tmagan** (`grep -rn "ThrottlerGuard"
backend/src` → **nol**) → `render.yaml` dagi `THROTTLE_TTL`/`THROTTLE_LIMIT`
**hech narsa qilmaydi**. Login'ga ham tegishli. → `./05-security.md`

### 3.2. Loyiha e'loni → bid → shartnoma

```
POST /api/projects           projects.service.ts:27   status: OPEN (project.entity.ts:60)

POST /api/bids               bids.service.ts:36
  ├─ loyiha OPEN'mi (:43) · o'z loyihangmi (:46) · takroriy bid (:50)
  └─ tranzaksiya (:55): Bid (:68) + BidMilestone[] (:70-80)
                        + project.bidsCount++ (:82)
     bid 30 kunda eskiradi (:65)

PATCH /api/bids/:id/status   bids.controller.ts:53 → acceptBid (:225)
  └─ tranzaksiya (:205):
       ├─ bu bid → ACCEPTED (:211)
       ├─ boshqa PENDING bidlar → REJECTED (:217-221)
       ├─ Contract yaratiladi (:223-241)
       │    clientSigned = true avtomatik (:234)
       │    platformFeePercent env'dan (:237)
       ├─ BidMilestone → Milestone ko'chiriladi (:244-257)
       └─ project → IN_PROGRESS (:259)
```

**Kuchli tomon:** butun qabul qilish oqimi **bitta tranzaksiyada**
(`bids.service.ts:205-265`). Bid qabul qilinib, shartnoma yaratilmay qolishi
mumkin emas.

⚠️ `bids.service.ts:229` — shartnoma turi `bid.milestones?.length > 0 ? FIXED : HOURLY`.
Ya'ni **milestone taklif qilmagan har bid soatbay shartnomaga aylanadi** —
loyihaning `type` maydoni (`project.entity.ts:63-64`) **umuman o'qilmaydi**.
Mijoz `FIXED` loyiha e'lon qilib, `HOURLY` shartnoma olishi mumkin. Va soatbay
oqim to'liq emas: `TimeLog` entity bor (`time-log.entity.ts`), lekin **uni
yaratadigan modul yo'q** — `grep -rn "TimeLog" backend/src/modules` faqat
`contracts.service.ts:31` dagi `relations` ro'yxatida uchraydi.

### 3.3. Shartnoma imzolash

```
PATCH /api/contracts/:id/sign   contracts.service.ts:68
  ├─ status PENDING'mi?         contracts.service.ts:71
  ├─ tomonmisan?                contracts.service.ts:78
  ├─ ikkinchi imzo bo'lsa → ACTIVE + startDate   contracts.service.ts:92-99
  └─ ikkala tomonga bildirishnoma                contracts.service.ts:102-123
```

Amalda mijoz imzosi bid qabul qilishda avtomatik qo'yiladi
(`bids.service.ts:234-235`), shuning uchun bu endpoint deyarli **faqat
frilanser** uchun ishlaydi.

### 3.4. Milestone escrow → topshirish → qabul → to'lov

Bu — loyihaning **markazi**. To'liq mexanika → `./03-money-and-escrow.md`.

```
① POST /api/contracts/:id/fund      contracts.service.ts:185 fundEscrow
     ├─ ACTIVE'mi? (:188) · escrow to'lganmi? (:194)
     └─ tranzaksiya (:196):
          ├─ ✅ bitta shartli UPDATE (:219-227):
          │    walletBalance -= amt, escrowBalance += amt
          │    WHERE walletBalance >= amt RETURNING
          │    0 qator = mablag' yetarli emas (:229)
          ├─ milestone → IN_PROGRESS, isEscrowFunded=true (:233)
          └─ Payment(ESCROW_DEPOSIT) (:239)

② POST /api/milestones/:id/submit   milestones.service.ts:55
     ├─ frilansermisan (:62) · ACTIVE'mi (:63)
     ├─ status IN_PROGRESS | REVISION_REQUESTED? (:66)
     ├─ ⚠️ escrow to'langanmi? (:70)  ← ishning oldiga to'lov shart
     ├─ urinishlar limiti (:76) — maxRevisions + 1
     └─ tranzaksiya: submission + milestone → SUBMITTED (:80-101)

③ PATCH /api/milestones/:id/review  milestones.service.ts:122
     ├─ mijozmisan (:129) · status SUBMITTED'mi (:130)
     ├─ 'approve'          → approveMilestone (:255)
     ├─ 'request_revision' → (:141)
     └─ boshqa HAMMA NARSA → rejectMilestone (:168) ⚠️

④ approveMilestone                  milestones.service.ts:255
     ├─ ✅ fee bir marta numeric'da yaxlitlanadi (:274-279)
     │    net = amount - fee (ta'rif bo'yicha → yig'indi teng)
     ├─ frilanser walletBalance += net (:283)
     ├─ mijoz escrowBalance -= escrow (:287)
     ├─ contract.paidAmount += amount (:291)
     ├─ 2 Payment: MILESTONE_PAYMENT (:299) + PLATFORM_FEE (:325)
     ├─ milestone → PAID (:350)
     └─ hamma PAID → shartnoma COMPLETED (:379, :390)
```

**Kuchli tomon:** har uch bosqich tranzaksiyada, `fundEscrow` dagi balans
tekshiruvi **atomik** (bitta `UPDATE ... WHERE ... RETURNING`), va komissiya
taqsimoti **konstruksiya bo'yicha** yig'indini saqlaydi. Bu ikkalasi ham
avval bug edi va tuzatilgan (commit `d412913`) — tarixi `./03-money-and-escrow.md` da.

### 3.5. Nizo (dispute)

```
POST /api/disputes              disputes.service.ts:28
  ├─ tomonmisan?                :38
  ├─ shartnoma ACTIVE'mi?       :41
  ├─ ochiq nizo bormi?          :45   ← ConflictException
  ├─ respondent avtomatik       :50   (ikkinchi tomon)
  └─ javob muddati: 5 kun       :51

POST /api/disputes/:id/messages   disputes.service.ts:113
  └─ senderType roldan kelib chiqadi   :118-122
       ADMIN → MEDIATOR, aks holda CLAIMANT yoki RESPONDENT

PATCH /api/disputes/:id/resolve   disputes.service.ts:148   @Roles(ADMIN)
  └─ tranzaksiya:               :158
       ├─ dispute → RESOLVED_*  :163
       ├─ contract → ACTIVE     :173
       └─ SYSTEM xabari         :177
```

⚠️ **Nizo hal qilinadi, lekin pul ko'chmaydi.** `disputes.service.ts:148-214`
`resolvedAmount`, `claimantSharePercent`, `respondentSharePercent` ni
**yozib qo'yadi** (`:166-168`) va shartnomani `ACTIVE` ga qaytaradi (`:173`) —
ammo hech kimning `walletBalance` yoki `escrowBalance` iga tegmaydi. `Payment`
yozuvi yaratilmaydi. `DisputesService` `Payment` repositoriysini inject qiladi
(`:23`) va `generateTransactionId` ni import qiladi (`:11`) — **ikkalasi ham
ishlatilmaydi**. Ya'ni pul ko'chirish **rejalashtirilgan, yozilmagan**.

Oqibat: `RESOLVED_SPLIT` da 60/40 deb yozilsa ham escrow mijozning
`escrowBalance` ida qotib qoladi. Nizo — hozircha **hujjatlashtirish vositasi**,
arbitraj emas. Bu 1-darajali funksional bo'shliq.

### 3.6. Agentlik jamoa bilan bid berish

```
POST /api/agencies              agencies.service.ts:26    (owner yaratadi)
POST /api/agencies/:id/invite   agencies.service.ts:113   inviteMember
  └─ AgencyMember(status = PENDING)   agency-member.entity.ts:43-44
POST /api/agencies/:id/respond  agencies.service.ts:148   respondToInvite
  └─ ACTIVE yoki REJECTED

POST /api/bids  { agencyId }    bids.service.ts:36
  └─ bidType = AGENCY           bids.service.ts:63
```

⚠️ **Agentlik bid'i — faqat yorliq.** Kod nima qilmaydi:

1. **`agencyId` tekshirilmaydi.** `bids.service.ts:36-68` da `dto.agencyId`
   to'g'ridan-to'g'ri `Bid` ga yoziladi (`:61` `...dto` spread). Bidder shu
   agentlikning a'zosimi — **so'ralmaydi**. `AgencyMember` jadvaliga murojaat
   yo'q. `CreateBidDto:73` faqat `@IsUUID()` ni talab qiladi. Ya'ni **istalgan
   frilanser istalgan agentlik nomidan bid bera oladi**.
2. **Jamoa shartnomaga o'tmaydi.** `bids.service.ts:223-241` `Contract` yaratganda
   `freelancerId = bid.bidderId` (`:228`) — `agencyId` **ko'chirilmaydi**.
   `contract.entity.ts` da `agencyId` maydoni **umuman yo'q**. Shartnoma
   darajasida agentlik yo'qoladi.
3. **`revenueShare` hisoblanmaydi.** `agency-member.entity.ts:49-50` da
   `revenueShare` bor. `grep -rn "revenueShare" backend/src/modules` → **nol**.
   To'lov faqat `contract.freelancerId` ga boradi (`milestones.service.ts:285`).

Ya'ni: agentlik **profil sifatida** ishlaydi, **pul birligi sifatida** yo'q.
`allowAgencyBids` (`project.entity.ts:102-103`) ham hech qayerda o'qilmaydi.

### 3.7. Sharh (review)

```
POST /api/reviews               reviews.service.ts:32
  └─ updateUserRating           reviews.service.ts:161  (o'rtacha qayta hisoblanadi)
```

### 3.8. Xabarlar

```
messages.service.ts:22   getOrCreateConversation
messages.service.ts:144  sendMessage
```
Real-time **yo'q** — WebSocket/SSE yo'q, frontend polling qiladi.

---

## 4. Modul bo'yicha holat

15 modul, `backend/src/modules/`. "Qator" — modul katalogidagi `.ts` jami.

### `auth` — 855 qator
**Bor:** register + 6 xonali OTP (`:54`, `:67`), login (`:187`), refresh
(`:300`), forgot/reset password (`:315`, `:345`), change password (`:371`),
email verify (`:394`), Google + GitHub OAuth (`:252`), rolga qarab profil
yaratish (`:442`). **Yagona to'liq DTO qamroviga ega modul** — 8 ta DTO klass
(`dto/login.dto.ts`, `dto/register.dto.ts`).
**Yetishmaydi:** ThrottlerGuard ro'yxatdan o'tmagani uchun OTP va login
**cheklanmagan** (§3.1). `jwt.config.ts:4` — `JWT_SECRET` default qiymati
`'nexus-secret-key'`; env berilmasa jimgina shu ishlatiladi.

### `users` — 327 qator
**Bor:** profil o'qish/yangilash, avatar yuklash, frilanser qidiruvi, portfolio.
**Yetishmaydi:** DTO yo'q — `users.controller.ts` `Partial<...>` va `any` ga
tayanadi.

### `projects` — 620 qator
**Bor:** CRUD (`:27`, `:147`), filtrli qidiruv (`:62`), holat mashinasi (`:166`),
ko'rishlar hisobi (`:117`), o'xshash loyihalar (`:266`), tanlangan loyihalar
(`:257`), admin ro'yxati (`:125`). **2 ta to'liq DTO** — `CreateProjectDto`,
`QueryProjectDto` (validatsiya bilan).
**Yetishmaydi:** `type` (FIXED/HOURLY) shartnoma yaratishda o'qilmaydi (§3.2).
⚠️ **`visibility` yarim majburlangan:** `findAll` (`:72`) `visibility = 'public'`
ni **to'g'ri filtrlaydi** — lekin `findOne` (`:108-115`) **umuman tekshirmaydi**,
va `projects.controller.ts:59-60` uni `@Public()` deb e'lon qiladi. Ya'ni
`PRIVATE` loyiha ro'yxatda ko'rinmaydi, ammo **UUID bilan har kimga, hatto
autentifikatsiyasiz ochiq**. Yomonrog'i: `findOne` (`:112`) `relations` ga
`'bids'` ni qo'shadi — ya'ni bu ochiq endpoint **barcha raqobatchi bidlarni**
(summa, cover letter, bidder kimligi) qaytaradi. ID — UUID, ya'ni sanab
chiqib bo'lmaydi; lekin bir marta havola tarqalsa — hammasi ochiq.
`questions` (`:111`) e'londa bor, `questionAnswers` bid'da bor — lekin javob
savolga **mos kelishi tekshirilmaydi**.

### `bids` — 495 qator
**Bor:** bid yaratish + milestone taklifi (`:36`), qabul qilish tranzaksiyasi
(`:225`), withdraw, delete. `CreateBidDto` bor.
**Yetishmaydi:** `agencyId` a'zolikka tekshirilmaydi (§3.6). Nested
`milestones[]` **validatsiyadan o'tmaydi** — `create-bid.dto.ts:66-69` da
`@IsArray()` bor, ammo `@ValidateNested({ each: true })` va
`@Type(() => BidMilestoneDto)` **yo'q**. `grep -rn "ValidateNested" backend/src`
→ **butun loyihada nol**. Ya'ni `BidMilestoneDto` ning `@Min(1) amount` (`:16-19`)
**hech qachon ishlamaydi**: `milestones: [{ amount: -5000 }]` o'tadi va
`bids.service.ts:73` orqali bazaga yoziladi. `bids.service.ts:237` —
`bid.amount * (PERCENT / 100)`: string × number (→ `./04-data-model.md` §5).

### `contracts` — 424 qator
**Bor:** imzolash (`:68`), holat mashinasi to'liq matritsa bilan (`:134-142`),
`fundEscrow` atomik balans tekshiruvi bilan (`:185`), xulosa (`:277`).
**Yetishmaydi:** `addNote` (`:304`) — **hech narsa qilmaydi**, kelgan matnni
qaytaradi, saqlamaydi; `findOneSecure(id, userId, UserRole.ADMIN)` deb
chaqirilgani uchun (`:305`) tekshiruv ham o'tib ketadi. `contracts.service.ts:298`
— `Number(totalAmount) - Number(paidAmount)`. `terms` (`:72`) barcha shartnomada
bir xil qator (`bids.service.ts:239`).

### `milestones` — 499 qator
**Bor:** topshirish (`:55`), review (`:122`), approve to'lov taqsimoti bilan
(`:255`), reject escrow qaytarish bilan (`:174`), revision limiti, avtomatik
shartnoma yopish (`:390`).
**Yetishmaydi:** `milestones.controller.ts:51` — inline tip literali, `action`
**validatsiya qilinmaydi**; `review()` (`:139-171`) da `else` shohobchasi
**rad etadi va escrow'ni qaytaradi**. `action: "typo"` → xato yo'q, jimgina
rad. Imtiyoz oshirish emas (mijoz baribir rad eta oladi), lekin mijoz kodidagi
xato pulni ko'chiradi. `:183` — `Number(milestone.escrowAmount || milestone.amount)`.
`:317`, `:318`, `:334`, `:335` — 4 ta `as unknown as number` cast (izohlangan).

### `payments` — 263 qator
**Bor:** to'lov tarixi (`:19`), hamyon ma'lumoti (`:33`), deposit (`:65`),
withdraw (`:102`), admin ro'yxati qidiruv bilan (`:160`).
**Yetishmaydi:** ⚠️ **`withdraw` (`:102-141`) da aynan o'sha check-then-act
poygasi** — balans `:105-108` da tranzaksiyadan **tashqarida va undan oldin**
tekshiriladi, keyin `:115` da **shartsiz** `decrement`. Bu `fundEscrow` da
tuzatilgan bug'ning **aynan o'zi**; tuzatish **bitta joyga** qo'llanilgan,
**bug sinfiga** emas. Ikki bir vaqtdagi withdraw → balans manfiy.
`deposit` (`:65`) `PaymentType.ESCROW_DEPOSIT` ishlatadi (`:80`) — hamyon
to'ldirish escrow depoziti emas, tur noto'g'ri. To'lov provayderi yo'q: pul
`:74` da shunchaki `increment` qilinadi.

### `disputes` — 372 qator
**Bor:** ochish (`:28`), xabar almashish (`:113`), admin hal qilish (`:148`),
ro'yxatlar.
**Yetishmaydi:** ⚠️ **`resolve` pul ko'chirmaydi** (§3.5) — eng katta funksional
bo'shliq. 3 ta endpoint validatsiyasiz (`disputes.controller.ts:25`, `:58`, `:69`).
`disputes.controller.ts:88` — noma'lum `outcome` → `?? RESOLVED_CLAIMANT`, ya'ni
xato yozuv **da'vogar foydasiga** default beradi. Hozir zararsiz (pul ko'chmaydi),
lekin §3.5 tuzatilsa **darhol xavfli bo'ladi**.

### `reviews` — 252 qator
**Bor:** sharh yaratish (`:32`), javob (`:111`), reyting xulosasi (`:126`),
o'rtachani qayta hisoblash (`:161`). **Yaxshi yozilgan modul:** faqat
`COMPLETED` shartnomaga sharh (`:39`), tomon tekshiruvi (`:46`), takroriy sharh
`ConflictException` (`:51-54`), reyting 1–5 oralig'ida (`:56-58`).
**Yetishmaydi:** takroriy sharh tekshiruvi **faqat kodda** (`:51-54`) —
`review.entity.ts` da `(contractId, reviewerId, type)` **unique cheklovi yo'q**,
ya'ni ikki bir vaqtdagi so'rov ikkalasi ham o'tadi va reyting ikki marta
hisoblanadi. Bu — `fundEscrow` da tuzatilgan check-then-act naqshining
uchinchi nusxasi. → `./04-data-model.md` §6

### `agencies` — 313 qator
**Bor:** yaratish, a'zo taklifi/javobi/chiqarish, slug bo'yicha qidirish.
**Yetishmaydi:** §3.6 dagi hammasi — bid'da a'zolik tekshirilmaydi, shartnomada
agentlik yo'q, `revenueShare` ishlatilmaydi.

### `messages` — 314 qator
**Bor:** suhbat yaratish/olish (`:22`), yuborish (`:144`), tahrirlash (`:188`),
o'chirish (`:202`), o'qilgan deb belgilash (`:98`).
**Yetishmaydi:** real-time yo'q (polling). `messages.controller.ts:49`
validatsiyasiz. `message.entity.ts:69-70` `replyToId` — **oddiy ustun, FK emas**.

### `notifications` — 153 qator
**Bor:** yaratish (`:25`), bulk (`:30`), ro'yxat, o'qilmagan soni, o'chirish.
Butun loyihaning **eng ko'p ishlatiladigan bog'liqligi** — 8 modul import qiladi.
**Yetishmaydi:** push/email kanali yo'q — faqat bazaga yozadi va frontend
so'raydi.

### `skills` — 162 qator
**Bor:** skill/category CRUD, top skills (`:39`), qidiruv (`:73`). Yozish
endpointlari **to'g'ri himoyalangan** — `skills.controller.ts:40` va `:62`
ikkalasida ham `@Roles(UserRole.ADMIN)`; o'qish `@Public()` (`:47`, `:54`).
**Yetishmaydi:** `skills.controller.ts:43`, `:65` — inline tip literali,
validatsiyasiz. Xavf past (faqat admin yeta oladi), lekin `name` bo'sh qator
bo'lishi mumkin.

### `stats` — 555 qator
**Bor:** platforma statistikasi (`:37`), foydalanuvchi statistikasi (`:154`),
oylik o'sish/daromad (`:303-483`). Eng katta **read-only** modul.
**Yetishmaydi:** hammasi jonli agregat — kesh yo'q. Indeks yo'qligi bilan
birga (`./04-data-model.md` §6) bu birinchi sekinlashadigan joy.

### `mailer` — 279 qator
**Bor:** `@Global()` modul (`mailer.module.ts:1`), OTP, parol tiklash, to'lov
xabarnomasi shablonlari.
**Yetishmaydi:** navbat yo'q — SMTP sinxron. `milestones.service.ts:369-376`
buni biladi va `try { ... } catch { /* silent */ }` bilan o'raydi.

---

## 5. Frontend qamrovi

36 sahifa, 3 route guruh (`frontend/app/`):

| Guruh | Sahifalar |
|---|---|
| `(auth)` | login, register, forgot-password, reset-password, verify-email, oauth-callback |
| `(main)` | dashboard, projects (+`[id]`, `[id]/edit`, `my`, `post`), bids, contracts (+`[id]`), disputes (+`[id]`, `new`), payments, messages, notifications, profile, settings, freelancers (+`[id]`), agencies (+`[id]`, `my-agency`), admin (+users, projects, disputes, payments) |
| Ochiq | `/`, `/privacy`, `/terms` |

⚠️ **Aktyorlar route bilan ajratilmagan.** To'rt rol ham bitta `(main)` va bitta
`/dashboard` dan foydalanadi; ajratish **komponent ichida**:
`components/layout/Sidebar.tsx:69-73` rolga qarab navigatsiyani tanlaydi.
`Sidebar.tsx:69-73` da oxirgi `else` — `: adminItems`, ya'ni **notanish rol
admin menyusini oladi** (faqat havolalar; server baribir tekshiradi).

`/admin/*` faqat **klient tomonda** himoyalangan
(`app/(main)/admin/page.tsx:12-18`); `middleware.ts` **yo'q**.

Batafsil (tip almashinuvi, ikki API qatlami, `$NaN` buglari) →
`./02-architecture.md` §8.

---

## 6. Non-goals — Nexus nima QILMAYDI

1. **Real pul qabul qilmaydi.** To'lov provayderi (Stripe/PayPal) yo'q.
   `walletBalance` — `deposit` (`payments.service.ts:65`) orqali havodan
   yaratiladigan raqam. Escrow bug'lari **real pul yo'qotmaydi** — lekin ular
   **domen mantiqi** bug'lari va portfolio uchun aynan shu muhim.
2. **Upwork bilan raqobat qilmaydi.** Sabab `./00-vision-and-market.md` da.
3. **Real-time yo'q.** Xabar ham, bildirishnoma ham polling.
4. **Soatbay ish yopilmagan.** `TimeLog` entity bor, moduli yo'q (§3.2).
5. **Invoice yopilmagan.** `Invoice` + `InvoiceItem` entity bor
   (`invoice.entity.ts`, `invoice-item.entity.ts`), **`invoices` moduli yo'q** —
   15 modul ro'yxatida u yo'q. Faqat `contracts.service.ts:31` relations'da
   uchraydi. 2 entity — o'lik sxema.
6. **Ko'p valyuta yo'q.** `currency` maydonlari bor (`contract.entity.ts:90-91`
   va h.k.), lekin kurs konvertatsiyasi yo'q; hamma joyda `|| 'USD'`
   (`milestones.service.ts:319`). Ikki valyutali shartnoma — noto'g'ri natija.
7. **Mobil ilova yo'q.** Faqat responsive web.
8. **Ko'p ijarachi (multi-tenant) emas.**
9. **Test yo'q.** 0 ta. Bu non-goal emas — **qarz**. → `./06-testing.md`

---

## 7. Kuchli tomonlar

Tanqid uchun tanqid qilmaslik uchun — kodda **aniq to'g'ri** qilingan narsalar:

1. **Pul bazada `numeric(10,2)`** — 53 decimal ustun, **birortasi Float emas**.
   Ko'p portfolio loyihasi bu yerda yiqiladi. → `./04-data-model.md` §4
2. **Tranzaksiyalar ishlatilgan** — `bids.service.ts:205`,
   `contracts.service.ts:196`, `milestones.service.ts:80/178/256`,
   `disputes.service.ts:158`, `payments.service.ts:69/110`. Ko'p bosqichli pul
   operatsiyalari atomik. → `./02-architecture.md` §7
3. **`fundEscrow` balans tekshiruvi atomik** (`contracts.service.ts:219-227`) va
   **komissiya konstruksiya bo'yicha to'g'ri** (`milestones.service.ts:274-279`)
   → `./03-money-and-escrow.md`
4. **JWT Bearer header** (cookie emas) → CSRF yuzasi yo'q. → `./05-security.md`
5. **15 modul toza ajratilgan** — aylanma bog'liqlik **yo'q**, `forwardRef`
   **nol marta**. → `./02-architecture.md` §6
6. **Holat mashinalari aniq** — `contracts.service.ts:134-142` to'liq o'tish
   matritsasi; `Record<ContractStatus, ContractStatus[]>` tipi tufayli yangi
   status qo'shilsa **kompilyator majburlaydi**
7. **34 native Postgres enum** — baza oxirgi himoya. → `./04-data-model.md` §7
8. **Escrow ishdan oldin** (`milestones.service.ts:70`) — domen jihatdan
   to'g'ri: frilanser bo'sh va'daga ishlamaydi
9. **Next.js app router** — zamonaviy tanlov

---

## 8. Ochiq savollar

1. **Nizo pul ko'chirishi qanday bo'lishi kerak?** (§3.5) `RESOLVED_SPLIT` da
   komissiya kimdan olinadi? Milestone `REJECTED` bo'lib escrow qaytgan bo'lsa,
   nizo nimani taqsimlaydi? — 1-darajali mahsulot savoli.
2. **Bitta odam ham mijoz, ham frilanser bo'la oladimi?** (§2) Hozir yo'q.
   O'zgartirish `user.role` ni `roles[]` ga aylantirishni talab qiladi — bu
   migratsiyasiz muhitda (`./02-architecture.md` §3) qimmat.
3. **Agentlik pul birligimi yoki profilmi?** (§3.6) Agar birinchisi bo'lsa —
   `contract.agencyId`, `revenueShare` hisobi va agentlik hamyoni kerak.
4. **`AGENCY_OWNER` nega mijoz huquqlariga ega?** (`milestones.controller.ts:46`)
   Ataylanmi (agentlik subkontrakt beradi) yoki nusxa-joylashtirishmi?
5. **`GET /projects/:id` ochiq bo'lishi kerakmi?** (`projects.controller.ts:59`)
   SEO uchun ochiq loyiha sahifasi mantiqiy — lekin u **bidlarni ham qaytaradi**
   (`projects.service.ts:112`) va `visibility` ni tekshirmaydi. Uchta savol:
   (a) bidlar javobdan chiqarilsinmi, (b) `PRIVATE` loyiha 404 qaytarsinmi,
   (c) `INVITE_ONLY` uchun taklif mexanizmi kerakmi?
6. **Invoice va TimeLog entity'lari qoladimi?** (§6.4, §6.5) Agar 2 versiyada
   rejalashtirilmagan bo'lsa — o'chirilsin. O'lik sxema ham xarajat.
7. **O'zbekistonda mahalliy freelance platforma bormi?** Tekshirilmagan.
   → `./00-vision-and-market.md`
8. **Demo hisoblar productionda qoladimi?** Qolsa — seed productionda ishlaydimi,
   va `seed.ts:102-103` `TRUNCATE TABLE ... CASCADE` tasodifan ishga tushib
   ketmasligi nimadan kafolatlangan?

---

## 9. Keyingi qadamlar (ustuvorlik)

| # | Nima | Nega | Hujjat |
|---|---|---|---|
| 1 | **Migratsiya joriy qilish** | Sxema faqat entity fayllarida; dev va prod kafolatlangan mos kelmaydi | `./02-architecture.md` §3 |
| 2 | **Pul tipini hal qilish** | 53 decimal ustun `number` deb yolg'on gapiradi | `./04-data-model.md` §5 |
| 3 | **`disputes.resolve` pul ko'chirsin** | Domenning yarmi yo'q | §3.5 |
| 4 | **`payments.withdraw` poygasini yopish** | Tuzatilgan bug sinfi qaytadan ochiq | §4 `payments` |
| 5 | **8 endpointga DTO + `ValidateNested`** | Validatsiya ishlamaydi | `./05-security.md` |
| 6 | **`ThrottlerGuard` ro'yxatdan o'tkazish** | OTP/login cheklanmagan | `./05-security.md` |
| 7 | **FK indekslari** | Postgres avtomatik yaratmaydi | `./04-data-model.md` §6 |
| 8 | **Pul oqimiga testlar** | 0 ta test | `./06-testing.md` |

To'liq reja → `./07-roadmap.md`
