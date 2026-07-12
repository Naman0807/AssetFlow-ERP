# AssetFlow — Enterprise Asset & Resource Management System

A centralized ERP platform for tracking, allocating, and maintaining physical assets and shared resources. Built with Next.js, Fastify, Supabase, and Bun.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime & Package Manager | Bun |
| Frontend | Next.js 15 (App Router) + Tailwind CSS + lucide-react |
| Backend API | Fastify 5 + TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |

## Features

- **Asset Registry** — Full lifecycle tracking (Available → Allocated → Under Maintenance → Lost → Retired → Disposed)
- **Allocation Engine** — Hard conflict control prevents double-allocation with transfer workflows
- **Resource Booking** — Calendar view with overlap validation for shared assets
- **Maintenance Workflow** — State machine pipeline (Pending → Approved → Assigned → In Progress → Resolved)
- **Audit Cycles** — Verification cycles with discrepancy engine and automatic status updates
- **Admin Panel** — User directory, department management, asset categories
- **Activity Logs** — Immutable audit trail of all system actions
- **Role-Based Access** — Employee, Asset Manager, Department Head, Admin

## Project Structure

```
assetflow/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify backend
├── supabase/
│   ├── migrations/   # SQL schema + triggers
│   └── seed.sql      # Reference data
├── docs/             # Architecture & specs
├── package.json      # Bun workspaces
└── .env.example      # Environment template
```

## Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Supabase](https://supabase.com) account (free tier works)

## Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd odoo-naman
bun install
```

### 2. Environment Variables

```bash
cp .env.example .env
# Fill in your Supabase credentials:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY  
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_JWT_SECRET
```

For the frontend:
```bash
cp apps/web/.env.example apps/web/.env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Database Setup

1. Go to your Supabase project → SQL Editor
2. Run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/migrations/002_auth_trigger.sql`
4. (Optional) Run `supabase/seed.sql` for reference data
5. Create a Storage bucket named `asset-attachments`

### 4. Start Development

```bash
# Run both API and Web concurrently
bun run dev

# Or run individually:
bun run dev:api    # http://localhost:3001
bun run dev:web    # http://localhost:3000
```

## API Endpoints

| Domain | Endpoints | Description |
|--------|-----------|-------------|
| Auth | `POST /auth/signup`, `POST /auth/login` | Registration & login via Supabase |
| Assets | `GET/POST/PATCH/DELETE /assets` | CRUD with filters & search |
| Allocations | `GET/POST /allocations`, `POST /allocations/:id/return` | Conflict-controlled assignment |
| Bookings | `GET/POST /bookings`, `GET /bookings/calendar` | Overlap-validated reservations |
| Maintenance | `GET/POST /maintenance`, `PATCH /maintenance/:id/*` | State machine workflow |
| Transfers | `GET/POST /transfers`, `PATCH /transfers/:id/*` | Request/approve pipeline |
| Audits | `GET/POST /audits/cycles`, `POST /audits/assignments/:id/results` | Cycle management |
| Dashboard | `GET /dashboard/kpis`, `GET /dashboard/*` | Real-time metrics |
| Admin | `GET/PATCH /admin/users`, `GET/POST /admin/departments`, `GET/POST /admin/categories` | System config |

## User Roles

| Role | Permissions |
|------|-------------|
| Employee | View assets, book resources, report maintenance, request transfers |
| Department Head | + Approve department allocations, book for department |
| Asset Manager | + Register assets, approve transfers & maintenance, manage returns |
| Admin | + Full system control, user management, audit cycles |

## Database Schema

12 tables with UUID primary keys, enum types, foreign key constraints, and performance indexes. See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## License

MIT
