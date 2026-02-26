-- Audit trail for critical tables: who changed what and when.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  old_data jsonb,
  new_data jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON public.audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON public.audit_logs(changed_by);

CREATE OR REPLACE FUNCTION public.log_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := COALESCE(OLD.id::text, '');
    INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_record_id, TG_OP, auth.uid(), to_jsonb(OLD), NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := COALESCE(NEW.id::text, OLD.id::text, '');
    INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_record_id, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSE
    v_record_id := COALESCE(NEW.id::text, '');
    INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, v_record_id, TG_OP, auth.uid(), NULL, to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_members ON public.members;
CREATE TRIGGER trg_audit_members
AFTER INSERT OR UPDATE OR DELETE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.log_row_change();

DROP TRIGGER IF EXISTS trg_audit_contracts ON public.contracts;
CREATE TRIGGER trg_audit_contracts
AFTER INSERT OR UPDATE OR DELETE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.log_row_change();

DROP TRIGGER IF EXISTS trg_audit_salary_payments ON public.salary_payments;
CREATE TRIGGER trg_audit_salary_payments
AFTER INSERT OR UPDATE OR DELETE ON public.salary_payments
FOR EACH ROW EXECUTE FUNCTION public.log_row_change();

DROP TRIGGER IF EXISTS trg_audit_extra_payments ON public.extra_payments;
CREATE TRIGGER trg_audit_extra_payments
AFTER INSERT OR UPDATE OR DELETE ON public.extra_payments
FOR EACH ROW EXECUTE FUNCTION public.log_row_change();

DROP TRIGGER IF EXISTS trg_audit_club_income ON public.club_income;
CREATE TRIGGER trg_audit_club_income
AFTER INSERT OR UPDATE OR DELETE ON public.club_income
FOR EACH ROW EXECUTE FUNCTION public.log_row_change();

DROP TRIGGER IF EXISTS trg_audit_match_expenses ON public.match_expenses;
CREATE TRIGGER trg_audit_match_expenses
AFTER INSERT OR UPDATE OR DELETE ON public.match_expenses
FOR EACH ROW EXECUTE FUNCTION public.log_row_change();

DROP TRIGGER IF EXISTS trg_audit_other_expenses ON public.other_expenses;
CREATE TRIGGER trg_audit_other_expenses
AFTER INSERT OR UPDATE OR DELETE ON public.other_expenses
FOR EACH ROW EXECUTE FUNCTION public.log_row_change();

DROP TRIGGER IF EXISTS trg_audit_user_profiles ON public.user_profiles;
CREATE TRIGGER trg_audit_user_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.log_row_change();

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());
