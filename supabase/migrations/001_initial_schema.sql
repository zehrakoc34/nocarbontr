-- ============================================================
-- Nocarbontr — Initial Schema
-- nctr_1.md §3 Database Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE org_type AS ENUM ('CORPORATE', 'SUPPLIER');
CREATE TYPE subscription_status AS ENUM ('TRIAL', 'ACTIVE', 'INACTIVE', 'PAST_DUE');
CREATE TYPE connection_status AS ENUM ('ACTIVE', 'PENDING', 'REJECTED');
CREATE TYPE data_source AS ENUM ('OCR', 'MANUAL');

-- ============================================================
-- TABLES
-- ============================================================

-- organizations: Multi-tenant temel tablosu
CREATE TABLE organizations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  tax_id              TEXT NOT NULL UNIQUE,
  type                org_type NOT NULL,
  subscription_status subscription_status NOT NULL DEFAULT 'TRIAL',
  trial_ends_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kullanıcı <-> Organizasyon ilişkisi
CREATE TABLE org_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',  -- 'owner' | 'member' | 'auditor'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- network_connections: Şirket <-> Tedarikçi bağlantısı
-- nctr_1.md §7.1: RLS politikaları asla esnetilmemeli
CREATE TABLE network_connections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status      connection_status NOT NULL DEFAULT 'PENDING',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, supplier_id),
  CHECK (company_id <> supplier_id)
);

-- emission_data: Tedarikçi emisyon kayıtları
-- nctr_1.md §4 Calculation Engine
CREATE TABLE emission_data (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sector            TEXT NOT NULL,  -- 'steel' | 'aluminum' | 'cement' | 'chemicals' | 'electricity'
  year              INTEGER NOT NULL CHECK (year >= 2026),
  emissions_ton_co2 NUMERIC(12, 4) NOT NULL CHECK (emissions_ton_co2 >= 0),
  data_source       data_source NOT NULL DEFAULT 'MANUAL',
  formula_version   TEXT NOT NULL DEFAULT 'v1',  -- nctr_1.md §7.2 Formula Versioning
  raw_inputs        JSONB,  -- ham veri (aktivite verisi, emisyon faktörleri)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- evidence_vault: Kanıt belgesi deposu
-- nctr_1.md §7.3 Evidence Integrity
CREATE TABLE evidence_vault (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         UUID NOT NULL REFERENCES emission_data(id) ON DELETE CASCADE,
  file_url          TEXT NOT NULL,
  verification_hash TEXT NOT NULL,  -- SHA-256 — değiştirilemezlik kanıtı
  upload_date       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- trust_scores: Tedarikçi güven skoru (hesaplanmış, cache)
-- nctr_1.md §4 Trust Score algoritması
CREATE TABLE trust_scores (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  score                INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  evidence_score       INTEGER NOT NULL DEFAULT 0,   -- max 40 puan
  continuity_score     INTEGER NOT NULL DEFAULT 0,   -- max 30 puan
  benchmark_score      INTEGER NOT NULL DEFAULT 0,   -- max 30 puan
  last_calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_emission_data_supplier_year ON emission_data(supplier_id, year);
CREATE INDEX idx_network_connections_company ON network_connections(company_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_network_connections_supplier ON network_connections(supplier_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_org_members_user ON org_members(user_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emission_data_updated_at
  BEFORE UPDATE ON emission_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- nctr_1.md §7.1: Data Leakage — RLS asla esnetilmemeli
-- ============================================================
ALTER TABLE organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_connections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE emission_data        ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_vault       ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores         ENABLE ROW LEVEL SECURITY;

-- Yardımcı fonksiyon: kullanıcının org_id'sini döner
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Yardımcı fonksiyon: kullanıcının org türünü döner
CREATE OR REPLACE FUNCTION auth_org_type()
RETURNS org_type AS $$
  SELECT o.type FROM organizations o
  JOIN org_members m ON m.org_id = o.id
  WHERE m.user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- organizations: kendi organizasyonunu okuyabilir
CREATE POLICY "org_read_own" ON organizations
  FOR SELECT USING (id = auth_org_id());

-- org_members: kendi kaydını okuyabilir
CREATE POLICY "members_read_own" ON org_members
  FOR SELECT USING (user_id = auth.uid());

-- network_connections: CORPORATE kendi bağlantılarını görür; SUPPLIER bağlı olduğu bağlantıları görür
CREATE POLICY "connections_company_read" ON network_connections
  FOR SELECT USING (company_id = auth_org_id() OR supplier_id = auth_org_id());

CREATE POLICY "connections_company_insert" ON network_connections
  FOR INSERT WITH CHECK (company_id = auth_org_id() AND auth_org_type() = 'CORPORATE');

CREATE POLICY "connections_supplier_update" ON network_connections
  FOR UPDATE USING (supplier_id = auth_org_id() AND auth_org_type() = 'SUPPLIER');

-- emission_data: tedarikçi kendi verisini yönetir; bağlı şirketler görebilir
CREATE POLICY "emission_supplier_all" ON emission_data
  FOR ALL USING (supplier_id = auth_org_id());

CREATE POLICY "emission_company_read" ON emission_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM network_connections
      WHERE supplier_id = emission_data.supplier_id
        AND company_id = auth_org_id()
        AND status = 'ACTIVE'
    )
  );

-- evidence_vault: emit data sahibi yönetir; bağlı şirket okuyabilir
CREATE POLICY "evidence_owner_all" ON evidence_vault
  FOR ALL USING (
    EXISTS (SELECT 1 FROM emission_data WHERE id = evidence_vault.report_id AND supplier_id = auth_org_id())
  );

CREATE POLICY "evidence_company_read" ON evidence_vault
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM emission_data e
      JOIN network_connections nc ON nc.supplier_id = e.supplier_id
      WHERE e.id = evidence_vault.report_id
        AND nc.company_id = auth_org_id()
        AND nc.status = 'ACTIVE'
    )
  );

-- trust_scores: herkes okuyabilir (bağlantısı varsa), tedarikçi okuyabilir
CREATE POLICY "trust_supplier_read" ON trust_scores
  FOR SELECT USING (supplier_id = auth_org_id());

CREATE POLICY "trust_company_read" ON trust_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM network_connections
      WHERE supplier_id = trust_scores.supplier_id
        AND company_id = auth_org_id()
        AND status = 'ACTIVE'
    )
  );
