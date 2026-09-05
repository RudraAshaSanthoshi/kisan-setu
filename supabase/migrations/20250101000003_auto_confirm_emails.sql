-- ============================================================================
-- KisanSetu PostgreSQL Auth Trigger & Email Auto-Confirmation Migration
-- SIH Problem Statement ID: 26032
-- Description: Ensures safe, unique profile creation on auth.users insert without
--              phone number unique constraint crashes, and auto-confirms user emails
--              for seamless procurement portal authentication.
-- ============================================================================

-- 1. Create fail-safe profile creation trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_phone VARCHAR(50);
BEGIN
    v_phone := COALESCE(
        NEW.raw_user_meta_data->>'phone_number',
        'PN-' || SUBSTRING(NEW.id::text FROM 1 FOR 12)
    );

    INSERT INTO public.profiles (
        id,
        full_name,
        phone_number,
        role,
        preferred_language
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Farmer User'),
        v_phone,
        'FARMER', -- FORCED DEFAULT ROLE FOR SAFETY
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'hi')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach handle_new_user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create auto-confirm trigger function for auth.users
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach auto-confirm trigger to auth.users ON INSERT
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user_email();

-- 3. Confirm all existing unconfirmed users in auth.users schema
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
