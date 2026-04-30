"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { TrustScore } from "@/components/ui/TrustScore";

const SECTOR_LABELS: Record<string, string> = {
  steel: "Demir-Çelik",
  aluminum: "Alüminyum",
  cement: "Çimento",
  chemicals: "Kimyasallar",
  electricity: "Elektrik",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: "Taslak",      color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  SUBMITTED: { label: "İnceleniyor", color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  APPROVED:  { label: "Onaylandı",   color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  REJECTED:  { label: "Reddedildi",  color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
};

export type SupplierRow = {
  connectionId: string;
  supplierId: string;
  name: string;
  taxId: string;
  email: string;
  status: string;
  tempPassword: string | null;
  address: string | null;
  phone: string | null;
  contactName: string | null;
  trust: { score: number; evidence_score: number; continuity_score: number };
  reports: {
    id: string;
    sector: string;
    year: number;
    emissions_ton_co2: number;
    status: string;
    created_at: string;
    reviewed_at: string | null;
    rejection_note: string | null;
  }[];
};

export function SupplierAccordion({ suppliers }: { suppliers: SupplierRow[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});

  if (suppliers.length === 0) {
    return (
      <div className="nctr-card-elevated text-center py-16 space-y-4">
        <span style={{ fontSize: "3rem" }}>🔗</span>
        <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Henüz bağlı tedarikçi yok
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Tedarikçi davet ederek CBAM uyumluluk ağını oluşturmaya başla
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {suppliers.map((s) => {
        const isOpen = open === s.supplierId;
        const cfg = STATUS_CONFIG;
        const submittedCount = s.reports.filter((r) => r.status === "SUBMITTED").length;

        return (
          <div
            key={s.supplierId}
            className="nctr-card p-0 overflow-hidden"
            style={{ transition: "box-shadow 0.15s" }}
          >
            {/* Accordion Header */}
            <button
              onClick={() => setOpen(isOpen ? null : s.supplierId)}
              className="w-full text-left"
              style={{ padding: "1rem 1.25rem", background: "transparent", border: "none", cursor: "pointer" }}
            >
              <div className="flex items-center gap-4">
                {/* Chevron */}
                <span style={{
                  fontSize: "0.75rem", color: "var(--color-text-muted)",
                  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s", flexShrink: 0,
                }}>▶</span>

                {/* İsim + VKN */}
                <div style={{ flex: "0 0 220px" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-primary)" }}>
                    {s.name || "—"}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                    VKN: {s.taxId}
                  </p>
                </div>

                {/* Email */}
                <p style={{ flex: "1", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                  {s.email || "—"}
                </p>

                {/* Durum badge */}
                <div style={{ flexShrink: 0 }}>
                  <Badge variant={s.status === "ACTIVE" ? "success" : "warning"}>
                    {s.status === "ACTIVE" ? "Aktif" : "Bekliyor"}
                  </Badge>
                </div>

                {/* Trust score */}
                <div style={{ flexShrink: 0, minWidth: "130px" }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-primary)", minWidth: "1.5rem" }}>
                      {s.trust.score}
                    </span>
                    <div style={{ flex: 1 }}>
                      <TrustScore score={s.trust.score} showLabel={false} />
                    </div>
                  </div>
                </div>

                {/* Bekleyen rapor sayısı */}
                {submittedCount > 0 && (
                  <span style={{
                    flexShrink: 0,
                    backgroundColor: "#f59e0b", color: "#000",
                    borderRadius: "999px", padding: "1px 8px",
                    fontSize: "0.7rem", fontWeight: 700,
                  }}>
                    {submittedCount} bekliyor
                  </span>
                )}

                {/* Rapor sayısı */}
                <span style={{ flexShrink: 0, fontSize: "0.75rem", color: "var(--color-text-disabled)" }}>
                  {s.reports.length} rapor
                </span>
              </div>
            </button>

            {/* Accordion Body */}
            {isOpen && (
              <div style={{ borderTop: "1px solid var(--color-border)", padding: "1.25rem" }}>
                <div className="grid grid-cols-2 gap-6">
                  {/* Sol: Şirket bilgileri */}
                  <div className="space-y-3">
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Şirket Bilgileri
                    </p>
                    <div className="space-y-2">
                      <InfoRow label="Şirket Adı" value={s.name} />
                      <InfoRow label="Vergi No" value={s.taxId} mono />
                      <InfoRow label="E-posta" value={s.email} />
                      <InfoRow label="Yetkili Kişi" value={s.contactName} />
                      <InfoRow label="Telefon" value={s.phone} />
                      <InfoRow label="Adres" value={s.address} />
                    </div>

                    {/* Trust detayı */}
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                        Güven Skoru
                      </p>
                      <div className="flex items-center gap-3 mb-2">
                        <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-primary-400)" }}>{s.trust.score}</span>
                        <div style={{ flex: 1 }}><TrustScore score={s.trust.score} showLabel={false} /></div>
                      </div>
                      <div className="flex gap-4">
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          Kanıt: <b style={{ color: "var(--color-text-secondary)" }}>{s.trust.evidence_score}/40</b>
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          Süreklilik: <b style={{ color: "var(--color-text-secondary)" }}>{s.trust.continuity_score}/30</b>
                        </span>
                      </div>
                    </div>

                    {/* Geçici şifre */}
                    {s.tempPassword && (
                      <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                          Geçici Şifre
                        </p>
                        <div className="flex items-center gap-2">
                          <code style={{ fontSize: "0.8rem", fontFamily: "monospace", color: "var(--color-text-primary)" }}>
                            {showPass[s.supplierId] ? s.tempPassword : "•".repeat(s.tempPassword.length)}
                          </code>
                          <button
                            onClick={() => setShowPass((p) => ({ ...p, [s.supplierId]: !p[s.supplierId] }))}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "0.8rem" }}
                          >
                            {showPass[s.supplierId] ? "Gizle" : "Göster"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sağ: Raporlar */}
                  <div className="space-y-3">
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Emisyon Raporları
                    </p>

                    {s.reports.length === 0 ? (
                      <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                        Henüz rapor gönderilmedi
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {s.reports.map((r) => {
                          const st = cfg[r.status] ?? cfg.DRAFT;
                          return (
                            <div key={r.id} style={{
                              borderRadius: "8px", border: "1px solid var(--color-border)",
                              padding: "0.75rem 1rem", backgroundColor: "var(--color-bg-elevated)",
                            }}>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                                      {SECTOR_LABELS[r.sector] ?? r.sector} — {r.year}
                                    </span>
                                    <span style={{
                                      fontSize: "0.7rem", fontWeight: 600, padding: "1px 8px",
                                      borderRadius: "999px", backgroundColor: st.bg, color: st.color,
                                    }}>
                                      {st.label}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                    {Number(r.emissions_ton_co2).toLocaleString("tr-TR", { maximumFractionDigits: 4 })} tCO₂
                                    {" · "}
                                    {new Date(r.created_at).toLocaleDateString("tr-TR")}
                                  </p>
                                  {r.rejection_note && (
                                    <p style={{ fontSize: "0.7rem", color: "#ef4444", marginTop: "2px" }}>
                                      Red notu: {r.rejection_note}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                                  <a
                                    href={`/dashboard/company/approvals?highlight=${r.id}`}
                                    style={{
                                      fontSize: "0.75rem", padding: "3px 10px",
                                      border: "1px solid var(--color-border)",
                                      borderRadius: "6px", color: "var(--color-text-secondary)",
                                      textDecoration: "none", backgroundColor: "transparent",
                                    }}
                                  >
                                    Görüntüle
                                  </a>
                                  <a
                                    href={`/dashboard/company/reports?add_emission=${r.id}&sector=${r.sector}&year=${r.year}&emissions=${r.emissions_ton_co2}`}
                                    style={{
                                      fontSize: "0.75rem", padding: "3px 10px",
                                      border: "1px solid var(--color-primary-600)",
                                      borderRadius: "6px", color: "var(--color-primary-400)",
                                      textDecoration: "none", backgroundColor: "rgba(34,197,94,0.06)",
                                    }}
                                  >
                                    + Ekle
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", minWidth: "90px", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "0.8125rem", color: value ? "var(--color-text-primary)" : "var(--color-text-disabled)", fontFamily: mono ? "monospace" : undefined }}>
        {value || "—"}
      </span>
    </div>
  );
}
