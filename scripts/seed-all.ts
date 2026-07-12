import { Client } from 'pg';

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.itgbnkinmlyemwnhnnwk',
  password: 'Naman#p0807',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

// ── Fixed UUIDs ──────────────────────────────────────────────
const DEPT = {
  engineering: 'a0000000-0000-0000-0000-000000000001',
  operations: 'a0000000-0000-0000-0000-000000000002',
  hr: 'a0000000-0000-0000-0000-000000000003',
  finance: 'a0000000-0000-0000-0000-000000000004',
};

const CAT = {
  electronics: 'b0000000-0000-0000-0000-000000000001',
  furniture: 'b0000000-0000-0000-0000-000000000002',
  vehicles: 'b0000000-0000-0000-0000-000000000003',
  officeEquipment: 'b0000000-0000-0000-0000-000000000004',
};

const USER = {
  admin: 'c0000000-0000-0000-0000-000000000001',
  rajesh: 'c0000000-0000-0000-0000-000000000002',
  priya: 'c0000000-0000-0000-0000-000000000003',
  amit: 'c0000000-0000-0000-0000-000000000004',
  neha: 'c0000000-0000-0000-0000-000000000005',
  vikram: 'c0000000-0000-0000-0000-000000000006',
};

const ASSET = {
  dell5520: 'd0000000-0000-0000-0000-000000000001',
  hpLaserJet: 'd0000000-0000-0000-0000-000000000002',
  standingDesk: 'd0000000-0000-0000-0000-000000000003',
  toyotaHilux: 'd0000000-0000-0000-0000-000000000004',
  macbookPro: 'd0000000-0000-0000-0000-000000000005',
  ergoChair: 'd0000000-0000-0000-0000-000000000006',
  projector: 'd0000000-0000-0000-0000-000000000007',
  thinkpad: 'd0000000-0000-0000-0000-000000000008',
  ciscoRouter: 'd0000000-0000-0000-0000-000000000009',
  whiteboard: 'd0000000-0000-0000-0000-000000000010',
  hondaCivic: 'd0000000-0000-0000-0000-000000000011',
  dellMonitor: 'd0000000-0000-0000-0000-000000000012',
  brotherPrinter: 'd0000000-0000-0000-0000-000000000013',
  confTable: 'd0000000-0000-0000-0000-000000000014',
  ipadPro: 'd0000000-0000-0000-0000-000000000015',
};

const ALLOC = {
  a1: 'e0000000-0000-0000-0000-000000000001',
  a2: 'e0000000-0000-0000-0000-000000000002',
  a3: 'e0000000-0000-0000-0000-000000000003',
  a4: 'e0000000-0000-0000-0000-000000000004',
  a5: 'e0000000-0000-0000-0000-000000000005',
  a6: 'e0000000-0000-0000-0000-000000000006',
  a7: 'e0000000-0000-0000-0000-000000000007',
  a8: 'e0000000-0000-0000-0000-000000000008',
};

const BOOK = {
  b1: 'f0000000-0000-0000-0000-000000000001',
  b2: 'f0000000-0000-0000-0000-000000000002',
  b3: 'f0000000-0000-0000-0000-000000000003',
  b4: 'f0000000-0000-0000-0000-000000000004',
  b5: 'f0000000-0000-0000-0000-000000000005',
};

const MAINT = {
  m1: 'a1000000-0000-0000-0000-000000000001',
  m2: 'a1000000-0000-0000-0000-000000000002',
  m3: 'a1000000-0000-0000-0000-000000000003',
  m4: 'a1000000-0000-0000-0000-000000000004',
  m5: 'a1000000-0000-0000-0000-000000000005',
};

const AUDIT_CYC = {
  c1: 'a2000000-0000-0000-0000-000000000001',
  c2: 'a2000000-0000-0000-0000-000000000002',
};

const TRANSFER = {
  t1: 'a3000000-0000-0000-0000-000000000001',
  t2: 'a3000000-0000-0000-0000-000000000002',
  t3: 'a3000000-0000-0000-0000-000000000003',
};

const ACTLOG = {
  l1: 'a4000000-0000-0000-0000-000000000001',
  l2: 'a4000000-0000-0000-0000-000000000002',
  l3: 'a4000000-0000-0000-0000-000000000003',
  l4: 'a4000000-0000-0000-0000-000000000004',
  l5: 'a4000000-0000-0000-0000-000000000005',
  l6: 'a4000000-0000-0000-0000-000000000006',
  l7: 'a4000000-0000-0000-0000-000000000007',
  l8: 'a4000000-0000-0000-0000-000000000008',
  l9: 'a4000000-0000-0000-0000-000000000009',
  l10: 'a4000000-0000-0000-0000-000000000010',
};

// ── Helpers ──────────────────────────────────────────────────
function q(sql: string) {
  return client.query(sql);
}

function log(msg: string) {
  console.log(`  ${msg}`);
}

// ── Main ─────────────────────────────────────────────────────
async function seed() {
  await client.connect();
  console.log('Connected to database.\n');

  // ──────────────────────────────────────────────────────────
  // 1. TRUNCATE / DELETE all data in correct FK order
  // ──────────────────────────────────────────────────────────
  console.log('Clearing existing data...');
  await q('DELETE FROM activity_logs');
  log('activity_logs cleared');
  await q('DELETE FROM audit_results');
  log('audit_results cleared');
  await q('DELETE FROM audit_assignments');
  log('audit_assignments cleared');
  await q('DELETE FROM audit_cycles');
  log('audit_cycles cleared');
  await q('DELETE FROM maintenance_requests');
  log('maintenance_requests cleared');
  await q('DELETE FROM bookings');
  log('bookings cleared');
  await q('DELETE FROM transfer_requests');
  log('transfer_requests cleared');
  await q('DELETE FROM allocations');
  log('allocations cleared');
  await q('DELETE FROM assets');
  log('assets cleared');
  await q('DELETE FROM profiles');
  log('profiles cleared');
  await q('DELETE FROM asset_categories');
  log('asset_categories cleared');
  await q('DELETE FROM departments');
  log('departments cleared');
  await q("DELETE FROM auth.users WHERE email != 'admin@assetflow.com'");
  log('auth.users cleared (admin kept)\n');

  // ──────────────────────────────────────────────────────────
  // 2. Generate bcrypt hash for User@123
  // ──────────────────────────────────────────────────────────
  console.log('Generating password hash...');
  const { rows: hashRows } = await q("SELECT crypt('User@123', gen_salt('bf')) as hash");
  const userHash = hashRows[0].hash;
  console.log('  Hash generated.\n');

  // ──────────────────────────────────────────────────────────
  // 3. Departments
  // ──────────────────────────────────────────────────────────
  console.log('Seeding departments...');
  await q(`INSERT INTO departments (id, name, parent_id, manager_id, is_active, created_at) VALUES
    ('${DEPT.engineering}', 'Engineering',   NULL, NULL, true, now()),
    ('${DEPT.operations}',  'Operations',    NULL, NULL, true, now()),
    ('${DEPT.hr}',          'Human Resources', NULL, NULL, true, now()),
    ('${DEPT.finance}',     'Finance',       NULL, NULL, true, now())
  `);
  log('4 departments inserted');

  // ──────────────────────────────────────────────────────────
  // 4. Asset Categories
  // ──────────────────────────────────────────────────────────
  console.log('Seeding asset_categories...');
  await q(`INSERT INTO asset_categories (id, name, custom_fields, created_at) VALUES
    ('${CAT.electronics}',     'Electronics',       '{"warranty_months":12}'::jsonb, now()),
    ('${CAT.furniture}',       'Furniture',         '{"material":"various"}'::jsonb, now()),
    ('${CAT.vehicles}',        'Vehicles',          '{"license_required":true}'::jsonb, now()),
    ('${CAT.officeEquipment}', 'Office Equipment',  '{}'::jsonb, now())
  `);
  log('4 categories inserted');

  // ──────────────────────────────────────────────────────────
  // 5. Auth Users (must come BEFORE profiles)
  // ──────────────────────────────────────────────────────────
  console.log('Seeding auth.users...');

  // Admin already exists – skip insert, just note it
  log('admin@assetflow.com already exists – skipping auth insert');

  // Insert the 5 new users
  const authUsers: Array<[string, string, string]> = [
    [USER.rajesh, 'rajesh@assetflow.com',  'Rajesh Kumar'],
    [USER.priya,  'priya@assetflow.com',   'Priya Sharma'],
    [USER.amit,   'amit@assetflow.com',    'Amit Singh'],
    [USER.neha,   'neha@assetflow.com',    'Neha Gupta'],
    [USER.vikram, 'vikram@assetflow.com',  'Vikram Patel'],
  ];

  for (const [id, email, _name] of authUsers) {
    await q(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at, confirmation_token,
        recovery_token, email_change_token_new, email_change
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '${id}',
        'authenticated',
        'authenticated',
        '${email}',
        '${userHash}',
        now(), now(), now(),
        '', '', '', ''
      )
    `);
    log(`auth.users: ${email}`);
  }

  // Also update admin's password to User@123 so all accounts share the same password for testing
  await q(`UPDATE auth.users SET encrypted_password = '${userHash}' WHERE email = 'admin@assetflow.com'`);
  log('admin@assetflow.com password updated to User@123');

  const { rows: adminRow } = await q(`SELECT id FROM auth.users WHERE email = 'admin@assetflow.com'`);
  USER.admin = adminRow[0].id;
  log(`admin@assetflow.com resolved id: ${USER.admin}`);

  console.log('');

  // ──────────────────────────────────────────────────────────
  // 6. Profiles (FK depends on auth.users)
  // ──────────────────────────────────────────────────────────
  console.log('Seeding profiles...');
  await q(`INSERT INTO profiles (id, name, email, department_id, role, is_active, created_at) VALUES
    ('${USER.admin}',   'System Admin',    'admin@assetflow.com',   '${DEPT.engineering}', 'Admin',          true, now()),
    ('${USER.rajesh}',  'Rajesh Kumar',    'rajesh@assetflow.com',  '${DEPT.engineering}', 'Asset Manager',  true, now()),
    ('${USER.priya}',   'Priya Sharma',    'priya@assetflow.com',   '${DEPT.operations}',  'Department Head', true, now()),
    ('${USER.amit}',    'Amit Singh',      'amit@assetflow.com',    '${DEPT.engineering}', 'Employee',       true, now()),
    ('${USER.neha}',    'Neha Gupta',      'neha@assetflow.com',    '${DEPT.hr}',          'Department Head', true, now()),
    ('${USER.vikram}',  'Vikram Patel',    'vikram@assetflow.com',  '${DEPT.finance}',     'Employee',       true, now())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, email = EXCLUDED.email,
      department_id = EXCLUDED.department_id, role = EXCLUDED.role,
      is_active = EXCLUDED.is_active, created_at = EXCLUDED.created_at
  `);
  log('6 profiles inserted\n');

  // ──────────────────────────────────────────────────────────
  // 7. Assets (15)
  // ──────────────────────────────────────────────────────────
  console.log('Seeding assets...');
  await q(`INSERT INTO assets (
    id, asset_tag, name, category_id, serial_number, acquisition_date,
    acquisition_cost, condition, location, is_shared_bookable, status,
    current_holder_id, current_department_id, document_urls, created_at
  ) VALUES
    ('${ASSET.dell5520}',     'AST-001', 'Dell Latitude 5520',      '${CAT.electronics}',     'SN-DELL-5520-001',  '2024-03-15', 95000,  'Good',    'Engineering Floor 2', true,  'Allocated',     '${USER.amit}',   '${DEPT.engineering}', '{}'::text[], now()),
    ('${ASSET.hpLaserJet}',   'AST-002', 'HP LaserJet Pro',         '${CAT.officeEquipment}', 'SN-HP-LJP-002',     '2024-01-20', 32000,  'Good',    'Operations Floor 1',  true,  'Available',     NULL,              '${DEPT.operations}',  '{}'::text[], now()),
    ('${ASSET.standingDesk}', 'AST-003', 'Standing Desk',           '${CAT.furniture}',       'SN-SD-003',         '2024-06-10', 45000,  'Excellent','Operations Floor 2',  false, 'Allocated',     '${USER.priya}',  '${DEPT.operations}',  '{}'::text[], now()),
    ('${ASSET.toyotaHilux}',  'AST-004', 'Toyota Hilux',            '${CAT.vehicles}',        'VIN-HILUX-004',     '2023-11-05', 2500000,'Good',    'Parking Lot A',       true,  'Available',     NULL,              '${DEPT.operations}',  '{}'::text[], now()),
    ('${ASSET.macbookPro}',   'AST-005', 'MacBook Pro 14"',         '${CAT.electronics}',     'SN-MBP-14-005',     '2025-01-12', 195000, 'Excellent','Engineering Floor 2', true,  'Allocated',     '${USER.rajesh}', '${DEPT.engineering}', '{}'::text[], now()),
    ('${ASSET.ergoChair}',    'AST-006', 'Ergonomic Chair',         '${CAT.furniture}',       'SN-EC-006',         '2024-09-01', 28000,  'Good',    'Finance Floor 1',     false, 'Allocated',     '${USER.vikram}', '${DEPT.finance}',     '{}'::text[], now()),
    ('${ASSET.projector}',    'AST-007', 'Projector Epson',         '${CAT.officeEquipment}', 'SN-EP-007',         '2023-08-20', 65000,  'Fair',    'Conference Room 1',   true,  'Under Maintenance', NULL,         '${DEPT.operations}',  '{}'::text[], now()),
    ('${ASSET.thinkpad}',     'AST-008', 'Lenovo ThinkPad X1',      '${CAT.electronics}',     'SN-TPX1-008',       '2025-03-01', 140000, 'Excellent','Finance Floor 1',     true,  'Available',     NULL,              '${DEPT.finance}',     '{}'::text[], now()),
    ('${ASSET.ciscoRouter}',  'AST-009', 'Cisco Router',            '${CAT.officeEquipment}', 'SN-CR-009',         '2024-04-18', 22000,  'Good',    'HR Floor 1',          false, 'Allocated',     '${USER.neha}',  '${DEPT.hr}',          '{}'::text[], now()),
    ('${ASSET.whiteboard}',   'AST-010', 'Whiteboard 6ft',          '${CAT.furniture}',       'SN-WB-010',         '2024-02-28', 8500,   'Good',    'HR Floor 1',          true,  'Available',     NULL,              '${DEPT.hr}',          '{}'::text[], now()),
    ('${ASSET.hondaCivic}',   'AST-011', 'Honda Civic',             '${CAT.vehicles}',        'VIN-HCV-011',       '2023-06-15', 1800000,'Good',    'Parking Lot A',       true,  'Allocated',     '${USER.admin}',  '${DEPT.engineering}', '{}'::text[], now()),
    ('${ASSET.dellMonitor}',  'AST-012', 'Dell Monitor 27"',        '${CAT.electronics}',     'SN-DM27-012',       '2025-02-10', 35000,  'Excellent','Engineering Floor 2', true,  'Available',     NULL,              '${DEPT.engineering}', '{}'::text[], now()),
    ('${ASSET.brotherPrinter}','AST-013','Printer Brother',         '${CAT.officeEquipment}', 'SN-PB-013',         '2023-09-25', 18000,  'Fair',    'Operations Floor 1',  true,  'Lost',          NULL,              '${DEPT.operations}',  '{}'::text[], now()),
    ('${ASSET.confTable}',    'AST-014', 'Conference Table',        '${CAT.furniture}',       'SN-CT-014',         '2024-07-01', 55000,  'Good',    'Engineering Floor 3', true,  'Available',     NULL,              '${DEPT.engineering}', '{}'::text[], now()),
    ('${ASSET.ipadPro}',      'AST-015', 'iPad Pro',                '${CAT.electronics}',     'SN-IPAD-015',       '2025-05-20', 82000,  'Excellent','HR Floor 1',          true,  'Reserved',      NULL,              '${DEPT.hr}',          '{}'::text[], now())
  `);
  log('15 assets inserted\n');

  // ──────────────────────────────────────────────────────────
  // 8. Allocations (8)
  // ──────────────────────────────────────────────────────────
  console.log('Seeding allocations...');
  await q(`INSERT INTO allocations (
    id, asset_id, assigned_to_user_id, assigned_to_dept_id,
    expected_return_date, actual_return_date, condition_on_return, status, allocated_at
  ) VALUES
    ('${ALLOC.a1}', '${ASSET.dell5520}',    '${USER.amit}',   NULL,                '2026-09-01', NULL, NULL, 'Active',   '2025-11-15'),
    ('${ALLOC.a2}', '${ASSET.standingDesk}','${USER.priya}',  NULL,                '2026-06-30', NULL, NULL, 'Active',   '2025-10-01'),
    ('${ALLOC.a3}', '${ASSET.macbookPro}',  '${USER.rajesh}', NULL,                '2027-01-12', NULL, NULL, 'Active',   '2026-01-12'),
    ('${ALLOC.a4}', '${ASSET.ergoChair}',   '${USER.vikram}', NULL,                '2026-03-01', '2026-02-28', 'Good',  'Returned', '2025-09-01'),
    ('${ALLOC.a5}', '${ASSET.ciscoRouter}', '${USER.neha}',   NULL,                '2026-12-31', NULL, NULL, 'Active',   '2026-01-01'),
    ('${ALLOC.a6}', '${ASSET.hondaCivic}',  '${USER.admin}',  NULL,                '2026-12-31', NULL, NULL, 'Active',   '2025-06-15'),
    ('${ALLOC.a7}', '${ASSET.dell5520}',    '${USER.rajesh}', NULL,                '2025-06-30', '2025-06-25', 'Good',  'Returned', '2025-03-01'),
    ('${ALLOC.a8}', '${ASSET.thinkpad}',    NULL,             '${DEPT.finance}',   '2026-08-01', NULL, NULL, 'Active',   '2026-02-01')
  `);
  log('8 allocations inserted\n');

  // ──────────────────────────────────────────────────────────
  // 9. Bookings (5)
  // ──────────────────────────────────────────────────────────
  console.log('Seeding bookings...');
  await q(`INSERT INTO bookings (
    id, asset_id, user_id, start_time, end_time, status, created_at
  ) VALUES
    ('${BOOK.b1}', '${ASSET.toyotaHilux}',  '${USER.amit}',   '2026-07-14 09:00:00', '2026-07-14 17:00:00', 'Upcoming',  '2026-07-01 10:00:00'),
    ('${BOOK.b2}', '${ASSET.hpLaserJet}',   '${USER.vikram}', '2026-07-10 08:00:00', '2026-07-10 12:00:00', 'Ongoing',   '2026-07-05 14:30:00'),
    ('${BOOK.b3}', '${ASSET.projector}',    '${USER.neha}',   '2026-07-01 09:00:00', '2026-07-01 17:00:00', 'Completed', '2026-06-25 11:00:00'),
    ('${BOOK.b4}', '${ASSET.dellMonitor}',  '${USER.priya}',  '2026-07-08 13:00:00', '2026-07-08 17:00:00', 'Cancelled', '2026-07-02 09:00:00'),
    ('${BOOK.b5}', '${ASSET.whiteboard}',   '${USER.amit}',   '2026-07-15 10:00:00', '2026-07-15 15:00:00', 'Upcoming',  '2026-07-08 16:00:00')
  `);
  log('5 bookings inserted\n');

  // ──────────────────────────────────────────────────────────
  // 10. Maintenance Requests (5)
  // ──────────────────────────────────────────────────────────
  console.log('Seeding maintenance_requests...');
  await q(`INSERT INTO maintenance_requests (
    id, asset_id, reporter_id, description, priority, status,
    technician_name, photo_url, resolved_at, created_at
  ) VALUES
    ('${MAINT.m1}', '${ASSET.projector}',    '${USER.priya}',  'Lamp flickering intermittently during presentations', 'High',   'In Progress',  'Ravi Technician', NULL, NULL,                    '2026-06-20 10:00:00'),
    ('${MAINT.m2}', '${ASSET.brotherPrinter}','${USER.amit}', 'Paper jam indicator stuck even after clearing',      'Medium', 'Pending',      NULL,             NULL, NULL,                    '2026-07-01 14:30:00'),
    ('${MAINT.m3}', '${ASSET.ergoChair}',    '${USER.vikram}', 'Hydraulic lift not holding position',                'Low',    'Resolved',     'Suresh Repairs', NULL, '2026-06-15 16:00:00', '2026-06-10 09:00:00'),
    ('${MAINT.m4}', '${ASSET.toyotaHilux}',  '${USER.admin}',  'Engine warning light on dashboard',                  'High',   'Approved',     NULL,             NULL, NULL,                    '2026-07-05 08:00:00'),
    ('${MAINT.m5}', '${ASSET.dell5520}',     '${USER.amit}',   'Battery draining faster than expected',              'Medium', 'Pending',      NULL,             NULL, NULL,                    '2026-07-08 11:30:00')
  `);
  log('5 maintenance_requests inserted\n');

  // ──────────────────────────────────────────────────────────
  // 11. Audit Cycles (2)
  // ──────────────────────────────────────────────────────────
  console.log('Seeding audit_cycles...');
  await q(`INSERT INTO audit_cycles (
    id, name, scope_department_id, scope_location, start_date, end_date, is_closed, created_at
  ) VALUES
    ('${AUDIT_CYC.c1}', 'Q2 2026 Engineering Audit', '${DEPT.engineering}', 'Engineering Floor 2', '2026-04-01', '2026-06-30', true,  '2026-03-15 09:00:00'),
    ('${AUDIT_CYC.c2}', 'Q3 2026 Full Office Audit', NULL,                   NULL,                   '2026-07-01', '2026-09-30', false, '2026-06-20 09:00:00')
  `);
  log('2 audit_cycles inserted\n');

  // ── Audit Assignments ──────────────────────────────────────
  console.log('Seeding audit_assignments...');
  await q(`INSERT INTO audit_assignments (id, audit_cycle_id, auditor_id) VALUES
    ('a2000000-0000-0000-0000-000000000011', '${AUDIT_CYC.c1}', '${USER.rajesh}'),
    ('a2000000-0000-0000-0000-000000000012', '${AUDIT_CYC.c1}', '${USER.admin}'),
    ('a2000000-0000-0000-0000-000000000013', '${AUDIT_CYC.c2}', '${USER.rajesh}'),
    ('a2000000-0000-0000-0000-000000000014', '${AUDIT_CYC.c2}', '${USER.priya}'),
    ('a2000000-0000-0000-0000-000000000015', '${AUDIT_CYC.c2}', '${USER.admin}')
  `);
  log('5 audit_assignments inserted');

  // ── Audit Results ──────────────────────────────────────────
  console.log('Seeding audit_results...');
  await q(`INSERT INTO audit_results (
    id, audit_cycle_id, asset_id, auditor_id, verification_status, notes, logged_at
  ) VALUES
    ('a2000000-0000-0000-0000-000000000021', '${AUDIT_CYC.c1}', '${ASSET.dell5520}',    '${USER.rajesh}', 'Verified', 'Asset found at assigned desk',      '2026-05-10 10:00:00'),
    ('a2000000-0000-0000-0000-000000000022', '${AUDIT_CYC.c1}', '${ASSET.macbookPro}',  '${USER.rajesh}', 'Verified', 'Asset with user, in good condition', '2026-05-10 10:30:00'),
    ('a2000000-0000-0000-0000-000000000023', '${AUDIT_CYC.c1}', '${ASSET.dellMonitor}', '${USER.admin}',  'Verified', 'Sitting in storage, unused',         '2026-05-12 14:00:00'),
    ('a2000000-0000-0000-0000-000000000024', '${AUDIT_CYC.c1}', '${ASSET.confTable}',   '${USER.admin}',  'Damaged',  'Scratches on surface',               '2026-05-12 14:30:00'),
    ('a2000000-0000-0000-0000-000000000025', '${AUDIT_CYC.c2}', '${ASSET.hpLaserJet}',  '${USER.priya}',  'Verified', 'Operational in Operations',          '2026-07-05 09:00:00'),
    ('a2000000-0000-0000-0000-000000000026', '${AUDIT_CYC.c2}', '${ASSET.toyotaHilux}', '${USER.rajesh}', 'Verified', 'In parking lot, keys with admin',    '2026-07-05 11:00:00'),
    ('a2000000-0000-0000-0000-000000000027', '${AUDIT_CYC.c2}', '${ASSET.brotherPrinter}','${USER.admin}', 'Missing', 'Not found at recorded location',     '2026-07-06 10:00:00'),
    ('a2000000-0000-0000-0000-000000000028', '${AUDIT_CYC.c2}', '${ASSET.whiteboard}',  '${USER.priya}',  'Verified', 'Present in HR area',                 '2026-07-06 14:00:00')
  `);
  log('8 audit_results inserted\n');

  // ──────────────────────────────────────────────────────────
  // 12. Transfer Requests (3)
  // ──────────────────────────────────────────────────────────
  console.log('Seeding transfer_requests...');
  await q(`INSERT INTO transfer_requests (
    id, asset_id, requester_id, target_department_id, status, notes, created_at
  ) VALUES
    ('${TRANSFER.t1}', '${ASSET.dellMonitor}', '${USER.rajesh}', '${DEPT.finance}',  'Requested', 'Finance needs a monitor for new hire',         '2026-07-08 09:00:00'),
    ('${TRANSFER.t2}', '${ASSET.whiteboard}',  '${USER.neha}',   '${DEPT.engineering}','Approved', 'Moved to engineering for new meeting room',    '2026-06-25 11:00:00'),
    ('${TRANSFER.t3}', '${ASSET.hpLaserJet}',  '${USER.amit}',   '${DEPT.engineering}','Rejected', 'Operations still needs this printer',          '2026-07-01 15:00:00')
  `);
  log('3 transfer_requests inserted\n');

  // ──────────────────────────────────────────────────────────
  // 13. Activity Logs (10)
  // ──────────────────────────────────────────────────────────
  console.log('Seeding activity_logs...');
  await q(`INSERT INTO activity_logs (
    id, user_id, action, entity_type, entity_id, old_values, new_values, details, created_at
  ) VALUES
    ('${ACTLOG.l1}',  '${USER.admin}',   'asset_created',     'asset',          '${ASSET.dell5520}',    NULL,                          '{"name":"Dell Latitude 5520"}',              '{"message":"Created new asset Dell Latitude 5520"}',              '2025-11-15 09:00:00'),
    ('${ACTLOG.l2}',  '${USER.admin}',   'asset_allocated',   'asset',          '${ASSET.dell5520}',    '{"status":"Available"}',      '{"status":"Allocated","current_holder_id":"${USER.amit}"}', '{"message":"Allocated to Amit Singh"}',   '2025-11-15 09:15:00'),
    ('${ACTLOG.l3}',  '${USER.priya}',   'booking_created',   'booking',        '${BOOK.b1}',           NULL,                          '{"status":"Upcoming"}',                        '{"message":"Booked Toyota Hilux for field visit"}',                 '2026-07-01 10:00:00'),
    ('${ACTLOG.l4}',  '${USER.priya}',   'maintenance_reported','maintenance',   '${MAINT.m1}',          NULL,                          '{"priority":"High","status":"Pending"}',       '{"message":"Reported projector issue"}',                            '2026-06-20 10:05:00'),
    ('${ACTLOG.l5}',  '${USER.admin}',   'role_changed',      'profile',        '${USER.rajesh}',       '{"role":"Employee"}',         '{"role":"Asset Manager"}',                      '{"message":"Promoted Rajesh Kumar to Asset Manager"}',              '2025-12-01 10:00:00'),
    ('${ACTLOG.l6}',  '${USER.rajesh}',  'transfer_requested','transfer',       '${TRANSFER.t1}',       NULL,                          '{"target_department_id":"${DEPT.finance}"}',    '{"message":"Requested monitor transfer to Finance"}',               '2026-07-08 09:00:00'),
    ('${ACTLOG.l7}',  '${USER.admin}',   'asset_created',     'asset',          '${ASSET.macbookPro}',  NULL,                          '{"name":"MacBook Pro 14\\""}',                 '{"message":"Created MacBook Pro for Rajesh"}',                      '2026-01-12 11:00:00'),
    ('${ACTLOG.l8}',  '${USER.amit}',    'maintenance_reported','maintenance',  '${MAINT.m5}',          NULL,                          '{"priority":"Medium","status":"Pending"}',     '{"message":"Reported battery drain on Dell Latitude"}',             '2026-07-08 11:35:00'),
    ('${ACTLOG.l9}',  '${USER.admin}',   'audit_completed',   'audit_cycle',    '${AUDIT_CYC.c1}',      '{"is_closed":false}',         '{"is_closed":true}',                            '{"message":"Closed Q2 2026 Engineering Audit"}',                    '2026-06-30 17:00:00'),
    ('${ACTLOG.l10}', '${USER.neha}',    'asset_marked_lost', 'asset',          '${ASSET.brotherPrinter}','{"status":"Available"}',     '{"status":"Lost"}',                             '{"message":"Brother Printer marked as lost"}',                      '2026-07-02 09:00:00')
  `);
  log('10 activity_logs inserted\n');

  // ──────────────────────────────────────────────────────────
  // 14. Update department managers
  // ──────────────────────────────────────────────────────────
  console.log('Updating department managers...');
  await q(`UPDATE departments SET manager_id = '${USER.rajesh}' WHERE id = '${DEPT.engineering}'`);
  await q(`UPDATE departments SET manager_id = '${USER.priya}' WHERE id = '${DEPT.operations}'`);
  await q(`UPDATE departments SET manager_id = '${USER.neha}' WHERE id = '${DEPT.hr}'`);
  await q(`UPDATE departments SET manager_id = '${USER.vikram}' WHERE id = '${DEPT.finance}'`);
  log('4 departments updated\n');

  // ──────────────────────────────────────────────────────────
  // 15. Summary
  // ──────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════');
  console.log('  SEED SUMMARY');
  console.log('═══════════════════════════════════════════════════');

  const tables = [
    'departments', 'asset_categories', 'profiles', 'assets',
    'allocations', 'bookings', 'maintenance_requests',
    'audit_cycles', 'audit_assignments', 'audit_results',
    'transfer_requests', 'activity_logs',
  ];

  for (const t of tables) {
    const { rows } = await q(`SELECT count(*)::int as cnt FROM ${t}`);
    const cnt = rows[0].cnt;
    const bar = '█'.repeat(cnt) + '░'.repeat(Math.max(0, 15 - cnt));
    console.log(`  ${t.padEnd(24)} ${bar}  ${cnt}`);
  }

  // auth.users count
  const { rows: au } = await q(`SELECT count(*)::int as cnt FROM auth.users`);
  const auCnt = au[0].cnt;
  console.log(`  ${'auth.users'.padEnd(24)} ${'█'.repeat(auCnt)}${'░'.repeat(Math.max(0, 15 - auCnt))}  ${auCnt}`);

  console.log('═══════════════════════════════════════════════════\n');

  // ──────────────────────────────────────────────────────────
  // 16. User Credentials
  // ──────────────────────────────────────────────────────────
  console.log('User Credentials (all passwords: User@123)');
  console.log('───────────────────────────────────────────────');
  console.log('  Role            Email                       Password');
  console.log('  ─────           ─────                       ────────');
  console.log('  Admin           admin@assetflow.com          User@123');
  console.log('  Asset Manager   rajesh@assetflow.com         User@123');
  console.log('  Dept Head       priya@assetflow.com          User@123');
  console.log('  Employee        amit@assetflow.com           User@123');
  console.log('  Dept Head       neha@assetflow.com           User@123');
  console.log('  Employee        vikram@assetflow.com         User@123');
  console.log('───────────────────────────────────────────────\n');

  console.log('Seed completed successfully!');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  client.end();
  process.exit(1);
});
