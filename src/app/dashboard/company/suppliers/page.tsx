import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { TrustScore } from "@/components/ui/TrustScore";

export default async function SuppliersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  // Bağlı tedarikçiler + trust score + son emisyon
  const { data: connections } = await supabase
    .from("network_connections")
    .select(`
      id, status, created_at,
      supplier:organizations!network_connections_supplier_id_fkey(id, name, tax_id, type)
    `)
    .eq("company_id", member.org_id)
    .order("created_at", { ascending: false });

  // Her tedarikçi için trust score
  const supplierIds = (connections ?? [])
    .map((c: any) => c.supplier?.id)
    .filter(Boolean);

  const { data: trustScores } = await supabase
    .from("trust_scores")
    .select("supplier_id, score, evidence_score, continuity_score, benchmark_score")
    .in("supplier_id", supplierIds);

  const trustMap = Object.fromEntries(
    (trustScores ?? []).map((t: any) => [t.supplier_id, t])
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-green">Tedarikçi Ağı</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {(connections ?? []).length} bağlı tedarikçi
          </p>
        </div>
        <InviteButton companyOrgId={member.org_id} />
      </div>

      {!connections || connections.length === 0 ? (
        <div className="nctr-card-elevated text-center py-16 space-y-4">
          <span style={{ fontSize: "3rem" }}>🔗</span>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Henüz bağlı tedarikçi yok
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Tedarikçi davet ederek CBAM uyumluluk ağını oluşturmaya başla
          </p>
        </div>
      ) : (
        <div className="nctr-card overflow-hidden p-0">
          <table className="nctr-table">
            <thead>
              <tr>
                <th>Tedarikçi</th>
                <th>Vergi No</th>
                <th>Durum</th>
                <th>Trust Score</th>
                <th>Kanıt</th>
                <th>Süreklilik</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((c: any) => {
                const trust = trustMap[c.supplier?.id] ?? { score: 0, evidence_score: 0, continuity_score: 0 };
                return (
                  <tr key={c.id}>
                    <td>
                      <p style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                        {c.supplier?.name ?? "—"}
                      </p>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}>
                      {c.supplier?.tax_id}
                    </td>
                    <td>
                      <Badge variant={c.status === "ACTIVE" ? "success" : "warning"}>
                        {c.status === "ACTIVE" ? "Aktif" : "Bekliyor"}
                      </Badge>
                    </td>
                    <td style={{ minWidth: "140px" }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", minWidth: "2rem" }}>
                          {trust.score}
                        </span>
                        <div style={{ flex: 1 }}>
                          <TrustScore score={trust.score} showLabel={false} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                        {trust.evidence_score}/40
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                        {trust.continuity_score}/30
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InviteButton({ companyOrgId }: { companyOrgId: string }) {
  return (
    <form action={async (fd: FormData) => {
      "use server";
      const supabase = await (await import("@/lib/supabase/server")).createClient();
      const taxId = fd.get("tax_id") as string;
      const { data: supplier } = await supabase
        .from("organizations")
        .select("id")
        .eq("tax_id", taxId)
        .eq("type", "SUPPLIER")
        .single();
      if (!supplier) return;
      await supabase.from("network_connections").insert({
        company_id: companyOrgId,
        supplier_id: supplier.id,
        status: "PENDING",
      });
    }} className="flex gap-2">
      <input
        name="tax_id"
        placeholder="Tedarikçi Vergi No"
        className="nctr-input"
        style={{ width: "180px" }}
      />
      <button type="submit" className="btn-primary">Davet Et</button>
    </form>
  );
}
