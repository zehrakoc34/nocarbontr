import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCorporateDashboardData, getSupplierDashboardData } from "@/lib/supabase/queries";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { TrustScore } from "@/components/ui/TrustScore";

const SECTOR_LABELS: Record<string, string> = {
  steel: "Demir-Çelik",
  aluminum: "Alüminyum",
  cement: "Çimento",
  chemicals: "Kimyasallar",
  electricity: "Elektrik",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const orgType = user.user_metadata?.org_type ?? "SUPPLIER";
  const orgName = user.user_metadata?.org_name ?? "Şirketiniz";

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/auth/login");

  if (orgType === "CORPORATE") {
    const data = await getCorporateDashboardData(member.org_id);
    return <CompanyDashboard orgName={orgName} data={data} />;
  }

  const data = await getSupplierDashboardData(member.org_id);
  return <SupplierDashboard orgName={orgName} data={data} />;
}

// ─── Corporate Dashboard ──────────────────────────────────────
function CompanyDashboard({
  orgName,
  data,
}: {
  orgName: string;
  data: Awaited<ReturnType<typeof getCorporateDashboardData>>;
}) {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gradient-green">Supply Chain Hub</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          {orgName} — 2026 CBAM Raporlama Dönemi
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Toplam Emisyon (2026)"
          value={data.totalEmissions.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
          unit="tCO₂"
        />
        <StatCard
          label="Ort. Güven Skoru"
          value={String(data.avgTrustScore)}
          unit="/100"
        />
        <StatCard
          label="Aktif Tedarikçi"
          value={String(data.activeSuppliers)}
        />
        <StatCard
          label="Onay Bekleyen"
          value={String(data.pendingConnections)}
          unit="rapor"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Sektör Emisyon Tablosu */}
        <div className="col-span-2 nctr-card">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
              Kategori Emisyonları
            </h2>
            <Badge variant="info">Canlı — 2026</Badge>
          </div>

          {data.emissionsBySector.length === 0 ? (
            <div className="text-center py-8" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              Henüz bağlı tedarikçiden emisyon verisi yok.
            </div>
          ) : (
            <table className="nctr-table">
              <thead>
                <tr><th>Sektör</th><th>Emisyon (tCO₂)</th><th>Pay</th><th>CBAM Durumu</th></tr>
              </thead>
              <tbody>
                {data.emissionsBySector.map((row) => {
                  const share =
                    data.totalEmissions > 0
                      ? ((row.total / data.totalEmissions) * 100).toFixed(1)
                      : "0";
                  const risk = row.total > 500 ? "high" : row.total > 150 ? "medium" : "low";
                  return (
                    <tr key={row.sector}>
                      <td style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                        {SECTOR_LABELS[row.sector] ?? row.sector}
                      </td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>
                        {row.total.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: "var(--color-text-muted)" }}>{share}%</td>
                      <td>
                        <Badge risk={risk}>
                          {risk === "high" ? "Yüksek Risk" : risk === "medium" ? "Orta Risk" : "Uyumlu"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Tedarikçi Güven Skorları */}
        <div className="nctr-card space-y-4">
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Tedarikçi Güven Skorları
          </h2>
          {data.topSuppliers.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              Henüz bağlı tedarikçi yok.
            </p>
          ) : (
            <div className="space-y-4">
              {data.topSuppliers.slice(0, 6).map((s) => (
                <div key={s.id}>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}
                      className="truncate pr-2 max-w-[150px]">
                      {s.name}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-text-muted)", flexShrink: 0 }}>
                      {s.trustScore}
                    </span>
                  </div>
                  <TrustScore score={s.trustScore} showLabel={false} />
                </div>
              ))}
            </div>
          )}
          <a href="/dashboard/company/suppliers" className="btn-ghost w-full justify-center"
            style={{ fontSize: "0.8125rem", display: "flex" }}>
            Tedarikçi Ağına Git →
          </a>
        </div>
      </div>

      {/* Hızlı Erişim */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: "/dashboard/company/suppliers", title: "Tedarikçi Ağı", desc: "Bağlantı yönetimi", icon: "🔗" },
          { href: "/dashboard/company/reports", title: "CBAM Raporları", desc: "XML export & beyan", icon: "📋" },
          { href: "/dashboard/company/risk", title: "Risk Analizi", desc: "Sektör bazlı risk", icon: "⚠️" },
        ].map((item) => (
          <a key={item.href} href={item.href}
            className="nctr-card flex items-center gap-4 cursor-pointer hover:border-border-strong transition-colors">
            <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
            <div>
              <p style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.875rem" }}>{item.title}</p>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>{item.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Supplier Dashboard ───────────────────────────────────────
function SupplierDashboard({
  orgName,
  data,
}: {
  orgName: string;
  data: Awaited<ReturnType<typeof getSupplierDashboardData>>;
}) {
  const recentEmissions = data.emissions.slice(0, 5);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gradient-green">Karbon Ayak İzi Merkezi</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          {orgName} — 2026 CBAM Beyan Dönemi
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Toplam Emisyon (2026)"
          value={data.totalEmissions.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
          unit="tCO₂"
        />
        <StatCard
          label="Güven Skoru"
          value={String(data.trustScore)}
          unit="/100"
        />
        <StatCard
          label="Bağlı Şirket"
          value={String(data.connectedCompanies)}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Son Emisyon Kayıtları */}
        <div className="col-span-2 nctr-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
              Son Emisyon Kayıtları
            </h2>
            <a href="/dashboard/supplier/emissions" className="btn-ghost" style={{ fontSize: "0.8125rem" }}>
              + Yeni Giriş
            </a>
          </div>

          {recentEmissions.length === 0 ? (
            <div className="nctr-card-elevated text-center py-10 space-y-3">
              <span style={{ fontSize: "2rem" }}>📊</span>
              <h3 style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>İlk Emisyon Verinizi Girin</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Sektörünüze uygun formu doldurun.
              </p>
              <a href="/dashboard/supplier/emissions" className="btn-primary inline-flex">
                Emisyon Girişi Yap →
              </a>
            </div>
          ) : (
            <table className="nctr-table">
              <thead>
                <tr><th>Sektör</th><th>Yıl</th><th>Emisyon</th><th>Kaynak</th><th>Tarih</th></tr>
              </thead>
              <tbody>
                {recentEmissions.map((e) => (
                  <tr key={e.id}>
                    <td style={{ color: "var(--color-text-primary)", fontWeight: 500, textTransform: "capitalize" }}>
                      {SECTOR_LABELS[e.sector] ?? e.sector}
                    </td>
                    <td>{e.year}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                      {Number(e.emissions_ton_co2).toLocaleString("tr-TR", { maximumFractionDigits: 4 })} tCO₂
                    </td>
                    <td><Badge variant={e.data_source === "OCR" ? "success" : "info"}>{e.data_source}</Badge></td>
                    <td style={{ color: "var(--color-text-muted)" }}>
                      {new Date(e.created_at).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Güven Skoru + Hızlı Erişim */}
        <div className="space-y-4">
          <div className="nctr-card text-center space-y-3">
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Güven Skoru</p>
            <p className="text-gradient-green" style={{ fontSize: "3rem", fontWeight: 800 }}>
              {data.trustScore}
            </p>
            <TrustScore score={data.trustScore} showLabel={true} />
            <a href="/dashboard/supplier/trust" className="btn-ghost w-full justify-center"
              style={{ fontSize: "0.8125rem", display: "flex" }}>
              Skoru Artır →
            </a>
          </div>

          <div className="space-y-2">
            {[
              { href: "/dashboard/supplier/calculator", title: "CBAM Hesaplayıcı", icon: "🧮" },
              { href: "/dashboard/supplier/installations", title: "Tesislerim", icon: "🏭" },
              { href: "/dashboard/supplier/evidence", title: "Kanıt Yükle", icon: "📎" },
              { href: "/dashboard/supplier/scope", title: "Kapsam Analizi", icon: "🔍" },
            ].map((item) => (
              <a key={item.href} href={item.href}
                className="nctr-card flex items-center gap-3 cursor-pointer hover:border-border-strong transition-colors py-3">
                <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>
                  {item.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
