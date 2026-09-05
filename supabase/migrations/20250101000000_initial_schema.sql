-- ============================================================================
-- KisanSetu PostgreSQL Database Migration Script
-- SIH Problem Statement ID: 26032
-- Description: Core Schema, Custom Enums, Indexes, Security Triggers, and RLS Policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. CUSTOM ENUM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('FARMER', 'CENTRE_STAFF', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE slot_status AS ENUM ('BOOKED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE queue_status AS ENUM ('WAITING', 'WEIGHING', 'GRADING', 'COMPLETED', 'SKIPPED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quality_grade AS ENUM ('GRADE_A', 'FAQ', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'DISBURSED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notif_channel AS ENUM ('IN_APP', 'SMS', 'PUSH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 3. CORE TABLE DEFINITIONS
-- ----------------------------------------------------------------------------

-- 3.1 Procurement Centres (Must exist prior to profile foreign keys)
CREATE TABLE IF NOT EXISTS procurement_centres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    daily_capacity_quintals INTEGER NOT NULL DEFAULT 1000,
    operating_start_time TIME DEFAULT '08:00:00',
    operating_end_time TIME DEFAULT '18:00:00',
    hourly_slot_capacity INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'FARMER',
    preferred_language VARCHAR(10) DEFAULT 'hi',
    aadhaar_last4 VARCHAR(4) NULL,
    assigned_centre_id UUID REFERENCES procurement_centres(id) ON DELETE SET NULL,
    district VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 Crops Lookup Master
CREATE TABLE IF NOT EXISTS crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_code VARCHAR(50) UNIQUE NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100) NOT NULL,
    season VARCHAR(50) NOT NULL,
    msp_per_quintal DECIMAL(10, 2) NOT NULL,
    max_moisture_percentage DECIMAL(5, 2) DEFAULT 14.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 Produce Declarations
CREATE TABLE IF NOT EXISTS produce_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
    estimated_quantity_quintals DECIMAL(10, 2) NOT NULL CHECK (estimated_quantity_quintals > 0),
    harvest_date DATE NOT NULL,
    village VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 Slot Bookings
CREATE TABLE IF NOT EXISTS slot_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_code VARCHAR(20) UNIQUE NOT NULL,
    declaration_id UUID REFERENCES produce_declarations(id) ON DELETE SET NULL,
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL,
    slot_start_time TIME NOT NULL,
    slot_end_time TIME NOT NULL,
    estimated_quantity_quintals DECIMAL(10, 2) NOT NULL CHECK (estimated_quantity_quintals > 0),
    vehicle_type VARCHAR(50) DEFAULT 'Tractor',
    vehicle_number VARCHAR(30) NULL,
    status slot_status DEFAULT 'BOOKED',
    qr_code_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 Queue Entries
CREATE TABLE IF NOT EXISTS queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES slot_bookings(id) ON DELETE CASCADE,
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
    queue_number INTEGER NOT NULL,
    status queue_status DEFAULT 'WAITING',
    check_in_time TIMESTAMPTZ DEFAULT NOW(),
    called_time TIMESTAMPTZ NULL,
    completed_time TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 Procurement Records
CREATE TABLE IF NOT EXISTS procurement_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_entry_id UUID UNIQUE REFERENCES queue_entries(id) ON DELETE SET NULL,
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE RESTRICT,
    crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
    gross_weight_kg DECIMAL(10, 2) NOT NULL CHECK (gross_weight_kg > 0),
    tare_weight_kg DECIMAL(10, 2) NOT NULL CHECK (tare_weight_kg >= 0),
    net_weight_quintals DECIMAL(10, 2) NOT NULL CHECK (net_weight_quintals > 0),
    moisture_percentage DECIMAL(5, 2) NOT NULL,
    grade quality_grade NOT NULL DEFAULT 'GRADE_A',
    rate_per_quintal DECIMAL(10, 2) NOT NULL CHECK (rate_per_quintal > 0),
    total_payout_amount DECIMAL(12, 2) NOT NULL CHECK (total_payout_amount >= 0),
    staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    remarks TEXT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procurement_record_id UUID UNIQUE NOT NULL REFERENCES procurement_records(id) ON DELETE RESTRICT,
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    transaction_ref VARCHAR(100) UNIQUE NULL,
    payment_status payment_status DEFAULT 'PENDING',
    disbursed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title_key VARCHAR(100) NOT NULL,
    body_key VARCHAR(100) NOT NULL,
    params JSONB DEFAULT '{}'::jsonb,
    channel notif_channel DEFAULT 'IN_APP',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 Centre Capacity Logs
CREATE TABLE IF NOT EXISTS centre_capacity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES procurement_centres(id) ON DELETE CASCADE,
    log_timestamp TIMESTAMPTZ DEFAULT NOW(),
    active_vehicles_count INTEGER DEFAULT 0,
    hourly_throughput_quintals DECIMAL(10, 2) DEFAULT 0,
    estimated_wait_duration_mins INTEGER DEFAULT 0,
    congestion_level VARCHAR(20) DEFAULT 'GREEN' -- GREEN, YELLOW, RED
);

-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_centres_district ON procurement_centres(district);
CREATE INDEX IF NOT EXISTS idx_centres_state ON procurement_centres(state);
CREATE INDEX IF NOT EXISTS idx_crops_code ON crops(crop_code);
CREATE INDEX IF NOT EXISTS idx_declarations_farmer ON produce_declarations(farmer_id);
CREATE INDEX IF NOT EXISTS idx_slot_bookings_date_centre ON slot_bookings(centre_id, booking_date, slot_start_time);
CREATE INDEX IF NOT EXISTS idx_slot_bookings_farmer ON slot_bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_slot_bookings_token ON slot_bookings(token_code);
CREATE INDEX IF NOT EXISTS idx_queue_entries_centre_status ON queue_entries(centre_id, status);
CREATE INDEX IF NOT EXISTS idx_procurement_records_farmer ON procurement_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_procurement_records_centre ON procurement_records(centre_id);
CREATE INDEX IF NOT EXISTS idx_payments_farmer_status ON payments(farmer_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_capacity_logs_centre_time ON centre_capacity_logs(centre_id, log_timestamp);

-- ----------------------------------------------------------------------------
-- 5. SECURE AUTOMATIC USER PROFILE TRIGGER
-- ----------------------------------------------------------------------------
-- Public user registration MUST default to FARMER.
-- Admin/Staff assigned role in metadata is strictly ignored for safety.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        phone_number,
        role,
        preferred_language
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', '0000000000'),
        'FARMER', -- FORCED DEFAULT ROLE FOR SAFETY
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'hi')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE produce_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE centre_capacity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check current user role from profiles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6.1 Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR get_current_user_role() IN ('CENTRE_STAFF', 'ADMIN'));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id OR get_current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
CREATE POLICY "Admins have full access to profiles" ON profiles
    FOR ALL USING (get_current_user_role() = 'ADMIN');

-- 6.2 Procurement Centres Policies
DROP POLICY IF EXISTS "Everyone can view active centres" ON procurement_centres;
CREATE POLICY "Everyone can view active centres" ON procurement_centres
    FOR SELECT USING (is_active = TRUE OR get_current_user_role() IN ('CENTRE_STAFF', 'ADMIN'));

DROP POLICY IF EXISTS "Admins can manage centres" ON procurement_centres;
CREATE POLICY "Admins can manage centres" ON procurement_centres
    FOR ALL USING (get_current_user_role() = 'ADMIN');

-- 6.3 Crops Policies
DROP POLICY IF EXISTS "Everyone can view active crops" ON crops;
CREATE POLICY "Everyone can view active crops" ON crops
    FOR SELECT USING (is_active = TRUE OR get_current_user_role() IN ('CENTRE_STAFF', 'ADMIN'));

DROP POLICY IF EXISTS "Admins can manage crops" ON crops;
CREATE POLICY "Admins can manage crops" ON crops
    FOR ALL USING (get_current_user_role() = 'ADMIN');

-- 6.4 Produce Declarations Policies
DROP POLICY IF EXISTS "Farmers can view own declarations" ON produce_declarations;
CREATE POLICY "Farmers can view own declarations" ON produce_declarations
    FOR SELECT USING (farmer_id = auth.uid() OR get_current_user_role() IN ('CENTRE_STAFF', 'ADMIN'));

DROP POLICY IF EXISTS "Farmers can insert own declarations" ON produce_declarations;
CREATE POLICY "Farmers can insert own declarations" ON produce_declarations
    FOR INSERT WITH CHECK (farmer_id = auth.uid());

DROP POLICY IF EXISTS "Farmers can update own declarations" ON produce_declarations;
CREATE POLICY "Farmers can update own declarations" ON produce_declarations
    FOR UPDATE USING (farmer_id = auth.uid() OR get_current_user_role() = 'ADMIN');

-- 6.5 Slot Bookings Policies
DROP POLICY IF EXISTS "Farmers can view own bookings" ON slot_bookings;
CREATE POLICY "Farmers can view own bookings" ON slot_bookings
    FOR SELECT USING (
        farmer_id = auth.uid() 
        OR get_current_user_role() = 'ADMIN'
        OR (get_current_user_role() = 'CENTRE_STAFF' AND centre_id IN (
            SELECT assigned_centre_id FROM profiles WHERE id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Farmers can insert own bookings" ON slot_bookings;
CREATE POLICY "Farmers can insert own bookings" ON slot_bookings
    FOR INSERT WITH CHECK (farmer_id = auth.uid());

DROP POLICY IF EXISTS "Farmers can update own bookings" ON slot_bookings;
CREATE POLICY "Farmers can update own bookings" ON slot_bookings
    FOR UPDATE USING (
        farmer_id = auth.uid() 
        OR get_current_user_role() = 'ADMIN'
        OR (get_current_user_role() = 'CENTRE_STAFF' AND centre_id IN (
            SELECT assigned_centre_id FROM profiles WHERE id = auth.uid()
        ))
    );

-- 6.6 Queue Entries Policies
DROP POLICY IF EXISTS "Farmers and Staff can view queue entries" ON queue_entries;
CREATE POLICY "Farmers and Staff can view queue entries" ON queue_entries
    FOR SELECT USING (
        booking_id IN (SELECT id FROM slot_bookings WHERE farmer_id = auth.uid())
        OR get_current_user_role() = 'ADMIN'
        OR (get_current_user_role() = 'CENTRE_STAFF' AND centre_id IN (
            SELECT assigned_centre_id FROM profiles WHERE id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Staff can manage queue entries" ON queue_entries;
CREATE POLICY "Staff can manage queue entries" ON queue_entries
    FOR ALL USING (
        get_current_user_role() = 'ADMIN'
        OR (get_current_user_role() = 'CENTRE_STAFF' AND centre_id IN (
            SELECT assigned_centre_id FROM profiles WHERE id = auth.uid()
        ))
    );

-- 6.7 Procurement Records Policies
DROP POLICY IF EXISTS "Farmers can view own procurement records" ON procurement_records;
CREATE POLICY "Farmers can view own procurement records" ON procurement_records
    FOR SELECT USING (
        farmer_id = auth.uid() 
        OR get_current_user_role() = 'ADMIN'
        OR (get_current_user_role() = 'CENTRE_STAFF' AND centre_id IN (
            SELECT assigned_centre_id FROM profiles WHERE id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Staff can manage procurement records" ON procurement_records;
CREATE POLICY "Staff can manage procurement records" ON procurement_records
    FOR INSERT WITH CHECK (
        get_current_user_role() = 'ADMIN'
        OR (get_current_user_role() = 'CENTRE_STAFF' AND centre_id IN (
            SELECT assigned_centre_id FROM profiles WHERE id = auth.uid()
        ))
    );

-- 6.8 Payments Policies
DROP POLICY IF EXISTS "Farmers can view own payments" ON payments;
CREATE POLICY "Farmers can view own payments" ON payments
    FOR SELECT USING (farmer_id = auth.uid() OR get_current_user_role() IN ('CENTRE_STAFF', 'ADMIN'));

DROP POLICY IF EXISTS "Admins can manage payments" ON payments;
CREATE POLICY "Admins can manage payments" ON payments
    FOR ALL USING (get_current_user_role() = 'ADMIN');

-- 6.9 Notifications Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- 6.10 Centre Capacity Logs Policies
DROP POLICY IF EXISTS "Staff and Admins can view capacity logs" ON centre_capacity_logs;
CREATE POLICY "Staff and Admins can view capacity logs" ON centre_capacity_logs
    FOR SELECT USING (get_current_user_role() IN ('CENTRE_STAFF', 'ADMIN'));

DROP POLICY IF EXISTS "Staff can insert capacity logs" ON centre_capacity_logs;
CREATE POLICY "Staff can insert capacity logs" ON centre_capacity_logs
    FOR INSERT WITH CHECK (
        get_current_user_role() = 'ADMIN'
        OR (get_current_user_role() = 'CENTRE_STAFF' AND centre_id IN (
            SELECT assigned_centre_id FROM profiles WHERE id = auth.uid()
        ))
    );

-- ----------------------------------------------------------------------------
-- 7. TABLE PERMISSIONS & ROLE GRANTS
-- ----------------------------------------------------------------------------
-- Grant schema & table access to standard Supabase API roles (anon, authenticated)
-- Row Level Security (RLS) policies defined above will govern row access filter rules.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
