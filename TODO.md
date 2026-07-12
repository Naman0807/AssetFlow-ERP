# AssetFlow — Remaining Tasks

> Each task is designed to be worked on **independently** on its own branch.
> After completing a task, push your branch and open a PR to `main`.
> Do NOT modify files that belong to another task's scope.

---

## TASK-1: Overdue Detection Cron + Notifications
**Branch:** `feature/overdue-cron`
**Estimated time:** 1–2 hours
**Owner:** ___________

### Goal
Automatically detect overdue asset allocations and send notifications to employees and department heads.

### Files to create/modify
| Action | File |
|--------|------|
| CREATE | `asset_flow/data/cron_data.xml` |
| MODIFY | `asset_flow/__manifest__.py` — add `'data/cron_data.xml'` to the `data` list |
| MODIFY | `asset_flow/models/asset_allocation.py` — add `_cron_check_overdue()` method |

### What to build

**1. Create `data/cron_data.xml`** — an `ir.cron` record:
```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data noupdate="1">
        <record id="ir_cron_check_overdue_allocations" model="ir.cron">
            <field name="name">AssetFlow: Check Overdue Allocations</field>
            <field name="model_id" ref="model_assetflow_allocation"/>
            <field name="state">code</field>
            <field name="code">model._cron_check_overdue()</field>
            <field name="interval_number">1</field>
            <field name="interval_type">days</field>
            <field name="numbercall">-1</field>
            <field name="active">True</field>
        </record>
    </data>
</odoo>
```

**2. Add `_cron_check_overdue()` to `assetflow.allocation`:**
```python
def _cron_check_overdue(self):
    """Called daily by ir.cron. Finds active allocations past their return date."""
    today = date.today()
    overdue = self.search([
        ('status', '=', 'active'),
        ('expected_return_date', '<', today),
        ('expected_return_date', '!=', False),
    ])
    for allocation in overdue:
        # Create a mail activity for the employee
        allocation.activity_schedule(
            'mail.mail_activity_data_todo',
            user_id=allocation.employee_id.user_id.id,
            summary=f'Overdue Asset Return: {allocation.asset_id.name}',
            note=f'Asset {allocation.asset_id.asset_tag} was due on '
                 f'{allocation.expected_return_date.strftime("%Y-%m-%d")}. '
                 f'Please return it immediately.',
        )
        # Post a message in the chatter
        allocation.message_post(
            body=f'<b>⚠️ Overdue:</b> Asset <b>{allocation.asset_id.asset_tag}</b> '
                 f'was due on {allocation.expected_return_date.strftime("%Y-%m-%d")} '
                 f'and has not been returned.',
            message_type='notification',
        )
```

### Acceptance Criteria
- [ ] `cron_data.xml` exists and is added to `__manifest__.py` data list
- [ ] `_cron_check_overdue()` method exists in `assetflow.allocation`
- [ ] Method creates `mail.activity` records for overdue allocations
- [ ] Method posts a chatter message on each overdue allocation
- [ ] Module still installs cleanly (run `odoo-bin -i asset_flow --stop-after-init`)

---

## TASK-2: Record Rules (Department-Level Access)
**Branch:** `feature/record-rules`
**Estimated time:** 1–2 hours
**Owner:** ___________

### Goal
Add record rules so Department Heads only see their department's data, and Employees only see their own allocations/bookings.

### Files to create/modify
| Action | File |
|--------|------|
| CREATE | `asset_flow/security/record_rules.xml` |
| MODIFY | `asset_flow/__manifest__.py` — add `'security/record_rules.xml'` BEFORE `ir.model.access.csv` |

### What to build

**Create `security/record_rules.xml`:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <!-- Department Head: can only see allocations in their department -->
    <record id="rule_allocation_dept_head" model="ir.rule">
        <field name="name">Allocation: Department Head sees own department</field>
        <field name="model_id" ref="model_assetflow_allocation"/>
        <field name="domain_force">[
            '|',
            ('department_id', '=', False),
            ('department_id', 'in', [user.employee_ids.department_id.id])
        ]</field>
        <field name="groups" eval="[(4, ref('group_assetflow_dept_head'))]"/>
    </record>

    <!-- Employee: can only see their own allocations -->
    <record id="rule_allocation_employee" model="ir.rule">
        <field name="name">Allocation: Employee sees own only</field>
        <field name="model_id" ref="model_assetflow_allocation"/>
        <field name="domain_force">[
            ('employee_id', '=', user.employee_ids.id)
        ]</field>
        <field name="groups" eval="[(4, ref('group_assetflow_employee'))]"/>
    </record>

    <!-- Employee: can only see their own bookings -->
    <record id="rule_booking_employee" model="ir.rule">
        <field name="name">Booking: Employee sees own only</field>
        <field name="model_id" ref="model_assetflow_booking"/>
        <field name="domain_force">[
            ('employee_id', '=', user.employee_ids.id)
        ]</field>
        <field name="groups" eval="[(4, ref('group_assetflow_employee'))]"/>
    </record>

    <!-- Employee: can only see their own maintenance requests -->
    <record id="rule_maintenance_employee" model="ir.rule">
        <field name="name">Maintenance: Employee sees own only</field>
        <field name="model_id" ref="model_assetflow_maintenance_request"/>
        <field name="domain_force">[
            ('employee_id', '=', user.employee_ids.id)
        ]</field>
        <field name="groups" eval="[(4, ref('group_assetflow_employee'))]"/>
    </record>

    <!-- Admin and Manager: no restrictions (full access) -->
    <record id="rule_admin_full_access" model="ir.rule">
        <field name="name">Admin: Full access to allocations</field>
        <field name="model_id" ref="model_assetflow_allocation"/>
        <field name="domain_force">[(1, '=', 1)]</field>
        <field name="groups" eval="[(4, ref('group_assetflow_manager'))]"/>
    </record>
</odoo>
```

### Acceptance Criteria
- [ ] `record_rules.xml` exists and is loaded in manifest BEFORE `ir.model.access.csv`
- [ ] Department Heads see only their department's allocations
- [ ] Employees see only their own allocations, bookings, maintenance
- [ ] Admins and Asset Managers see everything
- [ ] Module installs cleanly

---

## TASK-3: Demo Data for Hackathon Demo
**Branch:** `feature/demo-data`
**Estimated time:** 1–2 hours
**Owner:** ___________

### Goal
Pre-load realistic sample data so the demo script runs smoothly during the hackathon presentation.

### Files to create/modify
| Action | File |
|--------|------|
| CREATE | `asset_flow/data/demo_departments.xml` |
| CREATE | `asset_flow/data/demo_categories.xml` |
| CREATE | `asset_flow/data/demo_assets.xml` |
| MODIFY | `asset_flow/__manifest__.py` — add demo files to `'demo'` list (NOT `'data'`) |

### What to build

**1. `data/demo_departments.xml`** — 4 departments:
- Engineering (ENG)
- Human Resources (HR)
- Marketing (MKT)
- Operations (OPS)

**2. `data/demo_categories.xml`** — 4 categories:
- Electronics (warranty: 24 months)
- Furniture (warranty: 60 months)
- Vehicles (warranty: 36 months)
- IT Equipment (warranty: 12 months)

**3. `data/demo_assets.xml`** — 8–10 assets:
- MacBook Pro 16" (Electronics, bookable, available)
- Dell Monitor 27" (Electronics, bookable, available)
- Office Desk (Furniture, not bookable, allocated)
- Ergonomic Chair (Furniture, not bookable, available)
- Toyota Camry (Vehicles, bookable, available)
- Projector (Electronics, bookable, available)
- ThinkPad X1 (IT Equipment, bookable, maintenance)
- iPhone 15 (Electronics, not bookable, available)
- Standing Desk (Furniture, not bookable, available)
- Conference Room TV (Electronics, bookable, available)

**4. Update `__manifest__.py`:**
```python
'demo': [
    'data/demo_departments.xml',
    'data/demo_categories.xml',
    'data/demo_assets.xml',
],
```

Use `noupdate="0"` so demo data can be reloaded. Use `model="assetflow.department"` etc. with `<record>` tags.

### Acceptance Criteria
- [ ] 3 demo data XML files exist
- [ ] Files are in the `'demo'` key of `__manifest__.py` (not `'data'`)
- [ ] Installing with `--demo` flag loads sample departments, categories, and assets
- [ ] Asset tags auto-generate (AF-0001, AF-0002, etc.)
- [ ] Module installs cleanly

---

## TASK-4: KPI Dashboard with Real Metrics
**Branch:** `feature/kpi-dashboard`
**Estimated time:** 2–3 hours
**Owner:** ___________

### Goal
Replace the basic pivot/graph dashboard with a proper KPI card dashboard showing real-time counts.

### Files to create/modify
| Action | File |
|--------|------|
| CREATE | `asset_flow/models/dashboard.py` |
| MODIFY | `asset_flow/models/__init__.py` — add `from . import dashboard` |
| MODIFY | `asset_flow/views/dashboard_views.xml` — replace with KPI dashboard |
| MODIFY | `asset_flow/__manifest__.py` — add `'security/ir.model.access.csv'` entry for dashboard model |

### What to build

**1. Create `models/dashboard.py`** — a transient model for dashboard data:
```python
from odoo import models, fields, api


class AssetFlowDashboard(models.TransientModel):
    _name = 'assetflow.dashboard'
    _description = 'AssetFlow Dashboard'

    total_assets = fields.Integer(string='Total Assets', compute='_compute_stats')
    available_assets = fields.Integer(string='Available', compute='_compute_stats')
    allocated_assets = fields.Integer(string='Allocated', compute='_compute_stats')
    maintenance_assets = fields.Integer(string='Under Maintenance', compute='_compute_stats')
    lost_assets = fields.Integer(string='Lost', compute='_compute_stats')
    active_bookings = fields.Integer(string='Active Bookings', compute='_compute_stats')
    pending_maintenance = fields.Integer(string='Pending Maintenance', compute='_compute_stats')
    overdue_allocations = fields.Integer(string='Overdue Allocations', compute='_compute_stats')
    open_audit_cycles = fields.Integer(string='Open Audits', compute='_compute_stats')

    @api.depends()
    def _compute_stats(self):
        Asset = self.env['assetflow.asset']
        for record in self:
            record.total_assets = Asset.search_count([])
            record.available_assets = Asset.search_count([('state', '=', 'available')])
            record.allocated_assets = Asset.search_count([('state', '=', 'allocated')])
            record.maintenance_assets = Asset.search_count([('state', '=', 'maintenance')])
            record.lost_assets = Asset.search_count([('state', '=', 'lost')])
            record.active_bookings = self.env['assetflow.booking'].search_count([
                ('status', 'in', ['upcoming', 'ongoing'])
            ])
            record.pending_maintenance = self.env['assetflow.maintenance.request'].search_count([
                ('status', '=', 'pending')
            ])
            record.overdue_allocations = self.env['assetflow.allocation'].search_count([
                ('status', '=', 'active'),
                ('is_overdue', '=', True),
            ])
            record.open_audit_cycles = self.env['assetflow.audit.cycle'].search_count([
                ('status', '=', 'open')
            ])

    def action_view_assets(self):
        return self.env['ir.actions.act_window']._for_xml_id('asset_flow.action_assetflow_asset')

    def action_view_overdue(self):
        return {
            'type': 'ir.actions.act_window',
            'name': 'Overdue Allocations',
            'res_model': 'assetflow.allocation',
            'view_mode': 'tree,form',
            'domain': [('is_overdue', '=', True), ('status', '=', 'active')],
        }

    def action_view_pending_maintenance(self):
        return {
            'type': 'ir.actions.act_window',
            'name': 'Pending Maintenance',
            'res_model': 'assetflow.maintenance.request',
            'view_mode': 'tree,form',
            'domain': [('status', '=', 'pending')],
        }

    def action_view_active_bookings(self):
        return {
            'type': 'ir.actions.act_window',
            'name': 'Active Bookings',
            'res_model': 'assetflow.booking',
            'view_mode': 'tree,form,calendar',
            'domain': [('status', 'in', ['upcoming', 'ongoing'])],
        }
```

**2. Replace `views/dashboard_views.xml`** with a form view that shows KPI cards:
- Use `<field name="total_assets"/>` etc. in a styled card layout
- Each card is clickable and drills down to the relevant list
- Keep existing pivot/graph views as sub-menu items

**3. Add security rule** for the transient model in `ir.model.access.csv`:
```
access_assetflow_dashboard_user,assetflow.dashboard.user,model_assetflow_dashboard,base.group_user,1,0,0,0
```

### Acceptance Criteria
- [ ] `dashboard.py` exists with `assetflow.dashboard` transient model
- [ ] Dashboard shows 9 KPI cards with real-time counts
- [ ] Clicking a card opens the relevant filtered list view
- [ ] Existing pivot/graph views are accessible from Reports menu
- [ ] Module installs cleanly

---

## TASK-5: Transfer Workflow + Notification Messages
**Branch:** `feature/transfer-workflow`
**Estimated time:** 1–2 hours
**Owner:** ___________

### Goal
Complete the transfer request workflow: when a transfer is approved, auto-create a new allocation for the requesting employee. Add chatter messages on all key status changes.

### Files to create/modify
| Action | File |
|--------|------|
| MODIFY | `asset_flow/models/asset_allocation.py` — add `action_approve_transfer()` |
| MODIFY | `asset_flow/models/maintenance_request.py` — add chatter messages |
| MODIFY | `asset_flow/models/resource_booking.py` — add chatter messages |
| MODIFY | `asset_flow/views/allocation_views.xml` — add approve transfer button |

### What to build

**1. Add transfer approval to `assetflow.allocation`:**
```python
def action_approve_transfer(self):
    """Approve transfer: close current allocation, create new one for requester."""
    self.ensure_one()
    if self.status != 'transfer_requested':
        raise ValidationError(_('Only transfer requests can be approved.'))
    # Close current allocation
    self.write({
        'status': 'returned',
        'actual_return_date': fields.Date.context_today(self),
    })
    # The new allocation should be created by the requester through a separate action
    # Post message
    self.message_post(
        body=f'<b>✅ Transfer Approved:</b> Asset <b>{self.asset_id.asset_tag}</b> '
             f'returned by {self.employee_id.name}.',
        message_type='notification',
    )
```

**2. Add chatter messages to maintenance_request.py:**
In `action_approve()` add:
```python
record.message_post(
    body=f'<b>✅ Approved by</b> {self.env.user.name}',
    message_type='notification',
)
```

In `action_resolve()` add:
```python
record.message_post(
    body=f'<b>🔧 Resolved:</b> {record.resolution_notes or "No notes provided."}',
    message_type='notification',
)
```

**3. Add chatter messages to resource_booking.py:**
In `action_confirm_booking()` add:
```python
self.message_post(
    body=f'<b>📅 Booking Started:</b> {self.resource_id.name} booked by {self.employee_id.name}',
    message_type='notification',
)
```

**4. Add approve transfer button in `allocation_views.xml` form:**
```xml
<button name="action_approve_transfer" string="Approve Transfer" 
        type="object" class="oe_highlight"
        invisible="status != 'transfer_requested'"
        groups="asset_flow.group_assetflow_manager"/>
```

### Acceptance Criteria
- [ ] `action_approve_transfer()` exists in allocation model
- [ ] Approving a transfer closes current allocation and posts chatter message
- [ ] Maintenance approve/resolve post chatter messages
- [ ] Booking confirm/complete post chatter messages
- [ ] Approve transfer button visible only for Asset Managers
- [ ] Module installs cleanly

---

## TASK-6: Audit Item Quick-Verify + Reports Enhancement
**Branch:** `feature/audit-reports`
**Estimated time:** 1–2 hours
**Owner:** ___________

### Goal
Add quick-verify buttons on audit items and create an Asset Register PDF report.

### Files to create/modify
| Action | File |
|--------|------|
| MODIFY | `asset_flow/models/audit_item.py` — add verify/flag buttons |
| CREATE | `asset_flow/reports/asset_register_report.xml` |
| MODIFY | `asset_flow/__manifest__.py` — add report to data list |

### What to build

**1. Add buttons to `audit_item.py`:**
```python
def action_verify(self):
    for record in self:
        record.write({
            'verification_status': 'verified',
            'verified_by': self.env.user.employee_id.id,
            'verification_date': fields.Date.context_today(self),
        })

def action_flag_missing(self):
    for record in self:
        record.write({
            'verification_status': 'missing',
            'verified_by': self.env.user.employee_id.id,
            'verification_date': fields.Date.context_today(self),
        })

def action_flag_damaged(self):
    for record in self:
        record.write({
            'verification_status': 'damaged',
            'verified_by': self.env.user.employee_id.id,
            'verification_date': fields.Date.context_today(self),
        })
```

**2. Update `audit_item.py` imports** — add `from odoo import models, fields, api` (currently only imports `models, fields`).

**3. Create `reports/asset_register_report.xml`** — a QWeb PDF report listing all assets:
```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="action_report_asset_register" model="ir.actions.report">
        <field name="name">Asset Register</field>
        <field name="model">assetflow.asset</field>
        <field name="report_type">qweb-pdf</field>
        <field name="report_name">asset_flow.report_asset_register</field>
        <field name="report_file">asset_flow.report_asset_register</field>
        <field name="binding_model_id" ref="model_assetflow_asset"/>
        <field name="binding_type">report</field>
    </record>

    <template id="report_asset_register">
        <t t-call="web.html_container">
            <t t-foreach="docs" t-as="asset">
                <t t-call="web.external_layout">
                    <div class="page">
                        <h2>Asset Register</h2>
                        <table class="table table-sm table-bordered">
                            <tr><th>Asset Tag</th><td t-field="asset.asset_tag"/></tr>
                            <tr><th>Name</th><td t-field="asset.name"/></tr>
                            <tr><th>Category</th><td t-field="asset.category_id"/></tr>
                            <tr><th>Serial Number</th><td t-field="asset.serial_number"/></tr>
                            <tr><th>Acquisition Date</th><td t-field="asset.acquisition_date"/></tr>
                            <tr><th>Cost</th><td t-field="asset.acquisition_cost" t-options='{"widget": "monetary", "display_currency": "base.USD"}'/></tr>
                            <tr><th>Condition</th><td t-field="asset.condition"/></tr>
                            <tr><th>Location</th><td t-field="asset.location"/></tr>
                            <tr><th>Status</th><td t-field="asset.state"/></tr>
                            <tr><th>Bookable</th><td t-field="asset.is_bookable"/></tr>
                        </table>
                    </div>
                </t>
            </t>
        </t>
    </template>
</odoo>
```

### Acceptance Criteria
- [ ] Audit items have verify/flag_missing/flag_damaged buttons
- [ ] Buttons update `verification_status`, `verified_by`, `verification_date`
- [ ] Asset Register PDF report exists and appears in print menu
- [ ] Module installs cleanly

---

## How to Work on a Task

1. Pick a task and write your name in the "Owner" field above
2. Create a branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-task-name
   ```
3. Make your changes following the file paths listed
4. Test locally if possible:
   ```bash
   venv\Scripts\python.exe odoo-bin -c odoo.conf -d assetflow_db -i asset_flow --stop-after-init
   ```
5. Commit with a clear message:
   ```bash
   git add .
   git commit -m "feat(task-name): clear description of what was done"
   ```
6. Push your branch:
   ```bash
   git push -u origin feature/your-task-name
   ```
7. Open a PR to `main` and tag the team for review

---

## Current Module Status

| Component | Status |
|-----------|--------|
| Models (9) | ✅ Complete |
| Security groups | ✅ Complete |
| ACL rules | ✅ Complete |
| Views (list/form/search/kanban/calendar) | ✅ Complete |
| Dashboard (pivot/graph) | ✅ Basic — TASK-4 enhances |
| Menu hierarchy | ✅ Complete |
| Asset tag sequence (AF-0001) | ✅ Complete |
| Maintenance sequence (MR-0001) | ✅ Complete |
| Audit sequence (AUD-0001) | ✅ Complete |
| QWeb discrepancy report | ✅ Complete |
| Overdue cron job | ❌ TASK-1 |
| Record rules | ❌ TASK-2 |
| Demo data | ❌ TASK-3 |
| KPI dashboard | ❌ TASK-4 |
| Transfer workflow | ❌ TASK-5 |
| Audit quick-verify + asset report | ❌ TASK-6 |
