-- ============================================================
-- Nocarbontr — CBAM Report Schema (idempotent)
-- XSD v23.00 uyumlu — EU 2023/956 Annex
-- ============================================================

-- ─── 1. INSTALLATIONS — zaten varsa atla ─────────────────────
CREATE TABLE IF NOT EXISTS installations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  installation_ref      TEXT NOT NULL,
  installation_name     TEXT NOT NULL,
  economic_activity     TEXT,
  country               TEXT NOT NULL DEFAULT 'TR',
  subdivision           TEXT,
  city                  TEXT,
  street                TEXT,
  street_additional     TEXT,
  street_number         TEXT,
  postcode              TEXT,
  po_box                TEXT,
  plot_parcel_number    TEXT,
  latitude              NUMERIC(10,7),
  longitude             NUMERIC(10,7),
  coordinates_type      TEXT DEFAULT '01',
  operator_ref          TEXT,
  operator_name         TEXT,
  op_country            TEXT,
  op_subdivision        TEXT,
  op_city               TEXT,
  op_street             TEXT,
  op_street_additional  TEXT,
  op_street_number      TEXT,
  op_postcode           TEXT,
  op_po_box             TEXT,
  op_contact_name       TEXT,
  op_phone              TEXT,
  op_email              TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installations_supplier ON installations(supplier_id);

ALTER TABLE installations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "installation_supplier_all" ON installations;
CREATE POLICY "installation_supplier_all" ON installations
  FOR ALL USING (supplier_id = auth_org_id());

DROP POLICY IF EXISTS "installation_company_read" ON installations;
CREATE POLICY "installation_company_read" ON installations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM network_connections
      WHERE supplier_id = installations.supplier_id
        AND company_id = auth_org_id()
        AND status = 'ACTIVE'
    )
  );

-- ─── 2. CBAM_REPORTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cbam_reports (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_period                TEXT NOT NULL CHECK (reporting_period IN ('Q1','Q2','Q3','Q4')),
  year                            INTEGER NOT NULL CHECK (year >= 2026),
  status                          TEXT NOT NULL DEFAULT 'DRAFT'
                                    CHECK (status IN ('DRAFT','READY','SUBMITTED')),
  declarant_id_number             TEXT,
  declarant_name                  TEXT,
  declarant_role                  TEXT DEFAULT '01',
  decl_subdivision                TEXT,
  decl_city                       TEXT,
  decl_street                     TEXT,
  decl_street_additional          TEXT,
  decl_street_number              TEXT,
  decl_postcode                   TEXT,
  decl_po_box                     TEXT,
  rep_id_number                   TEXT,
  rep_name                        TEXT,
  rep_country                     TEXT,
  rep_city                        TEXT,
  rep_street                      TEXT,
  rep_postcode                    TEXT,
  importer_id_number              TEXT,
  importer_name                   TEXT,
  importer_country                TEXT,
  importer_city                   TEXT,
  importer_street                 TEXT,
  importer_postcode               TEXT,
  global_data_confirmation        BOOLEAN NOT NULL DEFAULT false,
  use_of_data_confirmation        BOOLEAN NOT NULL DEFAULT false,
  other_methodology_confirmation  BOOLEAN DEFAULT false,
  signature_place                 TEXT,
  signature                       TEXT,
  position_of_person              TEXT,
  remarks                         TEXT,
  submitted_at                    TIMESTAMPTZ,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbam_reports_org ON cbam_reports(org_id, year, reporting_period);

DROP TRIGGER IF EXISTS cbam_reports_updated_at ON cbam_reports;
CREATE TRIGGER cbam_reports_updated_at
  BEFORE UPDATE ON cbam_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cbam_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_org_all" ON cbam_reports;
CREATE POLICY "report_org_all" ON cbam_reports
  FOR ALL USING (org_id = auth_org_id());

-- ─── 3. CBAM_IMPORTED_GOODS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS cbam_imported_goods (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id             UUID NOT NULL REFERENCES cbam_reports(id) ON DELETE CASCADE,
  item_number           INTEGER NOT NULL,
  hs_code               TEXT,
  cn_code               TEXT,
  commodity_description TEXT,
  origin_country        TEXT NOT NULL DEFAULT 'TR',
  procedure_requested   TEXT DEFAULT '40',
  procedure_previous    TEXT,
  import_area           TEXT DEFAULT 'EU',
  net_mass              NUMERIC(16,6),
  supplementary_units   NUMERIC(16,6),
  measurement_unit      TEXT DEFAULT '01',
  measure_indicator     TEXT DEFAULT '0',
  remarks               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbam_goods_report ON cbam_imported_goods(report_id);

ALTER TABLE cbam_imported_goods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goods_org_all" ON cbam_imported_goods;
CREATE POLICY "goods_org_all" ON cbam_imported_goods
  FOR ALL USING (
    EXISTS (SELECT 1 FROM cbam_reports WHERE id = cbam_imported_goods.report_id AND org_id = auth_org_id())
  );

-- ─── 4. CBAM_GOODS_EMISSIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS cbam_goods_emissions (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  good_id                         UUID NOT NULL REFERENCES cbam_imported_goods(id) ON DELETE CASCADE,
  installation_id                 UUID REFERENCES installations(id) ON DELETE SET NULL,
  sequence_number                 INTEGER NOT NULL DEFAULT 1,
  production_country              TEXT DEFAULT 'TR',
  produced_net_mass               NUMERIC(16,6),
  produced_supplementary_units    NUMERIC(16,6),
  produced_measurement_unit       TEXT DEFAULT '01',
  direct_determination_type       TEXT DEFAULT '01',
  direct_reporting_type_method    TEXT DEFAULT 'TOM02',
  direct_reporting_methodology    TEXT,
  direct_see                      NUMERIC(16,7),
  direct_measurement_unit         TEXT DEFAULT 'EMU1',
  indirect_determination_type     TEXT,
  indirect_ef_source              TEXT,
  indirect_ef                     NUMERIC(16,5),
  indirect_see                    NUMERIC(16,7),
  indirect_measurement_unit       TEXT DEFAULT 'EMU1',
  indirect_electricity_consumed   NUMERIC(16,6),
  indirect_electricity_source     TEXT,
  indirect_other_source           TEXT,
  indirect_ef_source_value        TEXT,
  qualifying_params               JSONB,
  carbon_prices                   JSONB DEFAULT '[]',
  remarks                         TEXT,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goods_emissions_good ON cbam_goods_emissions(good_id);
CREATE INDEX IF NOT EXISTS idx_goods_emissions_installation ON cbam_goods_emissions(installation_id);

ALTER TABLE cbam_goods_emissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goods_emissions_org_all" ON cbam_goods_emissions;
CREATE POLICY "goods_emissions_org_all" ON cbam_goods_emissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cbam_imported_goods g
      JOIN cbam_reports r ON r.id = g.report_id
      WHERE g.id = cbam_goods_emissions.good_id
        AND r.org_id = auth_org_id()
    )
  );

-- ─── 5. CBAM_SUPPORTING_DOCS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS cbam_supporting_docs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  good_id           UUID REFERENCES cbam_imported_goods(id) ON DELETE CASCADE,
  emission_id       UUID REFERENCES cbam_goods_emissions(id) ON DELETE CASCADE,
  evidence_id       UUID REFERENCES evidence_vault(id) ON DELETE SET NULL,
  sequence_number   INTEGER NOT NULL DEFAULT 1,
  doc_type          TEXT NOT NULL DEFAULT '01',
  country           TEXT,
  reference_number  TEXT,
  line_item_number  INTEGER,
  issuing_auth_name TEXT,
  validity_start    DATE,
  validity_end      DATE,
  description       TEXT,
  filename          TEXT,
  mime_type         TEXT,
  file_url          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (good_id IS NOT NULL OR emission_id IS NOT NULL)
);

ALTER TABLE cbam_supporting_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "supporting_docs_org_all" ON cbam_supporting_docs;
CREATE POLICY "supporting_docs_org_all" ON cbam_supporting_docs
  FOR ALL USING (
    (good_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM cbam_imported_goods g
      JOIN cbam_reports r ON r.id = g.report_id
      WHERE g.id = cbam_supporting_docs.good_id AND r.org_id = auth_org_id()
    ))
    OR
    (emission_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM cbam_goods_emissions ge
      JOIN cbam_imported_goods g ON g.id = ge.good_id
      JOIN cbam_reports r ON r.id = g.report_id
      WHERE ge.id = cbam_supporting_docs.emission_id AND r.org_id = auth_org_id()
    ))
  );
