import { StatCard } from "@/components/ui/StatCard";
import { TrustScore } from "@/components/ui/TrustScore";
import { Badge } from "@/components/ui/Badge";

export default function Home() {
  return (
    <main className="min-h-screen bg-grid" style={{ backgroundColor: "var(--color-bg-base)" }}>
      {/* Header */}
      <header
        style={{ backgroundColor: "var(--color-bg-surface)", borderBottom: "1px solid var(--color-border)" }}
        className="px-8 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary-600)" }}
          >
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>nocarbontr</span>
        </div>
        <nav className="flex items-center gap-1">
          <a href="#" className="nav-item-active">Dashboard</a>
          <a href="#" className="nav-item">Tedarikçiler</a>
          <a href="#" className="nav-item">Raporlar</a>
          <a href="#" className="nav-item">CBAM Risk</a>
        </nav>
        <button className="btn-primary">+ Tedarikçi Ekle</button>
      </header>

      <div className="px-8 py-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gradient-green">Supply Chain Hub</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Risk ve Uyumluluk Merkezi — 2026 CBAM Raporlama Dönemi
          </p>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Toplam Emisyon (Scope 1)" value="31,652" unit="tCO₂" delta={-4.2} deltaLabel="geçen yıla göre" />
          <StatCard label="Tedarikçi Risk Skoru" value="12.4" unit="ort." delta={2.1} deltaLabel="artış" />
          <StatCard label="Aktif Tedarikçi" value="247" delta={8} deltaLabel="bu ay eklendi" />
          <StatCard label="Sipariş Otomasyon Oranı" value="98.3" unit="%" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Emission Table */}
          <div className="col-span-2 nctr-card">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                Kategori Emisyonları
              </h2>
              <button className="btn-ghost" style={{ fontSize: "0.8125rem" }}>Tümünü Gör →</button>
            </div>
            <table className="nctr-table">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th>Emisyon (tCO₂)</th>
                  <th>Değişim</th>
                  <th>CBAM Durumu</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Demir-Çelik", val: "640.13", change: "+12.3%", risk: "high" as const },
                  { name: "Alüminyum",   val: "580.74", change: "+6.8%",  risk: "medium" as const },
                  { name: "Çimento",     val: "200.19", change: "-2.1%",  risk: "low" as const },
                  { name: "Kimyasallar", val: "158.07", change: "+0.4%",  risk: "low" as const },
                  { name: "Elektrik",    val: "101.75", change: "-8.5%",  risk: "low" as const },
                ].map((row) => (
                  <tr key={row.name}>
                    <td style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{row.name}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{row.val}</td>
                    <td style={{ color: row.change.startsWith("+") ? "var(--color-danger)" : "var(--color-success)" }}>
                      {row.change}
                    </td>
                    <td>
                      <Badge risk={row.risk}>
                        {row.risk === "high" ? "Yüksek Risk" : row.risk === "medium" ? "Orta Risk" : "Uyumlu"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trust Score Panel */}
          <div className="nctr-card space-y-4">
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
              Tedarikçi Güven Skoru
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              Kanıt belgesi, veri sürekliliği ve benchmark uyumu bileşik skoru
            </p>
            <div className="space-y-4 pt-2">
              {[
                { name: "Arcelor Mittal TR",  score: 92 },
                { name: "Assan Alüminyum",    score: 78 },
                { name: "Çimsa Çimento",      score: 65 },
                { name: "BASF Kimya",         score: 41 },
                { name: "TEİAŞ Elektrik",     score: 88 },
              ].map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{s.name}</span>
                    <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-text-muted)" }}>
                      {s.score}
                    </span>
                  </div>
                  <TrustScore score={s.score} showLabel={false} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Design System Showcase */}
        <div className="nctr-card-elevated space-y-4">
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Design System — Badge & Risk Indicators
          </h2>
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="success">Uyumlu</Badge>
            <Badge variant="warning">İnceleniyor</Badge>
            <Badge variant="danger">Riskli</Badge>
            <Badge variant="info">Beklemede</Badge>
            <span className="flex items-center gap-2 ml-4">
              <span className="risk-dot risk-dot-low" /><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Düşük</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="risk-dot risk-dot-medium" /><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Orta</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="risk-dot risk-dot-high" /><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Yüksek</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="risk-dot risk-dot-critical" /><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Kritik</span>
            </span>
          </div>
          <div className="flex gap-3 flex-wrap pt-2">
            <button className="btn-primary">Primary CTA</button>
            <button className="btn-secondary">Secondary</button>
            <button className="btn-ghost">Ghost</button>
            <button className="btn-danger">Tehlikeli</button>
          </div>
        </div>
      </div>
    </main>
  );
}
