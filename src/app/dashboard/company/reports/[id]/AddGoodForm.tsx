"use client";

import { useActionState, useState } from "react";
import { addImportedGood, type GoodState } from "@/lib/reports/actions";

const COUNTRIES = ["TR","DE","CN","US","RU","UA","IN","BR","KR","JP","GB","FR","IT","ES","PL"];
const IMPORT_AREAS = [
  { value: "EU", label: "EU — AB Gümrük Bölgesi" },
  { value: "EUOTH", label: "EUOTH — Diğer AB Bölgesi" },
  { value: "XI", label: "XI — Kuzey İrlanda" },
];
const PROCEDURES = [
  { value: "40", label: "40 — Serbest Dolaşıma Giriş" },
  { value: "42", label: "42 — KDV Muafiyetli Serbest Dolaşım" },
  { value: "44", label: "44 — İşleme Sonrası Serbest Dolaşım" },
  { value: "48", label: "48 — Dahilde İşleme Beyanı" },
  { value: "07", label: "07 — Nihai Kullanım" },
];

const initial: GoodState = {};

export default function AddGoodForm({ reportId }: { reportId: string }) {
  const [state, formAction, pending] = useActionState(addImportedGood, initial);
  const [expanded, setExpanded] = useState(false);

  if (state.success) {
    return (
      <div className="flex items-center gap-3 py-2">
        <span style={{ color: "var(--color-success)" }}>✓</span>
        <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Mal eklendi.</span>
        <button onClick={() => window.location.reload()} className="btn-ghost" style={{ fontSize: "0.8125rem" }}>
          + Başka Mal Ekle
        </button>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="btn-secondary w-full justify-center"
        style={{ fontSize: "0.8125rem" }}>
        + Yeni Mal Ekle
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-4 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
      <input type="hidden" name="report_id" value={reportId} />

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label style={lbl}>HS Kodu (6 karakter)</label>
          <input name="hs_code" maxLength={6} placeholder="760900" className="nctr-input font-mono" />
        </div>
        <div className="space-y-1.5">
          <label style={lbl}>CN Kodu (8 karakter)</label>
          <input name="cn_code" maxLength={8} placeholder="76090000" className="nctr-input font-mono" />
        </div>
        <div className="space-y-1.5">
          <label style={lbl}>Menşe Ülke <span style={{ color: "var(--color-danger)" }}>*</span></label>
          <select name="origin_country" required className="nctr-input" defaultValue="TR">
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label style={lbl}>Emtia Açıklaması</label>
        <input name="commodity_description" placeholder="Ör. Alüminyum borular" className="nctr-input" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label style={lbl}>Gümrük Rejimi</label>
          <select name="procedure_requested" className="nctr-input" defaultValue="40">
            {PROCEDURES.map((p) => (
              <option key={p.value} value={p.value}>{p.value} — {p.label.split("—")[1]?.trim()}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label style={lbl}>İthalat Bölgesi</label>
          <select name="import_area" className="nctr-input" defaultValue="EU">
            {IMPORT_AREAS.map((a) => (
              <option key={a.value} value={a.value}>{a.value}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label style={lbl}>Ölçüm Birimi</label>
          <select name="measurement_unit" className="nctr-input" defaultValue="01">
            <option value="01">01 — kg (Net kütle)</option>
            <option value="04">04 — Ton</option>
            <option value="03">03 — Adet</option>
            <option value="MTQ">MTQ — m³</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={lbl}>Net Kütle</label>
          <input name="net_mass" type="number" step="0.000001" placeholder="5.48" className="nctr-input" />
        </div>
        <div className="space-y-1.5">
          <label style={lbl}>Tamamlayıcı Birim (opsiyonel)</label>
          <input name="supplementary_units" type="number" step="0.000001" className="nctr-input" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label style={lbl}>Notlar (opsiyonel)</label>
        <input name="remarks" placeholder="Ek bilgi" className="nctr-input" />
      </div>

      {state.error && (
        <div className="badge-danger py-2 px-3 rounded-lg" style={{ display: "flex", fontSize: "0.875rem" }}>
          {state.error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => setExpanded(false)} className="btn-ghost" style={{ fontSize: "0.8125rem" }}>
          İptal
        </button>
        <button type="submit" disabled={pending} className="btn-primary"
          style={{ opacity: pending ? 0.7 : 1, fontSize: "0.875rem" }}>
          {pending ? "Ekleniyor…" : "Malı Ekle"}
        </button>
      </div>
    </form>
  );
}

const lbl: React.CSSProperties = { fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 };
