-- ============================================================================
-- KisanSetu PostgreSQL Privileges & Table Grants Fix
-- SIH Problem Statement ID: 26032
-- Description: Ensures anon & authenticated API roles have proper table SELECT/INSERT/UPDATE
--              privileges alongside RLS policies.
-- ============================================================================

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant Table Privileges for Lookup Data
GRANT SELECT ON public.crops TO anon, authenticated;
GRANT SELECT ON public.procurement_centres TO anon, authenticated;

-- 3. Grant Table Privileges for Transactional Data (Governed by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slot_bookings TO authenticated;
GRANT SELECT ON public.centre_capacity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.queue_entries TO authenticated;
GRANT SELECT ON public.procurement_records TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- 4. Grant Stored Procedure Execution
GRANT EXECUTE ON FUNCTION public.create_smart_slot_booking(UUID, UUID, DATE, TIME, TIME, DECIMAL, VARCHAR, VARCHAR) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cancel_farmer_slot_booking(UUID) TO authenticated, anon;
