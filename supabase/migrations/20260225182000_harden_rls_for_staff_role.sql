-- Harden RLS: staff is read-only for core data, admin has write access.

-- MEMBERS
DROP POLICY IF EXISTS "Authenticated users can read members" ON members;
DROP POLICY IF EXISTS "Authenticated users can insert members" ON members;
DROP POLICY IF EXISTS "Authenticated users can update members" ON members;
DROP POLICY IF EXISTS "Authenticated users can delete members" ON members;

CREATE POLICY "Read members"
  ON members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update members"
  ON members FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete members"
  ON members FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- SALARY PAYMENTS
DROP POLICY IF EXISTS "Authenticated users can read salary_payments" ON salary_payments;
DROP POLICY IF EXISTS "Authenticated users can insert salary_payments" ON salary_payments;
DROP POLICY IF EXISTS "Authenticated users can update salary_payments" ON salary_payments;
DROP POLICY IF EXISTS "Authenticated users can delete salary_payments" ON salary_payments;

CREATE POLICY "Read salary_payments"
  ON salary_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin insert salary_payments"
  ON salary_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update salary_payments"
  ON salary_payments FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete salary_payments"
  ON salary_payments FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- EXTRA PAYMENTS
DROP POLICY IF EXISTS "Authenticated users can read extra_payments" ON extra_payments;
DROP POLICY IF EXISTS "Authenticated users can insert extra_payments" ON extra_payments;
DROP POLICY IF EXISTS "Authenticated users can update extra_payments" ON extra_payments;
DROP POLICY IF EXISTS "Authenticated users can delete extra_payments" ON extra_payments;

CREATE POLICY "Read extra_payments"
  ON extra_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin insert extra_payments"
  ON extra_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update extra_payments"
  ON extra_payments FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete extra_payments"
  ON extra_payments FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- CLUB INCOME
DROP POLICY IF EXISTS "Authenticated users can read club_income" ON club_income;
DROP POLICY IF EXISTS "Authenticated users can insert club_income" ON club_income;
DROP POLICY IF EXISTS "Authenticated users can update club_income" ON club_income;
DROP POLICY IF EXISTS "Authenticated users can delete club_income" ON club_income;

CREATE POLICY "Read club_income"
  ON club_income FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin insert club_income"
  ON club_income FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update club_income"
  ON club_income FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete club_income"
  ON club_income FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- MATCH EXPENSES
DROP POLICY IF EXISTS "Authenticated users can read match_expenses" ON match_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert match_expenses" ON match_expenses;
DROP POLICY IF EXISTS "Authenticated users can update match_expenses" ON match_expenses;
DROP POLICY IF EXISTS "Authenticated users can delete match_expenses" ON match_expenses;

CREATE POLICY "Read match_expenses"
  ON match_expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin insert match_expenses"
  ON match_expenses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update match_expenses"
  ON match_expenses FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete match_expenses"
  ON match_expenses FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- OTHER EXPENSES
DROP POLICY IF EXISTS "Authenticated users can read other_expenses" ON other_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert other_expenses" ON other_expenses;
DROP POLICY IF EXISTS "Authenticated users can update other_expenses" ON other_expenses;
DROP POLICY IF EXISTS "Authenticated users can delete other_expenses" ON other_expenses;

CREATE POLICY "Read other_expenses"
  ON other_expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin insert other_expenses"
  ON other_expenses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update other_expenses"
  ON other_expenses FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete other_expenses"
  ON other_expenses FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- CONTRACTS
DROP POLICY IF EXISTS "Authenticated users can read contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can insert contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can delete contracts" ON contracts;

CREATE POLICY "Read contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete contracts"
  ON contracts FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- USER PROFILES
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can update profile safely"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (auth.uid() = id AND role = 'staff')
  );

CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());
