-- Seed departments
INSERT INTO departments (id, name, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Engineering', true),
  ('a0000000-0000-0000-0000-000000000002', 'Operations', true),
  ('a0000000-0000-0000-0000-000000000003', 'Human Resources', true),
  ('a0000000-0000-0000-0000-000000000004', 'Finance', true);

-- Seed asset categories
INSERT INTO asset_categories (id, name, custom_fields) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Electronics', '{"warranty_period_months": 12}'),
  ('b0000000-0000-0000-0000-000000000002', 'Furniture', '{"material": "string"}'),
  ('b0000000-0000-0000-0000-000000000003', 'Vehicles', '{"license_required": true}'),
  ('b0000000-0000-0000-0000-000000000004', 'Office Equipment', '{}');
