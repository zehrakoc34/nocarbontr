-- nocarbontr — CBAM v2 Migration
-- Supabase SQL Editor'da çalıştır

-- 1. Yeni enum değerleri ekle
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supplier';

-- 2. CBAM sektör enum
DO $$ BEGIN
  CREATE TYPE cbam_sector AS ENUM ('steel','aluminium','cement','fertilizer','electricity','hydrogen');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Submission status enum
DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('draft','pending_review','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Suppliers tablosuna yeni kolonlar
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS "importerId"    INTEGER,
  ADD COLUMN IF NOT EXISTS "sectorType"    cbam_sector,
  ADD COLUMN IF NOT EXISTS "onboardingStatus" VARCHAR(50) NOT NULL DEFAULT 'invited',
  ADD COLUMN IF NOT EXISTS "cbamData"      JSONB;

-- 5. Scores tablosuna submission flow kolonları
ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS "submissionStatus" submission_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS "cbamData"          JSONB,
  ADD COLUMN IF NOT EXISTS "reviewNote"        TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt"        TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "reviewedBy"        INTEGER;

-- 6. CBAM Yıllık Rapor tablosu
CREATE TABLE IF NOT EXISTS "cbamAnnualReport" (
  id SERIAL PRIMARY KEY,
  "userId"      INTEGER NOT NULL,
  year          INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  title         VARCHAR(255) NOT NULL,
  "reportData"  JSONB NOT NULL DEFAULT '{}',
  "totalCO2e"   NUMERIC(15,4) NOT NULL DEFAULT 0,
  status        VARCHAR(50) NOT NULL DEFAULT 'draft',
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "cbamAnnualReport_userId_idx" ON "cbamAnnualReport"("userId");

-- 7. Supplier portal token tablosu
CREATE TABLE IF NOT EXISTS "supplierSessions" (
  id SERIAL PRIMARY KEY,
  "supplierId"  INTEGER NOT NULL UNIQUE,
  "userId"      INTEGER NOT NULL,
  token         VARCHAR(128) NOT NULL UNIQUE,
  "expiresAt"   TIMESTAMP NOT NULL,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. Mevcut 20 sektörü koru, 6 CBAM sektörünü güncelle
UPDATE sectors SET
  "nameEn" = 'Iron & Steel',
  "nameTr" = 'Demir-Çelik',
  category = 'CBAM'
WHERE code = 'STEEL';

UPDATE sectors SET
  "nameEn" = 'Aluminium',
  "nameTr" = 'Alüminyum',
  category = 'CBAM'
WHERE code = 'ALUM';

UPDATE sectors SET
  "nameEn" = 'Cement',
  "nameTr" = 'Çimento',
  category = 'CBAM'
WHERE code = 'CHEM';

-- 9. Yeni 6 CBAM sektörü (yoksa ekle)
INSERT INTO sectors (code, "nameEn", "nameTr", category, "hsCodes") VALUES
  ('CEMENT',  'Cement',      'Çimento',    'CBAM', '["2523","6810","6811"]'),
  ('FERT',    'Fertilizers', 'Gübre',      'CBAM', '["3102","3103","3104","3105"]'),
  ('ELECB',   'Electricity', 'Elektrik',   'CBAM', '["2716"]'),
  ('HYDRO',   'Hydrogen',    'Hidrojen',   'CBAM', '["2804"]')
ON CONFLICT (code) DO NOTHING;

SELECT 'CBAM v2 migration completed!' as result;
