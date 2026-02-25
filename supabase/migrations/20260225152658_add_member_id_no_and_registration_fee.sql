-- Add ID number and registration fee fields for players and staff
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS id_no text,
  ADD COLUMN IF NOT EXISTS registration_fee numeric(12,2) NOT NULL DEFAULT 0;

-- Ensure ID numbers are unique when provided
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_id_no_unique
  ON members (id_no)
  WHERE id_no IS NOT NULL;
