# 02 — Tizim arxitekturasi

> **Hujjat maqomi:** Loyiha · **Oxirgi yangilanish:** 2026-07-16
> **Asos:** o'qilgan real kod — `backend/src/` (9 633 qator, 15 modul, 25 entity, 25 commit)
>
> ⚠️ Nexus — **portfolio loyihasi**, real foydalanuvchisi yo'q. Shuning uchun bu
> yerda "migratsiyaga o'tish qimmat, chunki prod ma'lumoti bor" degan to'siq
> **yo'q**. Aksincha: bu tuzatish uchun **eng arzon payt**.
>
> Har bir da'vo `fayl:qator` bilan. Tekshirilmagan narsa — **ochiq savol**.
> Mahsulot → `./01-product-spec.md` · Sxema → `./04-data-model.md` · Xavfsizlik → `./05-security.md`

---

## 1. Umumiy ko'rinish

```
┌──────────────────────────────────────────────────────────┐
│ frontend/ — Next.js app router · 36 sahifa · 56 .tsx     │ Vercel
│ ⚠️ middleware.ts YO'Q → route himoyasi faqat klientda    │
│ ⚠️ 2 parallel API qatlami (axios + 15 RTK Query)   §8    │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTP · JWT Bearer header (cookie EMAS)
                      │ ⚠️ umumiy tip paketi YO'Q — qo'lda nusxa §8
┌─────────────────────▼────────────────────────────────────┐
│ backend/ — NestJS modular monolit (bitta process)        │ Render
│                                                          │
│ main.ts: globalPrefix 'api'(:77) · helmet(:23)           │
│          compression(:27) · CORS allow-list(:48)         │
│          ValidationPipe global(:79) · Swagger(:127)      │
│          ClassSerializerInterceptor(:89)                 │
│                                                          │
│ app.module.ts providers (:76-80):                        │
│   APP_FILTER → GlobalExceptionFilter                     │
│   APP_INTERCEPTOR → TransformInterceptor                 │
│   APP_GUARD → DemoGuard         ← YAGONA global          │
│   ⚠️ JwtAuthGuard/RolesGuard import(:16-17), RO'YXATDAN  │
│      O'TMAGAN → har kontroller o'zi yozadi          §5   │
│   ⚠️ ThrottlerModule sozlangan(:48), ThrottlerGuard      │
│      ro'yxatdan o'tmagan → rate limit ISHLAMAYDI    §5   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 15 MODUL — aylanma bog'liqlik 0 · forwardRef 0   §6  │ │
│ │ auth·users·projects·bids·contracts·milestones·       │ │
│ │ payments·reviews·agencies·skills·disputes·           │ │
│ │ notifications·messages·stats·mailer                  │ │
│ └───────────────────────┬──────────────────────────────┘ │
│ ┌───────────────────────▼──────────────────────────────┐ │
│ │ common/ — guards·decorators·filters·interceptors     │ │
│ └───────────────────────┬──────────────────────────────┘ │
│ ┌───────────────────────▼──────────────────────────────┐ │
│ │ TypeORM · Repository + DataSource (queryRunner)      │ │
│ │ ⚠️ synchronize: NODE_ENV !== 'production'            │ │
│ │ ⚠️ migrations: [] — KATALOG MAVJUD EMAS         §3   │ │
│ └───────────────────────┬──────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
        ┌─────────────────▼────┐  ┌──────────────────────────┐
        │ PostgreSQL (Neon)    │  │ Lokal disk /uploads      │
        │ 25 entity · 34 enum  │  │ main.ts:21               │
        │ 53 numeric ustun     │  │ ⚠️ Render diski o'tkinchi │
        └──────────────────────┘  └──────────────────────────┘
        SMTP (Gmail) — mailer, sinxron, navbatsiz
```

**Repo tuzilishi:** root'da `package.json` **yo'q** — `backend/` va `frontend/`
ikki bog'liq bo'lmagan npm loyihasi bitta git repo ichida. Turbo/Nx/pnpm
workspace **yo'q**. Bu monorepo emas, **ikki papka**. Oqibati §8 da.

---

## 2. Qatlamlar: Controller → Service → Repository

Da'vo qilingan qatlamlash **kodda amal qiladi** — tekshirildi.

```
HTTP → Controller           validatsiya, guard, @CurrentUser
         ↓
       Service              domen mantiqi, tranzaksiya, avtorizatsiya
         ↓
       Repository / DataSource   TypeORM
         ↓
       PostgreSQL
```

**Tekshiruv natijalari:**

| Savol | Natija |
|---|---|
| Kontroller repositoriyni to'g'ridan-to'g'ri chaqiradimi? | **Yo'q** — `@InjectRepository` faqat `*.service.ts` da |
| Servis servisni chaqiradimi? | **Ha, lekin faqat pastga** — `NotificationsService` (8 modul), `MailerService` (2), `ConfigService` |
| Kontroller kontrollerni chaqiradimi? | **Yo'q** |
| Domen mantiqi kontrollerda bormi? | **Bir joyda bor** — `disputes.controller.ts:78-89` `outcome → DisputeStatus` xaritasi. Bu servisga tegishli |

Ya'ni qatlamlash **haqiqiy**, deklarativ emas. Bitta istisno yuqorida.

⚠️ **Kontroller qatlamining nomuvofiqligi:** kontrollerlar natijani
to'g'ridan-to'g'ri servisdan qaytaradi (`return this.xService...`) → **entity
to'g'ridan-to'g'ri HTTP javobiga chiqadi**, response DTO yo'q. Oqibati:
`user.password` faqat entity darajasidagi `select: false` (`user.entity.ts:41`)
bilan himoyalangan — ishlaydi, lekin bitta `addSelect` (`auth.service.ts:113`)
uni qaytaradi. **Himoya javob shaklida emas, so'rov shaklida.**
→ `./05-security.md`

---

## 3. ⚠️ Migratsiya umuman yo'q — 1-USTUVORLIK

Bu — arxitekturaning **eng katta muammosi**. Boshqa hamma narsadan oldin.

### 3.1. Fakt

```bash
find backend/src -ipath "*migration*" -name "*.ts" | wc -l   # 0
```

`backend/src/config/database.config.ts`:

```ts
14:    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
15:    synchronize: process.env.NODE_ENV !== 'production',
```

Config migratsiya katalogiga ishora qiladi — **katalog mavjud emas**.
Migratsiya fayli **0 ta**. `package.json` da `typeorm migration:*` skripti ham
yo'q (tekshirilsin — ochiq savol).

### 3.2. Nega bu shunchaki "yetishmayotgan xususiyat" emas

Ikki muhit **ikki xil mexanizm** bilan ishlaydi:

| | dev (`NODE_ENV !== 'production'`) | production |
|---|---|---|
| `synchronize` | **`true`** | `false` |
| Sxema qayerdan | Entity'dan, **har ishga tushishda avtomatik** | **Hech qayerdan** |
| O'zgarish qanday yetadi | TypeORM `ALTER TABLE` ni **jimgina** bajaradi | **Hech qanday** |

Ya'ni **dev'da** entity'ga ustun qo'shsangiz — bazada **darhol va jimgina**
paydo bo'ladi (artefakt yo'q, review yo'q). **Productionda** o'sha entity
deploy bo'ladi, ustun esa **paydo bo'lmaydi** → `column "x" does not exist` → 500.

**Oqibat: repodan production sxemasini qurishning iloji yo'q.** Sxema hech
qayerda **yozilmagan** — u entity fayllarining hozirgi holatidan kelib
chiqadigan **hosila**. Ikki muhit **hech qachon kafolatlangan tarzda mos
kelmaydi** — tasodifan mos kelishi mumkin, kafolat yo'q.

### 3.3. Dalil: migratsiya seed ichiga yashirilgan

Bu nazariy emas. `backend/src/database/seed.ts:112-116`:

```ts
  // Add isDemo column if missing
  await AppDataSource.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "isDemo" boolean NOT NULL DEFAULT false
  `).catch(() => {});
```

Bu — **qo'lda yozilgan migratsiya**, seed skriptiga yashiringan. Kimdir
`user.entity.ts:120-121` ga `isDemo` qo'shgan, `synchronize` dev'da uni
yaratgan, **productionda yaratmagan**, va yagona chiqish yo'li — DDL ni
seed'ga suqib qo'yish bo'lgan. `.catch(() => {})` esa xato bo'lsa
**jimgina yutadi**.

Bu — migratsiya tizimi yo'qligining **eng aniq isboti**: ehtiyoj bor, mexanizm
yo'q, shuning uchun ehtiyoj noto'g'ri joydan chiqib ketgan.

### 3.4. `synchronize` — TypeORM'ga xos xavf

⚠️ Bu — **Prisma'da yo'q** muammo (§4 dagi taqqoslashdan farqli o'laroq, bu
haqiqatan ham TypeORM ayb). Prisma'da `prisma migrate dev` **majburiy**;
`prisma db push` bor, lekin ataylab "prototip uchun" deb belgilangan va default
emas. TypeORM'ning `synchronize: true` esa:

1. **Ma'lumot yo'qotishi mumkin** — ustun nomini o'zgartirsangiz TypeORM buni
   "eski o'chdi, yangi qo'shildi" deb tushunadi → `DROP COLUMN`. Dev'da bu
   "mayli, seed qayta ishlataman" — ammo bu **odat** yaratadi.
2. **Enum'ni xavfsiz o'zgartira olmaydi** — 34 native enum ustuni bor
   (`./04-data-model.md` §7); `ALTER TYPE ... ADD VALUE` ni ishonchli
   bajarmaydi.
3. **Indeks nazoratini beradi** — `@Index` yozmasangiz indeks yo'q, yozsangiz
   ham `CONCURRENTLY` yo'q.

### 3.5. Yechim

Bu — **eng arzon payt**, chunki himoya qilinadigan production ma'lumoti yo'q.

```
1. `synchronize: false` — HAR IKKI muhitda
2. `typeorm migration:generate` — hozirgi entity holatidan boshlang'ich
   migratsiya (baseline). Bu birinchi marta katta fayl bo'ladi — normal
3. `package.json` ga skript: migration:generate / migration:run / migration:revert
4. `seed.ts:112-116` dagi qo'lda ALTER ni o'chirish — endi migratsiyada
5. Render start command'iga `migration:run` qo'shish (`render.yaml`)
6. CI: migratsiya generatsiya qilingandan keyin entity o'zgargan bo'lsa —
   build yiqilsin (drift detektori)
```

**Narxi:** ~1 kun. **Qaytimi:** sxema versiyalanadi, review qilinadi,
qaytariladi, va ikki muhit **kafolatlangan** mos keladi.

⚠️ Diqqat: `migration:generate` **hozirgi dev bazasidan** emas, **entity
fayllaridan** o'qiydi. Dev bazasi `synchronize` tufayli entity'dan farq qilishi
mumkin (masalan qo'lda qo'shilgan `isDemo`, yoki o'chirilgan entity'dan qolgan
jadval). Baseline generatsiya qilishdan **oldin** dev bazasini **noldan**
qayta qurish kerak — aks holda drift migratsiyaga ko'chadi.

---

## 4. TypeORM tanlovi — halol taqqoslash

Nexus TypeORM ishlatadi. Bu tanlovni ikki qismga ajratish kerak, chunki
ular **turli javoblar** beradi.

### 4.1. `decimal → string` — bu TypeORM ayb EMAS

TypeORM Postgres'dan `decimal` ni **string** qaytaradi, garchi entity'da
`amount: number` deb yozilgan bo'lsa ham. Bu — loyihaning eng katta tur
muammosi (`./04-data-model.md` §5).

⚠️ **Lekin bu Prisma'da ham bor.** Prisma `Decimal` maydonini
**`Decimal.js` obyekti** sifatida qaytaradi — `number` emas. Ya'ni:

| | TypeORM | Prisma |
|---|---|---|
| Bazada | `numeric(10,2)` | `Decimal @db.Decimal(10,2)` |
| JS'da qaytadi | `string` | `Decimal` obyekti (decimal.js) |
| `a + b` ishlaydimi? | **Yo'q** — satr birikmasi | **Yo'q** — obyekt birikmasi |
| Tur tizimi ogohlantiradimi? | **Yo'q** — annotatsiya `number` deb yolg'on gapiradi | **Ha** — tip `Decimal`, `+` kompilyatsiya xatosi |

**Farq annotatsiyada, transportda emas.** Ikkala ORM ham `number` qaytara
olmaydi — chunki `number` (IEEE-754 float64) pulni **saqlay olmaydi**. Bu
to'g'ri qaror, ikkalasida ham.

Prisma'ning ustunligi: u **rost gapiradi**. TypeORM'niki: u `number` deb
yozishga **ruxsat beradi** va yolg'onni kompilyator ushlamaydi.

Ya'ni: bu **TypeORM ayb emas, entity annotatsiyalarining ayb**. Va u
transformer bilan tuzatiladi (`./04-data-model.md` §5) — ORM almashtirmasdan.
**"Prisma'ga o'tsak pul muammosi hal bo'ladi" — bu noto'g'ri.**

### 4.2. `synchronize` — bu TypeORM'ga xos xavf

§3.4 da. Bu — **haqiqiy** farq. Prisma migratsiyani majburlaydi, TypeORM yo'q.

Lekin: TypeORM'da ham `synchronize: false` + `migration:generate` bor. Ya'ni
muammo **TypeORM imkoniyati yo'qligida emas, default'ida**. TypeORM sizga
o'zingizni otish uchun qurol beradi; Prisma bermaydi.

### 4.3. Qaror: TypeORM'da qolish

- Pul muammosi Prisma'da ham bor (§4.1) → **migratsiya sababi emas**
- `synchronize` xavfi (§4.2) → `synchronize: false` bilan **yopiladi**, ORM
  almashtirmasdan
- 25 entity + 15 modul qayta yozish → ~2-3 hafta, **nol funksional qaytim**
- `queryRunner.query()` xom SQL (§7) → TypeORM bunga **yaxshi ruxsat beradi**;
  `milestones.service.ts:274-279` aynan shunga tayanadi
- ⚠️ **Hal qiluvchi: testlar 0 ta** → testsiz ORM migratsiyasida regressiyani
  **hech narsa ushlamaydi**

**Tavsiya: TypeORM'da qolish.** Sabab Prisma yomonligida emas — **migratsiya
qilishning qaytimi yo'qligida**. Muammolar (§3, `./04-data-model.md` §5)
TypeORM ichida **arzonroq** hal qilinadi. Loyiha noldan boshlanayotgan bo'lsa —
Prisma tavsiya qilinardi (majburiy migratsiya + rost tur tizimi); 9 633 qator
yozilgandan keyin esa bu **sunk cost emas, real xarajat**.

⚠️ **Halol e'tirof:** TypeORM tanlovi hujjatlashtirilmagan. `README.md` da
sabab yo'q. Bu — "shu bilib tanlangan" emas, "shu bilan boshlangan". Yuqoridagi
tahlil — **keyingi asoslash**, boshlang'ich qaror emas.

---

## 5. `common/guards` — himoya arxitekturasi

### 5.1. Uch guard

| Guard | Fayl | Qanday qo'llanadi |
|---|---|---|
| `JwtAuthGuard` | `common/guards/jwt-auth.guard.ts` | **Har kontrollerda qo'lda** `@UseGuards(...)` |
| `RolesGuard` | `common/guards/roles.guard.ts` | Xuddi shunday |
| `DemoGuard` | `common/guards/demo.guard.ts` | **Global** — `app.module.ts:79` `APP_GUARD` |

⚠️ **`JwtAuthGuard` va `RolesGuard` `app.module.ts:16-17` da import qilingan,
lekin `providers` (`:76-80`) ga qo'shilmagan.** Ya'ni ular **global emas** —
har kontroller o'zi `@UseGuards` yozishi kerak.

**Hozir qamrov to'liq:** 14 kontrollerning **hammasi** `@UseGuards` yozgan
(`agencies:17`, `auth:22`, `bids:18`, `contracts:17`, `disputes:17`,
`messages:14`, `milestones:15`, `notifications:13`, `payments:16`,
`projects:20`, `reviews:14`, `skills:14`, `stats:13`, `users:20`).

**Lekin default noto'g'ri tomonga qaragan** — `@UseGuards` yozishni unutgan
yangi kontroller **butunlay ochiq**; xavfsizlik "eslab qolish"ga tayanadi.
`@Public()` dekorator allaqachon bor (`common/decorators/public.decorator.ts`)
va `JwtAuthGuard:13-17` uni hurmat qiladi → **global qilish uchun hamma narsa
tayyor**, faqat `app.module.ts:76-80` ga ikki qator:

```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: RolesGuard },
```

Shunda default **yopiq** bo'ladi, `@Public()` esa ataylab ochadi. → `./05-security.md`

### 5.2. `ThrottlerGuard` — sozlangan, ishlamaydi

`app.module.ts:48-58` `ThrottlerModule.forRootAsync` ni sozlaydi:

```ts
ttl:   parseInt(config.get('THROTTLE_TTL')   || '60') * 1000,
limit: parseInt(config.get('THROTTLE_LIMIT') || '100'),
```

`render.yaml` ham ularni beradi (`THROTTLE_TTL=60`, `THROTTLE_LIMIT=100`).

⚠️ **`ThrottlerGuard` hech qayerda ro'yxatdan o'tmagan.**

```bash
grep -rn "ThrottlerGuard" backend/src   # → 0 natija
```

`ThrottlerModule` — faqat konfiguratsiya provayderi; cheklashni **`ThrottlerGuard`
bajaradi**. U `APP_GUARD` sifatida ro'yxatdan o'tmasa yoki `@UseGuards` bilan
qo'llanmasa — **hech narsa cheklanmaydi**.

Ya'ni: sozlama bor, env bor, `render.yaml` da bor — **effekt yo'q**. Bu
eng yomon turdagi bug: u **himoya bor** degan taassurot qoldiradi.
Eng ko'p ta'sir: 6 xonali OTP (`auth.service.ts:67`) va login — ikkalasi ham
cheksiz urinishga ochiq. → `./05-security.md`

Tuzatish — bir qator:
```ts
{ provide: APP_GUARD, useClass: ThrottlerGuard },
```

### 5.3. `DemoGuard` — xunuk, lekin teshik EMAS

`common/guards/demo.guard.ts` mutatsiyalarni (`POST/PATCH/PUT/DELETE`, `:19`)
demo hisoblardan to'sadi. `isDemo` ni JWT payload'idan **imzoni tekshirmasdan**
o'qiydi (`:32-34`):

```ts
const payloadBase64 = token.split('.')[1];
const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
isDemo = payload?.isDemo ?? false;
```

⚠️ **Buni zaiflik deb yozmaslik kerak — u emas.**

Sabab: guard faqat **cheklaydi**, hech qachon ruxsat bermaydi. Hujumchi
`isDemo: false` deb soxtalashtirsa — `DemoGuard` o'tkazadi (`:41` shart
bajarilmaydi), keyin `JwtAuthGuard` **imzoni tekshiradi** va **rad etadi**.
Ya'ni xato **fail-safe** yo'nalishda; imzosiz dekod bu yerda **imtiyoz
bermaydi**.

**Lekin:** u `JwtAuthGuard` dan **oldin** ishlashiga tayanadi — bu **yozilmagan
shart**. Nest'da global guard'lar kontroller guard'laridan oldin ishlaydi, ya'ni
hozir bajariladi — lekin bu **tasodifiy**, hech qayerda yozilmagan, va §5.1 dagi
tuzatish buni **o'zgartiradi**: ikkala guard global bo'lsa, tartib `providers`
massividagi tartibga bog'liq bo'lib qoladi.

**Yana bir kuzatuv:** `demo.guard.ts:24` `request.user?.isDemo ?? false` — bu
qator **hech qachon `true` bermaydi**. Chunki `DemoGuard` global, ya'ni
`JwtAuthGuard` dan **oldin** ishlaydi, ya'ni `request.user` shu paytda hali
**har doim `undefined`**. Ya'ni `:26` dagi `if (!isDemo)` **har doim** kiradi
va qo'lda dekod — "zaxira yo'l" emas, **yagona yo'l**.

**Tavsiya:** `request.user.isDemo` yetarli, qo'lda dekod olib tashlansin. Buning
uchun `DemoGuard` `JwtAuthGuard` dan **keyin** ishlashi kerak — ya'ni §5.1
bilan **birga** qilinishi shart, alohida emas. Tartib `app.module.ts` da
`APP_GUARD` lar ketma-ketligi bilan beriladi va **izoh bilan yozilsin** —
hozirgi yozilmagan shart o'sha yerda yozilgan shartga aylanadi.

---

## 6. Modullararo bog'liqlik — TEKSHIRILDI

```bash
grep -rn "forwardRef" backend/src --include=*.ts   # → 0 natija
```

**Aylanma bog'liqlik yo'q. `forwardRef` nol marta.** Bu — kuchli tomon; 15
modulli NestJS loyihasida odatiy emas.

Graf (`*.module.ts` `imports` dan):

```
  MailerModule @Global (mailer.module.ts:1) — graf qirrasi EMAS
                          │
   agencies:14 · bids:16 · contracts:14 · disputes:15 · messages:13
   milestones:15 · projects:13 · stats
                          │ (8 modul)
                          ▼
              NotificationsModule  ← BARG (notifications.module.ts:8
                                     faqat forFeature([Notification]))

  Hech narsani import qilmaydi (faqat TypeOrmModule.forFeature):
    notifications:8 · payments:9 · reviews:10 · skills:9 · users:12
```

**Graf — DAG.** `NotificationsModule` barg bo'lgani uchun aylana tug'ilmaydi.

⚠️ **Lekin bog'liqlik grafi entity bog'liqligini yashiradi.** Modullar bir-birini
import qilmasa ham, **bir xil entity'larni baham ko'radi**:
`User` — 9 modulda `forFeature` da, `Contract` — 5 modulda. Ya'ni
`MilestonesService` (`milestones.service.ts:24`) `User` repositoriysini
to'g'ridan-to'g'ri oladi va `walletBalance` ni **`UsersService` dan o'tmasdan**
o'zgartiradi (`:283-289`).

Bu — **modul chegarasi bor, ma'lumot chegarasi yo'q**. Hozirgi hajmda bu
muammo emas (va tranzaksiya uchun **shart** — §7). Lekin "hamyonga kim
tegadi?" degan savolning javobi: `contracts`, `milestones`, `payments`,
`disputes` — **to'rt modul**. Hamyon invariantlari (masalan
`walletBalance >= 0`) shuning uchun **hech qayerda markazlashmagan**.
→ `./03-money-and-escrow.md`

---

## 7. Tranzaksiya naqshi — TEKSHIRILDI

### 7.1. Naqsh: `queryRunner` qo'lda

```bash
grep -rn "createQueryRunner" backend/src   # → 7 joy
```

| Fayl:qator | Metod |
|---|---|
| `bids.service.ts:206` | `acceptBid` |
| `contracts.service.ts:196` | `fundEscrow` |
| `milestones.service.ts:80` | `submit` |
| `milestones.service.ts:178` | `rejectMilestone` |
| `milestones.service.ts:256` | `approveMilestone` |
| `disputes.service.ts:158` | `resolve` |
| `payments.service.ts:69`, `:110` | `deposit`, `withdraw` |

**Izchilmi? — HA.** 7/7 joyda **aynan bir xil** skelet:
`createQueryRunner()` → `connect()` → `startTransaction()` → `try { … commit }`
→ `catch { rollback; throw }` → `finally { release() }`.

`release()` **har doim `finally` da** — ulanish sizishi yo'q. `rollback`
**har doim `catch` da**. Bu — **kuchli tomon**: 5 fayl, 7 joy, nol og'ish.

⚠️ **Lekin naqsh 7 marta qo'lda takrorlangan.** TypeORM'da
`dataSource.transaction(async (manager) => { ... })` bor — u `connect`,
`commit`, `rollback`, `release` ni **o'zi** boshqaradi. 7 × 12 qator boilerplate
→ 0. Hozir izchil, chunki nusxa-joylashtirilgan; **8-chi nusxa** izchillikni
buzadigan joy.

### 7.2. Tranzaksiya chegarasi — bir joyda noto'g'ri

⚠️ **`payments.service.ts:102-141` `withdraw`:**

```
105:  const user = await this.userRepo.findOne(...)      ← tranzaksiyadan TASHQARIDA
106:  if (Number(user.walletBalance) < amount) throw     ← check
110:  const queryRunner = ...createQueryRunner()         ← tranzaksiya SHU YERDA boshlanadi
115:  await queryRunner.manager.decrement(...)           ← act, SHARTSIZ
```

Bu — **aynan** `fundEscrow` da tuzatilgan check-then-act poygasi
(`contracts.service.ts:202-213` dagi izoh uni tasvirlaydi). Ikki bir vaqtdagi
withdraw: ikkalasi ham `:105` da bir xil balansni o'qiydi, ikkalasi ham `:106`
dan o'tadi, ikkalasi ham `:115` da yechadi → **balans manfiy**.

Sxemada `walletBalance >= 0` CHECK cheklovi **yo'q** (`user.entity.ts:105-106`),
shuning uchun qator shunchaki noldan pastga tushadi.

**Tuzatish naqshi allaqachon repoda bor** — `contracts.service.ts:219-227`:
bitta shartli `UPDATE ... WHERE "walletBalance" >= $1 RETURNING`, 0 qator =
mablag' yetarli emas. Uni `withdraw` ga ko'chirish kerak.

**Xulosa:** tranzaksiya **skeleti** izchil (7/7), ammo tranzaksiya **chegarasi**
emas. `d412913` tuzatishi **bitta chaqiruv joyiga** qo'llanilgan, **bug sinfiga**
emas. Bu — testlar 0 bo'lgani uchun: regressiyani va o'xshash joylarni
**hech narsa ko'rsatmaydi**. → `./06-testing.md`

⚠️ **Uchinchi nusxa:** `reviews.service.ts:51-54` — takroriy sharh tekshiruvi
kodda, DB cheklovisiz. → `./04-data-model.md` §6

### 7.3. Tranzaksiya ichida xom SQL — to'g'ri qaror

`milestones.service.ts:274-279` va `contracts.service.ts:219-227`
`queryRunner.query()` bilan **xom SQL** ishlatadi:

```sql
SELECT round($1::numeric * $2::numeric / 100, 2) AS "platformFee",
       $1::numeric - round($1::numeric * $2::numeric / 100, 2) AS "netAmount"
```

Bu **ataylab** — arifmetika `numeric` da qoladi, JS float64 ga tushmaydi.
Izohlar (`:261-273`) sababini tushuntiradi. **To'g'ri qaror**, va
TypeORM'ning kuchli tomoni (u xom SQL ga to'sqinlik qilmaydi).

⚠️ Narxi: bu SQL **tekshirilmaydi** — na tur tizimi, na test. `$1::numeric`
noto'g'ri yozilsa runtime'da bilinadi.

### 7.4. Tranzaksiyadan tashqaridagi yon ta'sirlar — to'g'ri

Bildirishnoma va email **`commit` dan keyin** yuboriladi
(`contracts.service.ts:257-266`, `milestones.service.ts:356-376`) — **to'g'ri**:
tranzaksiya ichida bo'lsa, rollback email'ni qaytara olmaydi. Narxi: `commit`
bo'lib bildirishnoma yiqilsa — pul o'tdi, xabar yo'q;
`milestones.service.ts:369-376` buni biladi (`try/catch { /* silent */ }`).
Ongli **at-most-once** tanlovi. Ideal — outbox naqshi, lekin bu hajmda
ortiqcha. **Halol qayd: hozirgi yechim yetarli.**

---

## 8. Frontend ↔ backend chegarasi

### 8.1. Umumiy tip — YO'Q

⚠️ **Bu chegaraning eng katta muammosi.**

- Root'da `package.json` **yo'q** → npm/pnpm workspace **yo'q**
- Turbo / Nx / Lerna **yo'q**
- `frontend/tsconfig.json:20-22` faqat `"@/*": ["./*"]` — `backend/` ga yo'l **yo'q**
- Umumiy paket **yo'q**

Ya'ni **texnik jihatdan tip almashish imkonsiz** — repo shunga sozlanmagan.

Natijada `frontend/types/index.ts` (393 qator) — backend entity'larining
**qo'lda yozilgan nusxasi**. Backend `enum`, frontend **string literal union**:

| Tushuncha | Backend | Frontend |
|---|---|---|
| `UserRole` | `backend/src/database/entities/user.entity.ts:12-17` (enum) | `frontend/types/index.ts:1` (union) |
| `ProjectStatus` | `project.entity.ts:13-22` | `types/index.ts:160` |
| `MilestoneStatus` | `milestone.entity.ts:9-19` | `types/index.ts:263` |

Qiymatlar hozir **mos keladi**. Buni **hech narsa majburlamaydi**. Backend'da
enum qiymati o'zgarsa — frontend jimgina buziladi. Kompilyator ko'rmaydi,
test ham yo'q.

### 8.2. Nusxa ham ishlatilmaydi

Yomonrog'i: `types/index.ts` **56 `.tsx` dan atigi 5 tasida** import qilingan.

- Har bir RTK Query endpoint `builder.query<any, any>` — 15 api faylida
  **~75 marta**. Ya'ni **hech bir API javobi tekshirilmaydi**.
- `frontend/tsconfig.json:10` — `"strict": false`
- **Uchinchi, ziddiyatli `User`** — `store/slices/authSlice.ts:3-13`, `role: string`.
  Shuning uchun `Sidebar.tsx:78` da `user.role as UserRole` cast kerak bo'lgan

### 8.3. Buning narxi — ikki real bug

1. **`bid.bidAmount` — mavjud emas.** Backend maydoni `amount`
   (`bid.entity.ts:57`), frontend tipi ham **to'g'ri** aytadi
   (`types/index.ts:208`), yuborish yo'li ham to'g'ri (`BidSubmitModal.tsx:55`).
   Lekin **uch joy** `bid.bidAmount` o'qiydi → `formatCurrency(undefined)` →
   **`$NaN`**: `app/(main)/bids/page.tsx:112`,
   `components/dashboard/FreelancerDashboard.tsx:173`,
   `components/projects/BidCard.tsx:80`.
2. **Satr birikmasi** — `app/(main)/bids/page.tsx:135`:
   `formatCurrency(bid.milestones.reduce((sum, m) => sum + m.amount, 0))`.
   `m.amount` runtime'da **string** (§4.1) → `0 + "500.00" + "250.00"` →
   `"0500.00250.00"` → **`$NaN`**.

Ikkalasi ham **majburlangan umumiy tip ostida kompilyatsiya xatosi bo'lardi**.

### 8.4. Pul chegarada — himoya nomuvofiq

`formatCurrency` (`frontend/lib/utils.ts:9-16`) faqat `Intl.NumberFormat`,
arifmetika qilmaydi — **to'g'ri**. Muammo chaqiruv joylarida: backend `decimal`
ni **string** qaytaradi (§4.1), frontend buni **joy-joyda** himoyalaydi.

**Himoyalangan:** `Topbar.tsx:121`, `ClientDashboard.tsx:150,156`,
`FreelancerDashboard.tsx:139,145`, `BidSubmitModal.tsx:49`,
`admin/payments/page.tsx:42-45` — hammasi `Number(...)` bilan.
**Himoyalanmagan:** `bids/page.tsx:135` (§8.3) · `utils.ts:83-84`
`min.toLocaleString()` (stringda ajratkich yo'q) · `BidCard.tsx:68` `.toFixed()` ·
`agencies/[id]/page.tsx:87,286`.

⚠️ **Tarqoq `Number(...)` o'ramlari — diagnostika.** Ular kimdir bu bug'ga
**bir necha marta urilgani** va har safar **chaqiruv joyini** tuzatgani,
**chegarani** emas, degan dalil. Backend ham shunday: `payments.service.ts:60-61`
`parseFloat`, `contracts.service.ts:298` `Number(...)`. Ikkala tomon bir xil
kasallikni bir xil noto'g'ri joyda davolaydi.

**To'g'ri joy — bitta:** entity transformer'i (`./04-data-model.md` §5).
U qo'yilsa, bu `Number()` o'ramlarining **hammasi keraksiz** bo'ladi.

### 8.5. Ikki parallel API qatlami

- `frontend/lib/api.ts:1-103` — axios instance, refresh-navbat bilan (`:22-83`)
- `frontend/store/api/` — **15 ta RTK Query fayli**

⚠️ `store/api/baseApi.ts:46-50` `baseQueryWithReauth` bilan `baseApi` ni e'lon
qiladi — lekin **birorta fayl `injectEndpoints` chaqirmaydi**. Qolgan 14 fayl
**mustaqil `createApi({...})`** qiladi va `prepareHeaders` ni **o'zi qaytadan
yozadi** (`bidsApi.ts:6-15`). Ya'ni `baseApi.ts` — **o'lik kod**, va undagi
**401 → refresh mantiqi o'sha 14 endpoint uchun hech qachon ishlamaydi**.

**Oqibat:** access token 7 kundan keyin tugaydi (`jwt.config.ts:5`) → RTK Query
chaqiruvlari 401 → avtomatik refresh **yo'q**. Foydalanuvchi 7 kundan keyin
qayta login qilishga majburmi? — **ochiq savol**.

### 8.6. Auth — token ikki joyda

`frontend/lib/api.ts:85-91` `setTokens` **ham cookie, ham localStorage** ga
yozadi; o'qish cookie birinchi (`api.ts:15`, `:100-101`, `baseApi.ts:9`).
Cookie **`httpOnly` emas** (JS'dan yozilgan — bo'lishi mumkin ham emas),
`secure` faqat productionda (`api.ts:86-88`), `sameSite: 'lax'`.

⚠️ Lekin **cookie hech qachon `Authorization` header'siz ishlatilmaydi** —
`credentials: false` (`main.ts:65`), backend faqat Bearer header o'qiydi. Ya'ni
cookie bu yerda **shunchaki saqlash joyi**, sessiya mexanizmi emas →
**CSRF yuzasi yo'q** (kuchli tomon). Narxi: XSS bo'lsa token ochiq.
→ `./05-security.md`

---

## 9. Konfiguratsiya va deploy

`src/config/` — 4 fayl, `registerAs` naqshi bilan. Toza.

⚠️ **Har bir sirning xavfli default'i bor:**

| Fayl:qator | Default |
|---|---|
| `jwt.config.ts:4` | `JWT_SECRET` → `'nexus-secret-key'` |
| `jwt.config.ts:6` | `JWT_REFRESH_SECRET` → `'nexus-refresh-secret'` |
| `database.config.ts:11` | `DB_PASSWORD` → `'password'` |

Env berilmasa — ilova **yiqilmaydi**, jimgina **umumiy ma'lum** sir bilan
ishlaydi. `render.yaml` ularni `sync: false` bilan beradi (ya'ni dashboard'dan),
shuning uchun productionda **ehtimol** to'g'ri. Lekin kafolat kodda emas.

**Kontrast:** `main.ts:68-75` `CORS_ORIGINS` bo'sh bo'lsa **ishga tushmaydi** —
bu **to'g'ri naqsh**. U `JWT_SECRET` uchun ham qo'llanishi kerak.

⚠️ **`render.yaml` da `CORS_ORIGINS` YO'Q.** `main.ts:42` uni o'qiydi, `:68-75`
u bo'sh bo'lsa production'da **`throw`** qiladi. `render.yaml` esa 20+ env
e'lon qiladi va `CORS_ORIGINS` **ular orasida emas**.

Ya'ni: `render.yaml` bo'yicha deploy qilinsa — **backend ishga tushmaydi**.
U Render dashboard'ida qo'lda qo'shilgan bo'lishi mumkin (shunda ishlaydi,
lekin IaC fayli **yolg'on gapiradi**), yoki servis **hozir yiqilgan**.
**Ochiq savol** — `render.yaml` ga qo'shilishi kerak (`sync: false` bilan).

### 9.1. Fayl yuklash — o'tkinchi disk

`main.ts:21` — `useStaticAssets(join(__dirname, '..', 'uploads'))`.

⚠️ Render'ning fayl tizimi **o'tkinchi** — har deploy'da (va konteyner qayta
ishga tushganda) `/uploads` **yo'qoladi**. Avatar, portfolio rasmi, milestone
attachment — hammasi. Baza ularning yo'lini saqlaydi, fayl esa yo'q → **buzilgan
havola**.

Yechim: S3 / Cloudinary / Render persistent disk. Hozir — **ma'lumot yo'qotish
yo'li**, garchi ma'lumot soxta bo'lsa ham.

---

## 10. Ochiq savollar

1. **`render.yaml` da `CORS_ORIGINS` yo'q** (§9) — servis hozir ishlayaptimi?
   Dashboard'da qo'lda qo'yilganmi?
2. **`package.json` da `typeorm migration:*` skriptlari bormi?** (§3.1)
   Tekshirilmadi.
3. **7 kundan keyin foydalanuvchi qayta login qilishga majburmi?** (§8.5)
   RTK Query yo'lida refresh ishlamaydi.
4. **`baseApi.ts` o'lik kodmi yoki tugallanmagan refaktormi?** (§8.5) Agar
   birinchisi — o'chirilsin; ikkinchisi — 14 fayl `injectEndpoints` ga o'tsin.
5. **`DemoGuard` va `JwtAuthGuard` tartibi** (§5.3) — §5.1 tuzatilgandan keyin
   `APP_GUARD` tartibi qanday kafolatlanadi? Nest `providers` tartibini
   hurmat qiladi, lekin bu **hujjatlashtirilishi** kerak.
6. **`/uploads` productionda ishlaganmi?** (§9.1) Yoki hech kim fayl
   yuklamaganmi?
7. **`dataSource.transaction()` ga o'tilsinmi?** (§7.1) 7 × 12 qator
   boilerplate yo'qoladi, lekin 7 joyni tegish testlarsiz xavfli.
8. **Hamyon invariantlari qayerda yashashi kerak?** (§6) Hozir 4 modul
   `walletBalance` ga tegadi. DB CHECK cheklovimi (`walletBalance >= 0`),
   yoki `WalletService` mi?

---

## 11. Ustuvorlik

1. **Migratsiya** (§3.5) — ~1 kun. Sxema hech qayerda yozilmagan; prod ↔ dev kafolatsiz
2. **`ThrottlerGuard` ro'yxatdan o'tkazish** (§5.2) — ~5 daq. Bir qator; OTP/login ochiq
3. **`render.yaml` ga `CORS_ORIGINS`** (§9) — ~5 daq. Deploy fayli yolg'on gapiradi
4. **`payments.withdraw` poygasi** (§7.2) — ~1 soat. Naqsh repoda bor, ko'chirish kerak
5. **Pul transformer'i** (`./04-data-model.md` §5) — ~2 soat. 2 frontend bug yo'qoladi
6. **`JwtAuthGuard`/`RolesGuard` global** (§5.1) — ~1 soat. Default yopiq bo'lsin
7. **Pul oqimiga testlar** (`./06-testing.md`) — ~3 kun. #4 kabi bug'lar takrorlanmasin
8. **Umumiy tip paketi** (§8.1) — ~2 kun. Workspace kerak
9. **`/uploads` → S3** (§9.1) — ~4 soat. Fayllar deploy'da yo'qoladi

To'liq reja → `./07-roadmap.md`
