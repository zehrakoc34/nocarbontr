import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApprovalActions } from "./ApprovalActions";

const SECTOR_LABELS: Record<string, string> = {
  steel: "Demir-Çelik",
  aluminum: "Alüminyum",
  cement: "Çimento",
  chemicals: "Kimyasallar",
  electricity: "Elektrik",
};

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  if (user.user_metadata?.org_type !== "CORPORATE") redirect("/dashboard");

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  // Bağlı tedarikçiler + org bilgileri
  const { data: connections } = await supabase
    .from("network_connections")
    .select("supplier_id, status, created_at, supplier:supplier_id(id, name, tax_id)")
    .eq("company_id", member.org_id)
    .order("created_at", { ascending: false });

  const supplierIds = (connections ?? []).map((c: any) => c.supplier_id).filter(Boolean);

  const supplierMap = Object.fromEntries(
    (connections ?? []).map((c: any) => [c.supplier_id, {
      name: c.supplier?.name ?? "—",
      tax_id: c.supplier?.tax_id ?? "—",
      status: c.status,
      joined: c.created_at,
    }])
  );

  // Tüm raporları çek (SUBMITTED + APPROVED + REJECTED) tarihe göre
  const { data: allReports } = supplierIds.length
    ? await supabase
        .from("emission_data")
        .select("id, supplier_id, sector, year, emissions_ton_co2, status, created_at, reviewed_at, rejection_note")
        .in("supplier_id", supplierIds)
        .in("status", ["SUBMITTED", "APPROVED", "REJECTED"])
        .order("created_at", { ascending: false })
    : { data: [] };

  const pending   = (allReports ?? []).filter((r: any) => r.status === "SUBMITTED");
  const reviewed  = (allReports ?? []).filter((r: any) => r.status !== "SUBMITTED");

  return (
    <div className="p-8 space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-gradient-green">Tedarikçi Raporları</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Tedarikçilerin emisyon raporlarını inceleyin, onaylayın veya reddedin
        </p>
      </div>

      {/* Tedarikçi Künyesi */}
      {(connections ?? []).length > 0 && (
        <div className="nctr-card space-y-3">
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Bağlı Tedarikçiler
          </p>
          <div className="grid grid-cols-1 gap-2">
            {(connections ?? []).map((c: any) => (
              <div key={c.supplier_id} className="flex items-center justify-between py-2"
                style={{ borderBottom: "1px solid var(--color-border)" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                    {c.supplier?.name ?? "—"}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                    Vergi No: {c.supplier?.tax_id ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <span style={{
                    fontSize: "0.75rem", fontWeight: 600, padding: "2px 10px", borderRadius: "999px",
                    backgroundColor: c.status === "ACTIVE" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                    color: c.status === "ACTIVE" ? "var(--color-primary-400)" : "#f59e0b",
                  }}>
                    {c.status === "ACTIVE" ? "Aktif" : "Bekliyor"}
                  </span>
                  <p style={{ fontSize: "0.7rem", color: "var(--color-text-disabled)", marginTop: "4px" }}>
                    {new Date(c.created_at).toLocaleDateString("tr-TR")} tarihinden beri
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onay Bekleyenler */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
            Onay Bekleyen Raporlar
          </p>
          {pending.length > 0 && (
            <span style={{
              backgroundColor: "#f59e0b", color: "#000",
              borderRadius: "999px", padding: "1px 10px",
              fontSize: "0.75rem", fontWeight: 700,
            }}>
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="nctr-card text-center py-10">
            <p style={{ color: "var(--color-text-muted)" }}>Onay bekleyen rapor yok</p>
          </div>
        ) : (
          <div className="nctr-card overflow-hidden p-0">
            <table className="nctr-table">
              <thead>
                <tr>
                  <th>Tedarikçi</th>
                  <th>Vergi No</th>
                  <th>Sektör</th>
                  <th>Yıl</th>
                  <th>Toplam Emisyon</th>
                  <th>Gönderim Tarihi</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((e: any) => {
                  const sup = supplierMap[e.supplier_id];
                  return (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {sup?.name ?? "—"}
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                        {sup?.tax_id ?? "—"}
                      </td>
                      <td style={{ fontSize: "0.8125rem" }}>
                        {SECTOR_LABELS[e.sector] ?? e.sector}
                      </td>
                      <td style={{ fontSize: "0.8125rem", fontFamily: "monospace" }}>{e.year}</td>
                      <td style={{ fontWeight: 700, color: "var(--color-primary-400)", fontFamily: "monospace" }}>
                        {(e.emissions_ton_co2 ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 4 })} tCO₂
                      </td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                        {new Date(e.created_at).toLocaleDateString("tr-TR")}
                      </td>
                      <td>
                        <ApprovalActions emissionId={e.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Geçmiş Raporlar */}
      <div className="space-y-3">
        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
          Geçmiş Raporlar
        </p>

        {reviewed.length === 0 ? (
          <div className="nctr-card text-center py-10">
            <p style={{ color: "var(--color-text-muted)" }}>Henüz incelenmiş rapor yok</p>
          </div>
        ) : (
          <div className="nctr-card overflow-hidden p-0">
            <table className="nctr-table">
              <thead>
                <tr>
                  <th>Tedarikçi</th>
                  <th>Vergi No</th>
                  <th>Sektör</th>
                  <th>Yıl</th>
                  <th>Emisyon</th>
                  <th>Gönderim</th>
                  <th>İnceleme</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((e: any) => {
                  const sup = supplierMap[e.supplier_id];
                  return (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {sup?.name ?? "—"}
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                        {sup?.tax_id ?? "—"}
                      </td>
                      <td style={{ fontSize: "0.8125rem" }}>
                        {SECTOR_LABELS[e.sector] ?? e.sector}
                      </td>
                      <td style={{ fontSize: "0.8125rem", fontFamily: "monospace" }}>{e.year}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}>
                        {(e.emissions_ton_co2 ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 4 })} tCO₂
                      </td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                        {new Date(e.created_at).toLocaleDateString("tr-TR")}
                      </td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                        {e.reviewed_at ? new Date(e.reviewed_at).toLocaleDateString("tr-TR") : "—"}
                      </td>
                      <td>
                        <div>
                          <span style={{
                            fontSize: "0.75rem", fontWeight: 600, padding: "2px 10px",
                            borderRadius: "999px",
                            backgroundColor: e.status === "APPROVED" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                            color: e.status === "APPROVED" ? "var(--color-primary-400)" : "#ef4444",
                          }}>
                            {e.status === "APPROVED" ? "✓ Onaylandı" : "✗ Reddedildi"}
                          </span>
                          {e.rejection_note && (
                            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                              {e.rejection_note}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
