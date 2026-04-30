import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getInstallations } from "@/lib/supabase/queries";
import { deleteInstallation } from "@/lib/installations/actions";
import InstallationForm from "./InstallationForm";

export default async function InstallationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const installations = await getInstallations(member.org_id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gradient-green">Tesislerim</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          CBAM beyanında kullanılacak üretim tesisi ve operatör bilgileri
        </p>
      </div>

      {/* Tesis Listesi */}
      {installations.length > 0 && (
        <div className="nctr-card space-y-0 overflow-hidden p-0">
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
              Kayıtlı Tesisler ({installations.length})
            </p>
          </div>
          <div>
            {installations.map((inst, i) => (
              <div
                key={inst.id}
                className="px-6 py-4 flex items-start justify-between gap-4"
                style={{ borderBottom: i < installations.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-mono"
                      style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "var(--color-primary-500)", border: "1px solid rgba(34,197,94,0.2)" }}
                    >
                      {inst.installation_ref}
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.9375rem" }}>
                      {inst.installation_name}
                    </span>
                  </div>
                  {inst.economic_activity && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {inst.economic_activity}
                    </p>
                  )}
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    📍 {[inst.city, inst.country].filter(Boolean).join(", ")}
                    {inst.latitude && inst.longitude && (
                      <span className="ml-2 font-mono" style={{ fontSize: "0.75rem" }}>
                        ({inst.latitude}, {inst.longitude})
                      </span>
                    )}
                  </p>
                  {inst.operator_name && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                      Operatör: <strong>{inst.operator_name}</strong>
                      {inst.op_email && <span className="ml-2" style={{ color: "var(--color-text-muted)" }}>({inst.op_email})</span>}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <InstallationDeleteButton id={inst.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yeni Tesis Formu */}
      <div className="nctr-card space-y-6">
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
            Yeni Tesis Ekle
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            CBAM XML formatında InstallationOperator + Installation bloğu oluşturulur.
          </p>
        </div>
        <InstallationForm />
      </div>

      {/* Bilgi kutusu */}
      <div
        className="rounded-xl p-4 space-y-2"
        style={{ backgroundColor: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}
      >
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
          CBAM XML Yapısı Hakkında
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          Her tesis, CBAM Quarterly Report'ta <code style={{ color: "var(--color-primary-400)" }}>InstallationOperator</code> ve{" "}
          <code style={{ color: "var(--color-primary-400)" }}>Installation</code> bloğu olarak yer alır.
          Tesis ID formatı: <code style={{ color: "var(--color-primary-400)" }}>IN01, IN02...</code>
          Operatör ID formatı: <code style={{ color: "var(--color-primary-400)" }}>OP01-0001</code>
        </p>
      </div>
    </div>
  );
}

function InstallationDeleteButton({ id }: { id: string }) {
  async function handleDelete() {
    "use server";
    await deleteInstallation(id);
  }
  return (
    <form action={handleDelete}>
      <button type="submit" className="btn-danger" style={{ fontSize: "0.8125rem", padding: "0.25rem 0.75rem" }}>
        Sil
      </button>
    </form>
  );
}
