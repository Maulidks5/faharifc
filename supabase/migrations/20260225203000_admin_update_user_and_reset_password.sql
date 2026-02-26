-- Admin can update user account details and reset passwords.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_role app_role,
  p_is_active boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can update users';
  END IF;

  v_email := lower(trim(p_email));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = v_email
      AND id <> p_user_id
  ) THEN
    RAISE EXCEPTION 'Another user already uses this email';
  END IF;

  UPDATE auth.users
  SET
    email = v_email,
    raw_user_meta_data = jsonb_set(
      coalesce(raw_user_meta_data, '{}'::jsonb),
      '{full_name}',
      to_jsonb(coalesce(p_full_name, ''))
    ),
    updated_at = now()
  WHERE id = p_user_id;

  UPDATE public.user_profiles
  SET
    email = v_email,
    full_name = coalesce(p_full_name, ''),
    role = p_role,
    is_active = p_is_active,
    blocked_at = CASE WHEN p_is_active THEN null ELSE now() END,
    blocked_reason = CASE WHEN p_is_active THEN '' ELSE blocked_reason END,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid, text, text, app_role, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can reset passwords';
  END IF;

  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    updated_at = now()
  WHERE id = p_user_id;

  BEGIN
    DELETE FROM auth.sessions WHERE user_id = p_user_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(uuid, text) TO authenticated;
