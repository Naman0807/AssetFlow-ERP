-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id UUID,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. USER PROFILES
CREATE TYPE user_role AS ENUM ('Employee', 'Asset Manager', 'Department Head', 'Admin');

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    role user_role DEFAULT 'Employee'::user_role NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add Foreign Key to departments for manager_id
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. ASSET CATEGORIES
CREATE TABLE asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ASSETS
CREATE TYPE asset_status AS ENUM ('Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed');

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES asset_categories(id) ON DELETE RESTRICT,
    serial_number VARCHAR(100) UNIQUE,
    acquisition_date DATE NOT NULL,
    acquisition_cost NUMERIC(12, 2),
    condition VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    is_shared_bookable BOOLEAN DEFAULT false NOT NULL,
    status asset_status DEFAULT 'Available'::asset_status NOT NULL,
    current_holder_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    current_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    document_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ALLOCATIONS & TRANSFERS
CREATE TYPE transfer_status AS ENUM ('Requested', 'Approved', 'Rejected');
CREATE TYPE allocation_status AS ENUM ('Active', 'Returned');

CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
    assigned_to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_to_dept_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    expected_return_date DATE,
    actual_return_date DATE,
    condition_on_return TEXT,
    status allocation_status DEFAULT 'Active'::allocation_status NOT NULL,
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_allocation_target CHECK (
        (assigned_to_user_id IS NOT NULL AND assigned_to_dept_id IS NULL) OR
        (assigned_to_user_id IS NULL AND assigned_to_dept_id IS NOT NULL)
    )
);

CREATE TABLE transfer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
    requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    target_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    status transfer_status DEFAULT 'Requested'::transfer_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. RESOURCE BOOKINGS
CREATE TYPE booking_status AS ENUM ('Upcoming', 'Ongoing', 'Completed', 'Cancelled');

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status booking_status DEFAULT 'Upcoming'::booking_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_booking_times CHECK (start_time < end_time)
);

-- 7. MAINTENANCE REQUESTS
CREATE TYPE maintenance_status AS ENUM ('Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved');

CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status maintenance_status DEFAULT 'Pending'::maintenance_status NOT NULL,
    technician_name VARCHAR(255),
    photo_url TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. AUDIT CYCLES
CREATE TYPE audit_asset_status AS ENUM ('Verified', 'Missing', 'Damaged');

CREATE TABLE audit_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    scope_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    scope_location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE audit_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_cycle_id UUID REFERENCES audit_cycles(id) ON DELETE CASCADE NOT NULL,
    auditor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE audit_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_cycle_id UUID REFERENCES audit_cycles(id) ON DELETE CASCADE NOT NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
    auditor_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
    verification_status audit_asset_status NOT NULL,
    notes TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(audit_cycle_id, asset_id)
);

-- 9. ACTIVITY LOGS
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES FOR PERFORMANCE OPTIMIZATION
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_tag ON assets(asset_tag);
CREATE INDEX idx_assets_category ON assets(category_id);
CREATE INDEX idx_assets_department ON assets(current_department_id);
CREATE INDEX idx_assets_holder ON assets(current_holder_id);
CREATE INDEX idx_allocations_asset ON allocations(asset_id);
CREATE INDEX idx_allocations_user ON allocations(assigned_to_user_id);
CREATE INDEX idx_allocations_status ON allocations(status);
CREATE INDEX idx_bookings_range ON bookings(asset_id, start_time, end_time) WHERE status != 'Cancelled';
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_asset ON maintenance_requests(asset_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_audit_results_cycle ON audit_results(audit_cycle_id);
CREATE INDEX idx_transfer_requests_asset ON transfer_requests(asset_id);
CREATE INDEX idx_transfer_requests_status ON transfer_requests(status);
