# 05 — Xavfsizlik (Security)

> **Loyiha:** Nexus — Freelance & Agency Marketplace
> **Hujjat holati:** hozirgi holat — **o'lchangan fakt** (`fayl:qator`). Tavsiyalar — reja.
> **Halol chegara:** portfolio loyihasi. To'lov provayderi **yo'q**, `walletBalance` —
> soxta pul. Hech bir bag **real moliyaviy zarar** keltirmaydi. Lekin ular **domen
> mantiqi** baglari — portfolio uchun aynan shu muhim.

**Bog'liq:** [03-money-and-escrow.md](./03-money-and-escrow.md) · [04-data-model.md](./04-data-model.md) ·
[06-testing.md](./06-testing.md) — bu yerdagi har da'voni **isbotlaydigan** testlar ·
[02-architecture.md](./02-architecture.md) · [07-roadmap.md](./07-roadmap.md)

> ## 🔴 AVVAL SHUNI O'QING
>
> Topilmalarning aksariyati "xunuk, lekin chegaralangan". **Bittasi bundan mustasno.**
>
> **`POST /api/auth/register` tanasiga `"role": "admin"` yozib, har kim o'ziga admin
> hisob ochadi.** Autentifikatsiya kerak emas, hiyla kerak emas, validatsiya buni
> **to'xtatmaydi** (`admin` — `UserRole` enum'ining haqiqiy a'zosi). Bitta so'rov.
>
> Admin nizolarni hal qiladi (escrow'ni **istalgan tomonga** ko'chiradi), barcha
> shartnoma/to'lov/foydalanuvchini o'qiydi, hisoblarni bloklaydi.
>
> **Tafsilot: 2.5. Tuzatish: `register.dto.ts` da 4 qator.** Qolgani shundan keyin.

---

## 1. Tahdid modeli

| Aktyor | Maqsadi | Nishoni |
|---|---|---|
| **Frilanser** | Ish qilmasdan escrow'ni olish; reytingini ko'tarish | `milestones` approve yo'li, `reviews` |
| **Mijoz** | Ishni olib to'lamaslik; escrow'ni qaytarib olish | `milestones` reject yo'li, `disputes` |
| **Tashqi hujumchi** | Hisobni egallash; begona shartnoma/summani o'qish | ⚠️ **`register` + `role:"admin"` (2.5) — boshqa hech narsa kerak emas**; brute-force; IDOR |
| **Demo foydalanuvchi** | Demo cheklovidan chiqish | `DemoGuard` (3) |

### 1.1 ⚠️ Pul soxta — buni yashirmaymiz

`payments.controller.ts:36-45` — Swagger'da ochiq: *"Deposit funds to wallet
(simulated)"*. `payments.service.ts:65-100` — provayder chaqirig'i yo'q, shunchaki
`increment(User, {id}, 'walletBalance', amount)`. Ya'ni **har kim o'ziga $10 000
gacha "quya oladi"** — bu **bag emas, dizayn**.

**To'g'ri xulosa:** escrow bagi pul yo'qotmaydi, u **holat buzadi** — balans manfiy,
yig'indi teng emas, escrow yo'q joydan to'ladi.

**Noto'g'ri xulosa** (uni yozmaymiz): "pul soxta, demak muhim emas". Escrow mantiqi
provayder ulanadigan kungacha **shu holatda** qoladi. Provayder ulash — bir kunlik
ish; buzilgan invariantni keyin tuzatish — migratsiya va hisob-kitob.

---

## 2. Autentifikatsiya

### 2.1 ✅ JWT Bearer header — kuchli tomon

`jwt.strategy.ts:16` — `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`.
Token **faqat** `Authorization` header'idan; cookie'dan **hech qachon**.
`main.ts:65` — `credentials: false`.

**Oqibat: CSRF yuzasi yo'q.** CSRF brauzer cookie'ni avtomatik yuborishiga tayanadi;
server cookie'ga qaramaydi. Begona sahifa `<form>` yuborsa — `Authorization` header
bo'lmaydi → 401. CSRF token, `SameSite`, double-submit — **hech biri kerak emas**.

### 2.2 ⚠️ Lekin sababni to'g'ri ayting

Frontend tokenni cookie'ga **ham** yozadi (`frontend/lib/api.ts:85-91`):

```ts
Cookies.set('accessToken', accessToken, { expires: 7, secure, sameSite: 'lax' });
Cookies.set('refreshToken', refreshToken, { expires: 30, secure, sameSite: 'lax' });
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

Cookie **bor**. Demak "cookie yo'q → CSRF yo'q" — **noto'g'ri formula**. To'g'risi:

> CSRF yuzasi yo'q, chunki **server** cookie'dan auth qilmaydi. Cookie bu yerda
> faqat **saqlash joyi**; tokenni JS o'qib header'ga qo'yadi.

Farq muhim: kimdir SSR uchun cookie o'qiydigan qatlam qo'shsa, CSRF yuzasi **bir
zumda** paydo bo'ladi va frontend allaqachon cookie yozib turibdi. Bu qaror
[02-architecture.md](./02-architecture.md) da yozilsin: *server hech qachon
cookie'dan auth qilmaydi*.

⚠️ `js-cookie` bilan yozilgan cookie **hech qachon `HttpOnly` emas** — u
`localStorage` dan **xavfsizroq emas**, shunchaki takroriy nusxa. 30 kunlik
`refreshToken` ikkala joyda ham JS uchun ochiq (9.4).

### 2.3 Access / refresh — TTL va rotation

`config/jwt.config.ts:4-8`:

| | Qiymat | Baho |
|---|---|---|
| Access TTL | **7 kun** | ⚠️ Juda uzun (odat: 5–15 daq) |
| Refresh TTL | **30 kun** | Normal |
| Alohida secret | **Ha** | ✅ To'g'ri |
| Rotation | **Yo'q** | ⚠️ |
| Revocation / `jti` | **Yo'q** | ⚠️ |

**✅ Alohida secret — ongli ajratish.** `auth.service.ts:428-437` access va refresh'ni
**bir xil payload** bilan imzolaydi. Secret bir xil bo'lganida refresh token access
sifatida ishlar edi (30 kunlik access!). Farqli bo'lgani uchun `jwt.strategy.ts:19`
(`secretOrKey: jwt.secret`) refreshni rad etadi.

**⚠️ Rotation yo'q** (`auth.service.ts:300-313`): `refreshTokens` eski tokenni bekor
qilmaydi → bitta refresh token 30 kun **cheksiz marta** ishlaydi. O'g'irlangani —
30 kunlik kirish, va **sezishning yo'li yo'q** (rotation bo'lganida o'g'ri va
egasi navbatma-navbat ishlatganda anomaliya ko'rinardi).

**⚠️ `logout` yolg'on** (`auth.controller.ts:98`): `jti`/blacklist yo'q → faqat
frontend tokenni o'chiradi (`frontend/lib/api.ts:93-98`). Server tomonda token
**hali yaroqli**. Xuddi shunday: **parol o'zgartirilganda ham eski token ishlaydi**
(`auth.service.ts:371-392`) — hisob o'g'irlangandan keyingi tiklanish yo'li buzilgan.

⚠️ **Halol yumshatish:** `jwt.strategy.ts:22-36` har so'rovda DB'dan userni o'qiydi
va `SUSPENDED`/`INACTIVE` ni rad etadi → admin hisobni bloklay oladi, darhol kuchga
kiradi. Bu revocation emas, lekin ojiz ham emas. **E'tibor:** bu har so'rovga bitta
`SELECT` qo'shadi — stateless JWT tejamkorligi allaqachon yo'q. Demak `jti` blacklist
**qo'shimcha narx emas**: DB so'rovi baribir bor.

**Tavsiya:** (1) access `15m`, refresh `7d`; (2) rotation + reuse detection;
(3) `token_version` ustuni — `changePassword`/`logout` uni oshirsin,
`jwt.strategy.ts` `validate` da solishtirsin (narx nol).

### 2.4 ⚠️ OTP — `Math.random()` va urinish chegarasi yo'q

`auth.service.ts:421-423`:

```ts
private generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

`Math.random()` — **kripto-xavfsiz emas** (V8: `xorshift128+`). OTP bu yerda
jiddiy: `verifyOtp` (`:110-153`) to'g'ri OTP'da **darhol to'liq token juftligi**
beradi (`:146`) — ya'ni OTP **autentifikatsiya omili**.

⚠️ **Oshirmaymiz:** holat tiklash uchun ketma-ket chiqishlar kerak. `Math.random()`
`generateUsername` (`generate.util.ts:44`) va `generateContractNumber` (`:5`) da ham
ishlatiladi, ular javoblarda **ko'rinadi** — oqim butunlay yopiq emas. Lekin bu
**nazariy zanjir, isbotlanmagan**. Tuzatish narxi nol, shuning uchun bahs ortiqcha:

```ts
import { randomInt } from 'node:crypto';
return randomInt(100_000, 1_000_000).toString();
```

⚠️ **Bundan MUHIMROQ: urinish chegarasi yo'q.** `auth.service.ts:134` faqat
`user.otpCode !== dto.otp` ni tekshiradi — noto'g'ri urinish **hisoblanmaydi**,
OTP **bekor qilinmaydi**. 900 000 variant, 10 daqiqa, rate limiting yo'q (6) →
**bruteforce oddiy**. Bu bashorat muammosidan jiddiyroq: 5 urinishdan keyin OTP
bekor qilinsin.

⚠️ Nomuvofiqlik: `passwordResetToken` esa `uuidv4()` (`generate.util.ts:52`) —
**kripto-xavfsiz**. Parol tiklash yaxshi, OTP yomon.

### 2.5 🔴 Ro'yxatdan o'tishda rol tanlash — imtiyoz oshirish

> **Kod bazasidagi eng jiddiy topilma. Zanjir to'liq tekshirilgan.**

**1 — `ADMIN` enum'da** (`database/entities/user.entity.ts:12-17`):

```ts
export enum UserRole { CLIENT='client', FREELANCER='freelancer', AGENCY_OWNER='agency_owner', ADMIN='admin' }  // :16
```

**2 — `RegisterDto` uni to'liq qabul qiladi** (`modules/auth/dto/register.dto.ts:35-38`):

```ts
@IsOptional()
@IsEnum(UserRole)      // ← 'admin' — enum'ning HAQIQIY a'zosi. Validatsiya O'TKAZADI.
role?: UserRole;
```

⚠️ Bu 4-bo'limdagi "validatsiya yo'q" muammosi **emas**. `RegisterDto` — to'g'ri DTO,
`@IsEnum` **ishlaydi**. Muammo: u **ishlaydi va `admin` ni o'tkazadi**, chunki `admin`
haqiqatan `UserRole` a'zosi. **Validatsiya o'z ishini bajardi; model noto'g'ri.**

**3 — servis so'zsiz saqlaydi** (`auth.service.ts:76`): `role: dto.role || UserRole.FREELANCER`

**4 — OTP hujumchining o'z pochtasiga** (`:91`) → `verifyOtp` (`:146`) **darhol token
beradi**: `payload = { sub, email, role: 'admin', isDemo }`

**5 — `RolesGuard` tokendagi rolga ishonadi** (`roles.guard.ts:24`). Imzo **haqiqiy**,
DB'da ham `role: 'admin'`. **Har tekshiruv o'tadi, chunki hujumchi haqiqatan admin.**

#### Ekspluatatsiya — 2 so'rov

```bash
curl -X POST https://<api>/api/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"attacker@mail.com","password":"Passw0rd1","firstName":"Ali","lastName":"Vali","role":"admin"}'
curl -X POST https://<api>/api/auth/verify-otp -H 'Content-Type: application/json' \
  -d '{"email":"attacker@mail.com","otp":"123456"}'      # → admin JWT
```

#### Admin nima qila oladi

**A. `@Roles(UserRole.ADMIN)` route'lari — 10 ta:**

| Route | Fayl | Ta'sir |
|---|---|---|
| `PATCH /disputes/:id/resolve` | `disputes.controller.ts:64` | 🔴 **Escrow'ni istalgan tomonga** |
| `PATCH /users/:id/status` | `users.controller.ts:117` | Istalgan hisobni bloklaydi |
| `GET /users/admin/all` · `GET /payments/admin` | `users.controller.ts:110` · `payments.controller.ts:59` | Barcha foydalanuvchi / to'lov |
| `GET /contracts/admin/all` · `GET /disputes/admin/all` | `contracts.controller.ts:32` · `disputes.controller.ts:41` | Barcha shartnoma / nizo |
| `GET /projects/admin/...` · `GET /stats/admin` | `projects.controller.ts:53` · `stats.controller.ts:18` | Barcha loyiha / statistika |
| `POST /skills` · `POST /skills/categories` | `skills.controller.ts:40` · `:62` | Ma'lumotnoma yozish |

**B. Servis darajasidagi IDOR bypass — 5 ta** (jimroq va yomonroq, `@Roles` da
ko'rinmaydi):

```
contracts.service.ts:42     userRole !== UserRole.ADMIN && ...   → HAR QANDAY shartnoma
disputes.service.ts:104     userRole !== UserRole.ADMIN && ...   → HAR QANDAY nizo
projects.service.ts:169     userRole !== UserRole.ADMIN && ...   → tahrirlash
projects.service.ts:245     userRole !== UserRole.ADMIN && ...   → o'chirish
bids.service.ts:310         userRole !== UserRole.ADMIN && ...   → HAR QANDAY taklif
```

Ya'ni 12-bo'limdagi "IDOR himoyasi 6 dan 5 tasida" xulosasi admin uchun **bekor** —
`findOneSecure` admin'ni **ataylab** o'tkazadi.

**C. Eng og'iri — `disputes.service.ts:148-175` `resolve`:** admin escrow'ni
**kimga va qancha** berishni o'zi belgilaydi (`resolvedAmount`, `claimantSharePercent`).
Bu — 1-jadvaldagi "frilanser escrow'ni oladi" va "mijoz to'lamaydi" **ikkala**
maqsadning to'g'ridan-to'g'ri yechimi: frilanser admin bo'ladi, nizo ochadi, o'z
foydasiga hal qiladi. `findOne` da egalik tekshiruvi yo'q — admin baribir o'tadi.

#### ⚠️ Halol chegara

1. **Pul soxta** (1.1) — real mablag' ketmaydi. Buziladigan narsa — platformaning
   **butun ishonch modeli**
2. **Email tasdig'i kerak** (`auth.service.ts:204-210`) — **to'siq emas**, o'z
   pochtasi yetarli. U faqat **iz qoldiradi**
3. **Yashirin emas:** `role` Swagger'da hujjatlashtirilgan (`register.dto.ts:35`
   `@ApiPropertyOptional({ enum: UserRole })`) va Swagger UI **ochiq**
   (`main.ts:127`) — `admin` qiymati **ro'yxatda turibdi**

**Nega bo'lgan — taxmin qilmaymiz.** Ehtimol enum **qayta ishlatilgan**. Bu tabiiy
xato: bitta enum ikki savolga javob beradi — *"tizimda qanday rollar bor?"* va
*"ro'yxatdan o'tuvchi qaysi rolni tanlashi mumkin?"* **Ikki savol — ikki tip.**

#### Tuzatish

```ts
// register.dto.ts — tizim rollari ≠ ro'yxatdan o'tish rollari
export const SELF_REGISTRABLE_ROLES = [
  UserRole.CLIENT, UserRole.FREELANCER, UserRole.AGENCY_OWNER,
] as const;                                     // ← ADMIN ATAYLAB YO'Q

@IsOptional()
@IsIn(SELF_REGISTRABLE_ROLES, { message: 'Invalid role' })
role?: UserRole;
```

2. **Servisda ikkinchi qatlam** (`auth.service.ts:76`) — DTO kelajakda o'zgarishi mumkin:
   `if (dto.role === UserRole.ADMIN) throw new ForbiddenException(...)`
3. **Mavjud ma'lumot:** `SELECT id, email, "createdAt" FROM users WHERE role='admin';`
   ⚠️ Repo **public**, deploy **jonli** — bu so'rov **tuzatishdan oldin** ishga tushsin
4. **Test** ([06-testing.md](./06-testing.md) 6.1) — aks holda tuzatish
   "soddalashtirish" bahonasida qaytarilishi mumkin
5. **Arxitektura savoli:** admin `users.role` da bo'lishi kerakmi? Mediator —
   **alohida imtiyoz**, oddiy rol emas. Ajratish B dagi 5 bypass'ni qayta ko'rishga majbur qiladi

---

## 3. `DemoGuard` — xunuk, lekin teshik EMAS

Bu bo'lim ehtiyotkor: "JWT'ni imzosiz dekodlaydi!" ni ko'rgan odam darrov "kritik"
deb yozadi. **Bu noto'g'ri bo'lardi.**

### 3.1 Nima qiladi

`common/guards/demo.guard.ts:15-48` — mutatsiyada (`POST/PATCH/PUT/DELETE`) `isDemo`
ni o'qiydi, rost bo'lsa `ForbiddenException`. `:26-39` — bayroqni JWT payload'idan
**imzosiz** oladi: `JSON.parse(Buffer.from(payloadBase64,'base64url').toString())`.

### 3.2 ⚠️ Nega zaiflik EMAS

Guard **faqat cheklaydi** — hech qachon kirish **bermaydi**. Uning `true` qaytarishi
**hech narsani tasdiqlamaydi**: keyin `JwtAuthGuard` (`jwt-auth.guard.ts:18`)
imzoni tekshiradi.

1. Demo user payload'ni `isDemo: false` ga o'zgartiradi
2. `DemoGuard` soxta payload'ni o'qiydi → o'tkazadi ✅
3. `JwtAuthGuard` → `passport-jwt` **imzoni tekshiradi** → **401** ❌

> **Imtiyoz oshirish yo'li yo'q. Kod xunuk, zaiflik emas.** Guard fail-safe
> yo'nalishda xato qiladi.

### 3.3 ⚠️ Asl muammo — va kanon o'lchovini to'g'rilash

Kanon: "faqat 2 faylda ishlatiladi, qamrov tekshirilsin". **O'lchov noto'g'ri
talqin qilingan:**

```bash
grep -rn "DemoGuard" backend/src --include=*.ts
# app.module.ts:18 (import) · app.module.ts:79 (APP_GUARD) · demo.guard.ts:9,14 (ta'rif)
```

Ikki "fayl" — `app.module.ts` va guard'ning **o'zi**. U hech bir controller'da
`@UseGuards` bilan emas, chunki u **`APP_GUARD` — global guard** (`app.module.ts:79`).

> **Qamrov savoli yopiq: qamrov to'liq.** Global guard **har** route'ga, shu jumladan
> kelajakdagilarga ham qo'llanadi. Bu — to'g'ri qaror.

**Lekin bu fakt haqiqiy muammoni ochadi.** NestJS'da tartib qat'iy:
**global (`APP_GUARD`) → controller (`@UseGuards`) → route**.

`JwtAuthGuard` esa **controller darajasida** ulanadi — `milestones.controller.ts:15`,
`contracts.controller.ts:17`, `payments.controller.ts:16` (15 modulning hammasida).

> **Demak `demo.guard.ts:24` — `request.user?.isDemo ?? false` — o'lik kod.**
> `request.user` bu nuqtada **hech qachon** to'ldirilmagan (uni to'ldiradigan
> `JwtAuthGuard` hali ishlamagan) → `isDemo` doim `false` → nazorat **doim**
> `:26` dagi qo'lda dekodlashga o'tadi.

Qo'lda dekodlash — **zaxira emas, YAGONA ishlaydigan yo'l**. Kod o'zini "avval
`request.user`, bo'lmasa dekod" deb ko'rsatadi; aslida ikkinchi shohobcha 100%
ishlaydi. **Shuning uchun xavfli:** kimdir `:26-39` ni "ortiqcha zaxira" deb
o'chirsa, guard **butunlay ishlamay qoladi** va **hech qanday test ushlamaydi**.

### 3.4 ⚠️ Kanon tavsiyasi shu holatda ishlamaydi

Kanon: *"`request.user.isDemo` yetarli, qo'lda dekod olib tashlansin"*. **Maqsad
to'g'ri, lekin to'g'ridan-to'g'ri qo'llash guard'ni o'chiradi** — `APP_GUARD`
sifatida `request.user` hech qachon yo'q. **Tartibni ham** o'zgartirish kerak:

**Variant A (tavsiya):**

```ts
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },  // 1-chi: user'ni to'ldiradi
  { provide: APP_GUARD, useClass: DemoGuard },     // 2-chi: endi request.user BOR
],
```

`APP_GUARD` lar **ro'yxat tartibida** ishlaydi. `JwtAuthGuard` allaqachon
`@Public()` ni qo'llab-quvvatlaydi (`jwt-auth.guard.ts:13-17`) va `auth.controller.ts`
da 11 ta `@Public()` bor — **global qilishga tayyor**. Keyin `DemoGuard` bir qatorga
qisqaradi va bonus: 15 controller'dan `JwtAuthGuard` olib tashlanadi.

**Variant B:** qoldirish, lekin `:24` dagi o'lik shohobcha o'chirilsin va kommentda
guard global ekani, `JwtAuthGuard` dan oldin ishlashi va **shuning uchun** imzosiz
dekodlash majbur ekani yozilsin.

Har ikki holda test shart ([06-testing.md](./06-testing.md) 6.3).

---

## 4. ⚠️ Validatsiya — 19 dan 8 tasida yo'q

### 4.1 Sabab

`@Body() dto: { action: 'approve' | ... }` — **inline tip literali, klass emas**.
TS tiplari kompilyatsiyada o'chadi; `design:paramtypes` ga `Object` yoziladi.
`ValidationPipe` `Object` ni ko'rib **hech narsa qilmaydi** (`toValidate()` `false`).
`main.ts:79-87` dagi `whitelist`, `forbidNonWhitelisted`, `transform` — **hech biri
ta'sir qilmaydi**.

> Validatsiya **sozlangan, lekin ishlamaydi** — "yozilmagan" dan yomonroq, chunki
> `main.ts` ga qarab "bor" degan xulosa chiqadi.

### 4.2 8 endpoint (tasdiqlangan)

```
disputes.controller.ts:25, :58, :69     messages.controller.ts:49
milestones.controller.ts:40, :51        skills.controller.ts:43, :65
                        ↑ :51 ESCROW'NI BO'SHATADI
```

### 4.3 ⚠️ Kanon 8 ni sanaydi — aslida ko'proq

Kanon grep'i `@Body() dto: {` ni **to'g'ri** sanaydi. Lekin boshqa naqsh ham bor —
`payments.controller.ts:39-45`, `:50-56`:

```ts
@Body('amount') amount: number,     // ← primitiv, DTO emas → ValidationPipe rad etadi
```

**Oqibat.** `payments.service.ts:66-67`:

```ts
if (amount < 10)    throw new BadRequestException('Minimum deposit is $10');
if (amount > 10000) throw new BadRequestException('Maximum deposit is $10,000');
```

`transform` + `enableImplicitConversion` (`main.ts:83-84`) bilan `{"amount":"abc"}` →
`Number("abc")` = **`NaN`**. Va `NaN < 10` → **`false`**, `NaN > 10000` → **`false`**
— **ikkala qo'riqchi ham o'tkazadi** (IEEE-754: NaN bilan har solishtirish `false`).
Keyin `:74` `increment(..., NaN)`.

⚠️ **Oxirgi qadam tekshirilmagan.** PostgreSQL `numeric` `'NaN'` ni **qabul qiladi**
(float'dan farqli — hujjatlashtirilgan). Agar `pg` drayveri `NaN` ni shunday
serializatsiya qilsa, `walletBalance` **`NaN` bo'lib qoladi** va `NaN + 100 = NaN`
→ hisob **qaytarib bo'lmas darajada zaharlanadi**.

**Bu — gipoteza, isbot emas.** Uni bitta test hal qiladi ([06-testing.md](./06-testing.md) 7.2).
Natijadan qat'i nazar tuzatish bir xil: `DepositDto` + `@IsNumber()` + `@Min(10)` + `@Max(10000)`.

### 4.4 ⚠️ `review()` — noma'lum qiymat eng buzg'unchi shohobchaga tushadi

`milestones.controller.ts:51` validatsiyasiz, `milestones.service.ts:139-171`:

```ts
if (dto.action === 'approve')                { return this.approveMilestone(...) }
else if (dto.action === 'request_revision')  { /* ... */ }
else                                         { return this.rejectMilestone(...) }  // ← HAMMA NARSA
```

`action: "typo"`, `null`, yo'q — **hammasi `else` ga** → `rejectMilestone` (`:174`)
→ escrow mijozga qaytadi (`:186-188`), milestone `REJECTED` (`:216-222`).

**Halol baho — imtiyoz oshirish EMAS:** `review()` ga faqat mijoz kiradi (`:129`
+ `@Roles` `milestones.controller.ts:46`), u **baribir** `action:"reject"` yuborib
shu natijaga erishadi. Hujumchi **qila olmaydigan narsani qila olmaydi**.

**Lekin muammo real:**

> Mijoz kodidagi **xato** — imlo, `undefined`, eski mijoz versiyasi — **jimgina
> pul ko'chiradi**. Xato qaytmaydi, 200 qaytadi. Frilanserning ishi rad etiladi,
> escrow qaytariladi, **hech kim bilmaydi**.

**Tuzatish — ikki qatlam:** (1) `ReviewMilestoneDto` + `@IsEnum`; (2) `else` ni
yo'q qilish — DTO kelajakda o'zgarishi mumkin:

```ts
switch (dto.action) {
  case 'approve':          return this.approveMilestone(...);
  case 'request_revision': return this.requestRevision(...);
  case 'reject':           return this.rejectMilestone(...);   // ← ENDI OSHKORA
  default: throw new BadRequestException(`Unknown review action: ${dto.action}`);
}
```

### 4.5 Reja

1. `milestones` — `SubmitMilestoneDto`, `ReviewMilestoneDto` + `switch/default`
2. `payments` — `DepositDto`, `WithdrawDto` (`@IsNumber({maxDecimalPlaces:2})`, `@Min`, `@Max`)
3. `disputes` (3), `messages` (1), `skills` (2) — DTO
4. `main.ts:81` — `forbidNonWhitelisted: true` (hozir `false`)
5. Lint qoidasi: `@Body()` + inline tip → xato

---

## 5. CORS — tuzatilgan (`d412913`), tarix

**Nima bo'lgan:** commit `0144b12` — *"use origin '*' for CORS since auth uses JWT
headers not cookies"*.

### 5.1 ⚠️ Nega "survivable" edi — va nega baribir yomon

Commit'dagi mulohaza **texnik jihatdan asosli edi**: `origin:'*'` + `credentials:false`
+ Bearer auth → begona sahifada foydalanuvchi tokeni **yo'q** (uni faqat
`nexus.vercel.app` origin'idagi JS o'qiy oladi), `*` bunga **yangi imkon bermaydi**.
**Sessiyani o'g'irlash yo'li emas edi** — "kritik" deb yozish oshirish bo'lardi.

**Lekin yomon edi, uch sababga:**

1. **Auth'siz endpoint'lar ochiq:** `@Public()` route'lar (11 ta) — har sayt o'qiydi.
   Login'ni istalgan origin'dan chaqirish → brute-force qulay (rate limiting yo'q, 6)
2. **Himoya bitta qarorga bog'lanadi:** "`*` xavfsiz, chunki Bearer" — **rost, lekin
   mo'rt**. Cookie auth yoki `credentials:true` qo'shilsa, `*` zaiflikka aylanadi.
   Xavfsizlik "hozir zarar yo'q" ga emas, **qatlamlarga** tayanadi
3. **Ma'lumot yozmaydi:** allow-list — bu **hujjat**; `*` esa "qaysi frontend'lar
   qonuniy?" savoliga javob bermaslik

Va commit'da `"temporarily"` yozilgan. Vaqtinchalik yechimlar vaqtinchalik bo'lmaydi.

### 5.2 Hozirgi holat — ✅ (`main.ts:42-75`)

1. **Allow-list `CORS_ORIGINS`** (`:42-45`), prefiks `*` bilan (`:53-57`) — Vercel preview uchun
2. **Productionda bo'sh bo'lsa — ishga tushmaydi** (`:68-75`) — eng yaxshi qism: xato
   **deploy paytida**, ishlash paytida emas
3. **`credentials: false`** (`:65`) — 2.1 qarorini mustahkamlaydi

⚠️ `origin: true` production'dan tashqarida qoladi (`:62`) — **ongli**: friksiya dev'da edi.

⚠️ **Ochiq savol:** `:52` — `if (!origin) return callback(null, true)`. Origin'siz
so'rovlar (server-to-server, Postman) o'tadi. **To'g'ri va zarur** (brauzersiz
mijozlar CORS'ga bo'ysunmaydi baribir), lekin allow-list'ni "hujjat" deb hisoblasak, to'liq emas.

---

## 6. ⚠️ Rate limiting — sozlangan va UMUMAN ISHLAMAYDI

**Bu hujjatdagi eng katta tasdiqlangan topilma.**

```bash
grep -n "throttler" backend/package.json        # 34: "@nestjs/throttler": "^5.1.2"   ← O'RNATILGAN
grep -n "ThrottlerModule" backend/src/app.module.ts   # 4, 48                          ← SOZLANGAN
grep -rn "ThrottlerGuard\|@Throttle\|SkipThrottle" backend/src --include=*.ts
# (bo'sh)                                                                              ← ⚠️ GUARD YO'Q
```

`app.module.ts:48-58` to'liq sozlangan (`ttl`, `limit`), `.env.example:38-40` ham
hujjatlashtiradi (`THROTTLE_TTL=60`, `THROTTLE_LIMIT=100`).

**Nega ishlamaydi:** `ThrottlerModule` — bu **konfiguratsiya va saqlash**. Cheklovni
**`ThrottlerGuard`** qo'llaydi. U `app.module.ts:76-80` da `APP_GUARD` sifatida
ro'yxatdan **o'tmagan** (u yerda **faqat** `DemoGuard`), hech bir controller'da ham yo'q.

> **Natija: birorta so'rov cheklanmaydi. `THROTTLE_LIMIT=100` — o'lik sozlama.**
> Bu "rate limiting yo'q" dan yomonroq: `.env.example` va `app.module.ts` ga qaragan
> odam u **bor** deb o'ylaydi.

`DemoGuard` bilan bir xil sinf: `APP_GUARD` ro'yxati **bitta joyda** va **hech narsa**
uning to'liqligini tekshirmaydi.

| Endpoint | Hujum |
|---|---|
| `auth.controller.ts:58` `POST /auth/login` | **Parol brute-force** — urinish hisoblagichi ham, lockout ham yo'q (`auth.service.ts:187-250`) |
| `auth.controller.ts:39` `POST /auth/verify-otp` | **OTP brute-force** — 2.4: 900k variant, 10 daq. **Eng jiddiy kombinatsiya** |
| `auth.controller.ts:30` `POST /auth/register` | Hisob spam, **email bombing** (`auth.service.ts:91`) |
| `auth.controller.ts:76` `POST /auth/forgot-password` | Email bombing (`:333`) |
| `bids.controller.ts` `POST /bids` · `messages.controller.ts:49` | Bid / xabar spam |

⚠️ **`resend-otp` — yagona himoyalangan joy:** `auth.service.ts:166-175` da qo'lda
1 daqiqalik oraliq. **To'g'ri o'ylangan**, lekin bitta endpoint uchun va
`ThrottlerModule` dan **mustaqil** — ya'ni muallif rate limiting kerakligini
**bilgan**, global ulashni **unutgan**.

**Tuzatish:** `{ provide: APP_GUARD, useClass: ThrottlerGuard }` — **bitta qator**.
Keyin auth'ga qattiqroq: `@Throttle({ default: { limit: 5, ttl: 60_000 } })` login'ga,
`{ limit: 5, ttl: 600_000 }` verify-otp'ga.

⚠️ **Ochiq savol — Render proxy:** `ThrottlerGuard` IP'ni `req.ip` dan oladi. Render
reverse proxy ortida; `trust proxy` sozlanmasa **hamma so'rov bitta IP** dan ko'rinadi
va cheklov **butun dunyoni bitta chelakka** soladi. `main.ts` da
`app.set('trust proxy', 1)` **yo'q** — aks holda tuzatish yangi muammo yaratadi.

---

## 7. ✅ Helmet — bor va sozlangan

`main.ts:23-25` — `app.use(helmet({ crossOriginEmbedderPolicy: false }))`,
`helmet@7.1.0` (`package.json:41`). Standart: CSP, `X-Content-Type-Options: nosniff`,
`X-Frame-Options`, HSTS, `Referrer-Policy`.

**Kuchli tomon** — ko'p portfolio loyihalarida helmet umuman yo'q.

⚠️ `nosniff` 11-bo'limdagi fayl muammosining ta'sirini **kamaytiradi**.
⚠️ `crossOriginEmbedderPolicy: false` — **ongli** (COEP tashqi resurslarni buzadi),
lekin **nega** o'chirilgani kodda yozilmagan → komment qo'shilsin.

**Ochiq savol:** CSP `/api/docs` (Swagger, `main.ts:127`) bilan ziddiyatga tushadimi?
Swagger inline script ishlatadi. Ishlayotgan bo'lsa — CSP yumshoq yoki Swagger buzilgan.

---

## 8. ✅ SQL injection — tekshirildi, toza

TypeORM parametrlashtiradi. Xavf faqat raw `query()` da — hammasini sanadim:

| Joy | Holat |
|---|---|
| `contracts.service.ts:219` | ✅ `$1,$2` + `[milestone.amount, clientId]` |
| `milestones.service.ts:275, :283, :287, :291` | ✅ `$1..$3` parametrlar |
| `database/seed.ts:102, :113` | ⚠️ Shablon literal — quyida |

**`d412913` da qo'shilgan barcha raw SQL — parametrlashtirilgan.** Masalan
`contracts.service.ts:219-227`: `WHERE "id" = $2 AND "walletBalance" >= $1::numeric`
— foydalanuvchi kiritmasi `$1`/`$2` orqali.

⚠️ `seed.ts:102` — `TRUNCATE TABLE "${t}" CASCADE` shablon literal, lekin `t` **kod
ichidagi** ro'yxatdan keladi va `seed.ts` **production'da ishlamaydi**. **Zaiflik
emas** — lekin naqsh sifatida xavfli (kopi-paste manbai).

> **SQL injection yuzasi yo'q.** Muallif raw SQL'ga o'tganda ham parametrlashtirishni
> **saqlagan** — tan olamiz.

---

## 9. ✅ XSS — yuzasi deyarli nol

```bash
grep -rn "dangerouslySetInnerHTML\|innerHTML\|eval(\|new Function" frontend/   # 0
```

**Bitta ham yo'q.** Barcha foydalanuvchi matni React interpolatsiyasi orqali —
avtomatik escape:

| Matn | Joy |
|---|---|
| Xabar | `frontend/app/(main)/messages/page.tsx:212` — `{msg.content}` |
| Nizo xabari / tavsifi | `frontend/app/(main)/disputes/[id]/page.tsx:135`, `:93` |
| Loyiha tavsifi | `frontend/app/(main)/projects/[id]/page.tsx:130` |

⚠️ Ko'p qatorli matn **CSS bilan** (`whitespace-pre-wrap`), markdown parsing bilan
**emas** → HTML'ga aylantirish qadami **umuman yo'q** → sanitizatsiya qilinadigan
narsa ham yo'q. **Eng xavfsiz yechim.**

Matn **autentifikatsiyalangan** foydalanuvchilardan (`messages.service.ts:153-154`
ishtirokchilikni tekshiradi) — ishonchsiz, lekin anonim emas.

⚠️ **`react-markdown` — o'lik bog'liqlik** (`frontend/package.json:52`), hech qayerda
import qilinmagan; `dompurify`/`sanitize-html` yo'q. Hozir zarar yo'q. **Kelajak
xavfi:** markdown qo'shilsa `react-markdown` standart holatda xavfsiz, lekin
`rehype-raw` qo'shilsa — **XSS ochiladi**. Qaror yozilsin: *markdown → `rehype-raw` HECH QACHON*.

⚠️ **Agar XSS bo'lsa — narx yuqori.** 2.2: `accessToken` + 30 kunlik `refreshToken`
JS uchun ochiq; rotation ham, revocation ham yo'q (2.3) → **bitta XSS = 30 kunlik
to'liq hisob**, bekor qilib bo'lmaydi. XSS **yo'q**, lekin himoyaning butun og'irligi
"XSS hech qachon bo'lmaydi" degan yagona taxminga tushgan. 2.3-dagi `token_version`
shu narxni tushiradi.

---

## 10. ⚠️ OAuth token'lari URL query string'da

`auth.controller.ts:133`, `:150`:

```ts
`${frontendUrl}/oauth-callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
```

Frontend o'qiydi: `frontend/app/(auth)/oauth-callback/page.tsx:18-23`.

Query string fragment (`#`) dan farqli — **serverga yuboriladi**: (1) brauzer
tarixida qoladi; (2) `Referer` header'da tashqi xostga ketadi; (3) Vercel access
log'lariga tushadi; (4) URL nusxalansa token ham nusxalanadi.

⚠️ `oauth-callback/page.tsx` da `router.replace()` **yo'q** — token URL'da **qoladi**.

**Tuzatish:** (1) tez — `setTokens` dan keyin `router.replace('/dashboard')`;
(2) to'g'ri — **fragment** (`#accessToken=...`), u serverga yuborilmaydi;
(3) eng to'g'ri — bir martalik `code` → `POST /auth/oauth/exchange`.

---

## 11. ⚠️ Fayl yuklash — MIME tekshiruvi yo'q

```bash
grep -rn "FileInterceptor" backend/src --include=*.ts   # users.controller.ts:92 — yagona
```

⚠️ `attachments` maydonlari (`milestones.controller.ts:40`, `messages.controller.ts:49`,
`disputes.controller.ts:58`) — **fayl emas**, `string[]` URL. **Ochiq savol:** ular
validatsiya qilinmaydi (4.2) — `javascript:` yoki ichki tarmoq manzili yozish mumkin.
Frontend `<a href>` qilib chiqarsa — XSS. Tekshirilsin.

### Avatar — `users.controller.ts:90-107`

```ts
filename: (_, file, cb) => cb(null, `${Date.now()}${extname(file.originalname)}`),  // :96
limits: { fileSize: 2 * 1024 * 1024 },                                             // :100  ✅
```

| Nazorat | Holat |
|---|---|
| O'lcham (2 MB) | ✅ Bor (`:100`) |
| `fileFilter` (MIME) · kengaytma allow-list · magic byte | ❌ **Yo'q** |

Kengaytma `file.originalname` dan — **foydalanuvchi nazoratida**. `evil.html` →
`/uploads/avatars/1763294857123.html`. Va `main.ts:21` uni **statik xizmat qiladi**
(`useStaticAssets(..., { prefix: '/uploads' })`). Xuddi shunday `.svg` + `<script>`.

⚠️ **Ta'sirni oshirmaymiz — chegaralangan.** Backend **Render**, frontend **Vercel**,
token'lar **frontend** origin'ida (2.2). Same-origin policy: `api.nexus` dagi skript
frontend `localStorage` iga **kira olmaydi** → bu XSS **token o'g'irlamaydi**.

Qolgan real ta'sir: (1) **phishing** loyihaning haqiqiy domenida; (2) `nosniff`
faqat *taxmin qilishni* to'xtatadi — aniq `Content-Type` bilan brauzer baribir
bajaradi; (3) ⚠️ **bir domenga birlashtirilsa** (`/api` reverse proxy ortida — keng
tarqalgan qadam) — **darrov to'liq XSS'ga aylanadi**.

⚠️ **Kolliziya:** `Date.now()` — bir ms ichida ikki yuklash → **bir xil nom** →
biri ikkinchisini **o'chiradi**. Xavfsizlik emas, **to'g'rilik** bagi.

**Tuzatish:** `fileFilter` + `ALLOWED = {image/jpeg, image/png, image/webp}` (**SVG
yo'q**), `randomUUID()` nom, `files: 1`. ⚠️ `file.mimetype` — mijoz bergan, **ishonchsiz**
→ magic byte (`file-type`) yoki `Content-Disposition: attachment`.

⚠️ **Ochiq savol — Render efemer disk:** `./uploads` deploy paytida **o'chadi** →
avatar'lar yo'qoladi. Arxitektura muammosi → S3/Cloudinary
([02-architecture.md](./02-architecture.md)); u MIME muammosini ham hal qiladi.

---

## 12. ⚠️ IDOR — marketplace'ning asosiy savoli

> **Frilanser boshqa odamning shartnomasini, milestone'ini ko'ra oladimi?**

Natija **aralash** va bu qiziq.

### 12.1-12.4 ✅ To'g'ri qilingan joylar

| Modul | Manba | Izoh |
|---|---|---|
| `contracts` | `contracts.service.ts:39-49` | `findOneSecure` — nom farqni **oshkora** qiladi; `:93`, `:132`, `:278` uni ishlatadi |
| `messages` | `messages.service.ts:105-106, :128-129, :153-154` | Uchala yo'lda `isParticipant` |
| `disputes` | `disputes.service.ts:101-111`, `:39` | `findOneSecure` naqshi + `isParty` |
| `reviews` | `reviews.service.ts:43-49` | ⚠️ Quyida — **nozik va to'g'ri** |

⚠️ **`reviews` — o'ylangan kod:** `revieweeId` **mijoz kiritmasidan olinmaydi**, u
shartnomadan **hosil qilinadi** (`:48-49`). Ya'ni "reytingimni ko'taraman" hujumi
(1-jadval) **ishlamaydi**: frilanser o'ziga sharh yoza olmaydi — `revieweeId` doim
**qarama-qarshi tomon**. `:39` `COMPLETED` sharti va `:51` takroriylik tekshiruvi
buni mustahkamlaydi.

### 12.5 ❌ `milestones.findOne` — IDOR bor

`milestones.service.ts:46-53`:

```ts
async findOne(id: string) {
  const milestone = await this.milestoneRepo.findOne({
    where: { id },
    relations: ['contract', 'submissions'],   // ← shartnoma va topshiriqlar bilan
  });
  if (!milestone) throw new NotFoundException('Milestone not found');
  return milestone;                            // ← EGALIK TEKSHIRUVI YO'Q
}
```

`milestones.controller.ts:28-32` uni to'g'ridan-to'g'ri ochadi — **`@CurrentUser()`
parametri umuman yo'q**, ya'ni servis foydalanuvchi kimligini **bila olmaydi**:

```ts
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) { return this.milestonesService.findOne(id); }
```

**Oqibat:** `GET /api/milestones/:id` — **har qanday autentifikatsiyalangan
foydalanuvchi** (rol muhim emas, `@Roles` yo'q) **har qanday** milestone'ni o'qiydi:
`amount`/`escrowAmount`; `contract` (`clientId`, `freelancerId`, `totalAmount`,
`paidAmount`, `platformFeePercent`); `submissions` (**frilanserning ishi** —
`description`, `attachments`, `deliverableLinks`).

⚠️ **Chegara:** ID — **UUID** (`ParseUUIDPipe`). Bu **enumeration'ni to'xtatadi,
IDOR'ni emas**. UUID qo'lga tushsa (log, referer, screenshot, boshqa javob) kirish
**to'liq**. UUID — sir emas, **identifikator**.

**Bu — naqshning yagona buzilgan joyi.** `getContractMilestones`
(`milestones.service.ts:31-44`) **to'g'ri** qilingan → muallif tekshiruvni **biladi
va yozgan**, `findOne` da **unutgan**.

⚠️ **Ichkariga tarqalmaydi:** `findOne` `submit` (`:59`) va `review` (`:126`) ichida
ham chaqiriladi, lekin u yerda **keyin** tekshiruv bor (`:62`, `:129`) → **mutatsiya
xavfsiz**. Faqat **to'g'ridan-to'g'ri o'qish** ochiq. Bu **ma'lumot oshkor bo'lishi**,
imtiyoz oshirish emas.

**Tuzatish:** `contracts` naqshini takrorlash — `findOneSecure(id, userId, userRole)`
+ controller'ga `@CurrentUser()`.

### 12.6 Xulosa

| Modul | Egalik tekshiruvi |
|---|---|
| `contracts` · `messages` · `disputes` · `reviews` | ✅ |
| `milestones` (mutatsiya) | ✅ `:62`, `:129` |
| **`milestones` (o'qish)** | ❌ **`milestones.service.ts:46`** |

> **IDOR himoyasi 6 dan 5 tasida bor — yaxshi natija.** Muammo bilim emas,
> **izchillik**: himoya har servisda **qo'lda** takrorlanadi va hech narsa uni
> majburlamaydi.
>
> **Shuning uchun bu masala testga tegishli, tuzatishga emas.** Bitta qatorni
> tuzatish — 5 daqiqa. Keyingi safar unutilmasligini kafolatlash —
> [06-testing.md](./06-testing.md) 6.2 dagi **parametrlashtirilgan IDOR reestri**.

⚠️ **Va 2.5 ni eslang:** admin bu tekshiruvlarning **hammasini** ataylab chetlab
o'tadi (`contracts.service.ts:42` va h.k.). Ya'ni `#0` tuzatilmasa, bu bo'limning
qiymati nolga yaqin.

---

## 13. ⚠️ `withdraw` — `d412913` tuzatgan poyga hali ham bor

Kanon §4: `fundMilestone` poygasi **tuzatilgan** (`contracts.service.ts:219-231`).
**Lekin xuddi shu bag `payments.service.ts:102-141` da qoldi:**

```ts
async withdraw(userId: string, amount: number, method: PaymentMethod) {
  if (amount < 10) throw new BadRequestException('Minimum withdrawal is $10');
  const user = await this.userRepo.findOne({ where: { id: userId } });   // :105 O'QISH — tranzaksiyadan TASHQARIDA
  if (Number(user.walletBalance) < amount) {                             // :106 TEKSHIRUV — eski qiymat
    throw new BadRequestException('Insufficient wallet balance');
  }
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction();                                   // :112 TRANZAKSIYA KEYIN
  try {
    await queryRunner.manager.decrement(User, { id: userId }, 'walletBalance', amount);  // :115 SHARTSIZ DEBET
```

Ikki bir vaqtdagi `POST /payments/withdraw` → ikkalasi ham `:105` da **bir xil
balansni** o'qiydi → ikkalasi `:106` dan o'tadi → ikkalasi debet qiladi → **balans
manfiy**. Sxemada manfiy balansni taqiqlovchi `CHECK` yo'q (kanon §4).

⚠️ `Number(user.walletBalance)` (`:106`) — kanon §4 float muammosi ham shu yerda.

> **`d412913` bagni tuzatgan, lekin bag SINFINI tuzatmagan.** Tuzatish `fundEscrow`
> ga **lokal** qo'llanilgan; naqsh `withdraw` da qoldi.

**Tuzatish:** `contracts.service.ts:219` naqshini takrorlash — shartli
`UPDATE ... WHERE "walletBalance" >= $1::numeric RETURNING`, 0 qator = mablag' yetmaydi.

**Uzoq muddatli — sxema darajasida:**

```sql
ALTER TABLE users ADD CONSTRAINT wallet_balance_non_negative CHECK ("walletBalance" >= 0);
ALTER TABLE users ADD CONSTRAINT escrow_balance_non_negative CHECK ("escrowBalance" >= 0);
```

Bu **butun sinfni** yopadi. ⚠️ Lekin **migratsiya kerak** — va migratsiya **yo'q**
(kanon §3) → [04-data-model.md](./04-data-model.md) ga bog'liq.

---

## 14. Sirlar

### 14.1 ✅ `.env.example` — bor, to'liq, sirsiz

50 qator, hamma o'zgaruvchi hujjatlashtirilgan; qiymatlar — placeholder.
`.gitignore`: `backend/.env`, `frontend/.env.local` ✅

### 14.2 ⚠️ JWT secret — xavfli fallback

`config/jwt.config.ts:4-7`:

```ts
secret: process.env.JWT_SECRET || 'nexus-secret-key',
refreshSecret: process.env.JWT_REFRESH_SECRET || 'nexus-refresh-secret',
```

⚠️ **`||` fallback — eng xavfli qator.** Production'da `JWT_SECRET` qo'yilmasa,
ilova **ishga tushadi** va **hammaga ma'lum** (repo **public** — kanon §1) satr bilan
imzolaydi.

**Oqibat:** kim `nexus-secret-key` ni bilsa (**har kim** — GitHub'da turibdi),
**istalgan foydalanuvchi uchun yaroqli token yasaydi**: `{ sub: <admin-uuid>,
role: 'admin' }` → **to'liq tizimni egallash**. `jwt.strategy.ts:23` faqat
`payload.sub` bo'yicha userni izlaydi; imzo to'g'ri bo'lsa boshqa tekshiruv yo'q.

⚠️ **Hozir zaiflikmi — ochiq savol.** Render'da qo'yilgan bo'lsa zarar yo'q;
qo'yilmagan bo'lsa **kritik**. **Muammo aynan shu:** kod buni **bilib bo'lmaydigan**
qiladi — xavfsizlik deploy paneli sozlamasiga bog'liq.

**Bu `main.ts:68-75` bilan ziddiyat** — u yerda muallif **to'g'ri** yo'lni tanlagan
(`CORS_ORIGINS` bo'sh → `throw`).

> **Xuddi shu qat'iylik JWT secret'ga kerak — u CORS'dan MUHIMROQ.**

```ts
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required. Refusing to boot without it.`);
  if (process.env.NODE_ENV === 'production' && v.length < 32) {
    throw new Error(`${name} must be at least 32 characters in production.`);
  }
  return v;
}
```

⚠️ Dev'da fallback qolsin, **production'da hech qachon**. ⚠️ Qo'shimcha:
`JWT_SECRET === JWT_REFRESH_SECRET` bo'lsa ham `throw` — 2.3-dagi ajratish shunda ma'noli.

### 14.3 ✅ Axlat fayllar — tekshirilgan

```bash
git ls-files backend/backend.log backend/check_users_schema.js   # (bo'sh — kuzatilmaydi)
```

`.gitignore` da: `backend.log`, `*.log`, `check_users_schema.js` ✅ Fayllar lokal
diskda bor (normal). **Sir yo'q edi — tekshirilgan** (kanon §4).

### 14.4 ✅ Parol saqlash

`bcrypt@5.1.1`, `@Column({ select: false })` — `auth.service.ts:189` da
`addSelect("user.password")` bilan **ataylab** so'raladi ✅. `:247` — qo'lda
`{ password, ...rest }` o'chirish, ikkinchi qatlam ✅.
⚠️ **Ochiq savol:** bcrypt round soni (`bcrypt.util.ts`) — 2026 uchun 12 tavsiya.

### 14.5 ⚠️ Email enumeration — qisman

`auth.service.ts:320-322` — `forgotPassword` **to'g'ri** (*"Always return success to
avoid email enumeration attacks"*) ✅ **o'ylangan kod**.

**Lekin boshqalar buzadi:**

| Joy | Nima ochadi |
|---|---|
| `auth.service.ts:58` `register` | `Conflict("Email already registered")` → **bor** |
| `auth.service.ts:118` `verifyOtp` · `:162` `resendOtp` | `NotFound("User not found")` → **yo'q** |

`resendOtp` orqali istalgan emailni tekshirish mumkin; rate limiting yo'q (6) →
**butun ro'yxatni**. ⚠️ **Halol:** `register` dagi `Conflict` — **muqarrar murosa**
(Upwork ham shunday). **Lekin `verifyOtp`/`resendOtp` uchun bahona yo'q** — ular
neytral javob qaytarishi kerak.

---

## 15. Xulosa

### 15.1 ✅ Kuchli tomonlar

| | Manba |
|---|---|
| JWT Bearer header — CSRF yuzasi yo'q | `jwt.strategy.ts:16`, `main.ts:65` |
| Access/refresh alohida secret | `jwt.config.ts:4,6` |
| Helmet sozlangan | `main.ts:23` |
| CORS allow-list + fail-fast | `main.ts:42-75` |
| SQL injection yuzasi yo'q — raw SQL ham parametrlashtirilgan | `contracts.service.ts:219`, `milestones.service.ts:275+` |
| XSS yuzasi nol — `dangerouslySetInnerHTML` 0 ta | butun `frontend/` |
| IDOR himoyasi 6 dan 5 tasida | `contracts.service.ts:39`, `messages`, `disputes`, `reviews` |
| `reviews` — `revieweeId` shartnomadan hosil qilinadi | `reviews.service.ts:48-49` |
| bcrypt + `select: false` | `auth.service.ts:189` |
| `forgotPassword` — enumeration'ga qarshi | `auth.service.ts:320` |
| `numeric(10,2)`, tranzaksiya ishlatilgan | kanon §4 |
| Fayl o'lcham chegarasi | `users.controller.ts:100` |

### 15.2 ⚠️ Ustuvorlik

| # | Muammo | Joy | Narx |
|---|---|---|---|
| **0** | 🔴 **Har kim `role:"admin"` bilan ro'yxatdan o'tadi** | `register.dto.ts:37`, `auth.service.ts:76` | **4 qator** |
| **1** | **Rate limiting ishlamaydi** — `ThrottlerGuard` yo'q | `app.module.ts:76-80` | **1 qator** |
| **2** | **JWT secret fallback** | `jwt.config.ts:4,6` | Kichik |
| **3** | **OTP urinish chegarasi yo'q** + `Math.random()` | `auth.service.ts:134`, `:422` | Kichik |
| **4** | **`review()` `else` → escrow qaytaradi** | `milestones.service.ts:168` | Kichik |
| **5** | **`withdraw` poygasi** | `payments.service.ts:105-115` | O'rta |
| **6** | **IDOR — `milestones.findOne`** | `milestones.service.ts:46` | Kichik |
| **7** | **Validatsiya — 8 + `payments` (2)** | kanon §5 + `payments.controller.ts:41` | O'rta |
| **8** | **`DemoGuard` o'lik shohobcha** + `JwtAuthGuard` global | `demo.guard.ts:24`, `app.module.ts:79` | Kichik |
| **9** | **Fayl `fileFilter` yo'q** | `users.controller.ts:92` | Kichik |
| **10** | **OAuth token URL query'da** | `auth.controller.ts:133,150` | O'rta |
| **11** | **Refresh rotation + revocation** | `auth.service.ts:300` | Katta |
| **12** | **Access TTL 7 kun → 15 daqiqa** | `jwt.config.ts:5` | 1 qator |
| **13** | **`CHECK (walletBalance >= 0)`** | migratsiya kerak (kanon §3) | Bog'liq |

⚠️ **0, 1, 2, 12 — birgalikda ~10 qator, va ular eng yuqorida.** Eng katta teshiklar
— **unutilgan ulanish** yoki **noto'g'ri joyda ishlatilgan tip**, murakkab bag emas.

⚠️ **`#0` birinchi, chunki u boshqa hamma tuzatishning old sharti.** Rate limiting
uni **to'xtatmas edi** (bitta qonuniy so'rov). Va `#0` turganda `#6` ni tuzatish
ma'nosiz: admin `findOneSecure` ni baribir chetlab o'tadi.

### 15.3 ⚠️ Umumiy naqsh

Topilmalarning aksariyati bir shaklda:

- `ThrottlerModule` sozlangan → **guard ulanmagan** (6)
- `ValidationPipe` sozlangan → **DTO klass emas, ishlamaydi** (4)
- IDOR himoyasi 5 joyda → **6-chisida unutilgan** (12)
- `d412913` poygani tuzatgan → **`withdraw` da qolgan** (13)
- `DemoGuard` global → **`request.user` shohobchasi hech qachon ishlamaydi** (3.3)

> **Hammasida himoya *mavjud*, *sozlangan*, va *ishlamaydi*.** Bu bilim muammosi
> emas: muallif rate limiting kerakligini bilgan (`.env.example:38`, `resendOtp` da
> qo'lda cheklov), validatsiya kerakligini bilgan (`main.ts:79`, 5 ta DTO), IDOR
> tekshiruvini bilgan (`findOneSecure` deb **nomlagan**).
>
> **Muammo — hech narsa bularni majburlamasligi.** Kod o'qigan odam "himoya bor"
> deb ko'radi. Faqat **ishlatib ko'rgan** narsa haqiqatni aytadi. Bu —
> [06-testing.md](./06-testing.md) ning mavjud bo'lish sababi.

⚠️ **Lekin `#0` bu naqshga TUSHMAYDI — shuning uchun u alohida.**

Qolgani "himoya bor, ulanmagan". `#0` da esa **himoya ishladi**: `RegisterDto` —
to'g'ri DTO, `@IsEnum` — to'g'ri dekorator, `ValidationPipe` uni **haqiqatan
chaqirdi**. Hammasi kutilganidek ishladi va **`admin` ni o'tkazdi**, chunki unga
*"`UserRole` a'zosini qabul qil"* deb aytilgan edi.

> **Xato — kodda emas, modelda.** Bitta enum ikki savolga javob berdi. Bu ikki
> ro'yxat **hech qachon bir xil emas** — birlashtirish xatoni **ko'rinmas** qildi.
>
> Buni test ham ushlamas edi: testni xuddi shu noto'g'ri model bo'yicha yozgan
> bo'lardik (`@IsEnum(UserRole)` → "enum a'zosi o'tsin" → yashil). **Buni faqat
> savol ushlaydi: "bu ro'yxat kim uchun?"**
>
> Shuning uchun tuzatish **DTO'dan boshlanadi, testdan emas**. Test — ikkinchi qatlam.

---

## 16. Ochiq savollar

1. **Render'da `JWT_SECRET` qo'yilganmi?** (14.2) — "yo'q" bo'lsa **kritik** va
   ro'yxatning 1-o'rniga chiqadi. Kod buni bilib bo'lmaydigan qiladi
2. **`trust proxy`** — Render ortida `req.ip` to'g'ri kelmasa, rate limiting butun
   dunyoni bitta chelakka soladi (6)
3. **`NaN` deposit** — PostgreSQL `numeric` `NaN` ni qabul qiladi; `pg` drayveri
   uni shunday yuboradimi? (4.3) — test hal qiladi
4. **`attachments: string[]`** — validatsiya yo'q; `javascript:` URL frontend'da
   `<a href>` ga tushadimi? (11)
5. **CSP va Swagger** — `/api/docs` helmet CSP bilan ishlaydimi? (7)
6. **bcrypt round soni** (14.4)
7. ✅ **~~Admin roli qanday beriladi?~~ — TEKSHIRILDI:** `register.dto.ts:37`
   `@IsEnum(UserRole)` `ADMIN` ni **bloklamaydi** → 2.5. Qolgan savol **operatsion**:
   production DB'da hozir nechta `role='admin'` yozuv bor va ular **kutilganmi**?
8. **`payeeId: 'platform'`** (`milestones.service.ts:328`, `:193`) — UUID emas, satr.
   FK'mi? ([04-data-model.md](./04-data-model.md))
9. **Demo hisob qanday yaratiladi?** `isDemo` — `auth.service.ts:426` da token'ga
   qo'yiladi, lekin uni **kim** `true` qiladi? Seed'dami?
10. **Audit log yo'q** — escrow ko'chishi `payments` da qoladi, lekin **kim nima
    qilgani** (login, rol o'zgarishi, admin `resolve` — `disputes.service.ts:148`)
    yozilmaydi. Admin escrow'ni ko'chira oladi — bu **yozilishi kerak**. Kerakmi,
    yoki portfolio uchun ortiqchami?
