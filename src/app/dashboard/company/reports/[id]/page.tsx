import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { deleteImportedGood, finalizeReport } from "@/lib/reports/actions";
import { getReportArchives } from "@/lib/supabase/queries";
import AddGoodForm from "./AddGoodForm";
import AddEmissionForm from "./AddEmissionForm";
import FinalizeForm from "./FinalizeForm";
import ArchiveTab from "./ArchiveTab";

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "detail" } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const { data: report } = await supabase
    .from("cbam_reports")
    .select("*")
    .eq("id", id)
    .eq("org_id", member.org_id)
    .single();

  if (!report) notFound();

  const statusColor = report.status === "READY" ? "success"
    : report.status === "SUBMITTED" ? "info" : "warning";
  const isEditable = report.status === "DRAFT";

  // ─── Arşiv sekmesi ───────────────────────────────────────────
  if (tab === "archive") {
    const archives = await getReportArchives(member.org_id, id);

    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <ReportHeader id={id} report={report} statusColor={statusColor} />
        <TabNav id={id} active="archive" hasArchive={report.current_version > 0} />
        <ArchiveTab reportId={id} archives={archives} />
      </div>
    );
  }

  // ─── Rapor detay sekmesi ──────────────────────────────────────
  const { data: goods } = await supabase
    .from("cbam_imported_goods")
    .select("*")
    .eq("report_id", id)
    .order("item_number");

  const goodIds = (goods ?? []).map((g) => g.id);
  const { data: emissions } = goodIds.length > 0
    ? await supabase
        .from("cbam_goods_emissions")
        .select("*, installations(installation_name, installation_ref)")
        .in("good_id", goodIds)
    : { data: [] };

  const { data: connections } = await supabase
    .from("network_connections")
    .select("supplier_id")
    .eq("company_id", member.org_id)
    .eq("status", "ACTIVE");

  const supplierIds = (connections ?? []).map((c) => c.supplier_id);
  const { data: installations } = supplierIds.length > 0
    ? await supabase
        .from("installations")
        .select("id, installation_ref, installation_name, country, city, supplier_id")
        .in("supplier_id", supplierIds)
    : { data: [] };

  const emissionsByGood = Object.fromEntries(
    (goods ?? []).map((g) => [
      g.id,
      (emissions ?? []).filter((e) => e.good_id === g.id),
    ])
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <ReportHeader id={id} report={report} statusColor={statusColor} />
      <TabNav id={id} active="detail" hasArchive={report.current_version > 0} />

      {/* Rapor Başlık Özeti */}
      <div className="nctr-card grid grid-cols-4 gap-6">
        {[
          { label: "Dönem", value: `${report.reporting_period} / ${report.year}` },
          { label: "Rol", value: report.declarant_role === "01" ? "İthalatçı" : "Temsilci" },
          { label: "EORI/Vergi No", value: report.declarant_id_number ?? "—" },
          { label: "Toplam Mal", value: String(goods?.length ?? 0) },
        ].map((item) => (
          <div key={item.label}>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>{item.label}</p>
            <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* İthal Edilen Mallar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            İthal Edilen Mallar
          </h2>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {goods?.length ?? 0} kayıt
          </span>
        </div>

        {(goods ?? []).map((good) => {
          const goodEmissions = emissionsByGood[good.id] ?? [];

          async function handleDeleteGood() {
            "use server";
            await deleteImportedGood(good.id, id);
          }

          return (
            <div key={good.id} className="nctr-card space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded font-mono text-xs"
                      style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "var(--color-primary-500)", border: "1px solid rgba(34,197,94,0.2)" }}>
                      Kalem {good.item_number}
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {good.commodity_description ?? `HS: ${good.hs_code ?? "—"}`}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    CN: {good.cn_code ?? "—"} · Menşe: <strong>{good.origin_country}</strong> ·
                    Miktar: {good.net_mass ? `${good.net_mass} kg` : good.supplementary_units ? `${good.supplementary_units}` : "—"} ·
                    Bölge: {good.import_area}
                  </p>
                </div>
                {isEditable && (
                  <form action={handleDeleteGood}>
                    <button type="submit" className="btn-danger"
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}>Sil</button>
                  </form>
                )}
              </div>

              {goodEmissions.length > 0 && (
                <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border-subtle)" }}>
                  <table className="nctr-table">
                    <thead>
                      <tr>
                        <th>Tesis</th>
                        <th>Üretim Ülkesi</th>
                        <th>Doğrudan SEE</th>
                        <th>Dolaylı SEE</th>
                        <th>Yöntem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goodEmissions.map((e: Record<string, any>) => (
                        <tr key={e.id}>
                          <td style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
                            {e.installations?.installation_name ?? "—"}
                          </td>
                          <td>{e.production_country}</td>
                          <td style={{ fontVariantNumeric: "tabular-nums" }}>
                            {e.direct_see != null ? `${e.direct_see} tCO₂/t` : "—"}
                          </td>
                          <td style={{ fontVariantNumeric: "tabular-nums" }}>
                            {e.indirect_see != null ? `${e.indirect_see} tCO₂/t` : "—"}
                          </td>
                          <td style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            {e.direct_reporting_type_method}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {isEditable && (
                <AddEmissionForm goodId={good.id} installations={installations ?? []} />
              )}
            </div>
          );
        })}

        {isEditable && (
          <div className="nctr-card-elevated space-y-4">
            <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
              + İthal Edilen Mal Ekle
            </p>
            <AddGoodForm reportId={id} />
          </div>
        )}
      </div>

      {isEditable && (goods?.length ?? 0) > 0 && (
        <FinalizeForm reportId={id} onFinalize={finalizeReport} />
      )}

      {report.status !== "DRAFT" && (
        <div className="nctr-card space-y-3">
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            İmza Bilgileri
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "İmzalayan", value: report.signature },
              { label: "İmza Yeri", value: report.signature_place },
              { label: "Pozisyon", value: report.position_of_person },
            ].map((f) => (
              <div key={f.label}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{f.label}</p>
                <p style={{ fontWeight: 500, color: "var(--color-text-primary)", fontSize: "0.875rem" }}>
                  {f.value ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Paylaşımlı header bileşeni ───────────────────────────────
function ReportHeader({
  id, report, statusColor,
}: {
  id: string;
  report: Record<string, any>;
  statusColor: "success" | "info" | "warning";
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <a href="/dashboard/company/reports" className="btn-ghost inline-flex mb-3"
          style={{ fontSize: "0.8125rem" }}>← Raporlara Dön</a>
        <h1 className="text-2xl font-bold text-gradient-green">
          CBAM Raporu — {report.year} {report.reporting_period}
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          {report.declarant_name} · ID:{" "}
          <code style={{ color: "var(--color-primary-400)", fontSize: "0.8125rem" }}>
            {id.slice(0, 8)}…
          </code>
          {report.current_version > 0 && (
            <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              · Arşiv v{report.current_version}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={statusColor}>
          {report.status === "DRAFT" ? "Taslak" : report.status === "READY" ? "Hazır" : "Gönderildi"}
        </Badge>
        <a href={`/api/reports/${id}/xml`} target="_blank" className="btn-primary"
          style={{ fontSize: "0.8125rem" }}>
          XML İndir (XSD v23.00)
        </a>
      </div>
    </div>
  );
}

// ─── Tab navigation ───────────────────────────────────────────
function TabNav({ id, active, hasArchive }: { id: string; active: string; hasArchive: boolean }) {
  const tabs = [
    { key: "detail", label: "Rapor Detayı" },
    { key: "archive", label: hasArchive ? "🗄️ Arşiv Geçmişi" : "Arşiv Geçmişi" },
  ];

  return (
    <div style={{ borderBottom: "1px solid var(--color-border)", display: "flex", gap: "0.25rem" }}>
      {tabs.map((t) => (
        <a
          key={t.key}
          href={`/dashboard/company/reports/${id}?tab=${t.key}`}
          style={{
            padding: "0.6rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: active === t.key ? 600 : 400,
            color: active === t.key ? "var(--color-primary-400)" : "var(--color-text-muted)",
            borderBottom: active === t.key ? "2px solid var(--color-primary-400)" : "2px solid transparent",
            marginBottom: "-1px",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
        >
          {t.label}
        </a>
      ))}
    </div>
  );
}
