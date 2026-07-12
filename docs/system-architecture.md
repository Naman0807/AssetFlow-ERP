# AssetFlow — Enterprise Asset & Resource Management System

## System Overview

AssetFlow is an internal enterprise platform that gives organizations a single source of truth for physical and digital assets, resource bookings, maintenance workflows, and periodic audit cycles. The system enforces role-based access (Employee, Asset Manager, Department Head, Admin) across every feature, provides hard conflict control to prevent double-allocation of assets and overlapping bookings, maintains an immutable audit trail via activity logs, and surfaces real-time KPIs on an analytics dashboard. The design goal is a production-grade monorepo application that runs entirely on Supabase's free tier (PostgreSQL + Auth + Storage) with a thin Fastify API middleware for business logic and a Next.js App Router frontend for the user experience.

---

## Architecture Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Next.js App Router + Tailwind                      │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐  │  │
│  │  │  Auth    │ │  Assets  │ │ Bookings │ │ Maintenance│ │ Dashboard│  │  │
│  │  │ Pages   │ │  Pages   │ │  Pages   │ │   Pages    │ │  Pages   │  │  │
│  │  └────┬────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ └────┬─────┘  │  │
│  │       │           │            │              │             │         │  │
│  │       └───────────┴─────┬──────┴──────────────┴─────────────┘         │  │
│  │                         │                                             │  │
│  │              ┌──────────▼──────────┐                                  │  │
│  │              │  Supabase JS Client │  ◄── Auth token (JWT)            │  │
│  │              │  + Fastify fetch    │                                  │  │
│  │              └──────────┬──────────┘                                  │  │
│  └─────────────────────────┼─────────────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────────────────┘
                             │  HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Fastify API Middleware  (Node.js)                     │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────────────────┐   │
│  │  Auth Guard   │  │ Request       │  │  Route Modules                │   │
│  │  (verify JWT) │  │ Logger        │  │  /assets  /allocations        │   │
│  │               │  │               │  │  /bookings  /maintenance      │   │
│  │               │  │               │  │  /audits  /dashboard  /admin  │   │
│  └──────┬───────┘  └───────┬───────┘  └──────────┬─────────────────────┘   │
│         │                  │                      │                         │
│         └──────────┬───────┴──────────────────────┘                         │
│                    │                                                       │
│         ┌──────────▼──────────┐                                            │
│         │  Supabase Client    │  ◄── Uses service_role key for writes      │
│         │  Plugin (Fastify)   │      Uses anon key for reads (optional)   │
│         └──────────┬──────────┘                                            │
└────────────────────┼───────────────────────────────────────────────────────┘
                     │  HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Supabase Platform                                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │  PostgreSQL   │  │ Supabase     │  │  Supabase     │  │  Supabase     │  │
│  │  Database     │  │ Auth         │  │  Storage      │  │  Edge         │  │
│  │  (12 tables)  │  │ (JWT tokens) │  │  (attachments)│  │  Functions    │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
odoo-naman/
├── apps/
│   ├── web/                          # Next.js App Router frontend
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout, fonts, providers
│   │   │   ├── page.tsx              # Landing / redirect
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx        # Sidebar + topbar shell
│   │   │   │   ├── page.tsx          # Analytics dashboard
│   │   │   │   ├── assets/
│   │   │   │   │   ├── page.tsx      # Asset list
│   │   │   │   │   ├── new/page.tsx  # Create asset
│   │   │   │   │   └── [id]/page.tsx # Asset detail
│   │   │   │   ├── allocations/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── new/page.tsx
│   │   │   │   ├── bookings/
│   │   │   │   │   ├── page.tsx      # Calendar view
│   │   │   │   │   └── new/page.tsx
│   │   │   │   ├── maintenance/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── audits/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── transfers/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── activity-log/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── admin/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── users/page.tsx
│   │   │   │       └── departments/page.tsx
│   │   │   └── api/                  # (optional BFF routes if needed)
│   │   ├── components/
│   │   │   ├── ui/                   # Reusable primitives (Button, Modal, Table, Badge)
│   │   │   ├── layout/               # Sidebar, Topbar, PageHeader
│   │   │   ├── assets/               # AssetForm, AssetCard, AssetFilters
│   │   │   ├── bookings/             # CalendarView, BookingForm, TimeSlotPicker
│   │   │   ├── maintenance/          # MaintenanceWorkflow, StatusTimeline
│   │   │   ├── audits/               # AuditWizard, DiscrepancyTable
│   │   │   ├── dashboard/            # KPICard, Charts, RecentActivity
│   │   │   └── shared/               # DataTable, SearchInput, Pagination, EmptyState
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx        # User session, role, profile
│   │   │   └── SupabaseContext.tsx    # Supabase client singleton
│   │   ├── hooks/
│   │   │   ├── useAssets.ts
│   │   │   ├── useAllocations.ts
│   │   │   ├── useBookings.ts
│   │   │   ├── useMaintenance.ts
│   │   │   ├── useAudits.ts
│   │   │   └── useDashboard.ts
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts         # Browser client
│   │   │   │   └── server.ts         # Server-side client (cookies)
│   │   │   ├── constants.ts          # Enums, status maps, role permissions
│   │   │   └── utils.ts              # Date formatting, conflict checks
│   │   ├── middleware.ts             # Next.js middleware (auth redirect)
│   │   ├── tailwind.config.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   └── api/                          # Fastify API middleware
│       ├── src/
│       │   ├── server.ts             # Fastify bootstrap
│       │   ├── plugins/
│       │   │   ├── supabase.ts       # FastifySupabase plugin (client injection)
│       │   │   ├── auth.ts           # JWT verification, role extraction
│       │   │   └── logger.ts         # Request/response logging
│       │   ├── routes/
│       │   │   ├── assets.ts
│       │   │   ├── allocations.ts
│       │   │   ├── bookings.ts
│       │   │   ├── maintenance.ts
│       │   │   ├── audits.ts
│       │   │   ├── dashboard.ts
│       │   │   ├── admin.ts
│       │   │   ├── transfers.ts
│       │   │   └── activity-log.ts
│       │   ├── schemas/              # JSON Schema / TypeBox validation
│       │   │   ├── assets.ts
│       │   │   ├── allocations.ts
│       │   │   ├── bookings.ts
│       │   │   ├── maintenance.ts
│       │   │   ├── audits.ts
│       │   │   └── common.ts
│       │   ├── services/             # Business logic layer
│       │   │   ├── asset.service.ts
│       │   │   ├── allocation.service.ts
│       │   │   ├── booking.service.ts
│       │   │   ├── maintenance.service.ts
│       │   │   ├── audit.service.ts
│       │   │   ├── dashboard.service.ts
│       │   │   ├── admin.service.ts
│       │   │   └── activity.service.ts
│       │   └── types/
│       │       └── index.ts          # Shared TS types
│       ├── tsconfig.json
│       └── package.json
├── supabase/
│   ├── migrations/                   # SQL migration files (timestamp-named)
│   │   ├── 001_create_departments.sql
│   │   ├── 002_create_profiles.sql
│   │   ├── 003_create_asset_categories.sql
│   │   ├── 004_create_assets.sql
│   │   ├── 005_create_allocations.sql
│   │   ├── 006_create_transfer_requests.sql
│   │   ├── 007_create_bookings.sql
│   │   ├── 008_create_maintenance_requests.sql
│   │   ├── 009_create_audit_cycles.sql
│   │   ├── 010_create_audit_assignments.sql
│   │   ├── 011_create_audit_results.sql
│   │   ├── 012_create_activity_logs.sql
│   │   └── 013_create_indexes.sql
│   └── seed.sql                      # Reference data (departments, categories, default admin)
├── docs/
│   └── system-architecture.md        # This file
├── package.json                      # Root workspace config
├── turbo.json                        # Turborepo task pipeline
├── .gitignore
└── .env.example                      # All env vars documented
```

---

## Component Breakdown

### Backend (Fastify API)

**Responsibility:** Server-side business logic that is too complex or too security-sensitive for client-side execution. Acts as a thin validation and orchestration layer over Supabase.

**Route Structure:**

| Route Module       | Responsibility                                                  |
| ------------------ | --------------------------------------------------------------- |
| `assets.ts`        | CRUD for assets, image upload via Supabase Storage, search/filter |
| `allocations.ts`   | Create/cancel allocations, conflict detection, return flow       |
| `bookings.ts`      | Create/cancel bookings, calendar data, overlap validation        |
| `maintenance.ts`   | Status transitions, technician assignment, resolution             |
| `audits.ts`        | Cycle management, assignment, discrepancy engine                 |
| `dashboard.ts`     | Aggregated KPI queries (counts, trends, utilization)             |
| `admin.ts`         | User management, role changes, department CRUD                   |
| `transfers.ts`     | Transfer request workflow (submit → approve → execute)           |
| `activity-log.ts`  | Paginated activity log queries (immutable, read-only)            |

**Middleware Stack (applied via Fastify plugins):**

1. **Logger Plugin** — Pino-based structured logging for every request/response cycle.
2. **Auth Guard Plugin** — Verifies the Supabase JWT from `Authorization: Bearer <token>`. Extracts `user_id` and `role` into `request.auth`. Rejects unauthenticated requests with `401`. Rejects insufficient-role requests with `403`.
3. **Supabase Client Plugin** — Creates and injects a Supabase client into `request.supabase` using the `service_role` key for backend writes. All DB access goes through this client — no raw SQL from routes.

**Services Layer:** Each route module delegates to a corresponding service file. Services contain all business logic: validation rules, conflict checks, state transitions, activity log writes. Routes are thin — they parse input, call a service, and return the result.

### Frontend (Next.js)

**Responsibility:** All user-facing UI. Server Components for data fetching where possible; Client Components for interactive forms, modals, and real-time updates.

**App Router Structure:**

- `(auth)/` — Login and registration pages. No layout shell (centered card).
- `(dashboard)/` — All authenticated pages wrapped in a shared layout with sidebar navigation and topbar.

**Auth Context (`AuthContext.tsx`):**

- Listens to `supabase.auth.onAuthStateChange`.
- Fetches the `profiles` row for the current user on login (role, department_id, avatar_url).
- Exposes `{ user, profile, role, signOut, refreshProfile }`.
- The `role` value drives conditional rendering throughout the app (e.g., Admin pages hidden from Employees).

**Component Hierarchy:**

```
<AuthProvider>
  <SupabaseProvider>
    <Layout>
      <Sidebar />        ← Role-filtered navigation items
      <Topbar />         ← User avatar, notifications bell, sign-out
      <PageHeader />     ← Title, breadcrumbs, action buttons
      <main>{children}</main>
    </Layout>
  </SupabaseProvider>
</AuthProvider>
```

**Shared Components (`components/ui/`):**

| Component       | Purpose                                       |
| --------------- | --------------------------------------------- |
| `Button`        | Variants: primary, secondary, danger, ghost   |
| `Modal`         | Dialog overlay with title, body, footer       |
| `DataTable`     | Sortable, filterable table with pagination    |
| `Badge`         | Status/role indicators with color variants    |
| `SearchInput`   | Debounced text search with icon               |
| `Pagination`    | Page controls with prev/next/jump             |
| `EmptyState`    | Illustration + message for empty views        |
| `Toast`         | Success/error notifications                   |
| `ConfirmDialog` | Destructive action confirmation               |

**Custom Hooks:**

Each hook wraps Supabase queries with loading/error states, optimistic updates where appropriate, and re-fetch logic.

### Database

**Schema Overview (12 tables + RLS policies):**

```
departments (1) ──────┐
                      │
profiles (N:1) ───────┤
                      │
asset_categories (1) ──┤
                      │
assets (N:1 to dept, N:1 to category)
   │
   ├── allocations (N:1 to asset, N:1 to profile)
   │
   ├── bookings (N:1 to asset, N:1 to profile)
   │
   ├── maintenance_requests (N:1 to asset, N:1 to requester, N:1 to technician)
   │
   ├── audit_assignments (N:1 to asset, N:1 to auditor)
   │      │
   │      └── audit_results (N:1 to assignment)
   │
   └── transfer_requests (N:1 to asset, N:1 to requester)

audit_cycles (1) ── audit_assignments (1:N)

activity_logs (standalone — references entity_type + entity_id polymorphically)
```

**Key Relationships:**

| Relationship                      | Type   | Constraint                                    |
| --------------------------------- | ------ | --------------------------------------------- |
| `assets.department_id` → `departments` | N:1    | ON DELETE SET NULL                            |
| `assets.category_id` → `asset_categories` | N:1 | ON DELETE RESTRICT                         |
| `assets.assigned_to` → `profiles` | N:1    | ON DELETE SET NULL                            |
| `allocations.asset_id` → `assets` | N:1    | ON DELETE RESTRICT                            |
| `allocations.user_id` → `profiles` | N:1   | ON DELETE RESTRICT                            |
| `bookings.asset_id` → `assets`    | N:1    | ON DELETE RESTRICT                            |
| `bookings.user_id` → `profiles`   | N:1    | ON DELETE RESTRICT                            |
| `maintenance_requests.asset_id` → `assets` | N:1 | ON DELETE RESTRICT                     |
| `maintenance_requests.assigned_to` → `profiles` | N:1 | ON DELETE SET NULL                  |
| `profiles.user_id` → `auth.users` | 1:1    | ON DELETE CASCADE                             |

**Indexes (beyond PK/FK defaults):**

| Index                              | Purpose                                        |
| ---------------------------------- | ---------------------------------------------- |
| `assets(status, department_id)`    | Filter by status within a department            |
| `assets(category_id, status)`      | Category listing with status                    |
| `allocations(asset_id, status)`    | Active allocation lookup for conflict checks    |
| `allocations(user_id, status)`     | User's current allocations                      |
| `bookings(asset_id, start_time, end_time)` | Overlap detection range scan           |
| `bookings(user_id, start_time)`    | User's upcoming bookings                        |
| `maintenance_requests(status)`     | Workflow queue queries                          |
| `maintenance_requests(assigned_to, status)` | Technician's active work             |
| `audit_results(audit_assignment_id)` | Results per assignment                        |
| `activity_logs(entity_type, entity_id)` | Polymorphic lookup                         |
| `activity_logs(created_at DESC)`   | Chronological activity feed                     |
| `activity_logs(user_id, created_at)` | Per-user activity                              |

**Row Level Security (RLS) Policies:**

Supabase RLS is enabled on every table. The Fastify API uses the `service_role` key which bypasses RLS, so RLS serves as a safety net for direct client queries. Key policies:

- `profiles`: Users can read all profiles; only admins can update roles.
- `assets`: All authenticated users can read; only asset managers and admins can create/update.
- `allocations`: Users can read their own + their department's; only asset managers can create.
- `bookings`: Users can read all; only create/update their own.
- `maintenance_requests`: Requesters and technicians can read their own; asset managers see all.
- `activity_logs`: Read-only for everyone (immutable).

---

## API Design

Base URL: `http://localhost:3001/api/v1` (Fastify dev server)

### Authentication

| Method | Path                     | Description                                  | Auth     |
| ------ | ------------------------ | -------------------------------------------- | -------- |
| POST   | `/auth/signup`           | Register new user (creates auth.users + profile) | Public |
| POST   | `/auth/login`            | Exchange credentials for JWT + refresh token  | Public   |
| POST   | `/auth/logout`           | Invalidate session                           | Required |
| GET    | `/auth/me`               | Get current user profile + role              | Required |

### Assets

| Method | Path                          | Description                                  | Roles                  |
| ------ | ----------------------------- | -------------------------------------------- | ---------------------- |
| GET    | `/assets`                     | List assets (filter: status, dept, category, search) | All              |
| GET    | `/assets/:id`                 | Asset detail with allocation history         | All                    |
| POST   | `/assets`                     | Create asset                                 | Manager, Admin         |
| PATCH  | `/assets/:id`                 | Update asset metadata                        | Manager, Admin         |
| DELETE | `/assets/:id`                 | Soft-delete / mark as Retired                | Admin                  |
| POST   | `/assets/:id/attachment`      | Upload attachment to Supabase Storage        | Manager, Admin         |
| GET    | `/assets/:id/attachments`     | List attachments                             | All                    |

### Allocations

| Method | Path                          | Description                                  | Roles                  |
| ------ | ----------------------------- | -------------------------------------------- | ---------------------- |
| GET    | `/allocations`                | List (filter: asset_id, user_id, status)     | All                    |
| POST   | `/allocations`                | Allocate asset to user (conflict check)      | Manager, Admin         |
| PATCH  | `/allocations/:id`            | Update details (e.g., expected_return_date)  | Manager, Admin         |
| POST   | `/allocations/:id/return`     | Mark returned, update asset status           | Manager, Admin         |
| DELETE | `/allocations/:id`            | Cancel pending allocation                    | Manager, Admin         |

### Bookings

| Method | Path                          | Description                                  | Roles                  |
| ------ | ----------------------------- | -------------------------------------------- | ---------------------- |
| GET    | `/bookings`                   | List (filter: asset_id, date range, user_id) | All                    |
| GET    | `/bookings/calendar`          | Calendar view data (month/week/day)          | All                    |
| POST   | `/bookings`                   | Create booking (overlap validation)          | All (own)              |
| PATCH  | `/bookings/:id`               | Update booking times                         | Owner, Manager         |
| DELETE | `/bookings/:id`               | Cancel booking                               | Owner, Manager         |

### Maintenance

| Method | Path                                          | Description                                  | Roles              |
| ------ | --------------------------------------------- | -------------------------------------------- | ------------------ |
| GET    | `/maintenance`                                | List requests (filter: status, asset, assignee) | All            |
| GET    | `/maintenance/:id`                            | Request detail with status history           | All                |
| POST   | `/maintenance`                                | Submit maintenance request                   | All                |
| PATCH  | `/maintenance/:id/approve`                    | Approve request (Pending → Approved)         | Manager, Admin     |
| PATCH  | `/maintenance/:id/assign`                     | Assign technician (Approved → Assigned)      | Manager, Admin     |
| PATCH  | `/maintenance/:id/start`                      | Start work (Assigned → In Progress)          | Technician         |
| PATCH  | `/maintenance/:id/resolve`                    | Mark resolved (In Progress → Resolved)       | Technician, Manager|
| PATCH  | `/maintenance/:id/reject`                     | Reject request (Pending → Rejected)          | Manager, Admin     |

### Transfers

| Method | Path                          | Description                                  | Roles                  |
| ------ | ----------------------------- | -------------------------------------------- | ---------------------- |
| GET    | `/transfers`                  | List transfer requests                       | Manager, Admin         |
| POST   | `/transfers`                  | Submit transfer request                      | Manager, Admin         |
| PATCH  | `/transfers/:id/approve`      | Approve transfer                             | Manager, Admin         |
| PATCH  | `/transfers/:id/reject`       | Reject transfer                              | Manager, Admin         |
| POST   | `/transfers/:id/execute`      | Execute transfer (updates asset department)  | Admin                  |

### Audits

| Method | Path                              | Description                                  | Roles              |
| ------ | --------------------------------- | -------------------------------------------- | ------------------ |
| GET    | `/audits/cycles`                  | List audit cycles                            | Manager, Admin     |
| POST   | `/audits/cycles`                  | Create audit cycle                           | Admin              |
| GET    | `/audits/cycles/:id`              | Cycle detail with assignments                | Manager, Admin     |
| POST   | `/audits/cycles/:id/assignments`  | Bulk-assign assets to auditors               | Manager, Admin     |
| GET    | `/audits/assignments/:id`         | Assignment detail (assets to audit)          | Auditor, Manager   |
| POST   | `/audits/assignments/:id/results` | Submit audit result (match / discrepancy)    | Auditor            |
| GET    | `/audits/cycles/:id/report`       | Cycle report with discrepancy summary        | Manager, Admin     |

### Dashboard

| Method | Path                          | Description                                  | Roles              |
| ------ | ----------------------------- | -------------------------------------------- | ------------------ |
| GET    | `/dashboard/kpis`             | Total assets, utilization rate, open maintenance, active allocations | All |
| GET    | `/dashboard/assets-by-status` | Asset count grouped by lifecycle status      | All                |
| GET    | `/dashboard/assets-by-dept`   | Asset distribution across departments        | All                |
| GET    | `/dashboard/maintenance-trend`| Maintenance requests over time (monthly)     | All                |
| GET    | `/dashboard/recent-activity`  | Last 20 activity log entries                 | All                |

### Admin

| Method | Path                          | Description                                  | Roles              |
| ------ | ----------------------------- | -------------------------------------------- | ------------------ |
| GET    | `/admin/users`                | List all users with profiles                 | Admin              |
| PATCH  | `/admin/users/:id/role`       | Change user role                             | Admin              |
| GET    | `/admin/departments`          | List departments                             | Admin              |
| POST   | `/admin/departments`          | Create department                            | Admin              |
| PATCH  | `/admin/departments/:id`      | Update department                            | Admin              |
| DELETE | `/admin/departments/:id`      | Delete department (must have no assets)      | Admin              |

### Activity Log

| Method | Path                          | Description                                  | Roles              |
| ------ | ----------------------------- | -------------------------------------------- | ------------------ |
| GET    | `/activity-log`               | Paginated log (filter: entity, user, date range) | All            |

---

## Data Flow Diagrams

### Asset Allocation (with conflict control)

```
User submits allocation form
        │
        ▼
Next.js calls POST /api/v1/allocations
        │
        ▼
Fastify Auth Guard verifies JWT → extracts role
        │
        ▼
Route checks role ∈ [Manager, Admin]
        │
        ▼
AllocationService.create(data)
        │
        ├── 1. Check asset status = 'Available'
        │      └── If not → return 409 "Asset not available"
        │
        ├── 2. Check no active allocation exists for this asset
        │      └── SELECT FROM allocations WHERE asset_id = X AND status = 'active'
        │      └── If exists → return 409 "Asset already allocated"
        │
        ├── 3. Insert allocation (status = 'active')
        │
        ├── 4. Update asset status → 'Allocated'
        │
        ├── 5. Write activity_log (entity_type='allocation', action='created')
        │
        └── 6. Return allocation record
```

### Resource Booking (with overlap validation)

```
User submits booking form (asset_id, start_time, end_time)
        │
        ▼
POST /api/v1/bookings
        │
        ▼
BookingService.create(data)
        │
        ├── 1. Validate start_time < end_time
        │
        ├── 2. Check no overlapping booking exists:
        │      SELECT FROM bookings
        │      WHERE asset_id = X
        │        AND status = 'confirmed'
        │        AND start_time < :end_time
        │        AND end_time > :start_time
        │      └── If exists → return 409 "Time slot conflict"
        │
        ├── 3. Check asset is not 'Under Maintenance' or 'Retired'
        │
        ├── 4. Insert booking (status = 'confirmed')
        │
        ├── 5. Write activity_log
        │
        └── 6. Return booking record
```

### Maintenance Workflow

```
[All Users]           POST /maintenance          → status: 'pending'
                                        │
                                        ▼
[Manager/Admin]       PATCH /maintenance/:id/approve  → status: 'approved'
                                        │
                                        ▼
[Manager/Admin]       PATCH /maintenance/:id/assign   → status: 'technician_assigned'
                                        │
                                        ▼
[Technician]          PATCH /maintenance/:id/start    → status: 'in_progress'
                                        │
                                        ▼
[Technician/Manager]  PATCH /maintenance/:id/resolve  → status: 'resolved'
                                                └── → asset status: 'Available'

  Any status → [Manager/Admin] PATCH /maintenance/:id/reject → status: 'rejected'
```

Valid transitions enforced in `maintenance.service.ts`:

| From                   | Allowed Transitions                            |
| ---------------------- | ----------------------------------------------- |
| `pending`              | `approved`, `rejected`                          |
| `approved`             | `technician_assigned`                           |
| `technician_assigned`  | `in_progress`                                   |
| `in_progress`          | `resolved`                                      |
| `rejected`             | (terminal)                                      |
| `resolved`             | (terminal)                                      |

### Audit Discrepancy Engine

```
[Admin] creates audit cycle → assigns assets to auditors
                                        │
                                        ▼
[Auditor] submits results per asset:
  ├── expected_qty vs counted_qty
  ├── expected_condition vs actual_condition
  ├── location_check
  └── notes
                                        │
                                        ▼
DiscrepancyEngine.processResults(cycle_id):
  │
  ├── For each result:
  │     ├── If qty_match AND condition_match AND location_match → 'match'
  │     └── Else → 'discrepancy' (with specific flags)
  │
  ├── Calculate cycle summary:
  │     ├── total_assets, matched, discrepant
  │     ├── discrepancy_rate = discrepant / total_assets * 100
  │     └── discrepancies_by_type (qty, condition, location)
  │
  └── Write activity_log entries for each discrepancy
```

---

## Infrastructure & Deployment

### Environment Variables

```bash
# .env.local (web app)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=http://localhost:3001

# .env (Fastify API)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...
API_PORT=3001
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=<from Supabase JWT secret>
```

### Supabase Setup Steps

1. Create a new project on [supabase.com](https://supabase.com) (free tier).
2. Note the project URL and keys (anon + service_role) from Settings → API.
3. Note the JWT secret from Settings → API → JWT Settings.
4. Create a Storage bucket named `asset-attachments` (private, 5MB limit per file).
5. Run migrations in order via the SQL Editor or Supabase CLI:
   ```
   supabase db push
   ```
6. Enable RLS on all tables (migrations include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
7. Seed reference data: `supabase/seed.sql` (default departments, asset categories, admin user).

### Local Development Workflow

```bash
# 1. Clone and install
git clone <repo> && cd odoo-naman
npm install

# 2. Set up environment variables
cp .env.example .env          # Fill in Supabase keys
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 3. Run Supabase locally (optional — can use hosted free tier)
supabase start
supabase db push

# 4. Start API server
npm run dev --workspace=apps/api     # http://localhost:3001

# 5. Start Next.js dev server
npm run dev --workspace=apps/web     # http://localhost:3000
```

### Production Deployment (Free Tier Friendly)

| Service       | Platform         | Notes                                          |
| ------------- | ---------------- | ---------------------------------------------- |
| Supabase      | supabase.com     | Free tier: 500MB DB, 1GB storage, 50K MAU     |
| Fastify API   | Railway / Render | Free tier: 512MB RAM, sleep after inactivity   |
| Next.js Front | Vercel           | Free tier: hobby plan, serverless functions    |

---

## Cross-Cutting Concerns

### Auth Flow

```
1. User enters email + password on /login
2. Next.js client calls supabase.auth.signInWithPassword()
3. Supabase returns access_token (short-lived) + refresh_token
4. access_token is sent as Authorization: Bearer header on all API calls
5. Fastify auth plugin decodes JWT, verifies signature with JWT_SECRET
6. auth plugin extracts user_id, role from JWT claims (or fetches from profiles)
7. request.auth = { userId, role, departmentId }
8. On token expiry, Supabase client auto-refreshes via refresh_token
9. On logout: supabase.auth.signOut() clears tokens client-side
```

**Role Resolution:** The JWT contains `user_id`. The auth plugin fetches `role` and `department_id` from the `profiles` table on every request (cached for 60s in memory per user to avoid DB overhead). This keeps the JWT small and allows role changes to take effect without re-login.

### Error Handling

**API Error Response Shape:**

```json
{
  "error": {
    "code": "ASSET_NOT_AVAILABLE",
    "message": "Asset is currently allocated to another user",
    "statusCode": 409,
    "details": { "asset_id": "abc-123", "allocated_to": "user-456" }
  }
}
```

**Error Codes (domain-specific):**

| Code                       | Status | Description                              |
| -------------------------- | ------ | ---------------------------------------- |
| `UNAUTHORIZED`             | 401    | Missing or invalid JWT                   |
| `FORBIDDEN`                | 403    | Insufficient role for this action        |
| `ASSET_NOT_AVAILABLE`      | 409    | Asset not in Available status            |
| `ALREADY_ALLOCATED`        | 409    | Asset has an active allocation           |
| `BOOKING_CONFLICT`         | 409    | Overlapping booking exists               |
| `INVALID_TRANSITION`       | 409    | Maintenance status transition not allowed|
| `VALIDATION_ERROR`         | 400    | Request body failed schema validation    |
| `NOT_FOUND`                | 404    | Resource does not exist                  |
| `STORAGE_LIMIT_EXCEEDED`   | 413    | File too large for upload                |

**Frontend Error Handling:**

- All API calls wrapped in try/catch.
- Errors displayed via `<Toast>` component (auto-dismiss after 5s).
- Validation errors highlighted inline on form fields.
- 401 → redirect to login. 403 → show "insufficient permissions" message.

### Activity Logging Strategy

Every state-changing operation writes an `activity_logs` row **after** the primary write succeeds (within the same transaction):

```sql
INSERT INTO activity_logs (
  user_id, action, entity_type, entity_id,
  old_values, new_values, metadata, created_at
) VALUES (...);
```

**Fields:**

| Field        | Type     | Description                                          |
| ------------ | -------- | ---------------------------------------------------- |
| `user_id`    | UUID     | Who performed the action                             |
| `action`     | TEXT     | e.g., 'created', 'updated', 'status_changed', 'allocated', 'returned' |
| `entity_type`| TEXT     | e.g., 'asset', 'allocation', 'booking', 'maintenance' |
| `entity_id`  | UUID     | ID of the affected record                            |
| `old_values` | JSONB    | Snapshot of changed fields before the update (null for creates) |
| `new_values` | JSONB    | Snapshot of changed fields after the update          |
| `metadata`   | JSONB    | Additional context (e.g., { reason: "Annual audit" }) |
| `created_at` | TIMESTAMPTZ | Always UTC, immutable                           |

**Immutability:** No UPDATE or DELETE operations are permitted on `activity_logs`. RLS policies enforce this: `FOR ALL USING (false) FOR ALL USING (true)` (read yes, write no — writes only via service_role which bypasses RLS).

---

## Tradeoffs & Decisions

### 1. Fastify Middleware Over Direct Supabase Client

**Decision:** All writes route through Fastify; reads can optionally go direct from Next.js to Supabase (anon key + RLS).

**Rationale:** RLS is powerful but complex to express for every business rule (e.g., "no double-allocation" requires checking related tables). Fastify services encode these rules in TypeScript where they're testable and version-controlled. RLS serves as a defense-in-depth layer.

**Tradeoff:** Adds a server hop for writes. Acceptable at this scale; the alternative (all logic in RLS + Edge Functions) is harder to debug and test.

### 2. Single Supabase Client Key Strategy

**Decision:** Backend uses `service_role` key; frontend uses `anon` key. RLS policies protect the `anon` key path.

**Rationale:** The `service_role` key bypasses RLS, which is needed for complex business logic. Keeping `anon` key on the frontend with RLS means even if the API is bypassed, data is protected.

### 3. Polymorphic Activity Logs

**Decision:** `activity_logs` uses `entity_type` + `entity_id` instead of separate log tables per entity.

**Rationale:** Single table is simpler to query ("show me everything this user did"), paginate, and index. The JSONB `old_values`/`new_values` columns provide flexibility without schema changes.

**Tradeoff:** No foreign key constraints on `entity_id` (can reference non-existent records if data is deleted). Mitigated by soft-deleting entities rather than hard-deleting.

### 4. Soft Deletes Over Hard Deletes

**Decision:** Assets, allocations, bookings, and maintenance requests use a `deleted_at` timestamp column rather than `DELETE FROM`.

**Rationale:** Preserves referential integrity for activity logs and audit results. Enables "undo" functionality. Keeps historical data intact for compliance.

### 5. Monorepo Without Turborepo

**Decision:** Use npm workspaces for the monorepo. Turborepo is optional (included in the structure for when the team wants it).

**Rationale:** Two apps with shared types don't need a complex build system. npm workspaces handle dependency hoisting. Turborepo adds value when build caching and parallel task execution matter (e.g., CI).

### 6. No Real-time Subscriptions

**Decision:** All data is fetched on-demand (polling on page load / manual refresh). No Supabase Realtime subscriptions.

**Rationale:** This is an internal tool with ~50-200 concurrent users. Polling is sufficient. Realtime adds complexity (connection management, state synchronization) that isn't justified here.

### 7. Calendar View Server-Side Aggregation

**Decision:** Booking calendar data is pre-aggregated by the API (`/bookings/calendar`) rather than fetching all bookings and filtering client-side.

**Rationale:** Calendar queries (bookings in a date range, grouped by asset) benefit from database indexes and are more efficient server-side. Client-side filtering of thousands of bookings would be sluggish on the free tier's modest hardware.

---

## Open Decisions

1. **File attachment storage rules:** Maximum file size per upload? Allowed MIME types? (Suggested: 5MB, images + PDFs only.)
2. **Notification system:** Email notifications for allocations, maintenance assignments, etc.? Can defer to v2 using Supabase Edge Functions + Resend.
3. **Bulk operations:** Should admins be able to bulk-allocate or bulk-create assets via CSV upload? (Suggested: defer to v2.)
4. **Reporting export:** PDF/CSV export for audit reports and dashboard data? (Suggested: defer to v2.)
5. **Search implementation:** Supabase full-text search (pg_trgm) is sufficient for <10K records. Consider Algolia/Elasticsearch only if needed later.
