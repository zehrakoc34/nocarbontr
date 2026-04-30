-- network_connections'a temp_password ve supplier_email ekle
ALTER TABLE network_connections ADD COLUMN IF NOT EXISTS temp_password TEXT;
ALTER TABLE network_connections ADD COLUMN IF NOT EXISTS supplier_email TEXT;

-- emission_data'ya status workflow kolonları ekle
ALTER TABLE emission_data ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT'
  CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'));
ALTER TABLE emission_data ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE emission_data ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE emission_data ADD COLUMN IF NOT EXISTS rejection_note TEXT;
