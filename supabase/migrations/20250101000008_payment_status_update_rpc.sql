-- ============================================================================
-- KisanSetu Database Migration: Payment Status Update & Notification RPC
-- Migration ID: 20250101000008
-- Description: Extends payment_status enum with PROCESSED, expands notification text columns,
--              creates update_payment_status RPC for authorized staff/admins to update
--              payment status with automatic centre-assignment enforcement and farmer notification.
-- ============================================================================

-- 1. Extend payment_status enum safely with PROCESSED if not present
DO $$ BEGIN
    ALTER TYPE payment_status ADD VALUE 'PROCESSED';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Expand notification text capacity to prevent length truncation
ALTER TABLE public.notifications ALTER COLUMN body_key TYPE TEXT;
ALTER TABLE public.notifications ALTER COLUMN title_key TYPE TEXT;

-- 3. Schema Usage & Table Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, UPDATE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- 4. Atomic Payment Status Update Stored Procedure
CREATE OR REPLACE FUNCTION public.update_payment_status(
    p_payment_id UUID,
    p_new_status payment_status,
    p_transaction_ref VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
    v_staff_role user_role;
    v_staff_assigned_centre UUID;
    v_payment RECORD;
    v_txn_ref VARCHAR(100);
BEGIN
    -- 1. Authentication check
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

    -- 2. Fetch payment row & linked centre ID
    SELECT p.*, pr.centre_id, sb.token_code
    INTO v_payment
    FROM public.payments p
    JOIN public.procurement_records pr ON pr.id = p.procurement_record_id
    LEFT JOIN public.queue_entries qe ON qe.id = pr.queue_entry_id
    LEFT JOIN public.slot_bookings sb ON sb.id = qe.booking_id
    WHERE p.id = p_payment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PAYMENT_NOT_FOUND';
    END IF;

    -- 3. Centre assignment check for CENTRE_STAFF
    IF v_staff_role = 'CENTRE_STAFF' AND v_staff_assigned_centre IS DISTINCT FROM v_payment.centre_id THEN
        RAISE EXCEPTION 'WRONG_CENTRE_ASSIGNMENT';
    END IF;

    v_txn_ref := COALESCE(p_transaction_ref, v_payment.transaction_ref, 'TXN-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)));

    -- 4. Update payment status
    UPDATE public.payments
    SET payment_status = p_new_status,
        transaction_ref = v_txn_ref,
        disbursed_at = CASE WHEN p_new_status IN ('PROCESSED', 'DISBURSED') THEN NOW() ELSE disbursed_at END
    WHERE id = p_payment_id;

    -- 5. Dispatch farmer notification
    INSERT INTO public.notifications (
        user_id,
        title_key,
        body_key,
        params,
        channel,
        is_read,
        created_at
    ) VALUES (
        v_payment.farmer_id,
        'Payment Status Updated: ' || p_new_status::text,
        'Payout of ₹' || v_payment.amount::text || ' for token ' || COALESCE(v_payment.token_code, 'KS-SLIP') || ' is now ' || p_new_status::text || '.',
        jsonb_build_object(
            'payment_id', p_payment_id,
            'status', p_new_status,
            'amount', v_payment.amount,
            'transaction_ref', v_txn_ref
        ),
        'IN_APP',
        FALSE,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'payment_id', p_payment_id,
        'status', p_new_status,
        'amount', v_payment.amount,
        'transaction_ref', v_txn_ref
    );
END;
$$;

-- 5. Update save_procurement_record to use concise body_key as safety check
CREATE OR REPLACE FUNCTION public.save_procurement_record(
    p_queue_entry_id UUID,
    p_gross_weight_kg DECIMAL,
    p_tare_weight_kg DECIMAL,
    p_moisture_percentage DECIMAL,
    p_grade quality_grade DEFAULT 'GRADE_A',
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
    v_staff_role user_role;
    v_staff_assigned_centre UUID;
    v_queue RECORD;
    v_booking RECORD;
    v_farmer_id UUID;
    v_centre_id UUID;
    v_crop_id UUID;
    v_rate_per_quintal DECIMAL(10, 2);
    v_net_weight_quintals DECIMAL(10, 2);
    v_total_payout_amount DECIMAL(12, 2);
    v_procurement_id UUID;
    v_payment_id UUID;
    v_txn_ref VARCHAR(100);
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

    SELECT * INTO v_queue
    FROM public.queue_entries
    WHERE id = p_queue_entry_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'QUEUE_ENTRY_NOT_FOUND';
    END IF;

    IF v_staff_role = 'CENTRE_STAFF' AND v_staff_assigned_centre IS DISTINCT FROM v_queue.centre_id THEN
        RAISE EXCEPTION 'WRONG_CENTRE_ASSIGNMENT';
    END IF;

    SELECT b.* INTO v_booking
    FROM public.slot_bookings b
    WHERE b.id = v_queue.booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND';
    END IF;

    v_farmer_id := v_booking.farmer_id;
    v_centre_id := v_queue.centre_id;

    v_crop_id := v_booking.crop_id;
    IF v_crop_id IS NULL THEN
        SELECT crop_id INTO v_crop_id
        FROM public.produce_declarations
        WHERE id = v_booking.declaration_id;
    END IF;

    IF v_crop_id IS NULL THEN
        SELECT id INTO v_crop_id
        FROM public.crops
        WHERE is_active = TRUE
        LIMIT 1;
    END IF;

    SELECT msp_per_quintal INTO v_rate_per_quintal
    FROM public.crops
    WHERE id = v_crop_id;

    IF v_rate_per_quintal IS NULL OR v_rate_per_quintal <= 0 THEN
        v_rate_per_quintal := 2275.00;
    END IF;

    IF p_gross_weight_kg <= p_tare_weight_kg THEN
        RAISE EXCEPTION 'INVALID_WEIGHTS_GROSS_MUST_EXCEED_TARE';
    END IF;

    v_net_weight_quintals := ROUND((p_gross_weight_kg - p_tare_weight_kg) / 100.0, 2);
    v_total_payout_amount := ROUND(v_net_weight_quintals * v_rate_per_quintal, 2);

    SELECT id INTO v_procurement_id
    FROM public.procurement_records
    WHERE queue_entry_id = p_queue_entry_id;

    IF v_procurement_id IS NOT NULL THEN
        UPDATE public.procurement_records
        SET gross_weight_kg = p_gross_weight_kg,
            tare_weight_kg = p_tare_weight_kg,
            net_weight_quintals = v_net_weight_quintals,
            moisture_percentage = p_moisture_percentage,
            grade = p_grade,
            rate_per_quintal = v_rate_per_quintal,
            total_payout_amount = v_total_payout_amount,
            staff_id = v_staff_id,
            remarks = p_remarks,
            recorded_at = NOW()
        WHERE id = v_procurement_id;
    ELSE
        INSERT INTO public.procurement_records (
            queue_entry_id,
            farmer_id,
            centre_id,
            crop_id,
            gross_weight_kg,
            tare_weight_kg,
            net_weight_quintals,
            moisture_percentage,
            grade,
            rate_per_quintal,
            total_payout_amount,
            staff_id,
            remarks,
            recorded_at
        ) VALUES (
            p_queue_entry_id,
            v_farmer_id,
            v_centre_id,
            v_crop_id,
            p_gross_weight_kg,
            p_tare_weight_kg,
            v_net_weight_quintals,
            p_moisture_percentage,
            p_grade,
            v_rate_per_quintal,
            v_total_payout_amount,
            v_staff_id,
            p_remarks,
            NOW()
        ) RETURNING id INTO v_procurement_id;
    END IF;

    v_txn_ref := 'TXN-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));

    INSERT INTO public.payments (
        procurement_record_id,
        farmer_id,
        amount,
        transaction_ref,
        payment_status,
        created_at
    ) VALUES (
        v_procurement_id,
        v_farmer_id,
        v_total_payout_amount,
        v_txn_ref,
        'PENDING',
        NOW()
    )
    ON CONFLICT (procurement_record_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        payment_status = 'PENDING'
    RETURNING id INTO v_payment_id;

    UPDATE public.queue_entries
    SET status = 'COMPLETED',
        completed_time = NOW()
    WHERE id = p_queue_entry_id;

    UPDATE public.slot_bookings
    SET status = 'COMPLETED',
        updated_at = NOW()
    WHERE id = v_queue.booking_id;

    INSERT INTO public.notifications (
        user_id,
        title_key,
        body_key,
        params,
        channel,
        is_read,
        created_at
    ) VALUES (
        v_farmer_id,
        'Procurement Completed',
        'Procurement slip ' || COALESCE(v_booking.token_code, 'KS-SLIP') || ' (' || v_net_weight_quintals::text || ' Qtl) recorded. Payout: ₹' || v_total_payout_amount::text,
        jsonb_build_object(
            'slip_code', COALESCE(v_booking.token_code, 'KS-SLIP'),
            'net_weight', v_net_weight_quintals,
            'payout', v_total_payout_amount,
            'procurement_id', v_procurement_id,
            'payment_id', v_payment_id
        ),
        'IN_APP',
        FALSE,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'procurement_id', v_procurement_id,
        'payment_id', v_payment_id,
        'transaction_ref', v_txn_ref,
        'net_weight_quintals', v_net_weight_quintals,
        'total_payout_amount', v_total_payout_amount,
        'rate_per_quintal', v_rate_per_quintal
    );
END;
$$;

-- 6. Grant Execution Privileges
GRANT EXECUTE ON FUNCTION public.update_payment_status TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.save_procurement_record TO authenticated, anon;
