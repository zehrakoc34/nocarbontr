import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getEvidenceFiles } from "@/lib/supabase/queries";
import { deleteEvidence } from "@/lib/evidence/actions";
import EvidenceUploadForm from "./EvidenceUploadForm";
import { Badge } from "@/components/ui/Badge";

export default async function EvidencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) redirect("/dashboard");

  const { data: emissions } = await supabase
    .from("emission_data")
    .select("id, sector, year, emissions_ton_co2")
    .eq("supplier_id", member.org_id)
    .order("year", { ascending: false });

  const evidenceFiles = await getEvidenceFiles(member.org_id);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gradient-green">Kanıt Belgesi Yükle</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Fatura, sayaç okuma veya üçüncü taraf emisyon raporu yükleyin. SHA-256 hash ile doğrulanır.
        </p>
      </div>

      <div className="nctr-card space-y-6">
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
            Yeni Kanıt Belgesi
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            Desteklenen formatlar: PDF, DOCX, XLSX, JPG, PNG — max 20 MB
          </p>
        </div>

        {emissions && emissions.length > 0 ? (
          <EvidenceUploadForm emissions={emissions} />
        ) : (
          <div
            className="rounded-xl p-6 text-center space-y-3"
            style={{ backgroundColor: "rgba(34,197,94,0.04)", border: "1px dashed rgba(34,197,94,0.2)" }}
          >
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              Kanıt yüklemek için önce en az bir emisyon kaydı oluşturmalısınız.
            </p>
            <a href="/dashboard/supplier/emissions" className="btn-primary inline-flex">
              Emisyon Girişi Yap →
            </a>
          </div>
        )}
      </div>

      <div className="nctr-card space-y-0 overflow-hidden p-0">
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
            Yüklenen Belgeler ({evidenceFiles.length})
          </p>
          <Badge variant="info">SHA-256 Doğrulamalı</Badge>
        </div>

        {evidenceFiles.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              Henüz kanıt belgesi yüklenmedi.
            </p>
          </div>
        ) : (
          <div>
            {evidenceFiles.map((ev, i) => {
              const filename = ev.file_url.split("/").pop()?.split("?")[0] ?? "dosya";
              const ext = filename.split(".").pop()?.toUpperCase() ?? "?";
              const SECTOR: Record<string, string> = {
                steel: "Demir-Çelik", aluminum: "Alüminyum",
                cement: "Çimento", chemicals: "Kimyasallar", electricity: "Elektrik",
              };
              return (
                <div key={ev.id} className="px-6 py-4 flex items-start justify-between gap-4"
                  style={{ borderBottom: i < evidenceFiles.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}>
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)" }}>
                      <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-primary-500)" }}>{ext}</span>
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ fontWeight: 500, color: "var(--color-text-primary)", fontSize: "0.875rem" }} className="truncate">
                          {filename}
                        </p>
                        {ev.emission && (
                          <Badge variant="info">
                            {SECTOR[ev.emission.sector] ?? ev.emission.sector} {ev.emission.year}
                          </Badge>
                        )}
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {new Date(ev.upload_date).toLocaleDateString("tr-TR", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                      <p className="font-mono truncate"
                        style={{ fontSize: "0.6875rem", color: "var(--color-text-disabled)" }}
                        title={ev.verification_hash}>
                        SHA-256: {ev.verification_hash.slice(0, 40)}…
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={ev.file_url} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary" style={{ fontSize: "0.8125rem", padding: "0.25rem 0.75rem" }}>
                      İndir
                    </a>
                    <EvidenceDeleteButton id={ev.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl p-4 space-y-2"
        style={{ backgroundColor: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)" }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
          Güven Skoru Etkisi
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          Her kanıt belgesi güven skorunuza <strong style={{ color: "var(--color-primary-500)" }}>+10 puan</strong> ekler (max 40 puan).
          CBAM XML raporunda <code style={{ color: "var(--color-primary-400)" }}>SupportingDocuments</code> bloğuna otomatik eklenir.
        </p>
      </div>
    </div>
  );
}

function EvidenceDeleteButton({ id }: { id: string }) {
  async function handleDelete() {
    "use server";
    await deleteEvidence(id);
  }
  return (
    <form action={handleDelete}>
      <button type="submit" className="btn-danger" style={{ fontSize: "0.8125rem", padding: "0.25rem 0.75rem" }}>
        Sil
      </button>
    </form>
  );
}
