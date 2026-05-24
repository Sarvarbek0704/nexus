# Nexus — Freelance & Agency Marketplace Platform

> A full-stack, production-grade freelance marketplace where clients post projects, freelancers and agencies submit bids, contracts are managed with milestone-based escrow payments, and disputes are handled through an admin panel.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Database Schema](#5-database-schema)
6. [Getting Started](#6-getting-started)
7. [Environment Variables](#7-environment-variables)
8. [API Documentation](#8-api-documentation)
9. [Frontend Pages](#9-frontend-pages)
10. [User Roles](#10-user-roles)
11. [Payment & Escrow System](#11-payment--escrow-system)
12. [Project Structure](#12-project-structure)

---

## 1. Project Overview

**Nexus** is a full-featured freelance marketplace platform — similar to Upwork or Freelancer — built as a production-level portfolio project. It connects:

- **Clients** who need work done (post projects, hire talent, manage contracts)
- **Freelancers** who offer their skills (browse projects, submit bids, complete milestones)
- **Agencies** who bid as teams (manage members, submit collective bids)
- **Admins** who moderate the platform (manage users, resolve disputes, view analytics)

The platform covers the complete lifecycle: project posting → bidding → contract signing → milestone completion → payment release → review.

---

## 2. Features

### For Clients
- Post projects with detailed requirements, budget, deadlines, and milestones
- Browse freelancer and agency profiles
- Review and manage incoming bids (shortlist, accept, reject)
- Sign contracts and fund escrow per milestone
- Review submitted work and approve/reject/request revision
- Open disputes if work is unsatisfactory
- Rate and review freelancers after contract completion
- Dashboard with spending analytics (charts)

### For Freelancers
- Browse and search projects with advanced filters
- Submit detailed bids with cover letters and milestone proposals
- Track bid status (pending / shortlisted / accepted / rejected)
- View and manage active contracts
- Submit milestone work with notes
- Wallet system: deposit, withdraw, track earnings
- Public profile: bio, skills, portfolio, ratings
- Dashboard with earnings analytics

### For Agencies
- Create an agency with team members
- Invite and manage team members
- Submit bids as an agency
- Shared agency profile with skills and portfolio
- Agency owner manages all contracts and payments

### For Admins
- Platform-wide analytics dashboard
- User management (suspend, ban, verify users)
- Dispute resolution (favor complainant / respondent / dismiss)
- Full transaction history monitoring
- Project and contract oversight

### Platform-wide
- JWT authentication + Google OAuth + GitHub OAuth
- Dark / Light / System theme
- Real-time-style notifications (mark as read, filter unread)
- Direct messaging between users
- Skill and category taxonomy
- Pagination, search, sorting, and filters throughout
- Swagger API documentation

---

## 3. Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **NestJS** (v10) | Node.js framework — modular architecture |
| **TypeORM** (v0.3) | ORM for PostgreSQL |
| **PostgreSQL** | Relational database |
| **JWT** (access + refresh tokens) | Authentication |
| **Passport.js** | OAuth strategies (Google, GitHub) |
| **Bcrypt** | Password hashing |
| **Class Validator / Transformer** | DTO validation |
| **Swagger / OpenAPI** | Auto-generated API docs |
| **Helmet** | HTTP security headers |
| **Multer** | File uploads |
| **Morgan** | HTTP request logging |
| **Throttler** | Rate limiting |

### Frontend

| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework |
| **React 18** | UI library |
| **Redux Toolkit** | Global state management |
| **RTK Query** | Data fetching + caching + cache invalidation |
| **React Hook Form** | Form management |
| **Zod** | Schema validation |
| **Tailwind CSS** | Utility-first styling |
| **Recharts** | Charts (AreaChart, BarChart, PieChart) |
| **Framer Motion** | Animations |
| **Sonner** | Toast notifications |
| **next-themes** | Dark/Light mode |
| **Lucide React** | Icon library |
| **js-cookie** | Cookie management for tokens |

---

## 4. Architecture

```
nexus/
├── backend/          # NestJS REST API
│   └── src/
│       ├── modules/  # Feature modules (14 modules)
│       ├── database/ # TypeORM entities + migrations
│       ├── common/   # Guards, decorators, filters, interceptors
│       └── config/   # App, database, JWT configs
│
└── frontend/         # Next.js application
    ├── app/          # App Router pages
    ├── components/   # Reusable UI components
    ├── store/        # Redux store + RTK Query API slices (15 slices)
    ├── hooks/        # Custom hooks
    ├── lib/          # Utilities (cn, formatters)
    └── types/        # TypeScript type definitions
```

### Request Flow

```
Browser → Next.js Frontend
          → RTK Query (caches response)
          → NestJS Backend (/api/...)
            → JWT Guard (validates token)
            → Roles Guard (checks role)
            → Controller → Service
            → TypeORM → PostgreSQL
          ← JSON Response (transformed by interceptor)
```

---

## 5. Database Schema

### Core Entities (25 tables)

```
users                    — base user account (role: client | freelancer | agency_owner | admin)
freelancer_profiles      — bio, hourly rate, skills, availability
client_profiles          — company, location, payment methods
portfolios               — freelancer portfolio items

projects                 — job postings by clients
skills                   — skill taxonomy (many-to-many with projects and users)
categories               — project categories

bids                     — freelancer/agency bids on projects
bid_milestones           — milestone proposals within a bid

contracts                — created when bid is accepted
milestones               — contract milestones (fund → submit → review → release)
milestone_submissions    — work submission with notes

payments                 — transaction ledger (deposit/withdraw/escrow/release)
invoices                 — generated invoices per contract
invoice_items            — line items on invoices

agencies                 — agency entity
agency_members           — team members (owner, members)
agency_profiles          — extended agency info

reviews                  — ratings after contract completion
disputes                 — raised when there's a conflict
dispute_messages         — threaded messages in a dispute

conversations            — message threads between users
messages                 — individual messages in a conversation
notifications            — in-app notification records

time_logs                — optional time tracking per contract
```

### Key Relationships

```
User (client)     ─── creates ──→ Project
User (freelancer) ─── submits ──→ Bid ──→ Contract ──→ Milestones
User              ─── has ──────→ FreelancerProfile | ClientProfile
Agency            ─── submits ──→ Bid (via agency_owner)
Contract          ─── generates → Payments (escrow flow)
Contract          ─── can have ─→ Dispute
User              ─── writes ──→ Review (after contract)
User              ─── sends ──→ Message (via Conversation)
```

---

## 6. Getting Started

### Prerequisites

- Node.js ≥ 18.x
- PostgreSQL ≥ 14
- npm ≥ 9.x

### Step 1 — Clone and install

```bash
git clone <repo-url>
cd nexus
```

### Step 2 — Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials and secrets (see section 7)
```

### Step 3 — Create the PostgreSQL database

```sql
-- In psql or pgAdmin:
CREATE DATABASE nexus_db;
```

### Step 4 — Run the backend

```bash
# Development (with hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API will be available at: **http://localhost:5000/api**  
Swagger docs at: **http://localhost:5000/api/docs**

> **Note:** TypeORM is configured with `synchronize: true` in development — it will auto-create all tables on first run. Do **not** use `synchronize: true` in production.

### Step 5 — Setup Frontend

```bash
cd ../frontend
npm install
cp .env.local.example .env.local  # or create manually
# Add: NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 6 — Run the frontend

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

The app will be available at: **http://localhost:3000**

---

## 7. Environment Variables

### Backend — `.env`

```env
# Application
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_NAME=nexus_db

# JWT Tokens
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-different-from-above
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth (get from console.cloud.google.com)
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# GitHub OAuth (get from github.com/settings/apps)
GITHUB_CLIENT_ID=Iv1.xxxx
GITHUB_CLIENT_SECRET=xxxx
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# File Uploads
MAX_FILE_SIZE=10485760    # 10MB in bytes
UPLOAD_DEST=./uploads

# Rate Limiting
THROTTLE_TTL=60           # seconds
THROTTLE_LIMIT=100        # requests per TTL

# Email / SMTP (required for OTP verification and password reset)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false         # true for port 465
MAIL_USER=your@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM_NAME=Nexus
MAIL_FROM_EMAIL=noreply@nexus.com

# Platform Fee (percentage deducted from freelancer payouts)
PLATFORM_FEE_PERCENT=10
```

### Frontend — `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 8. API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require a Bearer token in the header:
```
Authorization: Bearer <accessToken>
```

Tokens are returned on login/register. Use the refresh endpoint to get a new access token when it expires.

---

### Auth Endpoints

```
POST   /auth/register              Register a new user
POST   /auth/login                 Login with email + password
GET    /auth/me                    Get current user info
POST   /auth/refresh               Refresh access token
POST   /auth/forgot-password       Send password reset email
POST   /auth/reset-password        Reset password with token
PATCH  /auth/change-password       Change password (authenticated)
GET    /auth/google                Redirect to Google OAuth
GET    /auth/google/callback       Google OAuth callback
GET    /auth/github                Redirect to GitHub OAuth
GET    /auth/github/callback       GitHub OAuth callback
```

**Register Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "freelancer"  // client | freelancer | agency_owner
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "freelancer", ... },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### Users Endpoints

```
GET    /users/freelancers               Browse all freelancers (paginated + filtered)
GET    /users/profile/:id               Get any user's public profile
GET    /users/username/:username        Get user by username
PATCH  /users/me                        Update own basic profile
PATCH  /users/me/freelancer-profile     Update freelancer-specific profile
PATCH  /users/me/client-profile         Update client-specific profile
POST   /users/me/portfolio              Add a portfolio item
DELETE /users/me/portfolio/:id          Delete a portfolio item
GET    /users/admin/all                 [Admin] Get all users (paginated)
PATCH  /users/admin/:userId/status      [Admin] Ban/suspend/activate a user
```

**Query Params for GET /users/freelancers:**
```
?page=1&limit=12&search=react&experienceLevel=expert&availability=available&minRate=50&maxRate=200&category=web-development
```

---

### Projects Endpoints

```
GET    /projects                        Browse projects (paginated + filtered)
GET    /projects/featured               Get featured projects
GET    /projects/my/projects            Get own projects (client)
GET    /projects/:id                    Get project by ID
GET    /projects/:id/similar            Get similar projects
GET    /projects/:id/stats              Get project view/bid stats
POST   /projects                        Create a new project (client only)
PATCH  /projects/:id                    Update project
PATCH  /projects/:id/status             Change project status (open/closed/paused)
DELETE /projects/:id                    Delete project
```

**Query Params for GET /projects:**
```
?page=1&limit=12&search=react+app&status=open&type=fixed&category=web-development
 &experienceRequired=intermediate&minBudget=500&maxBudget=5000
 &sortBy=createdAt&sortOrder=desc
```

**Create Project Request:**
```json
{
  "title": "Build a React Dashboard",
  "description": "We need a beautiful admin dashboard...",
  "requirements": "Must know TypeScript and Recharts",
  "type": "fixed",           // fixed | hourly
  "budgetMin": 1000,
  "budgetMax": 3000,
  "deadline": "2025-03-01",
  "experienceRequired": "intermediate",
  "visibility": "public",
  "categoryId": "uuid",
  "skillIds": ["uuid1", "uuid2"],
  "milestones": [
    { "title": "UI Design", "amount": 500 },
    { "title": "Frontend Implementation", "amount": 2000 }
  ]
}
```

---

### Bids Endpoints

```
GET    /bids/my                         Get own bids (freelancer)
GET    /bids/project/:projectId         Get all bids for a project (owner only)
GET    /bids/:id                        Get a specific bid
POST   /bids                            Submit a bid on a project
PATCH  /bids/:id/status                 Update bid status (shortlist/accept/reject)
PATCH  /bids/:id/withdraw               Withdraw a bid
DELETE /bids/:id                        Delete a bid
```

**Submit Bid Request:**
```json
{
  "projectId": "uuid",
  "bidAmount": 2500,
  "deliveryDays": 30,
  "coverLetter": "I have extensive experience with React and TypeScript...",
  "milestones": [
    { "title": "UI Design", "amount": 500, "deliveryDays": 7 },
    { "title": "Implementation", "amount": 2000, "deliveryDays": 23 }
  ]
}
```

---

### Contracts Endpoints

```
GET    /contracts                       Get my contracts (client or freelancer)
GET    /contracts/:id                   Get contract details
GET    /contracts/:id/summary           Get financial summary
PATCH  /contracts/:id/sign              Sign the contract (both parties)
PATCH  /contracts/:id/status            Update status (pause/resume/complete/cancel)
```

**Milestone Escrow Flow:**
```
POST   /contracts/:contractId/milestones/:milestoneId/fund-escrow    Client funds escrow for a milestone
POST   /milestones/:id/submit                  Freelancer submits completed work
PATCH  /milestones/:id/review                  Client reviews work (approve/reject/request_revision)
GET    /milestones/contract/:contractId        Get all milestones for a contract
```

**Milestone States:**
```
pending     → in_progress       (client funds escrow)
in_progress → submitted         (freelancer submits work)
submitted   → paid              (client approves → payment released to freelancer)
submitted   → revision_requested (client requests changes → freelancer resubmits)
submitted   → rejected          (client rejects → escrow refunded to client)
revision_requested → submitted  (freelancer resubmits after revision)
```

---

### Payments Endpoints

```
GET    /payments/wallet             Get wallet balance (available + in escrow)
GET    /payments/history            Get transaction history (paginated)
POST   /payments/deposit            Deposit funds into wallet (simulated)
POST   /payments/withdraw           Withdraw funds from wallet (simulated)
```

**Wallet Response:**
```json
{
  "availableBalance": 1250.00,
  "escrowBalance": 500.00,
  "totalEarned": 4750.00,
  "totalSpent": 3000.00
}
```

**Deposit Request:**
```json
{
  "amount": 500,
  "method": "card"   // card | bank_transfer | paypal
}
```

---

### Agencies Endpoints

```
GET    /agencies                    Browse all agencies (paginated)
GET    /agencies/:id                Get agency by ID
GET    /agencies/slug/:slug         Get agency by slug
GET    /agencies/my                 Get my agency (agency_owner only)
POST   /agencies                    Create a new agency
PATCH  /agencies/:id                Update agency info
POST   /agencies/:agencyId/invite         Invite a user to the agency
PATCH  /agencies/:agencyId/invite/respond Accept or decline an invite
DELETE /agencies/:agencyId/members/:memberId  Remove a team member
```

---

### Reviews Endpoints

```
GET    /reviews/freelancer/:userId     Get all reviews for a freelancer
GET    /reviews/client/:userId         Get all reviews for a client
GET    /reviews/summary/:userId        Get rating breakdown (1-5 stars)
POST   /reviews                        Submit a review (after contract completion)
PATCH  /reviews/:id/respond            Respond to a review (reviewed user)
```

**Submit Review Request:**
```json
{
  "contractId": "uuid",
  "revieweeId": "uuid",
  "rating": 5,
  "comment": "Excellent work! Delivered on time and exceeded expectations."
}
```

---

### Disputes Endpoints

```
GET    /disputes/my              Get my disputes
GET    /disputes/:id             Get dispute details + messages
POST   /disputes                 Open a new dispute
POST   /disputes/:id/messages    Add a message to dispute thread
PATCH  /disputes/:id/resolve     [Admin] Resolve the dispute
```

**Open Dispute Request:**
```json
{
  "contractId": "uuid",
  "title": "Freelancer delivered incomplete work",
  "description": "The mobile app was missing 3 of 5 agreed features...",
  "reason": "incomplete_work",   // incomplete_work | poor_quality | no_delivery | payment_issue | other
  "claimedAmount": 1500
}
```

---

### Messages Endpoints

```
GET    /messages/conversations                              Get all conversations
GET    /messages/conversations/:conversationId/messages    Get messages in a conversation
POST   /messages/conversations                             Start a new conversation
POST   /messages/conversations/:conversationId/send        Send a message
DELETE /messages/:id                                       Delete a message
```

---

### Notifications Endpoints

```
GET    /notifications                  Get notifications (paginated, filterable by unread)
GET    /notifications/unread-count     Get unread count (for badge)
PATCH  /notifications/:id/read         Mark one as read
PATCH  /notifications/read-all         Mark all as read
DELETE /notifications/:id              Delete a notification
```

---

### Skills & Categories Endpoints

```
GET    /skills                 Get all skills (with search)
GET    /skills/top             Get top skills by usage
GET    /categories             Get all categories
GET    /categories/:id         Get single category
```

---

### Stats Endpoints

```
GET    /stats/me               Get personal stats (for dashboard)
GET    /stats/platform         [Admin] Get platform-wide stats
```

**Personal Stats Response:**
```json
{
  "totalProjects": 12,
  "activeContracts": 3,
  "totalEarned": 15000,
  "totalSpent": 0,
  "avgRating": 4.8,
  "completedJobs": 9,
  "pendingBids": 5,
  "monthlyData": [
    { "month": "Jan", "amount": 2500 },
    ...
  ]
}
```

---

## 9. Frontend Pages

### Public / Auth Pages
| Route | Description |
|---|---|
| `/login` | Email/password login + Google/GitHub OAuth buttons |
| `/register` | Registration with role selection |
| `/verify-email` | 6-digit OTP verification after registration |
| `/forgot-password` | Password reset request — sends email with reset link |
| `/reset-password` | Set new password using token from email |
| `/oauth-callback` | Handles OAuth redirect and token storage |

### Main Application Pages
| Route | Who can access | Description |
|---|---|---|
| `/dashboard` | All roles | Role-based dashboard with charts and stats |
| `/profile` | All roles | Edit own profile, skills, portfolio |
| `/settings` | All roles | Password, notifications, appearance, privacy |

### Projects
| Route | Description |
|---|---|
| `/projects` | Browse all open projects with search + filters |
| `/projects/post` | 5-step wizard to post a new project (client) |
| `/projects/:id` | Project detail with tabs: overview, bids, attachments |

### Bids
| Route | Description |
|---|---|
| `/bids` | My bids list with status tabs and withdraw option |

### Contracts
| Route | Description |
|---|---|
| `/contracts` | My contracts list with progress bars |
| `/contracts/:id` | Contract detail: milestones, escrow actions, financial summary |

### Freelancers & Agencies
| Route | Description |
|---|---|
| `/freelancers` | Browse freelancers with filters |
| `/freelancers/:id` | Public freelancer profile: overview, portfolio, reviews |
| `/agencies` | Browse agencies |
| `/agencies/:id` | Agency detail: about, team, reviews |
| `/agencies/my-agency` | Agency owner: manage profile, invite/remove members |

### Finance & Communication
| Route | Description |
|---|---|
| `/payments` | Wallet, deposit/withdraw, transaction history |
| `/messages` | Split-pane chat: conversations sidebar + message thread |
| `/notifications` | All notifications with unread filter and mark-all-read |

### Disputes
| Route | Description |
|---|---|
| `/disputes` | My disputes with status tabs |
| `/disputes/:id` | Dispute detail with message thread |

### Admin (admin role only)
| Route | Description |
|---|---|
| `/admin` | Redirects to dashboard (admin sees platform-wide stats) |
| `/admin/users` | User management table: search, filter, ban/suspend/verify |
| `/admin/disputes` | All platform disputes: review and resolve |
| `/admin/payments` | All platform transactions with volume summary |

---

## 10. User Roles

### `client`
- Post projects
- Browse freelancers and agencies
- Manage bids (shortlist / accept / reject)
- Sign contracts, fund escrow, review milestone work
- Open disputes, leave reviews

### `freelancer`
- Browse and search projects
- Submit bids (with milestones and cover letter)
- Manage active contracts, submit milestone work
- Manage wallet (deposit, withdraw)
- Maintain public profile and portfolio

### `agency_owner`
- Everything a freelancer can do
- Create and manage an agency
- Invite / remove team members
- Submit bids as an agency

### `admin`
- Access all platform data
- Manage users (verify, suspend, ban)
- Resolve disputes (platform-admin decision)
- View financial analytics

---

## 11. Payment & Escrow System

> **Note:** Payments are fully simulated. No real money is processed. This is a portfolio project.

### Wallet System
Every user has a wallet with two balances:
- **Available Balance** — free funds the user can withdraw or use to fund escrow
- **Escrow Balance** — funds locked in escrow for active milestones

### Escrow Flow (per milestone)

```
1. Client has funds in wallet (deposit from "payment method")

2. Client funds a milestone → 
   client.availableBalance -= amount
   client.escrowBalance += amount
   milestone.status = "funded"

3. Freelancer submits work →
   milestone.status = "in_review"

4a. Client APPROVES →
   client.escrowBalance -= amount
   freelancer.availableBalance += amount  (minus platform fee)
   milestone.status = "approved"

4b. Client REQUESTS REVISION →
   milestone.status = "revision_requested"
   Freelancer revises and resubmits → back to step 3

4c. Client REJECTS →
   milestone.status = "rejected"
   Funds returned to client escrow balance

5. Freelancer withdraws earnings to their "bank account" (simulated)
```

### Transaction Types Tracked
| Type | Description |
|---|---|
| `deposit` | User adds money to wallet |
| `withdrawal` | User withdraws money from wallet |
| `escrow_fund` | Client locks money for a milestone |
| `escrow_release` | Payment released to freelancer on approval |
| `refund` | Escrow returned to client on rejection |
| `platform_fee` | Platform commission (deducted from freelancer payout) |

---

## 12. Project Structure

### Backend Structure

```
backend/
└── src/
    ├── main.ts                    # App entry point (port 5000, Swagger, CORS, Helmet)
    ├── app.module.ts              # Root module, imports all feature modules
    │
    ├── config/
    │   ├── app.config.ts          # Port, CORS, upload settings
    │   ├── database.config.ts     # TypeORM PostgreSQL config
    │   └── jwt.config.ts          # JWT secret and expiration
    │
    ├── database/
    │   └── entities/              # 25 TypeORM entities
    │       ├── user.entity.ts
    │       ├── project.entity.ts
    │       ├── bid.entity.ts
    │       ├── contract.entity.ts
    │       ├── milestone.entity.ts
    │       ├── payment.entity.ts
    │       ├── agency.entity.ts
    │       ├── review.entity.ts
    │       ├── dispute.entity.ts
    │       ├── message.entity.ts
    │       ├── notification.entity.ts
    │       └── ... (16 more)
    │
    ├── common/
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts   # @CurrentUser() param decorator
    │   │   ├── public.decorator.ts         # @Public() — skips JWT guard
    │   │   └── roles.decorator.ts          # @Roles('admin') — role guard
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts           # Validates Bearer token
    │   │   └── roles.guard.ts              # Validates user role
    │   ├── filters/
    │   │   └── http-exception.filter.ts    # Formats all errors consistently
    │   ├── interceptors/
    │   │   └── transform.interceptor.ts    # Wraps all responses in { success, data }
    │   └── utils/
    │       ├── bcrypt.util.ts              # Hash + compare passwords
    │       ├── generate.util.ts            # Generate slugs, codes, references
    │       └── pagination.util.ts          # Paginate TypeORM queries
    │
    └── modules/
        ├── auth/                  # Register, login, OAuth, JWT, refresh tokens
        ├── users/                 # Profiles, portfolio, freelancer search
        ├── projects/              # CRUD, filtering, status management
        ├── bids/                  # Submit, withdraw, shortlist, accept/reject
        ├── contracts/             # Sign, pause, complete, cancel
        ├── milestones/            # Fund escrow, submit work, review, release
        ├── payments/              # Wallet, deposit, withdraw, history
        ├── agencies/              # Create agency, invite/remove members
        ├── reviews/               # Rate after contract, respond to reviews
        ├── disputes/              # Open, message, admin-resolve
        ├── messages/              # Conversations, send/receive
        ├── notifications/         # In-app notifications, mark-as-read
        ├── skills/                # Skill and category taxonomy
        └── stats/                 # Personal + platform analytics
```

### Frontend Structure

```
frontend/
├── app/
│   ├── layout.tsx                 # Root layout (ThemeProvider, StoreProvider)
│   ├── (auth)/                    # Unauthenticated pages
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── oauth-callback/page.tsx
│   └── (main)/                    # Protected pages (auth required)
│       ├── layout.tsx             # Sidebar + Header + auth guard
│       ├── dashboard/page.tsx     # Role-based dashboard router
│       ├── profile/page.tsx
│       ├── settings/page.tsx
│       ├── projects/
│       │   ├── page.tsx           # Browse projects
│       │   ├── post/page.tsx      # 5-step wizard
│       │   └── [id]/page.tsx      # Project detail
│       ├── bids/page.tsx
│       ├── contracts/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── freelancers/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── agencies/
│       │   ├── page.tsx
│       │   ├── [id]/page.tsx
│       │   └── my-agency/page.tsx
│       ├── payments/page.tsx
│       ├── messages/page.tsx
│       ├── notifications/page.tsx
│       ├── disputes/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       └── admin/
│           ├── page.tsx           # Admin dashboard (platform stats)
│           ├── users/page.tsx
│           ├── disputes/page.tsx
│           └── payments/page.tsx
│
├── components/
│   ├── ui/
│   │   └── Pagination.tsx         # Smart pagination with ellipsis
│   ├── dashboard/
│   │   ├── StatCard.tsx           # Reusable metric card
│   │   ├── ClientDashboard.tsx    # Spending charts + recent projects
│   │   ├── FreelancerDashboard.tsx # Earnings charts + bid stats
│   │   ├── AgencyDashboard.tsx    # Revenue + contract breakdown
│   │   └── AdminDashboard.tsx     # Platform analytics + alerts
│   ├── projects/
│   │   ├── ProjectCard.tsx        # Grid/list card
│   │   ├── ProjectFilters.tsx     # Slide-in filter sidebar
│   │   ├── BidSubmitModal.tsx     # Bid form with dynamic milestones
│   │   └── BidCard.tsx            # Bid display with owner actions
│   ├── contracts/
│   │   ├── MilestoneSubmitModal.tsx  # Submit work form
│   │   └── MilestoneReviewModal.tsx  # Approve/reject/revision form
│   └── freelancers/
│       └── FreelancerCard.tsx     # Freelancer grid card
│
├── store/
│   ├── index.ts                   # Redux store with 14 API slices
│   ├── provider.tsx               # StoreProvider component
│   ├── slices/
│   │   ├── authSlice.ts           # user, isAuthenticated state
│   │   └── uiSlice.ts             # sidebar open/close, modal state
│   └── api/                       # 14 RTK Query API slices
│       ├── baseApi.ts
│       ├── authApi.ts
│       ├── usersApi.ts
│       ├── projectsApi.ts
│       ├── bidsApi.ts
│       ├── contractsApi.ts
│       ├── milestonesApi.ts
│       ├── paymentsApi.ts
│       ├── agenciesApi.ts
│       ├── reviewsApi.ts
│       ├── disputesApi.ts
│       ├── messagesApi.ts
│       ├── notificationsApi.ts
│       ├── skillsApi.ts
│       └── statsApi.ts
│
├── hooks/
│   └── useDebounce.ts             # Generic debounce for search inputs
│
├── lib/
│   └── utils.ts                   # cn(), formatCurrency(), formatDate(), getStatusColor()
│
└── types/
    └── index.ts                   # All TypeScript interfaces (User, Project, Bid, etc.)
```

---

## Frequently Asked Questions

**Q: Why no real payments?**  
A: This is a portfolio project demonstrating architecture and UI quality. Real payment processing (Stripe, PayPal) would require paid accounts and production infrastructure. The fake escrow system demonstrates the complete flow and data model.

**Q: Can I add real payments later?**  
A: Yes. Replace the `deposit` and `withdraw` service methods with Stripe Checkout sessions. The wallet and transaction model is already designed for it.

**Q: Why both access token and refresh token?**  
A: Security best practice. The access token is short-lived (7 days here, typically 15 minutes in production). The refresh token is long-lived (30 days) and stored securely. When the access token expires, the client silently refreshes it using the refresh token without logging the user out.

**Q: How does the notification system work?**  
A: The backend's `NotificationsService` is injected into other services (bids, contracts, milestones, payments). Whenever a relevant event occurs (bid accepted, milestone approved, payment received), a notification record is created in the database. The frontend polls `/notifications/unread-count` to show the badge and the full list on the Notifications page. No WebSockets are used — polling is sufficient for a portfolio-level app.

**Q: Is TypeORM synchronize safe for development?**  
A: `synchronize: true` auto-creates/alters tables based on entity definitions. Fine for development — it means you never need to write migrations while building. For production, set `synchronize: false` and use `npm run migration:run`.

**Q: Email verification isn't working — OTP emails aren't being received.**  
A: You need a working SMTP server. For local development, use [Mailtrap](https://mailtrap.io) or [Ethereal](https://ethereal.email) — both are free sandboxes that catch emails without sending them. For Gmail, enable 2FA and create an App Password at `myaccount.google.com/apppasswords`. Set `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, and `MAIL_PASS` in your `.env`.

**Q: What does the platform fee do?**  
A: When a client approves a milestone, the `PLATFORM_FEE_PERCENT` (default 10%) is deducted from the released amount before crediting the freelancer's wallet. A separate `platform_fee` payment record is created for auditing. The platform's revenue is visible in the Admin dashboard under platform stats.

---

## License

MIT — free to use as a portfolio reference, template, or learning resource.
