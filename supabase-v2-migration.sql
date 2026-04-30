-- nocarbontr v2 Migration: Multi-tenant CBAM
-- Run in Supabase SQL Editor

-- 1. Add mustChangePassword to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS "mustChangePassword" boolean NOT NULL DEFAULT false;

-- 2. Add tempPasswordEncoded to suppliers (base64 of temp password, cleared on change)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS "tempPasswordEncoded" text;

-- 3. Add userId FK to suppliers (links supplier record to their user account)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS "userId" integer;

-- 4. Indexes for tenant isolation performance
CREATE INDEX IF NOT EXISTS idx_suppliers_importerid ON suppliers("importerId");
CREATE INDEX IF NOT EXISTS idx_suppliers_userid ON suppliers("userId");
CREATE INDEX IF NOT EXISTS idx_scores_supplierid ON scores("supplierId");
CREATE INDEX IF NOT EXISTS idx_scores_userid ON scores("userId");
CREATE INDEX IF NOT EXISTS idx_annual_report_userid ON "cbamAnnualReport"("userId");
