-- Allow staff to create operational/financial records while keeping update/delete as admin-only.

CREATE OR REPLACE FUNCTION public.current_app_role(check_user_id uuid DEFAULT auth.uid())
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_profiles
  WHERE id = check_user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_app_role(uuid) TO authenticated;

-- MEMBERS: staff and admin can insert; update/delete remains admin only
DROP POLICY IF EXISTS "Admin insert members" ON members;
CREATE POLICY "Staff or admin insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role() IN ('admin'::app_role, 'staff'::app_role));

-- CONTRACTS: staff and admin can insert; update/delete remains admin only
DROP POLICY IF EXISTS "Admin insert contracts" ON contracts;
CREATE POLICY "Staff or admin insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role() IN ('admin'::app_role, 'staff'::app_role));

-- FINANCIAL TABLES: staff and admin can insert; update/delete remains admin only
DROP POLICY IF EXISTS "Admin insert salary_payments" ON salary_payments;
CREATE POLICY "Staff or admin insert salary_payments"
  ON salary_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role() IN ('admin'::app_role, 'staff'::app_role));

DROP POLICY IF EXISTS "Admin insert extra_payments" ON extra_payments;
CREATE POLICY "Staff or admin insert extra_payments"
  ON extra_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role() IN ('admin'::app_role, 'staff'::app_role));

DROP POLICY IF EXISTS "Admin insert club_income" ON club_income;
CREATE POLICY "Staff or admin insert club_income"
  ON club_income FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role() IN ('admin'::app_role, 'staff'::app_role));

DROP POLICY IF EXISTS "Admin insert match_expenses" ON match_expenses;
CREATE POLICY "Staff or admin insert match_expenses"
  ON match_expenses FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role() IN ('admin'::app_role, 'staff'::app_role));

DROP POLICY IF EXISTS "Admin insert other_expenses" ON other_expenses;
CREATE POLICY "Staff or admin insert other_expenses"
  ON other_expenses FOR INSERT
  TO authenticated
  WITH CHECK (public.current_app_role() IN ('admin'::app_role, 'staff'::app_role));
