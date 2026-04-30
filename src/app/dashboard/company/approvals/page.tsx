import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApprovalActions } from "./ApprovalActions";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  if (user.user_metadata?.org_type !== "CORPORATE") redirect("/dashboard");

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  // Bağlı tedarikçilerin ID'lerini al
  const { data: connections } = await supabase
    .from("network_connections")
    .select("supplier_id, supplier:organizations!network_connections_supplier_id_fkey(id, name)")
    .eq("company_id", member.org_id);

  const supplierIds = (connections ?? []).map((c: any) => c.supplier_id).filter(Boolean);
  const supplierMap = Object.fromEntries(
    (connections ?? []).map((c: any) => [c.supplier_id, c.supplier?.name ?? "Bilinmeyen"])
  );

  // SUBMITTED durumundaki emission_data kayıtları
  const { data: pending } = supplierIds.length
    ? await supabase
        .from("emission_data")
        .select("id, supplier_id, sector, year, emissions_ton_co2, status, created_at, rejection_note")
        .in("supplier_id", supplierIds)
        .eq("status", "SUBMITTED")
        .order("created_at", { ascending: false })
    : { data: [] };

  // APPROVED / REJECTED olanlar (son 20)
  const { data: reviewed } = supplierIds.length
    ? await supabase
        .from("emission_data")
        .select("id, supplier_id, sector, year, emissions_ton_co2, status, reviewed_at, rejection_note")
        .in("supplier_id", supplierIds)
        .in("status", ["APPROVED", "REJECTED"])
        .order("reviewed_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const SECTOR_LABELS: Record<string, string> = {
    steel: "Demir-Çelik",
    aluminum: "Alüminyum",
    cement: "Çimento",
    chemicals: "Kimyasallar",
    electricity: "Elektrik",
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gradient-green">Onay Bekleyenler</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Tedarikçilerin gönderdiği emisyon raporlarını inceleyin ve onaylayın
        </p>
      </div>

      {/* Bekleyen onaylar */}
      <div className="space-y-3">
        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Bekleyen Onaylar
          {(pending ?? []).length > 0 && (
            <span
              style={{
                marginLeft: "8px",
                backgroundColor: "var(--color-warning, #f59e0b)",
                color: "#000",
                borderRadius: "999px",
                padding: "1px 8px",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {(pending ?? []).length}
            </span>
          )}
        </p>

        {!pending || pending.length === 0 ? (
          <div className="nctr-card-elevated text-center py-12">
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>
              Bekleyen onay yok
            </p>
          </div>
        ) : (
          <div className="nctr-card overflow-hidden p-0">
            <table className="nctr-table">
              <thead>
                <tr>
                  <th>Tedarikçi</th>
                  <th>Sektör</th>
                  <th>Yıl</th>
                  <th>Toplam Emisyon</th>
                  <th>Gönderim Tarihi</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                      {supplierMap[e.supplier_id] ?? "—"}
                    </td>
                    <td style={{ fontSize: "0.8125rem" }}>
                      {SECTOR_LABELS[e.sector] ?? e.sector}
                    </td>
                    <td style={{ fontSize: "0.8125rem", fontFamily: "monospace" }}>
                      {e.year}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--color-primary-400)", fontFamily: "monospace" }}>
                      {(e.emissions_ton_co2 ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 4 })} tCO₂
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {new Date(e.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td>
                      <ApprovalActions emissionId={e.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Geçmiş */}
      {reviewed && reviewed.length > 0 && (
        <div className="space-y-3">
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Geçmiş İncelemeler
          </p>
          <div className="nctr-card overflow-hidden p-0">
            <table className="nctr-table">
              <thead>
                <tr>
                  <th>Tedarikçi</th>
                  <th>Sektör</th>
                  <th>Yıl</th>
                  <th>Emisyon</th>
                  <th>Durum</th>
                  <th>İnceleme Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                      {supplierMap[e.supplier_id] ?? "—"}
                    </td>
                    <td style={{ fontSize: "0.8125rem" }}>
                      {SECTOR_LABELS[e.sector] ?? e.sector}
                    </td>
                    <td style={{ fontSize: "0.8125rem", fontFamily: "monospace" }}>{e.year}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}>
                      {(e.emissions_ton_co2 ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 4 })} tCO₂
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "2px 10px",
                          borderRadius: "999px",
                          backgroundColor: e.status === "APPROVED" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                          color: e.status === "APPROVED" ? "var(--color-primary-400)" : "#ef4444",
                        }}
                      >
                        {e.status === "APPROVED" ? "Onaylandı" : "Reddedildi"}
                      </span>
                      {e.rejection_note && (
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                          {e.rejection_note}
                        </p>
                      )}
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {e.reviewed_at ? new Date(e.reviewed_at).toLocaleDateString("tr-TR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
