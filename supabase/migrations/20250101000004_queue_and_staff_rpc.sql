-- ============================================================================
-- KisanSetu PostgreSQL Stored Procedures: Queue Management & Staff Operations
-- SIH Problem Statement ID: 26032
-- Description: Atomic farmer check-in, queue entry creation, deterministic Call-Next
--              locking (FOR UPDATE SKIP LOCKED), state transition validation, and staff authorization.
-- ============================================================================

-- 1. Extend queue_status enum safely with required lifecycle statuses
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'CALLED';
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'AT_COUNTER';
ALTER TYPE queue_status ADD VALUE IF NOT EXISTS 'PROCESSING';

-- 2. Add counter_assigned column to queue_entries if not present
ALTER TABLE public.queue_entries ADD COLUMN IF NOT EXISTS counter_assigned VARCHAR(50) NULL;

-- ----------------------------------------------------------------------------
-- 3. FARMER ATOMIC CHECK-IN RPC
-- ----------------------------------------------------------------------------
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
    -- 1. Identify authenticated user
    v_farmer_id := auth.uid();
    IF v_farmer_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    -- 2. Fetch and validate booking
    SELECT b.*, c.name AS centre_name, cr.name_en AS crop_name
    INTO v_booking
    FROM public.slot_bookings b
    JOIN public.procurement_centres c ON c.id = b.centre_id
    LEFT JOIN public.crops cr ON cr.id = b.crop_id
    WHERE b.id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND';
    END IF;

    -- 3. Authorization check
    IF v_booking.farmer_id != v_farmer_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED_BOOKING';
    END IF;

    -- 4. Check if already checked in / queued
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

    -- 5. Calculate next sequential queue number for centre today
    SELECT COALESCE(MAX(queue_number), 0) + 1 INTO v_next_queue_num
    FROM public.queue_entries
    WHERE centre_id = v_booking.centre_id
      AND DATE(created_at) = CURRENT_DATE;

    -- 6. Insert new queue entry
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

    -- 7. Update booking status
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

-- ----------------------------------------------------------------------------
-- 4. STAFF ATOMIC CALL NEXT FARMER RPC (Row locking to prevent race conditions)
-- ----------------------------------------------------------------------------
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

    -- Staff authorization check
    SELECT role, assigned_centre_id INTO v_staff_role, v_staff_assigned_centre
    FROM public.profiles
    WHERE id = v_staff_id;

    IF v_staff_role NOT IN ('CENTRE_STAFF', 'ADMIN') THEN
        RAISE EXCEPTION 'UNAUTHORIZED_STAFF_ROLE';
    END IF;

    IF v_staff_role = 'CENTRE_STAFF' AND v_staff_assigned_centre IS DISTINCT FROM p_centre_id THEN
        RAISE EXCEPTION 'WRONG_CENTRE_ASSIGNMENT';
    END IF;

    -- Lock and select earliest WAITING farmer for this centre today
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

    -- Transition status to CALLED
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

-- ----------------------------------------------------------------------------
-- 5. QUEUE ENTRY STATE TRANSITION RPC (With lifecycle validation)
-- ----------------------------------------------------------------------------
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

    -- Fetch current queue entry
    SELECT * INTO v_current_queue
    FROM public.queue_entries
    WHERE id = p_queue_entry_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'QUEUE_ENTRY_NOT_FOUND';
    END IF;

    -- Staff authorization check
    SELECT role, assigned_centre_id INTO v_staff_role, v_staff_assigned_centre
    FROM public.profiles
    WHERE id = v_staff_id;

    IF v_staff_role NOT IN ('CENTRE_STAFF', 'ADMIN') THEN
        RAISE EXCEPTION 'UNAUTHORIZED_STAFF_ROLE';
    END IF;

    IF v_staff_role = 'CENTRE_STAFF' AND v_staff_assigned_centre IS DISTINCT FROM v_current_queue.centre_id THEN
        RAISE EXCEPTION 'WRONG_CENTRE_ASSIGNMENT';
    END IF;

    -- Validate transition rules
    -- Allowed: WAITING -> CALLED, CALLED -> AT_COUNTER, AT_COUNTER -> PROCESSING, PROCESSING -> COMPLETED, WAITING/CALLED -> SKIPPED
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

    -- Execute transition update
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

-- ----------------------------------------------------------------------------
-- 6. GRANT EXECUTE & TABLE PRIVILEGES TO API ROLES
-- ----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.queue_entries TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.slot_bookings TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_in_farmer_booking(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.staff_call_next_farmer(UUID, VARCHAR) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_queue_entry_status(UUID, queue_status, VARCHAR) TO authenticated, anon;
