-- Add finance role and grant finance-management permissions.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'finance'
      AND enumtypid = 'app_role'::regtype
  ) THEN
    ALTER TYPE app_role ADD VALUE 'finance';
  END IF;
END
$$;

-- Allow users with finance role to keep their own role when updating their profile fields.
DROP POLICY IF EXISTS "Users can update profile safely" ON user_profiles;
CREATE POLICY "Users can update profile safely"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = id
      AND role::text IN ('staff', 'finance')
    )
  );

-- Financial tables: admin and finance can fully manage, staff can still add.
DROP POLICY IF EXISTS "Admin update salary_payments" ON salary_payments;
CREATE POLICY "Admin or finance update salary_payments"
  ON salary_payments FOR UPDATE
  TO authenticated
  USING (public.current_app_role()::text IN ('admin', 'finance'))
  WITH CHECK (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Admin delete salary_payments" ON salary_payments;
CREATE POLICY "Admin or finance delete salary_payments"
  ON salary_payments FOR DELETE
  TO authenticated
  USING (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Staff or admin insert salary_payments" ON salary_payments;
CREATE POLICY "Staff admin or finance insert salary_payments"
  ON salary_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role()::text IN ('admin', 'staff', 'finance'));

DROP POLICY IF EXISTS "Admin update extra_payments" ON extra_payments;
CREATE POLICY "Admin or finance update extra_payments"
  ON extra_payments FOR UPDATE
  TO authenticated
  USING (public.current_app_role()::text IN ('admin', 'finance'))
  WITH CHECK (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Admin delete extra_payments" ON extra_payments;
CREATE POLICY "Admin or finance delete extra_payments"
  ON extra_payments FOR DELETE
  TO authenticated
  USING (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Staff or admin insert extra_payments" ON extra_payments;
CREATE POLICY "Staff admin or finance insert extra_payments"
  ON extra_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role()::text IN ('admin', 'staff', 'finance'));

DROP POLICY IF EXISTS "Admin update club_income" ON club_income;
CREATE POLICY "Admin or finance update club_income"
  ON club_income FOR UPDATE
  TO authenticated
  USING (public.current_app_role()::text IN ('admin', 'finance'))
  WITH CHECK (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Admin delete club_income" ON club_income;
CREATE POLICY "Admin or finance delete club_income"
  ON club_income FOR DELETE
  TO authenticated
  USING (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Staff or admin insert club_income" ON club_income;
CREATE POLICY "Staff admin or finance insert club_income"
  ON club_income FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role()::text IN ('admin', 'staff', 'finance'));

DROP POLICY IF EXISTS "Admin update match_expenses" ON match_expenses;
CREATE POLICY "Admin or finance update match_expenses"
  ON match_expenses FOR UPDATE
  TO authenticated
  USING (public.current_app_role()::text IN ('admin', 'finance'))
  WITH CHECK (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Admin delete match_expenses" ON match_expenses;
CREATE POLICY "Admin or finance delete match_expenses"
  ON match_expenses FOR DELETE
  TO authenticated
  USING (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Staff or admin insert match_expenses" ON match_expenses;
CREATE POLICY "Staff admin or finance insert match_expenses"
  ON match_expenses FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role()::text IN ('admin', 'staff', 'finance'));

DROP POLICY IF EXISTS "Admin update other_expenses" ON other_expenses;
CREATE POLICY "Admin or finance update other_expenses"
  ON other_expenses FOR UPDATE
  TO authenticated
  USING (public.current_app_role()::text IN ('admin', 'finance'))
  WITH CHECK (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Admin delete other_expenses" ON other_expenses;
CREATE POLICY "Admin or finance delete other_expenses"
  ON other_expenses FOR DELETE
  TO authenticated
  USING (public.current_app_role()::text IN ('admin', 'finance'));

DROP POLICY IF EXISTS "Staff or admin insert other_expenses" ON other_expenses;
CREATE POLICY "Staff admin or finance insert other_expenses"
  ON other_expenses FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role()::text IN ('admin', 'staff', 'finance'));
