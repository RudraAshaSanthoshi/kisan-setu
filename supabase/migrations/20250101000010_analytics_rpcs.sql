-- ============================================================================
-- KisanSetu Database Migration: Dashboard Analytics RPCs
-- Migration ID: 20250101000010
-- Description: Deploys get_centre_staff_analytics and get_admin_system_analytics
--              stored procedures for real-time operational metrics & performance audit.
-- ============================================================================

-- 1. Centre Staff Analytics RPC (Role Protected: CENTRE_STAFF & ADMIN)
CREATE OR REPLACE FUNCTION public.get_centre_staff_analytics(
    p_centre_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
    v_staff_role user_role;
    v_staff_assigned_centre UUID;
    v_target_centre_id UUID;
    v_centre_info RECORD;

    v_today_bookings INTEGER := 0;
    v_today_checked_in INTEGER := 0;
    v_today_completed INTEGER := 0;
    v_today_waiting INTEGER := 0;
    v_today_processing INTEGER := 0;
    v_today_quantity DECIMAL(12, 2) := 0.00;
    v_today_payout DECIMAL(14, 2) := 0.00;

    v_pay_pending_count INTEGER := 0;
    v_pay_pending_amount DECIMAL(14, 2) := 0.00;
    v_pay_processing_count INTEGER := 0;
    v_pay_processing_amount DECIMAL(14, 2) := 0.00;
    v_pay_processed_count INTEGER := 0;
    v_pay_processed_amount DECIMAL(14, 2) := 0.00;
BEGIN
    -- 1. Authentication Check
    v_staff_id := auth.uid();
    IF v_staff_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    -- 2. Authorization & Role Check
    SELECT role, assigned_centre_id INTO v_staff_role, v_staff_assigned_centre
    FROM public.profiles
    WHERE id = v_staff_id;

    IF v_staff_role NOT IN ('CENTRE_STAFF', 'ADMIN') THEN
        RAISE EXCEPTION 'UNAUTHORIZED_FARMER_ROLE';
    END IF;

    -- Resolve target centre ID
    IF p_centre_id IS NOT NULL THEN
        v_target_centre_id := p_centre_id;
    ELSE
        v_target_centre_id := v_staff_assigned_centre;
    END IF;

    IF v_target_centre_id IS NULL THEN
        SELECT id INTO v_target_centre_id FROM public.procurement_centres WHERE is_active = TRUE LIMIT 1;
    END IF;

    -- Security Enforcement: Staff can only query their assigned centre
    IF v_staff_role = 'CENTRE_STAFF' AND v_staff_assigned_centre IS DISTINCT FROM v_target_centre_id THEN
        RAISE EXCEPTION 'WRONG_CENTRE_ASSIGNMENT';
    END IF;

    -- Fetch Centre Meta
    SELECT * INTO v_centre_info FROM public.procurement_centres WHERE id = v_target_centre_id;

    -- Today's Total Bookings
    SELECT COUNT(*) INTO v_today_bookings
    FROM public.slot_bookings
    WHERE centre_id = v_target_centre_id
      AND booking_date = CURRENT_DATE;

    -- Today's Checked-In Farmers
    SELECT COUNT(*) INTO v_today_checked_in
    FROM public.slot_bookings
    WHERE centre_id = v_target_centre_id
      AND booking_date = CURRENT_DATE
      AND status IN ('CHECKED_IN', 'IN_PROGRESS', 'COMPLETED');

    -- Queue State Counts
    SELECT
        COUNT(*) FILTER (WHERE status = 'WAITING'),
        COUNT(*) FILTER (WHERE status IN ('CALLED', 'AT_COUNTER', 'PROCESSING'))
    INTO v_today_waiting, v_today_processing
    FROM public.queue_entries
    WHERE centre_id = v_target_centre_id
      AND DATE(created_at) = CURRENT_DATE;

    -- Today's Completed Procurements, Total Quantity & Total Payout Amount
    SELECT
        COUNT(*),
        COALESCE(SUM(net_weight_quintals), 0.00),
        COALESCE(SUM(total_payout_amount), 0.00)
    INTO v_today_completed, v_today_quantity, v_today_payout
    FROM public.procurement_records
    WHERE centre_id = v_target_centre_id
      AND DATE(recorded_at) = CURRENT_DATE;

    -- Payment Status Breakdown for Centre
    SELECT
        COUNT(*) FILTER (WHERE p.payment_status = 'PENDING'),
        COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'PENDING'), 0.00),
        COUNT(*) FILTER (WHERE p.payment_status = 'PROCESSING'),
        COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'PROCESSING'), 0.00),
        COUNT(*) FILTER (WHERE p.payment_status IN ('PROCESSED', 'DISBURSED')),
        COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status IN ('PROCESSED', 'DISBURSED')), 0.00)
    INTO
        v_pay_pending_count, v_pay_pending_amount,
        v_pay_processing_count, v_pay_processing_amount,
        v_pay_processed_count, v_pay_processed_amount
    FROM public.payments p
    JOIN public.procurement_records pr ON pr.id = p.procurement_record_id
    WHERE pr.centre_id = v_target_centre_id;

    RETURN jsonb_build_object(
        'centre_id', v_target_centre_id,
        'centre_name', COALESCE(v_centre_info.name, 'Procurement Centre'),
        'district', COALESCE(v_centre_info.district, 'Ludhiana'),
        'today_total_bookings', v_today_bookings,
        'today_checked_in', v_today_checked_in,
        'today_completed_procurements', v_today_completed,
        'today_waiting_count', v_today_waiting,
        'today_processing_count', v_today_processing,
        'today_quantity_quintals', v_today_quantity,
        'today_payout_amount', v_today_payout,
        'payment_breakdown', jsonb_build_object(
            'pending_count', v_pay_pending_count,
            'pending_amount', v_pay_pending_amount,
            'processing_count', v_pay_processing_count,
            'processing_amount', v_pay_processing_amount,
            'processed_count', v_pay_processed_count,
            'processed_amount', v_pay_processed_amount
        ),
        'throughput_info', jsonb_build_object(
            'completed_farmers', v_today_completed,
            'waiting_farmers', v_today_waiting,
            'estimated_wait_time_mins', CASE WHEN v_today_waiting > 10 THEN 25 ELSE 10 END
        )
    );
END;
$$;

-- 2. Admin System-Wide Analytics RPC (Role Protected: ADMIN Only)
CREATE OR REPLACE FUNCTION public.get_admin_system_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_admin_role user_role;

    v_total_centres INTEGER := 0;
    v_total_farmers INTEGER := 0;
    v_total_bookings INTEGER := 0;
    v_total_completed INTEGER := 0;
    v_total_quantity DECIMAL(14, 2) := 0.00;
    v_total_payout DECIMAL(16, 2) := 0.00;

    v_pay_pending_count INTEGER := 0;
    v_pay_pending_amount DECIMAL(16, 2) := 0.00;
    v_pay_processing_count INTEGER := 0;
    v_pay_processing_amount DECIMAL(16, 2) := 0.00;
    v_pay_processed_count INTEGER := 0;
    v_pay_processed_amount DECIMAL(16, 2) := 0.00;

    v_centre_performance JSONB;
BEGIN
    -- 1. Authentication Check
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHENTICATED';
    END IF;

    -- 2. Authorization Check (Admin Only)
    SELECT role INTO v_admin_role
    FROM public.profiles
    WHERE id = v_admin_id;

    IF v_admin_role IS DISTINCT FROM 'ADMIN' THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ADMIN_ROLE';
    END IF;

    -- Total Active Centres & Total Farmers
    SELECT COUNT(*) INTO v_total_centres FROM public.procurement_centres WHERE is_active = TRUE;
    SELECT COUNT(*) INTO v_total_farmers FROM public.profiles WHERE role = 'FARMER';

    -- Total System Bookings
    SELECT COUNT(*) INTO v_total_bookings FROM public.slot_bookings;

    -- System-Wide Procurements, Quantity & Payout
    SELECT
        COUNT(*),
        COALESCE(SUM(net_weight_quintals), 0.00),
        COALESCE(SUM(total_payout_amount), 0.00)
    INTO v_total_completed, v_total_quantity, v_total_payout
    FROM public.procurement_records;

    -- System-Wide Payment Status Breakdown
    SELECT
        COUNT(*) FILTER (WHERE payment_status = 'PENDING'),
        COALESCE(SUM(amount) FILTER (WHERE payment_status = 'PENDING'), 0.00),
        COUNT(*) FILTER (WHERE payment_status = 'PROCESSING'),
        COALESCE(SUM(amount) FILTER (WHERE payment_status = 'PROCESSING'), 0.00),
        COUNT(*) FILTER (WHERE payment_status IN ('PROCESSED', 'DISBURSED')),
        COALESCE(SUM(amount) FILTER (WHERE payment_status IN ('PROCESSED', 'DISBURSED')), 0.00)
    INTO
        v_pay_pending_count, v_pay_pending_amount,
        v_pay_processing_count, v_pay_processing_amount,
        v_pay_processed_count, v_pay_processed_amount
    FROM public.payments;

    -- Centre-Wise Performance Summary Table
    SELECT jsonb_agg(
        jsonb_build_object(
            'centre_id', c.id,
            'centre_name', c.name,
            'district', c.district,
            'state', c.state,
            'today_bookings', (
                SELECT COUNT(*) FROM public.slot_bookings sb
                WHERE sb.centre_id = c.id AND sb.booking_date = CURRENT_DATE
            ),
            'checked_in_count', (
                SELECT COUNT(*) FROM public.slot_bookings sb
                WHERE sb.centre_id = c.id AND sb.booking_date = CURRENT_DATE AND sb.status IN ('CHECKED_IN', 'IN_PROGRESS', 'COMPLETED')
            ),
            'completed_procurements', (
                SELECT COUNT(*) FROM public.procurement_records pr
                WHERE pr.centre_id = c.id AND DATE(pr.recorded_at) = CURRENT_DATE
            ),
            'total_quantity_quintals', (
                SELECT COALESCE(SUM(net_weight_quintals), 0.00) FROM public.procurement_records pr
                WHERE pr.centre_id = c.id
            ),
            'total_payout_amount', (
                SELECT COALESCE(SUM(total_payout_amount), 0.00) FROM public.procurement_records pr
                WHERE pr.centre_id = c.id
            )
        )
    ) INTO v_centre_performance
    FROM public.procurement_centres c
    WHERE c.is_active = TRUE;

    RETURN jsonb_build_object(
        'total_active_centres', v_total_centres,
        'total_registered_farmers', v_total_farmers,
        'total_slot_bookings', v_total_bookings,
        'total_completed_procurements', v_total_completed,
        'total_quantity_quintals', v_total_quantity,
        'total_payout_amount', v_total_payout,
        'payment_breakdown', jsonb_build_object(
            'pending_count', v_pay_pending_count,
            'pending_amount', v_pay_pending_amount,
            'processing_count', v_pay_processing_count,
            'processing_amount', v_pay_processing_amount,
            'processed_count', v_pay_processed_count,
            'processed_amount', v_pay_processed_amount
        ),
        'centre_performance', COALESCE(v_centre_performance, '[]'::jsonb)
    );
END;
$$;

-- 3. Grant Execution Privileges
GRANT EXECUTE ON FUNCTION public.get_centre_staff_analytics TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_system_analytics TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
