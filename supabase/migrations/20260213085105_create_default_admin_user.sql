/*
  # Create Default Admin User

  1. Admin User
    - Email: admin@fahari.com
    - Password: admin123
    
  2. Important Notes
    - This creates a default admin user for the system
    - User can log in immediately with these credentials
    - Password should be changed after first login in production
*/

-- Insert default admin user into auth.users
-- This uses Supabase's auth schema directly
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
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@fahari.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@fahari.com'
);

-- Remove the old admins table as we're using Supabase Auth
DROP TABLE IF EXISTS admins CASCADE;