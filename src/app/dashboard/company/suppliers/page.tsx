import { createClient } from "@/lib/supabase/server";
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

  const { data: connections } = await supabase
    .from("network_connections")
    .select(`
      id, status, created_at, temp_password, supplier_email,
      supplier:supplier_id(id, name, tax_id, type, address, phone, contact_name)
    `)
    .eq("company_id", member.org_id)
    .order("created_at", { ascending: false });

  const supplierIds = (connections ?? [])
    .map((c: any) => c.supplier?.id)
    .filter(Boolean);

  const [trustRes, reportsRes] = await Promise.all([
    supabase
      .from("trust_scores")
      .select("supplier_id, score, evidence_score, continuity_score")
      .in("supplier_id", supplierIds.length ? supplierIds : ["00000000-0000-0000-0000-000000000000"]),

    supabase
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

  const suppliers: SupplierRow[] = (connections ?? []).map((c: any) => ({
    connectionId: c.id,
    supplierId: c.supplier?.id ?? "",
    name: c.supplier?.name ?? "—",
    taxId: c.supplier?.tax_id ?? "—",
    email: c.supplier_email ?? "—",
    status: c.status,
    tempPassword: c.temp_password ?? null,
    address: c.supplier?.address ?? null,
    phone: c.supplier?.phone ?? null,
    contactName: c.supplier?.contact_name ?? null,
    trust: trustMap[c.supplier?.id] ?? { score: 0, evidence_score: 0, continuity_score: 0 },
    reports: reportsBySupplier[c.supplier?.id] ?? [],
  }));

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
