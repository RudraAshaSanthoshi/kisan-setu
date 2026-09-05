-- ============================================================================
-- KisanSetu Database Migration: Assisted Booking RPC & Staff Farmer Lookup
-- Migration ID: 20250101000009
-- Description: Deploys search_registered_farmers and create_assisted_slot_booking
--              stored procedures enabling Centre Staff to perform assisted slot
--              booking for farmers with role-based security & in-app notifications.
-- ============================================================================

-- 1. Helper RPC: Search Registered Farmers (Staff / Admin Only)
CREATE OR REPLACE FUNCTION public.search_registered_farmers(
    p_query TEXT DEFAULT ''
)
RETURNS TABLE (
    farmer_id UUID,
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    district VARCHAR(100),
    preferred_language VARCHAR(10)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
    v_staff_role user_role;
BEGIN
    v_staff_id := auth.uid();
    IF v_staff_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    SELECT role INTO v_staff_role
    FROM public.profiles
    WHERE public.profiles.id = v_staff_id;

    IF v_staff_role NOT IN ('CENTRE_STAFF', 'ADMIN') THEN
        RAISE EXCEPTION 'UNAUTHORIZED_STAFF_ROLE';
    END IF;

    RETURN QUERY
    SELECT p.id AS farmer_id, p.full_name, p.phone_number, p.district, p.preferred_language
    FROM public.profiles p
    WHERE p.role = 'FARMER'
      AND (
        p_query = ''
        OR p.phone_number ILIKE '%' || p_query || '%'
        OR p.full_name ILIKE '%' || p_query || '%'
      )
    ORDER BY p.full_name ASC
    LIMIT 20;
END;
$$;

-- 2. Atomic Staff-Assisted Slot Booking Creation RPC
CREATE OR REPLACE FUNCTION public.create_assisted_slot_booking(
    p_farmer_id UUID,
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
    v_staff_id UUID;
    v_staff_role user_role;
    v_staff_assigned_centre UUID;
    v_farmer_profile RECORD;
    v_centre RECORD;
    v_crop RECORD;
    v_booked_count INTEGER;
    v_existing_booking UUID;
    v_token_code VARCHAR(20);
    v_qr_hash TEXT;
    v_new_booking_id UUID;
    v_random_num INTEGER;
BEGIN
    -- 1. Security Check: Auth UID must be valid
    v_staff_id := auth.uid();
    IF v_staff_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    -- 2. Security Check: Staff role must be CENTRE_STAFF or ADMIN
    SELECT role, assigned_centre_id INTO v_staff_role, v_staff_assigned_centre
    FROM public.profiles
    WHERE public.profiles.id = v_staff_id;

    IF v_staff_role NOT IN ('CENTRE_STAFF', 'ADMIN') THEN
        RAISE EXCEPTION 'UNAUTHORIZED_STAFF_ROLE';
    END IF;

    -- 3. Security Check: Centre Staff can only book for their assigned centre
    IF v_staff_role = 'CENTRE_STAFF' AND v_staff_assigned_centre IS DISTINCT FROM p_centre_id THEN
        RAISE EXCEPTION 'WRONG_CENTRE_ASSIGNMENT';
    END IF;

    -- 4. Verify target farmer exists and is a FARMER
    SELECT * INTO v_farmer_profile
    FROM public.profiles
    WHERE public.profiles.id = p_farmer_id AND role = 'FARMER';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_FARMER_USER';
    END IF;

    -- 5. Verify crop
    SELECT * INTO v_crop FROM public.crops WHERE id = p_crop_id AND is_active = TRUE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_CROP';
    END IF;

    -- 6. Verify centre
    SELECT * INTO v_centre FROM public.procurement_centres WHERE id = p_centre_id AND is_active = TRUE FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_CENTRE';
    END IF;

    -- 7. Check for duplicate active booking on same date for farmer
    SELECT id INTO v_existing_booking
    FROM public.slot_bookings
    WHERE farmer_id = p_farmer_id
      AND booking_date = p_booking_date
      AND status IN ('BOOKED', 'CHECKED_IN', 'IN_PROGRESS');

    IF v_existing_booking IS NOT NULL THEN
        RAISE EXCEPTION 'DUPLICATE_BOOKING';
    END IF;

    -- 8. Check hourly slot capacity
    SELECT COUNT(*) INTO v_booked_count
    FROM public.slot_bookings
    WHERE centre_id = p_centre_id
      AND booking_date = p_booking_date
      AND slot_start_time = p_slot_start_time
      AND status IN ('BOOKED', 'CHECKED_IN', 'IN_PROGRESS');

    IF v_booked_count >= COALESCE(v_centre.hourly_slot_capacity, 15) THEN
        RAISE EXCEPTION 'SLOT_FULL';
    END IF;

    -- 9. Generate token code and QR hash
    v_random_num := floor(10000 + random() * 90000)::INTEGER;
    v_token_code := 'KS-26032-' || LPAD(v_random_num::text, 5, '0');
    v_qr_hash := md5(v_token_code || p_farmer_id::text || clock_timestamp()::text);

    -- 10. Insert real slot_bookings row
    INSERT INTO public.slot_bookings (
        token_code,
        farmer_id,
        centre_id,
        crop_id,
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
        p_farmer_id,
        p_centre_id,
        p_crop_id,
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

    -- 11. Send in-app notification to farmer
    INSERT INTO public.notifications (
        user_id,
        title_key,
        body_key,
        params,
        channel,
        is_read,
        created_at
    ) VALUES (
        p_farmer_id,
        'Slot Booking Confirmed (Staff Assisted)',
        'Your procurement slot for ' || COALESCE(v_crop.name_en, 'Crop') || ' on ' || p_booking_date::text || ' at ' || v_centre.name || ' was booked by centre staff. Token: ' || v_token_code,
        jsonb_build_object(
            'booking_id', v_new_booking_id,
            'token_code', v_token_code,
            'centre_name', v_centre.name,
            'crop_name', v_crop.name_en,
            'booking_date', p_booking_date,
            'assisted_by_staff', TRUE
        ),
        'IN_APP',
        FALSE,
        NOW()
    );

    RETURN jsonb_build_object(
        'id', v_new_booking_id,
        'token_code', v_token_code,
        'farmer_id', p_farmer_id,
        'farmer_name', v_farmer_profile.full_name,
        'farmer_phone', v_farmer_profile.phone_number,
        'centre_id', p_centre_id,
        'centre_name', v_centre.name,
        'crop_id', p_crop_id,
        'crop_name', v_crop.name_en,
        'booking_date', p_booking_date,
        'slot_start_time', p_slot_start_time,
        'slot_end_time', p_slot_end_time,
        'estimated_quantity_quintals', p_estimated_quantity_quintals,
        'status', 'BOOKED'
    );
END;
$$;

-- 3. Grant Execution Privileges & Reload PostgREST Schema Cache
GRANT EXECUTE ON FUNCTION public.search_registered_farmers TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_assisted_slot_booking TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
