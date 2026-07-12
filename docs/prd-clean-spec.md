## Problem Statement

Enterprises managing physical assets (laptops, vehicles, equipment, furniture) and shared resources (meeting rooms, projectors) rely on spreadsheets and ad-hoc tools, leading to lost inventory, double-booked resources, missed maintenance windows, and no audit trail. AssetFlow replaces this chaos with a single source of truth for the full asset lifecycle and resource scheduling, giving every stakeholder role-based visibility and control. Success means zero unaccounted-for assets, zero resource scheduling conflicts, maintenance completed on time, and full audit compliance — all accessible from a web-based dashboard.

## Actors & Contexts

- **Employee**: End-user who requests asset allocations, books shared resources, and reports maintenance issues. Accesses via web browser (desktop). Primary interaction: self-service dashboards and request forms.
- **Asset Manager**: Operational role responsible for the asset registry, approving/rejecting allocation requests, scheduling maintenance, and executing audit cycles. Accesses via web browser (desktop). Primary interaction: management dashboards and bulk operations.
- **Department Head**: Approves asset allocations for their department, views department-level analytics and audit results. Accesses via web browser (desktop). Primary interaction: approval queues and analytics views.
- **Admin**: Full system control — user/role management, system configuration, destructive operations. Accesses via web browser (desktop). Primary interaction: admin panels and configuration screens.

## Functional Requirements

### Asset Registry

- FR-01: Register new assets with required fields: name, category (enum), serial number (unique), purchase date, purchase cost, location, condition (enum: Good/Fair/Poor/Damaged), assigned department, warranty expiry date, and optional image upload.
- FR-02: Auto-generate a unique asset tag (system-generated, immutable) upon registration.
- FR-03: Track asset lifecycle through states: `Active` → `Allocated` → `Under Maintenance` → `Retired` → `Disposed`. State transitions follow a defined state machine (no direct jump from Active to Disposed without passing through Retired).
- FR-04: Edit asset details with a full change history (diff stored per field: old value, new value, timestamp, actor).
- FR-05: Search and filter assets by category, status, location, department, assignee, date range, and free-text name search.
- FR-06: Support bulk import of assets via CSV upload (Admin/Asset Manager only), with validation and error reporting per row.
- FR-07: Support soft-delete (retire) and hard-delete (dispose) of assets. Hard-delete requires Admin role and only available for assets in `Retired` state with no active allocations.
- FR-08: Display asset detail page showing: all properties, current/allocation history, maintenance history, audit history, and full activity log.

### Allocation

- FR-09: Create asset allocations binding an asset to an employee with a start date and optional end date. An asset can only be allocated if its current state is `Active`.
- FR-10: Prevent allocation if the asset has a conflicting active allocation for the requested date range (overlap detection: two allocations for the same asset with overlapping start/end windows are rejected).
- FR-11: Allow indefinite allocations (no end date) which remain active until explicitly returned.
- FR-12: Process asset returns: update allocation end date to today, transition asset state back to `Active`, and clear assignee.
- FR-13: Support an approval workflow: allocation requests from Employees are submitted as `Pending`, require approval from the employee's Department Head (or Asset Manager if no department), and transition to `Approved`/`Rejected`.
- FR-14: Auto-reject allocation requests if the asset enters `Under Maintenance` or `Retired` state before the request is acted upon.
- FR-15: Track allocation history per asset and per employee with status, date range, and approver.

### Resource Booking

- FR-16: Book shared resources (rooms, projectors, vehicles designated as shared) with a start datetime and end datetime.
- FR-17: Validate no overlapping bookings for the same resource in the requested time window (reject with specific conflict details showing existing booking times).
- FR-18: Cancel bookings. Only the booking creator, Asset Manager, or Admin can cancel. Cancellation must occur before the booking start time.
- FR-19: Display resource availability via a calendar view showing booked and available slots per resource.
- FR-20: Support filtering resources by type, location, and capacity (for rooms).
- FR-21: Auto-mark bookings as `Expired` if the end time passes without the system receiving an explicit confirmation. Bookings do not auto-extend.

### Maintenance

- FR-22: Schedule preventive maintenance for assets with a target date, estimated duration, and description. Transitions asset state to `Under Maintenance`.
- FR-23: Report corrective maintenance issues from asset detail page with a description, severity (Low/Medium/High/Critical), and photo attachment.
- FR-24: Track maintenance task status: `Scheduled` → `In Progress` → `Completed` (or `Overdue` if past target date without completion).
- FR-25: Block allocation of assets with `Under Maintenance` state (enforced by FR-09).
- FR-26: Send notification to Asset Manager when a maintenance task is `Scheduled` or becomes `Overdue`.
- FR-27: Require completion notes and updated condition rating when marking maintenance as `Completed`. Condition change triggers asset state transition back to `Active`.

### Audit Cycles

- FR-28: Create audit cycles with a name, description, scope (all assets, or filtered by department/category/location), and deadline.
- FR-29: Assign individual audit tasks to auditors (any user with Asset Manager role). Each task covers one or more assets within the cycle scope.
- FR-30: Record audit outcomes per asset: `Verified` (asset matches records), `Discrepancy` (location/condition/status mismatch), or `Missing` (asset not found).
- FR-31: Generate audit summary report showing: total assets, verified count, discrepancy count, missing count, completion percentage, and per-auditor breakdown.
- FR-32: Block retirement/disposal of assets that have an in-progress audit cycle covering them.

### Analytics Dashboard

- FR-33: Display asset utilization rate (allocated assets / total active assets) over configurable time period (week/month/quarter/year).
- FR-34: Display maintenance metrics: tasks completed on time, overdue count, average resolution time.
- FR-35: Display allocation trends: new allocations, returns, and pending approvals over time.
- FR-36: Display department-wise breakdown of asset counts, utilization, and maintenance load.
- FR-37: Display resource booking analytics: most booked resources, peak hours, utilization rate.
- FR-38: All analytics views must filter by department (for Department Head/Admin), date range, and category.

### Activity Logs

- FR-39: Log every create, update, delete, allocate, return, book, cancel, and state-change operation across all entities.
- FR-40: Each log entry captures: actor (user ID + name), timestamp (UTC), action type, affected entity type + ID, and a JSON diff of changed fields (before/after).
- FR-41: Provide a filterable, paginated activity log view with filters for: actor, action type, entity type, date range, and free-text search.
- FR-42: Activity logs are immutable — no user can edit or delete log entries.

### Authentication & Authorization

- FR-43: Authenticate users via Supabase Auth with email/password (magic link optional but not required for MVP).
- FR-44: Enforce four roles with these permission boundaries:
  - **Employee**: View own allocations/bookings, create allocation/booking requests, report maintenance, view own activity.
  - **Asset Manager**: All Employee permissions + manage asset registry (CRUD), approve/reject allocations, schedule maintenance, manage audit cycles, view all activity logs, view analytics.
  - **Department Head**: All Employee permissions + approve/reject allocations for own department, view department analytics and audit results, view department activity logs.
  - **Admin**: Unrestricted access to all features + manage users and roles, system configuration, hard-delete assets, manage resource catalog.
- FR-45: All API endpoints must verify role permissions. Unauthorized access returns HTTP 403.
- FR-46: Admin can promote/demote users between roles. Admin cannot demote themselves below Admin.

## Non-Functional Requirements

- NFR-01: P95 API response time < 200ms for all read operations under 1000 concurrent users.
- NFR-02: P95 API response time < 500ms for all write operations under 100 concurrent users.
- NFR-03: Support at minimum 50,000 assets and 10,000 resources in the system without degradation.
- NFR-04: Activity log retention: minimum 1 year. Logs older than 1 year may be archived but must be queryable within 5 seconds if accessed.
- NFR-05: All data at rest encrypted via Supabase default encryption. No PII stored outside Supabase PostgreSQL.
- NFR-06: All API communication over HTTPS only. No mixed content.
- NFR-07: Frontend must be responsive and functional on screens >= 1024px width. Mobile-responsive layout is desirable but not required for MVP.
- NFR-08: WCAG 2.1 AA compliance for core workflows (asset management, allocation, booking, maintenance).
- NFR-09: System must handle concurrent allocation/booking requests without data corruption — use database-level row locking or optimistic concurrency control.
- NFR-10: Maximum file upload size for asset images: 5MB. Supported formats: JPEG, PNG, WebP.
- NFR-11: Audit logs (activity logs) must use append-only tables — no UPDATE or DELETE operations permitted at the database level.
- NFR-12: API rate limiting: 100 requests per minute per authenticated user.

## Acceptance Criteria

### Asset Registry

- AC-01: Given an Asset Manager, when registering an asset with all required fields, then the asset is created with a unique auto-generated tag, state `Active`, and a log entry is recorded.
- AC-02: Given an Asset Manager, when registering an asset with a duplicate serial number for the same category, then the system rejects the registration with a clear error message.
- AC-03: Given an Asset Manager, when editing an asset's location, then the change history shows the old location, new location, timestamp, and actor name.
- AC-04: Given any user, when searching assets with the term "MacBook", then results include all assets whose name or serial number contains "MacBook" regardless of case.
- AC-05: Given an Admin, when uploading a CSV with 100 assets (3 with errors), then 97 assets are created and the response includes a per-row error report for the 3 failures.
- AC-06: Given an Admin, when hard-deleting a `Retired` asset with no active allocations, then the asset is permanently removed and a log entry is recorded.
- AC-07: Given an Admin, when attempting to hard-delete an asset with an active allocation, then the system rejects the operation with a clear error message.

### Allocation

- AC-08: Given an Employee, when requesting an allocation for an `Active` asset with a valid date range, then the request is created with status `Pending`.
- AC-09: Given an Employee, when requesting an allocation for an asset that already has a conflicting allocation in the same date range, then the system rejects the request and shows the conflicting allocation details.
- AC-10: Given an Employee, when requesting an allocation for an `Under Maintenance` asset, then the system rejects the request stating the asset is under maintenance.
- AC-11: Given a Department Head, when approving a `Pending` allocation request for their department, then the allocation status becomes `Approved`, the asset state becomes `Allocated`, and the assignee is set.
- AC-12: Given a Department Head, when rejecting a `Pending` allocation request, then the status becomes `Rejected` and the requester is notified.
- AC-13: Given an Asset Manager, when an allocation for an `Active` asset has a `Pending` status and the asset enters `Under Maintenance`, then the pending allocation is auto-rejected.
- AC-14: Given an employee with an active allocation, when the asset is returned (via explicit return action), then the allocation end date is set to today, asset state becomes `Active`, and assignee is cleared.
- AC-15: Given any user, when viewing an asset's detail page, then the full allocation history is displayed with status, date range, and approver for each entry.

### Resource Booking

- AC-16: Given an Employee, when booking a resource for a time slot with no conflicts, then the booking is created with status `Confirmed`.
- AC-17: Given an Employee, when booking a resource for a time slot that overlaps with an existing booking, then the system rejects with a message showing the conflicting booking's time window.
- AC-18: Given an Employee, when attempting to cancel a booking after its start time, then the system rejects the cancellation.
- AC-19: Given an Employee, when viewing a resource's calendar for a given week, then all booked and available time slots are displayed correctly.
- AC-20: Given an Employee, when booking a resource that is a meeting room with capacity filter, then only rooms matching or exceeding the requested capacity are shown as options.

### Maintenance

- AC-21: Given an Asset Manager, when scheduling maintenance for an asset, then the asset state transitions to `Under Maintenance` and a `Scheduled` maintenance task is created.
- AC-22: Given an Employee, when reporting a maintenance issue on an allocated asset, then a corrective maintenance task is created with the provided severity and description.
- AC-23: Given an Asset Manager, when a maintenance task passes its target date without being marked complete, then its status changes to `Overdue` and a notification is sent.
- AC-24: Given an Asset Manager, when completing a maintenance task with updated condition "Good", then the maintenance status becomes `Completed`, the asset condition is updated, and the asset state transitions to `Active`.

### Audit Cycles

- AC-25: Given an Asset Manager, when creating an audit cycle scoped to "Department: Engineering", then audit tasks are generated for all assets assigned to Engineering.
- AC-26: Given an auditor, when marking an asset as `Missing` during an audit, then the summary report reflects the missing count and the asset is flagged.
- AC-27: Given an Asset Manager, when an audit cycle is in progress for an asset, then attempts to retire or dispose of that asset are rejected.
- AC-28: Given an Asset Manager, when viewing an audit cycle summary, then it shows total assets, verified/discrepancy/missing counts, completion percentage, and per-auditor breakdown.

### Analytics Dashboard

- AC-29: Given a Department Head, when viewing the analytics dashboard, then only data for their department is displayed.
- AC-30: Given an Admin, when filtering analytics by date range "January 2026", then all metrics reflect only data within that range.
- AC-31: Given any authorized user, when viewing the utilization metric, then it calculates as (allocated assets in period / total active assets in period) * 100 and displays as a percentage.

### Activity Logs

- AC-32: Given an Admin, when viewing activity logs filtered by actor "john@company.com" and action type "allocate", then only allocation actions by that user are displayed.
- AC-33: Given any user, when viewing an activity log entry, then it shows actor name, timestamp (UTC), action type, entity, and a before/after diff.
- AC-34: Given an Admin, when attempting to delete an activity log entry via API, then the operation is rejected (HTTP 405 or 403).

### Authentication & Authorization

- AC-35: Given an unauthenticated user, when accessing any protected endpoint, then the system returns HTTP 401.
- AC-36: Given an Employee, when attempting to access the asset management endpoint, then the system returns HTTP 403.
- AC-37: Given an Admin, when promoting a user to Asset Manager, then the user immediately gains Asset Manager permissions on their next request.
- AC-38: Given an Admin, when attempting to demote themselves, then the system rejects the operation with a message stating self-demotion is not allowed.

## Open Questions

- **OQ-01**: What are the exact category values for assets? (e.g., Electronics, Furniture, Vehicles, Equipment — needs a defined enum)
- **OQ-02**: What is the relationship between "assets" and "resources"? Can the same physical item be both an asset (tracked) and a resource (bookable)? If a vehicle is an asset assigned to a user, can it also be booked by others? The PRD treats these as separate concepts but doesn't define the boundary.
- **OQ-03**: Does the allocation approval workflow require single-level approval (Department Head) or multi-level (Department Head → Asset Manager)? The PRD doesn't specify.
- **OQ-04**: What notification channels are supported? In-app only? Email? Push? The PRD mentions notifications but doesn't define the delivery mechanism.
- **OQ-05**: What happens to active allocations when a user's role is demoted from Employee? Are their allocations auto-revoked?
- **OQ-06**: Should the system track asset depreciation for valuation purposes? The PRD says "accounting integrations" are out of scope, but depreciation tracking may be in scope.
- **OQ-07**: What is the expected scale ceiling? NFR-03 assumes 50K assets / 10K resources — is this sufficient for the target market?
- **OQ-08**: Is there a concept of asset "location hierarchy" (building → floor → room) or is location a free-text field?
- **OQ-09**: What is the user onboarding flow? Is there an invite system, or do users self-register and await role assignment?
- **OQ-10**: Should recurring bookings be supported (e.g., "this meeting room every Tuesday 10-11am")? The PRD doesn't mention recurrence.
- **OQ-11**: What happens when a booking ends and the resource isn't "released"? Is there a grace period, or does it immediately become available?
- **OQ-12**: Can Department Heads allocate assets to employees outside their department? The RBAC implies department-scoped approval but doesn't address cross-department allocation.
- **OQ-13**: Should the system support barcode/QR code scanning for quick asset lookup during audits?
- **OQ-14**: What is the data retention and archival policy beyond activity logs (1 year)? What about retired/disposed asset records?

## Assumptions Made

- **ASM-01**: Assets and Resources are distinct entity types. A physical item is either an Asset (tracked, assignable to individuals) or a Resource (bookable by time slot). The PRD treats them as separate concepts, so this spec maintains that separation. *Flag for product owner: clarify if dual-mode entities are needed.*
- **ASM-02**: Approval workflow is single-level. An Employee submits a request; the Department Head (or Asset Manager if no department) approves/rejects. No cascading approval chain.
- **ASM-03**: "Condition" is an enum (Good/Fair/Poor/Damaged), not free text. This enables analytics and audit consistency.
- **ASM-04**: Notifications are in-app only for MVP. Email integration is deferred to a future phase.
- **ASM-05**: Location is a free-text field for MVP. Building/floor/room hierarchy is deferred.
- **ASM-06**: Assets have a one-to-one relationship with their current allocation (one active allocation at a time). No split allocations.
- **ASM-07**: Resources have a one-to-many relationship with bookings but only one active booking at any given time (enforced by overlap validation).
- **ASM-08**: Audit cycles are manually initiated by Asset Manager or Admin. No automated scheduling.
- **ASM-09**: Activity logs are append-only and immutable at the database level (enforced via Supabase row-level security or database triggers).
- **ASM-10**: The system uses optimistic concurrency control for allocation/booking conflict prevention (database-level unique constraints or row-level locking).
- **ASM-11**: Users are provisioned by an Admin (no self-registration). The system has a fixed set of users managed through an admin panel.
- **ASM-12**: Analytics are computed on-demand from the database (no pre-aggregated materialized views for MVP). If performance is insufficient, materialized views can be added later.
- **ASM-13**: "Shared resources" means resources available for booking by any authenticated employee, not restricted to a specific department.
- **ASM-14**: The allocation approval is department-scoped: a Department Head can only approve allocations for assets assigned to their department. Cross-department allocations require Admin approval.

## Out of Scope

- **Purchasing and procurement workflows** — no PO management, vendor selection, or budget tracking.
- **Invoicing and accounting integrations** — no financial ledger sync, no depreciation accounting, no tax reporting.
- **Mobile applications** (iOS/Android) — web-only for MVP. Responsive design is desirable but not required.
- **Asset barcode/QR code generation and scanning** — may be added in a future phase.
- **Email notification delivery** — in-app notifications only for MVP.
- **Multi-tenancy** — single-organization deployment only. No org/tenant isolation.
- **Recurring bookings** — single-instance bookings only for MVP.
- **GPS/real-time asset location tracking** — location is manually recorded, not device-tracked.
- **Integration with external systems** (LDAP, SSO, HR systems) — email/password auth only via Supabase Auth.
- **Asset depreciation tracking** — no financial valuation features.
- **Offline mode** — system requires active internet connection.
- **Bulk operations beyond CSV import** — no bulk allocation, bulk maintenance scheduling, or bulk audit assignment via file upload.
