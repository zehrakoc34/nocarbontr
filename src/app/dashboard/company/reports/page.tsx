import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCorporateReports } from "@/lib/supabase/queries";
import { Badge } from "@/components/ui/Badge";

const STATUS_MAP = {
  DRAFT:     { label: "Taslak",    variant: "warning" as const },
  READY:     { label: "Hazır",     variant: "success" as const },
  SUBMITTED: { label: "Gönderildi", variant: "info" as const },
};

const PERIOD_MAP: Record<string, string> = {
  Q1: "Ocak–Mart",
  Q2: "Nisan–Haziran",
  Q3: "Temmuz–Eylül",
  Q4: "Ekim–Aralık",
};

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const reports = await getCorporateReports(member.org_id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-green">CBAM Raporları</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            EU XSD v23.00 formatında çeyrek dönem beyan raporları
          </p>
        </div>
        <a href="/dashboard/company/reports/new" className="btn-primary">
          + Yeni Rapor Oluştur
        </a>
      </div>

      {/* Bilgi Kutusu */}
      <div className="nctr-card-elevated grid grid-cols-3 gap-6">
        {[
          { icon: "📋", title: "CBAM QReport", desc: "EU XSD v23.00 uyumlu XML çıktısı. CBAM portala yüklenebilir." },
          { icon: "🔐", title: "SHA-256 Kanıt", desc: "Kanıt belgeleriniz hash ile imzalanır, XML'e eklenir." },
          { icon: "⚡", title: "Anlık İndirme", desc: "Tüm veriler otomatik birleştirilerek XML oluşturulur." },
        ].map((item) => (
          <div key={item.title} className="flex gap-3">
            <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{item.icon}</span>
            <div>
              <p style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.875rem" }}>{item.title}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rapor Listesi */}
      {reports.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center gap-4 py-16"
          style={{ border: "1px dashed var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}
        >
          <span style={{ fontSize: "3rem" }}>📄</span>
          <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "1.125rem" }}>
            Henüz Rapor Yok
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", textAlign: "center", maxWidth: "28rem" }}>
            CBAM beyan dönemi için ilk raporunuzu oluşturun. İthal ettiğiniz malların emisyon verisini girin ve
            EU portalına yüklemeye hazır XML alın.
          </p>
          <a href="/dashboard/company/reports/new" className="btn-primary">
            + İlk Raporu Oluştur
          </a>
        </div>
      ) : (
        <div className="nctr-card p-0 overflow-hidden">
          <table className="nctr-table">
            <thead>
              <tr>
                <th>Dönem</th>
                <th>Yıl</th>
                <th>Durum</th>
                <th>Oluşturuldu</th>
                <th>Son Güncelleme</th>
                <th style={{ textAlign: "right" }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const status = STATUS_MAP[r.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.DRAFT;
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-bold"
                          style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "var(--color-primary-500)", border: "1px solid rgba(34,197,94,0.2)" }}>
                          {r.reporting_period}
                        </span>
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                          {PERIOD_MAP[r.reporting_period]}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{r.year}</td>
                    <td><Badge variant={status.variant}>{status.label}</Badge></td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                      {new Date(r.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                      {new Date(r.updated_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <a href={`/dashboard/company/reports/${r.id}`}
                          className="btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.25rem 0.75rem" }}>
                          Düzenle
                        </a>
                        <a href={`/api/reports/${r.id}/xml`} target="_blank"
                          className="btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.25rem 0.75rem" }}>
                          XML ↓
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CBAM Takvimi */}
      <div className="nctr-card space-y-4">
        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
          2026 CBAM Beyan Takvimi
        </p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { period: "Q1 2026", deadline: "31 Ağustos 2026", months: "Oca–Mar" },
            { period: "Q2 2026", deadline: "30 Kasım 2026",  months: "Nis–Haz" },
            { period: "Q3 2026", deadline: "28 Şubat 2027",  months: "Tem–Eyl" },
            { period: "Q4 2026", deadline: "31 Mayıs 2027",  months: "Eki–Ara" },
          ].map((item) => (
            <div key={item.period}
              className="rounded-xl p-4 space-y-2"
              style={{ backgroundColor: "var(--color-bg-input)", border: "1px solid var(--color-border)" }}>
              <p style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "0.9375rem" }}>
                {item.period}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{item.months}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-primary-500)", fontWeight: 500 }}>
                Son: {item.deadline}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
