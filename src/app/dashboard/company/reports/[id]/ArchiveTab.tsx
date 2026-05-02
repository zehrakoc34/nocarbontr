"use client";

export type ArchiveRow = {
  id: string;
  version_number: number;
  checksum: string;
  xml_url: string | null;
  excel_url: string | null;
  zip_url: string | null;
  created_at: string;
};

export default function ArchiveTab({
  reportId,
  archives,
}: {
  reportId: string;
  archives: ArchiveRow[];
}) {
  if (archives.length === 0) {
    return (
      <div className="nctr-card text-center py-14 space-y-3">
        <span style={{ fontSize: "2.5rem" }}>🗄️</span>
        <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Henüz arşiv bulunmuyor</p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", maxWidth: "400px", margin: "0 auto" }}>
          Raporu "İmzala &amp; Onayla" ile tamamladığınızda XML, XLSX ve ZIP dosyaları
          otomatik olarak güvenli arşive yüklenir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bilgi bandı */}
      <div style={{
        padding: "0.75rem 1rem",
        borderRadius: "8px",
        backgroundColor: "rgba(34,197,94,0.06)",
        border: "1px solid rgba(34,197,94,0.15)",
        fontSize: "0.8125rem",
        color: "var(--color-text-secondary)",
      }}>
        <strong style={{ color: "var(--color-primary-400)" }}>Dijital Arşiv &amp; Audit Trail</strong>
        {" "}— Her versiyon değiştirilemez şekilde saklanır. SHA-256 checksum ile dosya bütünlüğü
        doğrulanabilir. CBAM regülasyonu gereği 7 yıl boyunca erişilebilir.
      </div>

      <div className="nctr-card overflow-hidden p-0">
        <table className="nctr-table">
          <thead>
            <tr>
              <th>Versiyon</th>
              <th>Arşiv Tarihi</th>
              <th>SHA-256 Checksum</th>
              <th style={{ textAlign: "center" }}>İndir</th>
            </tr>
          </thead>
          <tbody>
            {archives.map((a) => (
              <tr key={a.id}>
                <td>
                  <span style={{
                    fontSize: "0.8rem", fontWeight: 700, padding: "2px 10px",
                    borderRadius: "999px",
                    backgroundColor: a.version_number === archives[0].version_number
                      ? "rgba(34,197,94,0.12)" : "rgba(107,114,128,0.1)",
                    color: a.version_number === archives[0].version_number
                      ? "var(--color-primary-400)" : "var(--color-text-muted)",
                  }}>
                    v{a.version_number}
                    {a.version_number === archives[0].version_number && " (güncel)"}
                  </span>
                </td>
                <td style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                  {new Date(a.created_at).toLocaleString("tr-TR")}
                </td>
                <td>
                  <code style={{
                    fontSize: "0.72rem", fontFamily: "monospace",
                    color: "var(--color-text-muted)",
                    letterSpacing: "0.02em",
                  }}>
                    {a.checksum.slice(0, 32)}…
                  </code>
                </td>
                <td>
                  <div className="flex items-center justify-center gap-2">
                    {a.xml_url && (
                      <a
                        href={`/api/reports/${reportId}/archive/${a.version_number}/xml`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={dlBtn("#3b82f6")}
                      >
                        XML
                      </a>
                    )}
                    {a.excel_url && (
                      <a
                        href={`/api/reports/${reportId}/archive/${a.version_number}/xlsx`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={dlBtn("#16a34a")}
                      >
                        XLSX
                      </a>
                    )}
                    {a.zip_url && (
                      <a
                        href={`/api/reports/${reportId}/archive/${a.version_number}/zip`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={dlBtn("#7c3aed")}
                      >
                        ZIP
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function dlBtn(color: string): React.CSSProperties {
  return {
    fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px",
    borderRadius: "6px", textDecoration: "none",
    border: `1px solid ${color}40`,
    color,
    backgroundColor: `${color}10`,
  };
}
