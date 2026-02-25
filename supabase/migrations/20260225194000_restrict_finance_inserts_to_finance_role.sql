-- Restrict finance table inserts to admin and finance roles only.

DROP POLICY IF EXISTS "Staff admin or finance insert salary_payments" ON salary_payments;
CREATE POLICY "Admin or finance insert salary_payments"
  ON salary_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Staff admin or finance insert extra_payments" ON extra_payments;
CREATE POLICY "Admin or finance insert extra_payments"
  ON extra_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Staff admin or finance insert club_income" ON club_income;
CREATE POLICY "Admin or finance insert club_income"
  ON club_income FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Staff admin or finance insert match_expenses" ON match_expenses;
CREATE POLICY "Admin or finance insert match_expenses"
  ON match_expenses FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Staff admin or finance insert other_expenses" ON other_expenses;
CREATE POLICY "Admin or finance insert other_expenses"
  ON other_expenses FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role()::text IN ('admin', 'finance'));
