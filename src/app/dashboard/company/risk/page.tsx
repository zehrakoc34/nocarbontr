import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { TrustScore } from "@/components/ui/TrustScore";

export default async function RiskPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const { data: connections } = await supabase
    .from("network_connections")
    .select(`
      id, status,
      supplier:organizations!network_connections_supplier_id_fkey(id, name, tax_id)
    `)
    .eq("company_id", member.org_id);

  const supplierIds = (connections ?? []).map((c: any) => c.supplier?.id).filter(Boolean);

  const { data: trustScores } = supplierIds.length > 0
    ? await supabase
        .from("trust_scores")
        .select("supplier_id, score, evidence_score, continuity_score, benchmark_score")
        .in("supplier_id", supplierIds)
    : { data: [] };

  const trustMap = Object.fromEntries(
    (trustScores ?? []).map((t: any) => [t.supplier_id, t])
  );

  const enriched = (connections ?? []).map((c: any) => {
    const trust = trustMap[c.supplier?.id] ?? { score: 0, evidence_score: 0, continuity_score: 0, benchmark_score: 0 };
    const riskLevel = trust.score >= 70 ? "low" : trust.score >= 40 ? "medium" : "high";
    return { ...c, trust, riskLevel };
  });

  const highRisk   = enriched.filter((c) => c.riskLevel === "high");
  const mediumRisk = enriched.filter((c) => c.riskLevel === "medium");
  const lowRisk    = enriched.filter((c) => c.riskLevel === "low");

  const riskVariant = (level: string) =>
    level === "high" ? "danger" : level === "medium" ? "warning" : "success";
  const riskLabel = (level: string) =>
    level === "high" ? "Yüksek Risk" : level === "medium" ? "Orta Risk" : "Düşük Risk";

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gradient-green">Risk Analizi</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          CBAM beyan riski — Trust Score bazlı tedarikçi güvenilirlik değerlendirmesi
        </p>
      </div>

      {/* Risk Özeti */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Yüksek Risk", count: highRisk.length, color: "var(--color-danger)", bg: "rgba(239,68,68,0.08)" },
          { label: "Orta Risk",   count: mediumRisk.length, color: "var(--color-warning)", bg: "rgba(234,179,8,0.08)" },
          { label: "Düşük Risk",  count: lowRisk.length,  color: "var(--color-success)", bg: "rgba(34,197,94,0.08)" },
        ].map((item) => (
          <div key={item.label} className="nctr-card text-center py-6 space-y-2"
            style={{ border: `1px solid ${item.color}33`, backgroundColor: item.bg }}>
            <p style={{ fontSize: "2rem", fontWeight: 700, color: item.color }}>{item.count}</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Yüksek Risk Uyarısı */}
      {highRisk.length > 0 && (
        <div className="nctr-card space-y-3"
          style={{ border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)" }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "1.25rem" }}>⚠️</span>
            <p style={{ fontWeight: 600, color: "var(--color-danger)" }}>
              {highRisk.length} tedarikçi CBAM beyan riskinde
            </p>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Trust Score 40'ın altındaki tedarikçilerin emisyon verileri AB CBAM beyanınızda yeterli güvenilirlik sağlamayabilir.
            Bu tedarikçilerden ek kanıt belgesi talep edin.
          </p>
        </div>
      )}

      {/* Tedarikçi Listesi */}
      {enriched.length === 0 ? (
        <div className="nctr-card-elevated text-center py-16 space-y-4">
          <span style={{ fontSize: "3rem" }}>🛡️</span>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Bağlı tedarikçi yok
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Tedarikçi ekledikten sonra risk analizi burada görünecek
          </p>
        </div>
      ) : (
        <div className="nctr-card overflow-hidden p-0">
          <table className="nctr-table">
            <thead>
              <tr>
                <th>Tedarikçi</th>
                <th>Risk Seviyesi</th>
                <th>Trust Score</th>
                <th>Kanıt</th>
                <th>Süreklilik</th>
                <th>Önlem</th>
              </tr>
            </thead>
            <tbody>
              {enriched
                .sort((a, b) => a.trust.score - b.trust.score)
                .map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <p style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                        {c.supplier?.name ?? "—"}
                      </p>
                      <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-text-disabled)" }}>
                        {c.supplier?.tax_id}
                      </p>
                    </td>
                    <td>
                      <Badge variant={riskVariant(c.riskLevel) as any}>
                        {riskLabel(c.riskLevel)}
                      </Badge>
                    </td>
                    <td style={{ minWidth: "130px" }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", minWidth: "2rem" }}>
                          {c.trust.score}
                        </span>
                        <div style={{ flex: 1 }}>
                          <TrustScore score={c.trust.score} showLabel={false} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                        {c.trust.evidence_score}/40
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                        {c.trust.continuity_score}/30
                      </span>
                    </td>
                    <td>
                      {c.riskLevel === "high" && (
                        <span style={{ fontSize: "0.75rem", color: "var(--color-danger)" }}>
                          Kanıt belgesi talep et
                        </span>
                      )}
                      {c.riskLevel === "medium" && (
                        <span style={{ fontSize: "0.75rem", color: "var(--color-warning)" }}>
                          Veri güncellemesi iste
                        </span>
                      )}
                      {c.riskLevel === "low" && (
                        <span style={{ fontSize: "0.75rem", color: "var(--color-success)" }}>
                          Beyan için hazır
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CBAM Bilgi Notu */}
      <div className="nctr-card-elevated space-y-2">
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
          Risk Seviyeleri Nasıl Hesaplanır?
        </p>
        <div className="space-y-1" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          <p><strong style={{ color: "var(--color-success)" }}>Düşük Risk (≥70):</strong> Kanıt belgeleri tam, veri sürekliliği yüksek, sektör benchmarkına uygun.</p>
          <p><strong style={{ color: "var(--color-warning)" }}>Orta Risk (40–69):</strong> Eksik kanıt veya düzensiz veri girişi. AB denetiminde ek açıklama gerekebilir.</p>
          <p><strong style={{ color: "var(--color-danger)" }}>Yüksek Risk (&lt;40):</strong> Yetersiz kanıt. CBAM beyannamesinde bu tedarikçinin verileri kabul edilmeyebilir.</p>
        </div>
      </div>
    </div>
  );
}
