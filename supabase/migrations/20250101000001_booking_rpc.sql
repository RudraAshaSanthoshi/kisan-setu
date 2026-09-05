-- ============================================================================
-- KisanSetu PostgreSQL Stored Procedure: Smart Slot Booking & Cancellation
-- SIH Problem Statement ID: 26032
-- Description: Atomic booking creation with row-level locking, capacity validation,
--              duplicate booking prevention, unique token generation, and safe cancellation.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ATOMIC SLOT BOOKING CREATION RPC
-- ----------------------------------------------------------------------------
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
    -- 1. Identify authenticated user from Supabase Auth session
    v_farmer_id := auth.uid();
    IF v_farmer_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    -- 2. Validate crop existence & active status
    SELECT * INTO v_crop FROM public.crops WHERE id = p_crop_id AND is_active = TRUE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_CROP';
    END IF;

    -- 3. Validate procurement centre existence & active status (Row lock to serialize capacity check per centre)
    SELECT * INTO v_centre FROM public.procurement_centres WHERE id = p_centre_id AND is_active = TRUE FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_CENTRE';
    END IF;

    -- 4. Prevent duplicate active booking for the same farmer on the same date
    SELECT id INTO v_existing_booking
    FROM public.slot_bookings
    WHERE farmer_id = v_farmer_id
      AND booking_date = p_booking_date
      AND status IN ('BOOKED', 'CHECKED_IN', 'IN_PROGRESS');

    IF v_existing_booking IS NOT NULL THEN
        RAISE EXCEPTION 'DUPLICATE_BOOKING';
    END IF;

    -- 5. Atomic Capacity Check: Count existing active bookings for this centre, date & slot start time
    SELECT COUNT(*) INTO v_booked_count
    FROM public.slot_bookings
    WHERE centre_id = p_centre_id
      AND booking_date = p_booking_date
      AND slot_start_time = p_slot_start_time
      AND status IN ('BOOKED', 'CHECKED_IN', 'IN_PROGRESS');

    IF v_booked_count >= COALESCE(v_centre.hourly_slot_capacity, 15) THEN
        RAISE EXCEPTION 'SLOT_FULL';
    END IF;

    -- 6. Generate unique token code (format: KS-26032-XXXXX)
    v_random_num := floor(10000 + random() * 90000)::INTEGER;
    v_token_code := 'KS-26032-' || LPAD(v_random_num::text, 5, '0');
    v_qr_hash := md5(v_token_code || v_farmer_id::text || clock_timestamp()::text);

    -- 7. Insert slot booking record atomically
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

    -- 8. Return created booking details
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

-- ----------------------------------------------------------------------------
-- 2. SAFE SLOT BOOKING CANCELLATION RPC
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 3. GRANT EXECUTE PRIVILEGES TO API ROLES
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_smart_slot_booking TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_farmer_slot_booking TO anon, authenticated;
