-- Admin lifecycle controls: create users from dashboard and block/activate accounts.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_reason text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

-- Tighten self-update policy: non-admin can update own profile only without changing role.
DROP POLICY IF EXISTS "Users can update profile safely" ON public.user_profiles;
CREATE POLICY "Users can update profile safely"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = id
      AND role = public.current_app_role()
      AND is_active = true
    )
  );

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_full_name text DEFAULT '',
  p_role app_role DEFAULT 'staff'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;

  v_email := lower(trim(p_email));

  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', coalesce(p_full_name, '')),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  UPDATE public.user_profiles
  SET
    email = v_email,
    full_name = coalesce(p_full_name, ''),
    role = p_role,
    is_active = true,
    blocked_at = null,
    blocked_reason = '',
    updated_at = now()
  WHERE id = v_user_id;

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_active(
  p_user_id uuid,
  p_is_active boolean,
  p_reason text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change user status';
  END IF;

  UPDATE public.user_profiles
  SET
    is_active = p_is_active,
    blocked_at = CASE WHEN p_is_active THEN null ELSE now() END,
    blocked_reason = CASE WHEN p_is_active THEN '' ELSE coalesce(p_reason, '') END,
    updated_at = now()
  WHERE id = p_user_id;

  IF NOT p_is_active THEN
    BEGIN
      DELETE FROM auth.sessions WHERE user_id = p_user_id;
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean, text) TO authenticated;
