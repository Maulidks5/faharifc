-- Contracts table for players and staff
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  contract_no text NOT NULL UNIQUE,
  contract_type text NOT NULL CHECK (contract_type IN ('player', 'staff')),
  position_title text DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_allowance numeric(12,2) NOT NULL CHECK (monthly_allowance >= 0),
  registration_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (registration_fee >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  termination_reason text DEFAULT '',
  terminated_at timestamptz,
  notes text DEFAULT '',
  member_signed_name text DEFAULT '',
  member_signed_date date,
  club_signed_name text DEFAULT '',
  club_signed_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contracts_valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_contracts_member_id ON contracts(member_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON contracts(start_date, end_date);

-- One active contract per member
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_one_active_per_member
  ON contracts(member_id)
  WHERE status = 'active';

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contracts"
  ON contracts FOR DELETE
  TO authenticated
  USING (true);
