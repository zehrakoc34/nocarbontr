-- ============================================================
-- Nocarbontr — Reports Archive (Dijital Arşivleme & Audit Trail)
-- CBAM Reg. (EU) 2023/956: 7-yıllık saklama zorunluluğu
-- ============================================================

ALTER TABLE cbam_reports ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS reports_archive (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id      UUID NOT NULL REFERENCES cbam_reports(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  importer_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  xml_url        TEXT,          -- Supabase Storage path (signed URL'den farklı)
  excel_url      TEXT,
  zip_url        TEXT,
  checksum       TEXT NOT NULL, -- SHA-256 of ZIP bytes
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID REFERENCES auth.users(id),
  UNIQUE(report_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_reports_archive_report
  ON reports_archive(report_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_reports_archive_importer
  ON reports_archive(importer_id, created_at DESC);

ALTER TABLE reports_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "archive_org_read" ON reports_archive;
CREATE POLICY "archive_org_read" ON reports_archive
  FOR SELECT USING (importer_id = auth_org_id());

-- INSERT/UPDATE/DELETE: yalnızca service role key (createAdminClient) ile
-- Kullanıcılar arşiv kaydı oluşturamaz/silemez → immutability guarantee
