import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { InviteForm } from "./InviteForm";
import { SupplierAccordion, type SupplierRow } from "./SupplierAccordion";

export default async function SuppliersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: connections } = await supabase
    .from("network_connections")
    .select(`
      id, status, created_at, temp_password, supplier_email,
      supplier:supplier_id(id, name, tax_id, type)
    `)
    .eq("company_id", member.org_id)
    .order("created_at", { ascending: false });

  // supplier_id'leri raw kolundan al (join null dönse bile güvenli)
  const { data: rawConns } = await admin
    .from("network_connections")
    .select("supplier_id")
    .eq("company_id", member.org_id);

  const supplierIds = (rawConns ?? []).map((c: any) => c.supplier_id).filter(Boolean);

  const [trustRes, reportsRes] = await Promise.all([
    admin
      .from("trust_scores")
      .select("supplier_id, score, evidence_score, continuity_score")
      .in("supplier_id", supplierIds.length ? supplierIds : ["00000000-0000-0000-0000-000000000000"]),

    admin
      .from("emission_data")
      .select("id, supplier_id, sector, year, emissions_ton_co2, status, created_at, reviewed_at, rejection_note")
      .in("supplier_id", supplierIds.length ? supplierIds : ["00000000-0000-0000-0000-000000000000"])
      .order("created_at", { ascending: false }),
  ]);

  const trustMap = Object.fromEntries(
    (trustRes.data ?? []).map((t: any) => [t.supplier_id, t])
  );

  const reportsBySupplier: Record<string, any[]> = {};
  for (const r of reportsRes.data ?? []) {
    if (!reportsBySupplier[r.supplier_id]) reportsBySupplier[r.supplier_id] = [];
    reportsBySupplier[r.supplier_id].push(r);
  }

  // org bilgilerini admin ile çek (join'a güvenmeden)
  const { data: orgs } = supplierIds.length
    ? await admin.from("organizations").select("id, name, tax_id").in("id", supplierIds)
    : { data: [] };
  const orgMap = Object.fromEntries((orgs ?? []).map((o: any) => [o.id, o]));

  // network_connections tablosundan supplier_id'yi doğrudan al
  const { data: fullConns } = await admin
    .from("network_connections")
    .select("id, supplier_id")
    .eq("company_id", member.org_id);
  const connToSupplier = Object.fromEntries(
    (fullConns ?? []).map((c: any) => [c.id, c.supplier_id])
  );

  const suppliers: SupplierRow[] = (connections ?? []).map((c: any) => {
    const sid = connToSupplier[c.id] ?? c.supplier?.id ?? "";
    const org = orgMap[sid];
    return {
      connectionId: c.id,
      supplierId: sid,
      name: org?.name ?? c.supplier?.name ?? "—",
      taxId: org?.tax_id ?? c.supplier?.tax_id ?? "—",
      email: c.supplier_email ?? "—",
      status: c.status,
      tempPassword: c.temp_password ?? null,
      address: null,
      phone: null,
      contactName: null,
      trust: trustMap[sid] ?? { score: 0, evidence_score: 0, continuity_score: 0 },
      reports: reportsBySupplier[sid] ?? [],
    };
  });

  const totalPending = suppliers.reduce(
    (n, s) => n + s.reports.filter((r) => r.status === "SUBMITTED").length,
    0
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-green">Tedarikçi Ağı</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {suppliers.length} bağlı tedarikçi
            {totalPending > 0 && (
              <span style={{
                marginLeft: "0.5rem",
                backgroundColor: "#f59e0b", color: "#000",
                borderRadius: "999px", padding: "1px 8px",
                fontSize: "0.72rem", fontWeight: 700,
              }}>
                {totalPending} rapor bekliyor
              </span>
            )}
          </p>
        </div>
        <InviteForm companyOrgId={member.org_id} />
      </div>

      <SupplierAccordion suppliers={suppliers} />
    </div>
  );
}
