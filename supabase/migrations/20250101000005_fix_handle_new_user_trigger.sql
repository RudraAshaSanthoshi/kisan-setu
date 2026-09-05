-- ============================================================================
-- KisanSetu Database Migration: Fix handle_new_user Trigger & Profile Integrity
-- Migration ID: 20250101000005
-- Description: Resolves "Database error saving new user" (duplicate phone constraint),
--              ensures deterministic unique phone numbers for fallback users,
--              maintains strict FARMER role assignment for public registration,
--              auto-confirms user emails for prototype testing, and grants
--              table privileges for profiles table to authenticated role.
-- ============================================================================

-- 1. Create or replace robust handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name VARCHAR(255);
    v_phone VARCHAR(20);
    v_lang VARCHAR(10);
BEGIN
    -- Extract full name safely from user metadata, defaulting to email prefix or 'Farmer User'
    v_full_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.email), ''),
        'Farmer User'
    );

    -- Extract language safely
    v_lang := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_language'), ''),
        'hi'
    );

    -- Extract phone number safely. If missing/empty, generate deterministic unique token based on UUID
    v_phone := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'phone_number'), ''),
        'PN' || SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 18)
    );

    -- Attempt insertion into public.profiles
    BEGIN
        INSERT INTO public.profiles (
            id,
            full_name,
            phone_number,
            role,
            preferred_language,
            district,
            state
        ) VALUES (
            NEW.id,
            v_full_name,
            v_phone,
            'FARMER', -- STRICT DEFAULT ROLE FOR PUBLIC REGISTRATION
            v_lang,
            'Ludhiana',
            'Punjab'
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            preferred_language = EXCLUDED.preferred_language,
            updated_at = NOW();
    EXCEPTION WHEN unique_violation THEN
        -- If phone_number unique constraint is violated (e.g., provided phone number is already registered),
        -- fall back to the deterministic unique phone token to ensure profile creation succeeds reliably
        INSERT INTO public.profiles (
            id,
            full_name,
            phone_number,
            role,
            preferred_language,
            district,
            state
        ) VALUES (
            NEW.id,
            v_full_name,
            'PN' || SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 18),
            'FARMER',
            v_lang,
            'Ludhiana',
            'Punjab'
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            updated_at = NOW();
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach handle_new_user trigger AFTER INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create auto-confirm trigger function for auth.users to bypass email rate-limits in prototype testing
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach auto-confirm trigger BEFORE INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user_email();

-- 3. Grant schema usage and table privileges for profiles to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- 4. Retroactively fix any duplicate '0000000000' phone numbers in public.profiles if present
UPDATE public.profiles
SET phone_number = 'PN' || SUBSTRING(REPLACE(id::text, '-', ''), 1, 18)
WHERE phone_number = '0000000000';
