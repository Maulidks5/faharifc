-- Add other_expenses table for non-match club expenses
CREATE TABLE IF NOT EXISTS other_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_item text NOT NULL,
  expense_date date NOT NULL,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE other_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read other_expenses"
  ON other_expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert other_expenses"
  ON other_expenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update other_expenses"
  ON other_expenses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete other_expenses"
  ON other_expenses FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_other_expenses_date ON other_expenses(expense_date);
