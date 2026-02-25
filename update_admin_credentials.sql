/*
  # Update Admin Credentials

  Instructions:
  1. Go to your Supabase project dashboard
  2. Navigate to SQL Editor
  3. Copy and paste this entire SQL script
  4. Click "Run" to execute

  This will:
  - Remove the old admin user (admin@fahari.com)
  - Create new admin user with credentials:
    - Email: faharifc@gmail.com
    - Password: Fahari@001
*/

-- Remove old admin user if exists
DELETE FROM auth.users WHERE email = 'admin@fahari.com';

-- Create new admin user with updated credentials
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
  'faharifc@gmail.com',
  crypt('Fahari@001', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Fahari FC Admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'faharifc@gmail.com'
);
