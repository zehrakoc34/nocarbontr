"use client";

import { useActionState } from "react";
import { createReport, type ReportHeaderState } from "@/lib/reports/actions";

const PERIODS = [
  { value: "Q1", label: "Q1 — Ocak–Mart" },
  { value: "Q2", label: "Q2 — Nisan–Haziran" },
  { value: "Q3", label: "Q3 — Temmuz–Eylül" },
  { value: "Q4", label: "Q4 — Ekim–Aralık" },
];

const ROLES = [
  { value: "01", label: "01 — İthalatçı (Importer)" },
  { value: "02", label: "02 — Temsilci (Representative)" },
];

const initial: ReportHeaderState = {};

export default function NewReportPage() {
  const [state, formAction, pending] = useActionState(createReport, initial);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <a href="/dashboard/company/reports" className="btn-ghost mb-4 inline-flex"
          style={{ fontSize: "0.8125rem" }}>
          ← Raporlara Dön
        </a>
        <h1 className="text-2xl font-bold text-gradient-green">Yeni CBAM Raporu</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          EU XSD v23.00 formatında çeyrek dönem beyan raporu oluşturun
        </p>
      </div>

      <form action={formAction} className="nctr-card space-y-6">
        {/* Dönem */}
        <div className="space-y-3">
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Raporlama Dönemi
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PERIODS.map((p) => (
              <label key={p.value}
                className="nctr-card flex items-center gap-3 cursor-pointer p-4"
                style={{ position: "relative" }}>
                <input type="radio" name="reporting_period" value={p.value}
                  required className="sr-only" />
                <div className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                  style={{ borderColor: "var(--color-primary-500)" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-primary)", fontWeight: 500 }}>
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Yıl */}
        <div className="space-y-1.5">
          <label style={lbl}>Raporlama Yılı</label>
          <select name="year" required className="nctr-input" defaultValue="2026">
            {[2026, 2027, 2028, 2029].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="border-t pt-6 space-y-4" style={{ borderColor: "var(--color-border)" }}>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Beyan Eden (Declarant) Bilgileri
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label style={lbl}>EORI / Vergi No</label>
              <input name="declarant_id_number" placeholder="TR1234567890" className="nctr-input" />
              <p style={hint}>CBAM portalında tescillenmiş EORI numarası</p>
            </div>
            <div className="space-y-1.5">
              <label style={lbl}>Rol</label>
              <select name="declarant_role" className="nctr-input" defaultValue="01">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label style={lbl}>Şehir</label>
              <input name="decl_city" placeholder="İstanbul" className="nctr-input" />
            </div>
            <div className="space-y-1.5">
              <label style={lbl}>Sokak</label>
              <input name="decl_street" placeholder="Atatürk Cad. No:1" className="nctr-input" />
            </div>
            <div className="space-y-1.5">
              <label style={lbl}>Posta Kodu</label>
              <input name="decl_postcode" placeholder="34000" className="nctr-input" />
            </div>
          </div>
        </div>

        {state.error && (
          <div className="badge-danger py-2 px-3 rounded-lg" style={{ display: "flex", fontSize: "0.875rem" }}>
            {state.error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Oluşturduktan sonra mal ve emisyon bilgilerini ekleyeceksiniz.
          </p>
          <button type="submit" disabled={pending} className="btn-primary"
            style={{ opacity: pending ? 0.7 : 1, minWidth: "160px", justifyContent: "center" }}>
            {pending ? "Oluşturuluyor…" : "Raporu Oluştur →"}
          </button>
        </div>
      </form>

      <div className="nctr-card-elevated space-y-3">
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
          CBAM QReport Yapısı
        </p>
        <div className="font-mono text-xs space-y-1" style={{ color: "var(--color-text-muted)" }}>
          {[
            "QReport",
            "  ├─ Declarant (Beyan eden)",
            "  ├─ Importer (İthalatçı, opsiyonel)",
            "  ├─ Signatures (İmza & onay)",
            "  └─ ImportedGood[] (İthal edilen mallar)",
            "       ├─ CommodityCode (HS/CN kodu)",
            "       ├─ OriginCountry (Menşe ülke)",
            "       └─ GoodsEmissions[] (Mal emisyonları)",
            "            ├─ Installation (Tesis)",
            "            ├─ DirectEmissions (SEE doğrudan)",
            "            └─ IndirectEmissions (SEE dolaylı)",
          ].map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 };
const hint: React.CSSProperties = { fontSize: "0.75rem", color: "var(--color-text-disabled)" };
