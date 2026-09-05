-- ============================================================================
-- KisanSetu Database Migration: Consolidated Flow RPCs & Table Permissions
-- Migration ID: 20250101000006
-- Description: Grants table permissions on lookup and operational tables, extends
--              queue_status enum, and deploys atomic slot booking, check-in, call-next,
--              and queue transition RPC functions for Farmer & Staff portals.
-- ============================================================================

-- 1. Extend queue_status enum safely with required operational statuses
DO $$ BEGIN
    ALTER TYPE queue_status ADD VALUE 'CALLED';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE queue_status ADD VALUE 'AT_COUNTER';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE queue_status ADD VALUE 'PROCESSING';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add counter_assigned column to queue_entries if not present
ALTER TABLE public.queue_entries ADD COLUMN IF NOT EXISTS counter_assigned VARCHAR(50) NULL;

-- 2. Schema Usage & Table Privileges for API Roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.crops TO anon, authenticated;
GRANT SELECT ON public.procurement_centres TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slot_bookings TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_entries TO authenticated, anon;
GRANT SELECT ON public.centre_capacity_logs TO authenticated;
GRANT SELECT ON public.procurement_records TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- 3. Atomic Slot Booking Creation RPC
CREATE OR REPLACE FUNCTION public.create_smart_slot_booking(
    p_crop_id UUID,
    p_centre_id UUID,
    p_booking_date DATE,
    p_slot_start_time TIME,
    p_slot_end_time TIME,
    p_estimated_quantity_quintals DECIMAL,
    p_vehicle_type VARCHAR DEFAULT 'Tractor',
    p_vehicle_number VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_farmer_id UUID;
    v_centre RECORD;
    v_crop RECORD;
    v_booked_count INTEGER;
    v_existing_booking UUID;
    v_token_code VARCHAR(20);
    v_qr_hash TEXT;
    v_new_booking_id UUID;
    v_random_num INTEGER;
BEGIN
    v_farmer_id := auth.uid();
    IF v_farmer_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT * INTO v_crop FROM public.crops WHERE id = p_crop_id AND is_active = TRUE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_CROP';
    END IF;

    SELECT * INTO v_centre FROM public.procurement_centres WHERE id = p_centre_id AND is_active = TRUE FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_CENTRE';
    END IF;

    SELECT id INTO v_existing_booking
    FROM public.slot_bookings
    WHERE farmer_id = v_farmer_id
      AND booking_date = p_booking_date
      AND status IN ('BOOKED', 'CHECKED_IN', 'IN_PROGRESS');

    IF v_existing_booking IS NOT NULL THEN
        RAISE EXCEPTION 'DUPLICATE_BOOKING';
    END IF;

    SELECT COUNT(*) INTO v_booked_count
    FROM public.slot_bookings
    WHERE centre_id = p_centre_id
      AND booking_date = p_booking_date
      AND slot_start_time = p_slot_start_time
      AND status IN ('BOOKED', 'CHECKED_IN', 'IN_PROGRESS');

    IF v_booked_count >= COALESCE(v_centre.hourly_slot_capacity, 15) THEN
        RAISE EXCEPTION 'SLOT_FULL';
    END IF;

    v_random_num := floor(10000 + random() * 90000)::INTEGER;
    v_token_code := 'KS-26032-' || LPAD(v_random_num::text, 5, '0');
    v_qr_hash := md5(v_token_code || v_farmer_id::text || clock_timestamp()::text);

    INSERT INTO public.slot_bookings (
        token_code,
        farmer_id,
        centre_id,
        booking_date,
        slot_start_time,
        slot_end_time,
        estimated_quantity_quintals,
        vehicle_type,
        vehicle_number,
        status,
        qr_code_hash
    ) VALUES (
        v_token_code,
        v_farmer_id,
        p_centre_id,
        p_booking_date,
        p_slot_start_time,
        p_slot_end_time,
        p_estimated_quantity_quintals,
        p_vehicle_type,
        p_vehicle_number,
        'BOOKED',
        v_qr_hash
    )
    RETURNING id INTO v_new_booking_id;

    RETURN jsonb_build_object(
        'id', v_new_booking_id,
        'token_code', v_token_code,
        'farmer_id', v_farmer_id,
        'centre_id', p_centre_id,
        'crop_id', p_crop_id,
        'booking_date', p_booking_date,
        'slot_start_time', p_slot_start_time,
        'slot_end_time', p_slot_end_time,
        'status', 'BOOKED'
    );
END;
$$;

-- 4. Safe Slot Booking Cancellation RPC
CREATE OR REPLACE FUNCTION public.cancel_farmer_slot_booking(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_farmer_id UUID;
BEGIN
    v_farmer_id := auth.uid();
    IF v_farmer_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    UPDATE public.slot_bookings
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_booking_id
      AND farmer_id = v_farmer_id
      AND status IN ('BOOKED', 'CHECKED_IN');

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND_OR_UNAUTHORIZED';
    END IF;

    RETURN TRUE;
END;
$$;

-- 5. Farmer Atomic Check-In RPC
CREATE OR REPLACE FUNCTION public.check_in_farmer_booking(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_farmer_id UUID;
    v_booking RECORD;
    v_existing_queue RECORD;
    v_next_queue_num INTEGER;
    v_new_queue_id UUID;
BEGIN
    v_farmer_id := auth.uid();
    IF v_farmer_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT b.*, c.name AS centre_name, COALESCE(cr.name_en, 'Wheat (Gehun)') AS crop_name
    INTO v_booking
    FROM public.slot_bookings b
    JOIN public.procurement_centres c ON c.id = b.centre_id
    LEFT JOIN public.produce_declarations d ON d.id = b.declaration_id
    LEFT JOIN public.crops cr ON cr.id = d.crop_id
    WHERE b.id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND';
    END IF;

    IF v_booking.farmer_id != v_farmer_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED_BOOKING';
    END IF;

    SELECT * INTO v_existing_queue
    FROM public.queue_entries
    WHERE booking_id = p_booking_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'id', v_existing_queue.id,
            'booking_id', v_existing_queue.booking_id,
            'centre_id', v_existing_queue.centre_id,
            'queue_number', v_existing_queue.queue_number,
            'status', v_existing_queue.status,
            'counter_assigned', v_existing_queue.counter_assigned,
            'check_in_time', v_existing_queue.check_in_time,
            'already_queued', TRUE
        );
    END IF;

    IF v_booking.status = 'CANCELLED' THEN
        RAISE EXCEPTION 'BOOKING_CANCELLED';
    END IF;

    SELECT COALESCE(MAX(queue_number), 0) + 1 INTO v_next_queue_num
    FROM public.queue_entries
    WHERE centre_id = v_booking.centre_id
      AND DATE(created_at) = CURRENT_DATE;

    INSERT INTO public.queue_entries (
        booking_id,
        centre_id,
        queue_number,
        status,
        check_in_time
    ) VALUES (
        p_booking_id,
        v_booking.centre_id,
        v_next_queue_num,
        'WAITING',
        NOW()
    )
    RETURNING id INTO v_new_queue_id;

    UPDATE public.slot_bookings
    SET status = 'CHECKED_IN',
        updated_at = NOW()
    WHERE id = p_booking_id;

    RETURN jsonb_build_object(
        'id', v_new_queue_id,
        'booking_id', p_booking_id,
        'centre_id', v_booking.centre_id,
        'token_code', v_booking.token_code,
        'queue_number', v_next_queue_num,
        'status', 'WAITING',
        'check_in_time', NOW(),
        'already_queued', FALSE
    );
END;
$$;

-- 6. Staff Atomic Call Next Farmer RPC
CREATE OR REPLACE FUNCTION public.staff_call_next_farmer(
    p_centre_id UUID,
    p_counter_name VARCHAR DEFAULT 'Gate #1'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
    v_staff_role user_role;
    v_staff_assigned_centre UUID;
    v_target_queue_id UUID;
    v_updated_queue RECORD;
BEGIN
    v_staff_id := auth.uid();
    IF v_staff_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT role, assigned_centre_id INTO v_staff_role, v_staff_assigned_centre
    FROM public.profiles
    WHERE id = v_staff_id;

    IF v_staff_role NOT IN ('CENTRE_STAFF', 'ADMIN') THEN
        RAISE EXCEPTION 'UNAUTHORIZED_STAFF_ROLE';
    END IF;

    IF v_staff_role = 'CENTRE_STAFF' AND v_staff_assigned_centre IS DISTINCT FROM p_centre_id THEN
        RAISE EXCEPTION 'WRONG_CENTRE_ASSIGNMENT';
    END IF;

    SELECT q.id INTO v_target_queue_id
    FROM public.queue_entries q
    WHERE q.centre_id = p_centre_id
      AND q.status = 'WAITING'
      AND DATE(q.created_at) = CURRENT_DATE
    ORDER BY q.queue_number ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF v_target_queue_id IS NULL THEN
        RAISE EXCEPTION 'NO_WAITING_FARMERS';
    END IF;

    UPDATE public.queue_entries
    SET status = 'CALLED',
        called_time = NOW(),
        counter_assigned = COALESCE(p_counter_name, 'Gate #1')
    WHERE id = v_target_queue_id
    RETURNING * INTO v_updated_queue;

    RETURN jsonb_build_object(
        'id', v_updated_queue.id,
        'booking_id', v_updated_queue.booking_id,
        'centre_id', v_updated_queue.centre_id,
        'queue_number', v_updated_queue.queue_number,
        'status', v_updated_queue.status,
        'counter_assigned', v_updated_queue.counter_assigned,
        'called_time', v_updated_queue.called_time
    );
END;
$$;

-- 7. Queue Entry State Transition RPC
CREATE OR REPLACE FUNCTION public.update_queue_entry_status(
    p_queue_entry_id UUID,
    p_new_status queue_status,
    p_counter_name VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
    v_staff_role user_role;
    v_staff_assigned_centre UUID;
    v_current_queue RECORD;
    v_updated_queue RECORD;
BEGIN
    v_staff_id := auth.uid();
    IF v_staff_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT * INTO v_current_queue
    FROM public.queue_entries
    WHERE id = p_queue_entry_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'QUEUE_ENTRY_NOT_FOUND';
    END IF;

    SELECT role, assigned_centre_id INTO v_staff_role, v_staff_assigned_centre
    FROM public.profiles
    WHERE id = v_staff_id;

    IF v_staff_role NOT IN ('CENTRE_STAFF', 'ADMIN') THEN
        RAISE EXCEPTION 'UNAUTHORIZED_STAFF_ROLE';
    END IF;

    IF v_staff_role = 'CENTRE_STAFF' AND v_staff_assigned_centre IS DISTINCT FROM v_current_queue.centre_id THEN
        RAISE EXCEPTION 'WRONG_CENTRE_ASSIGNMENT';
    END IF;

    IF p_new_status = 'CALLED' AND v_current_queue.status NOT IN ('WAITING') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION';
    ELSIF p_new_status = 'AT_COUNTER' AND v_current_queue.status NOT IN ('CALLED', 'WAITING') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION';
    ELSIF p_new_status = 'PROCESSING' AND v_current_queue.status NOT IN ('AT_COUNTER', 'CALLED', 'WAITING') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION';
    ELSIF p_new_status = 'COMPLETED' AND v_current_queue.status NOT IN ('PROCESSING', 'AT_COUNTER') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION';
    ELSIF p_new_status = 'SKIPPED' AND v_current_queue.status IN ('COMPLETED') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION';
    END IF;

    UPDATE public.queue_entries
    SET status = p_new_status,
        called_time = CASE WHEN p_new_status = 'CALLED' AND called_time IS NULL THEN NOW() ELSE called_time END,
        completed_time = CASE WHEN p_new_status = 'COMPLETED' THEN NOW() ELSE completed_time END,
        counter_assigned = COALESCE(p_counter_name, counter_assigned, 'Weighbridge Counter #1')
    WHERE id = p_queue_entry_id
    RETURNING * INTO v_updated_queue;

    RETURN jsonb_build_object(
        'id', v_updated_queue.id,
        'booking_id', v_updated_queue.booking_id,
        'centre_id', v_updated_queue.centre_id,
        'queue_number', v_updated_queue.queue_number,
        'status', v_updated_queue.status,
        'counter_assigned', v_updated_queue.counter_assigned,
        'called_time', v_updated_queue.called_time,
        'completed_time', v_updated_queue.completed_time
    );
END;
$$;

-- 8. Grant Execution Privileges on Stored Procedures
GRANT EXECUTE ON FUNCTION public.create_smart_slot_booking TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cancel_farmer_slot_booking TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_in_farmer_booking TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.staff_call_next_farmer TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_queue_entry_status TO authenticated, anon;
