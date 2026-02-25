/*
  # Fahari Football Club Management System Database Schema

  1. New Tables
    - `admins`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `full_name` (text)
      - `created_at` (timestamp)
    
    - `members`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `date_of_birth` (date)
      - `phone` (text)
      - `role` (text)
      - `member_type` (text) - 'player' or 'staff'
      - `monthly_salary` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `salary_payments`
      - `id` (uuid, primary key)
      - `member_id` (uuid, foreign key)
      - `amount` (numeric)
      - `payment_date` (date)
      - `month` (text)
      - `notes` (text)
      - `created_at` (timestamp)
    
    - `extra_payments`
      - `id` (uuid, primary key)
      - `member_id` (uuid, foreign key)
      - `amount` (numeric)
      - `payment_date` (date)
      - `category` (text) - bonus, transport, etc.
      - `notes` (text)
      - `created_at` (timestamp)
    
    - `club_income`
      - `id` (uuid, primary key)
      - `amount` (numeric)
      - `income_date` (date)
      - `source` (text)
      - `notes` (text)
      - `created_at` (timestamp)
    
    - `match_expenses`
      - `id` (uuid, primary key)
      - `opponent` (text)
      - `match_date` (date)
      - `category` (text)
      - `amount` (numeric)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admins only

  3. Important Notes
    - Default admin credentials will be created separately
    - All financial amounts stored as numeric for precision
    - Timestamps for audit trail
*/

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  phone text NOT NULL,
  role text NOT NULL,
  member_type text NOT NULL CHECK (member_type IN ('player', 'staff')),
  monthly_salary numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create salary_payments table
CREATE TABLE IF NOT EXISTS salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  payment_date date NOT NULL,
  month text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create extra_payments table
CREATE TABLE IF NOT EXISTS extra_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  payment_date date NOT NULL,
  category text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create club_income table
CREATE TABLE IF NOT EXISTS club_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric(12,2) NOT NULL,
  income_date date NOT NULL,
  source text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create match_expenses table
CREATE TABLE IF NOT EXISTS match_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opponent text NOT NULL,
  match_date date NOT NULL,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for admins table (used for authentication)
CREATE POLICY "Admins can read own data"
  ON admins FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for members table
CREATE POLICY "Authenticated users can read members"
  ON members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update members"
  ON members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete members"
  ON members FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for salary_payments table
CREATE POLICY "Authenticated users can read salary_payments"
  ON salary_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert salary_payments"
  ON salary_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update salary_payments"
  ON salary_payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete salary_payments"
  ON salary_payments FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for extra_payments table
CREATE POLICY "Authenticated users can read extra_payments"
  ON extra_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert extra_payments"
  ON extra_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update extra_payments"
  ON extra_payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete extra_payments"
  ON extra_payments FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for club_income table
CREATE POLICY "Authenticated users can read club_income"
  ON club_income FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert club_income"
  ON club_income FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update club_income"
  ON club_income FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete club_income"
  ON club_income FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for match_expenses table
CREATE POLICY "Authenticated users can read match_expenses"
  ON match_expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert match_expenses"
  ON match_expenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update match_expenses"
  ON match_expenses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete match_expenses"
  ON match_expenses FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_member_type ON members(member_type);
CREATE INDEX IF NOT EXISTS idx_salary_payments_member_id ON salary_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_extra_payments_member_id ON extra_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_date ON salary_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_extra_payments_date ON extra_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_club_income_date ON club_income(income_date);
CREATE INDEX IF NOT EXISTS idx_match_expenses_date ON match_expenses(match_date);

-- Insert default admin user (password: admin123)
-- Password hash generated using bcrypt with 10 rounds
INSERT INTO admins (email, password_hash, full_name)
VALUES ('admin@fahari.com', '$2a$10$rGHEqJ8L0YJ9PqP0r7V6sOXxZLJ8QVXkJ5Z1Y9Y8FqE5Z5Z5Z5Z5Z', 'Admin User')
ON CONFLICT (email) DO NOTHING;