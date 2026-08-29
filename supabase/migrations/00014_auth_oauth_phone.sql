-- 00014_auth_oauth_phone.sql
-- Add Google + Apple OAuth support plumbing and a required phone column on users.
--
-- Notes:
--  - users.phone is nullable at the DB layer so the auto-provision trigger and
--    pre-existing rows (email/password) are not broken, but it is enforced as
--    REQUIRED by the application (signup + post-OAuth completion screen).
--  - handle_new_user is updated to: map OAuth name metadata, carry phone from
--    user_metadata, and gracefully link an existing email row to the new
--    auth_id (email de-dup for OAuth) instead of failing on the UNIQUE email.

-- 1. Add phone column (nullable; app-enforced required)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- 2. Refresh the auto-provision trigger: OAuth-aware name mapping, phone carry,
--    and email-based linking to avoid UNIQUE(email) collisions.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_email TEXT;
BEGIN
  -- Email may be null for Apple private-relay / phone-only providers; fall back
  -- to a stable placeholder based on the auth user id so UNIQUE(email) holds.
  v_email := NULLIF(TRIM(NEW.email), '');
  IF v_email IS NULL THEN
    v_email := 'user-' || NEW.id || '@users.hificustoms.com';
  END IF;

  -- Name: handle google/apple provider metadata shapes.
  v_name := NULLIF(COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'fullName'
  ), '');

  -- If an account with this email already exists (e.g. email/password user now
  -- signs in via Google), link the existing profile to this auth_id instead of
  -- inserting a duplicate that would violate the UNIQUE email constraint.
  IF EXISTS (SELECT 1 FROM public.users WHERE lower(email) = lower(v_email)) THEN
    UPDATE public.users
      SET auth_id = COALESCE(auth_id, NEW.id),
          full_name = COALESCE(full_name, v_name),
          email = v_email
      WHERE lower(email) = lower(v_email);
    RETURN NEW;
  END IF;

  INSERT INTO public.users (auth_id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    v_email,
    v_name,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    CASE
      WHEN lower(v_email) = 'admin@hificustoms.com' THEN 'admin'
      ELSE 'customer'
    END
  )
  ON CONFLICT (auth_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. users self-update policy already exists (users_update_own) so a profile
--    edit flow can set phone via the authenticated route client.
