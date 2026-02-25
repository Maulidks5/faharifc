-- Finance role should only add and view financial data.
-- Admin remains the only role that can update/delete financial records.

-- SALARY PAYMENTS
DROP POLICY IF EXISTS "Admin or finance update salary_payments" ON salary_payments;
DROP POLICY IF EXISTS "Admin or finance delete salary_payments" ON salary_payments;
DROP POLICY IF EXISTS "Admin update salary_payments" ON salary_payments;
DROP POLICY IF EXISTS "Admin delete salary_payments" ON salary_payments;

CREATE POLICY "Admin update salary_payments"
  ON salary_payments FOR UPDATE
  TO authenticated
  USING (public.current_app_role()::text = 'admin')
  WITH CHECK (public.current_app_role()::text = 'admin');

CREATE POLICY "Admin delete salary_payments"
  ON salary_payments FOR DELETE
  TO authenticated
  USING (public.current_app_role()::text = 'admin');

-- EXTRA PAYMENTS
DROP POLICY IF EXISTS "Admin or finance update extra_payments" ON extra_payments;
DROP POLICY IF EXISTS "Admin or finance delete extra_payments" ON extra_payments;
DROP POLICY IF EXISTS "Admin update extra_payments" ON extra_payments;
DROP POLICY IF EXISTS "Admin delete extra_payments" ON extra_payments;

CREATE POLICY "Admin update extra_payments"
  ON extra_payments FOR UPDATE
  TO authenticated
  USING (public.current_app_role()::text = 'admin')
  WITH CHECK (public.current_app_role()::text = 'admin');

CREATE POLICY "Admin delete extra_payments"
  ON extra_payments FOR DELETE
  TO authenticated
  USING (public.current_app_role()::text = 'admin');

-- CLUB INCOME
DROP POLICY IF EXISTS "Admin or finance update club_income" ON club_income;
DROP POLICY IF EXISTS "Admin or finance delete club_income" ON club_income;
DROP POLICY IF EXISTS "Admin update club_income" ON club_income;
DROP POLICY IF EXISTS "Admin delete club_income" ON club_income;

CREATE POLICY "Admin update club_income"
  ON club_income FOR UPDATE
  TO authenticated
  USING (public.current_app_role()::text = 'admin')
  WITH CHECK (public.current_app_role()::text = 'admin');

CREATE POLICY "Admin delete club_income"
  ON club_income FOR DELETE
  TO authenticated
  USING (public.current_app_role()::text = 'admin');

-- MATCH EXPENSES
DROP POLICY IF EXISTS "Admin or finance update match_expenses" ON match_expenses;
DROP POLICY IF EXISTS "Admin or finance delete match_expenses" ON match_expenses;
DROP POLICY IF EXISTS "Admin update match_expenses" ON match_expenses;
DROP POLICY IF EXISTS "Admin delete match_expenses" ON match_expenses;

CREATE POLICY "Admin update match_expenses"
  ON match_expenses FOR UPDATE
  TO authenticated
  USING (public.current_app_role()::text = 'admin')
  WITH CHECK (public.current_app_role()::text = 'admin');

CREATE POLICY "Admin delete match_expenses"
  ON match_expenses FOR DELETE
  TO authenticated
  USING (public.current_app_role()::text = 'admin');

-- OTHER EXPENSES
DROP POLICY IF EXISTS "Admin or finance update other_expenses" ON other_expenses;
DROP POLICY IF EXISTS "Admin or finance delete other_expenses" ON other_expenses;
DROP POLICY IF EXISTS "Admin update other_expenses" ON other_expenses;
DROP POLICY IF EXISTS "Admin delete other_expenses" ON other_expenses;

CREATE POLICY "Admin update other_expenses"
  ON other_expenses FOR UPDATE
  TO authenticated
  USING (public.current_app_role()::text = 'admin')
  WITH CHECK (public.current_app_role()::text = 'admin');

CREATE POLICY "Admin delete other_expenses"
  ON other_expenses FOR DELETE
  TO authenticated
  USING (public.current_app_role()::text = 'admin');
