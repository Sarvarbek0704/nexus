<div align="center">

# Nexus

**A freelance marketplace built around milestone escrow.**

Clients post projects, freelancers and agencies bid, work is split into milestones, and money sits in escrow until the work is accepted. Disputes go to an admin. The interesting part is not the marketplace — it is what happens to the money in between.

[![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3-FE0803?style=flat-square)](https://typeorm.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Escrow](#escrow) · [What it does](#what-it-does) · [Architecture](#architecture) · [Security](#security) · [Getting started](#getting-started)

</div>

> **Status.** This describes the system specified in [`docs/`](./docs) — an eight-document technical specification written against the working code. Implementation follows the [roadmap](./docs/07-roadmap.md).
>
> **And one thing stated plainly:** this is a technical showcase, not a business. A two-sided marketplace needs liquidity, and liquidity is not an engineering problem — see [`docs/00-vision-and-market.md`](./docs/00-vision-and-market.md). The domain was chosen because escrow, disputes and multi-party transactions are hard in ways CRUD is not.

---

## Escrow

This is the whole point of the project, so it goes first.

Two strangers need to work together without trusting each other. Escrow is how: the client's money leaves their wallet before work starts, but does not reach the freelancer until the work is accepted.

```
  CLIENT                                              FREELANCER
  walletBalance ──┐                                 ┌── walletBalance
                  │  fundMilestone                  │
                  ▼                                 │  approveMilestone
             ┌─────────────────────────────┐        │  (net)
             │  ESCROW                     │────────┤
             │  committed, owned by nobody │        └── PLATFORM (fee)
             └─────────────────────────────┘
                  ▲            │
                  └────────────┘
                   rejectMilestone (refund)
```

One invariant holds the whole thing up:

```
SUM(walletBalance) + SUM(escrowBalance) = constant
```

**Money moves. It is never created and never destroyed.** Every rule below exists to keep that true.

### The arithmetic stays in the database

Every amount is `numeric(10,2)` — exact decimal, not float. So the arithmetic belongs there too:

```ts
// Funding a milestone: the check and the debit are one statement, deliberately.
const debited = await queryRunner.query(
  `UPDATE "users"
      SET "walletBalance" = "walletBalance" - $1::numeric,
          "escrowBalance" = "escrowBalance" + $1::numeric
    WHERE "id" = $2
      AND "walletBalance" >= $1::numeric
RETURNING "walletBalance"`,
  [milestone.amount, clientId],
);

if (debited.length === 0) throw new BadRequestException('Insufficient wallet balance');
```

Reading a balance, comparing it, then debiting is three steps, and two concurrent requests fit between them: both read the same balance, both pass, both debit. One statement leaves no gap — a losing writer sees the already-debited balance and matches no row.

**The fee split is derived, not computed twice:**

```sql
SELECT round($1::numeric * $2::numeric / 100, 2)                   AS "platformFee",
       $1::numeric - round($1::numeric * $2::numeric / 100, 2)     AS "netAmount"
```

Rounding the fee and the net independently does not add back up: on a $0.05 milestone at 10%, both round up and the platform pays out $0.06 against $0.05 of escrow. The net is *defined* as the remainder, so the sum is the amount by construction rather than by luck.

`CHECK ("walletBalance" >= 0)` sits underneath as the backstop: if the code is ever wrong, the transaction fails rather than the balance going negative.

[`docs/03-money-and-escrow.md`](./docs/03-money-and-escrow.md) covers this in full — including why double-entry bookkeeping is *rejected* here rather than recommended.

---

## What it does

**Clients** post projects with budgets and milestones, review bids, sign contracts, fund escrow per milestone, accept or reject submitted work, and open disputes.

**Freelancers** browse and bid with cover letters and milestone proposals, submit work, and withdraw earnings.

**Agencies** bid as a team — members, collective bids, shared contracts. A role inside a role.

**Admins** resolve disputes, which means deciding where escrowed money goes. That is the most privileged action in the system, which is why admin is granted and never claimed — see [Security](#security).

Around that: messaging, reviews tied to completed contracts, notifications, time logs, invoices, portfolios, skills and categories. Fifteen modules, twenty-five entities, fifty-six pages.

---

## Architecture

```
nexus/
├── backend/                  NestJS + TypeORM
│   └── src/
│       ├── database/
│       │   ├── entities/     25 entities
│       │   └── migrations/   the schema's history — see below
│       ├── modules/          15 feature modules
│       ├── common/
│       │   └── guards/       jwt-auth · roles · demo
│       └── config/
├── frontend/                 Next.js (app router)
│   └── app/                  56 pages
├── docs/                     the specification — 8 documents
└── render.yaml
```

### Migrations, and why they are the first thing

TypeORM's `synchronize` will happily reshape a database to match the entities — including dropping a column when a field disappears. That is why it is off in production. The problem is what replaces it: without migrations, nothing does. The schema then exists only in the entity files, dev drifts silently, and production cannot be rebuilt from the repository at all.

So migrations are generated, committed, and checked in CI: `migration:generate` on a clean tree must produce nothing. Everything downstream — a `CHECK` constraint, an index, a test database that actually resembles production — depends on this being true first. It is item zero on the [roadmap](./docs/07-roadmap.md) for that reason, not because it is interesting.

### Money is a string, and the types say so

TypeORM returns `decimal` columns as strings, because `numeric` does not fit in a JavaScript `number`. Annotating them `amount: number` does not change that — it just means the type checker agrees with a lie, and quietly accepts `bid.amount + fee` producing `"1000.00100"`.

The annotations tell the truth instead. [`docs/04-data-model.md`](./docs/04-data-model.md) compares the three ways to resolve this and explains why the easiest one — a `decimal → number` transformer — is the worst: it makes the mismatch disappear by throwing away the precision the `numeric` column exists to keep.

---

## Tech stack

| Backend | | Frontend | |
|---|---|---|---|
| NestJS | 11 | Next.js (app router) | 14 |
| TypeORM | 0.3 | React | 18 |
| PostgreSQL | 15+ | TypeScript | 5 |
| JWT (access + refresh) | — | Tailwind CSS | — |
| class-validator | — | | |

Auth is a **Bearer header, not a cookie** — so there is no CSRF surface to defend. That falls out of the design rather than being bolted on.

---

## Security

The most privileged action in this system is resolving a dispute, because it decides where escrowed money goes. Everything below follows from taking that seriously.

### Privilege is granted, never claimed

Registration takes a role. It used to validate that role against the whole `UserRole` enum — which contains `ADMIN` — and store whatever came back. `POST /api/auth/register {"role":"admin"}` was a valid request on a public endpoint.

The validator was working correctly. It was being asked the wrong question:

```ts
export const SELF_ASSIGNABLE_ROLES = [
  UserRole.CLIENT,
  UserRole.FREELANCER,
  UserRole.AGENCY_OWNER,
] as const;   // an allow-list — not the enum minus one
```

The service re-checks it independently, because a public endpoint writing a privilege column should not rest on one layer being present.

### The rest

- **Rate limiting** — `ThrottlerGuard`, registered. Configuration that is documented and deployed but enforced nowhere is worse than none, because it is believed
- **Validation** — every mutating endpoint takes a DTO class. An inline `@Body() dto: { … }` gives `ValidationPipe` no metatype to work with, so it silently does nothing
- **Ownership** — a freelancer cannot read another's contract; the checks live in the service, not the controller
- **CORS** — an explicit allow-list from `CORS_ORIGINS`, with prefix matching for preview deployments. Production refuses to boot without it
- **SQL** — parameterised throughout, including the raw `UPDATE`s in the escrow path
- **XSS** — no `dangerouslySetInnerHTML` anywhere
- **JWT** — separate access and refresh secrets, no fallback string

---

## Testing

The escrow path is a state machine that moves money, so that is where the tests are — against a real PostgreSQL via Testcontainers, not a mocked repository. A mock cannot demonstrate a race; it can only agree with whatever it was told.

Three invariants, asserted rather than assumed:

| | |
|---|---|
| `walletBalance >= 0` | always — the regression test for the concurrent-funding race |
| `fee + net === amount` | always — property-tested across random amounts and fee percentages |
| `SUM(wallet) + SUM(escrow)` | constant — the system is closed |

Plus ownership tests per module, and a rejected-transition test for every edge of the milestone state machine.

---

## Getting started

**Requirements:** Node 18+ · PostgreSQL 15+

```bash
git clone https://github.com/Sarvarbek0704/nexus.git
cd nexus
```

**Backend**

```bash
cd backend
npm install
cp .env.example .env        # DATABASE_URL, JWT secrets, CORS_ORIGINS
npm run migration:run
npm run seed                # demo data — local only
npm run start:dev           # http://localhost:4000 · Swagger at /api/docs
```

**Frontend**

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api" > .env.local
npm run dev                 # http://localhost:3000
```

---

## Documentation

[**`docs/`**](./docs) — eight documents, written against measured facts. Where something could not be verified it is marked as an open question rather than guessed, and where the project got something right that is said too.

Start with the [roadmap](./docs/07-roadmap.md): it is ordered by dependency, not importance, which is why the most valuable change in the project is deliberately not the first one.

---

## License

Proprietary. Built by [Sarvarbek Sodiqov](https://github.com/Sarvarbek0704); published for review, not for reuse.
