import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { recalculateTrustScore } from "@/lib/trust/actions";
import { TrustScore } from "@/components/ui/TrustScore";
import { Badge } from "@/components/ui/Badge";

export default async function TrustPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  // Güncel skoru hesapla
  const score = await recalculateTrustScore(member.org_id);

  const { data: emissions } = await supabase
    .from("emission_data")
    .select("id, sector, year, emissions_ton_co2, data_source, created_at")
    .eq("supplier_id", member.org_id)
    .order("created_at", { ascending: false })
    .limit(10);

  const levelColor = score.level === "high"
    ? "var(--color-success)" : score.level === "medium"
    ? "var(--color-warning)" : "var(--color-danger)";

  const levelLabel = score.level === "high" ? "Yüksek Güven"
    : score.level === "medium" ? "Orta Güven" : "Düşük Güven";

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gradient-green">Güven Skorum</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          CBAM beyan güvenilirlik endeksi — kurumsal müşterilerin gördüğü skor
        </p>
      </div>

      {/* Ana Skor */}
      <div className="nctr-card-elevated text-center py-10 space-y-4 glow-green">
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Toplam Trust Score</p>
        <div style={{ fontSize: "5rem", fontWeight: 800, color: levelColor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {score.total}
        </div>
        <p style={{ fontSize: "1rem", color: levelColor, fontWeight: 600 }}>{levelLabel}</p>
        <div className="max-w-xs mx-auto">
          <TrustScore score={score.total} showLabel={false} />
        </div>
      </div>

      {/* Bileşen Dökümü */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Kanıt Belgesi", score: score.evidence_score,   max: 40, icon: "📄", hint: "Fatura / sayaç fotoğrafı" },
          { label: "Veri Sürekliliği", score: score.continuity_score, max: 30, icon: "📅", hint: "Aylık düzenli giriş" },
          { label: "Benchmark Uyumu",  score: score.benchmark_score,  max: 30, icon: "📊", hint: "Sektör ortalamasına yakınlık" },
        ].map((item) => (
          <div key={item.label} className="nctr-card space-y-3 text-center">
            <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{item.label}</p>
              <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {item.score}
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-disabled)", fontWeight: 400 }}>/{item.max}</span>
              </p>
            </div>
            <TrustScore score={Math.round((item.score / item.max) * 100)} showLabel={false} />
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-disabled)" }}>{item.hint}</p>
          </div>
        ))}
      </div>

      {/* Gelişim Önerileri */}
      {score.next_actions.length > 0 && (
        <div className="nctr-card space-y-3">
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Skoru Artırmak İçin
          </p>
          <div className="space-y-2">
            {score.next_actions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <span style={{ color: "var(--color-primary-500)", flexShrink: 0 }}>→</span>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Son Emisyon Kayıtları */}
      <div className="nctr-card space-y-4">
        <div className="flex items-center justify-between">
          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Emisyon Geçmişi
          </p>
          <a href="/dashboard/supplier/emissions" className="btn-ghost" style={{ fontSize: "0.8125rem" }}>
            + Yeni Giriş
          </a>
        </div>
        {!emissions || emissions.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", textAlign: "center", padding: "2rem 0" }}>
            Henüz emisyon verisi yok. İlk girişi yap ve skoru artır.
          </p>
        ) : (
          <table className="nctr-table">
            <thead>
              <tr><th>Sektör</th><th>Yıl</th><th>Emisyon</th><th>Kaynak</th><th>Tarih</th></tr>
            </thead>
            <tbody>
              {emissions.map((e) => (
                <tr key={e.id}>
                  <td style={{ color: "var(--color-text-primary)", fontWeight: 500, textTransform: "capitalize" }}>{e.sector}</td>
                  <td>{e.year}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{Number(e.emissions_ton_co2).toLocaleString("tr-TR")} tCO₂</td>
                  <td><Badge variant={e.data_source === "OCR" ? "success" : "info"}>{e.data_source}</Badge></td>
                  <td style={{ color: "var(--color-text-muted)" }}>{new Date(e.created_at).toLocaleDateString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
