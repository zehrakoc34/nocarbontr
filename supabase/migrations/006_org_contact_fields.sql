-- Organizations: irtibat ve adres alanları
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS address      TEXT,
  ADD COLUMN IF NOT EXISTS phone        TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT;
