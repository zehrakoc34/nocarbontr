"use client";

import { useActionState, useState } from "react";
import { addGoodsEmission, type EmissionState } from "@/lib/reports/actions";

type Installation = {
  id: string;
  installation_ref: string;
  installation_name: string;
  country: string;
  city: string | null;
};

const DET_TYPES = [
  { value: "01", label: "01 — Gerçek Veri" },
  { value: "02", label: "02 — AB Varsayılan Değer" },
  { value: "03", label: "03 — Ülke Varsayılan Değer" },
];

const METHODS = [
  { value: "TOM01", label: "TOM01 — Hesaplama Yöntemi (Faaliyet Verisi + EF)" },
  { value: "TOM02", label: "TOM02 — Ölçüm Yöntemi (Gerçek Emisyon)" },
  { value: "TOM03", label: "TOM03 — Kütle Dengesi" },
];

const ELEC_SOURCES = [
  { value: "SOE01", label: "SOE01 — Ulusal Şebeke" },
  { value: "SOE02", label: "SOE02 — Güç Satın Alma Anlaşması (PPA)" },
  { value: "SOE03", label: "SOE03 — Diğer" },
];

const EF_SOURCES = [
  { value: "01", label: "01 — IEA" },
  { value: "02", label: "02 — IPCC" },
  { value: "03", label: "03 — Ulusal İstatistik" },
  { value: "04", label: "04 — Diğer" },
];

const initial: EmissionState = {};

export default function AddEmissionForm({
  goodId,
  installations,
}: {
  goodId: string;
  installations: Installation[];
}) {
  const [state, formAction, pending] = useActionState(addGoodsEmission, initial);
  const [expanded, setExpanded] = useState(false);
  const [hasIndirect, setHasIndirect] = useState(false);

  if (state.success) {
    return (
      <div className="flex items-center gap-3 py-1 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
        <span style={{ color: "var(--color-success)", fontSize: "0.875rem" }}>✓ Emisyon eklendi</span>
        <button onClick={() => window.location.reload()} className="btn-ghost" style={{ fontSize: "0.75rem" }}>
          Yenile
        </button>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div className="border-t pt-3" style={{ borderColor: "var(--color-border-subtle)" }}>
        <button onClick={() => setExpanded(true)} className="btn-ghost" style={{ fontSize: "0.8125rem" }}>
          + Emisyon Verisi Ekle
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 border-t pt-4 bg-opacity-50"
      style={{ borderColor: "var(--color-border-subtle)" }}>
      <input type="hidden" name="good_id" value={goodId} />

      <p style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
        Emisyon Verisi (GoodsEmissions)
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label style={lbl}>Tesis (Installation)</label>
          <select name="installation_id" className="nctr-input">
            <option value="">— Tesis seçin (opsiyonel) —</option>
            {installations.map((inst) => (
              <option key={inst.id} value={inst.id}>
                [{inst.installation_ref}] {inst.installation_name} ({inst.country})
              </option>
            ))}
          </select>
          {installations.length === 0 && (
            <p style={{ fontSize: "0.75rem", color: "var(--color-warning)" }}>
              Tedarikçi tesis tanımlamadı. Tedarikçi "Tesislerim" bölümünden ekleyebilir.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label style={lbl}>Üretim Ülkesi</label>
          <input name="production_country" defaultValue="TR" maxLength={2}
            className="nctr-input font-mono uppercase" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label style={lbl}>Üretilen Miktar</label>
          <input name="produced_net_mass" type="number" step="0.000001" placeholder="5.48" className="nctr-input" />
        </div>
        <div className="space-y-1.5">
          <label style={lbl}>Tamamlayıcı Birim</label>
          <input name="produced_supplementary_units" type="number" step="0.000001" className="nctr-input" />
        </div>
        <div className="space-y-1.5">
          <label style={lbl}>Ölçüm Birimi</label>
          <select name="produced_measurement_unit" className="nctr-input" defaultValue="01">
            <option value="01">01 — kg</option>
            <option value="04">04 — Ton</option>
          </select>
        </div>
      </div>

      {/* Doğrudan Emisyonlar */}
      <div className="rounded-lg p-4 space-y-4"
        style={{ backgroundColor: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)" }}>
        <p style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
          Doğrudan Emisyonlar (DirectEmissions)
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label style={lbl}>Belirleme Tipi</label>
            <select name="direct_determination_type" className="nctr-input" defaultValue="01">
              {DET_TYPES.map((d) => <option key={d.value} value={d.value}>{d.value}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label style={lbl}>Yöntem</label>
            <select name="direct_reporting_type_method" className="nctr-input" defaultValue="TOM02">
              {METHODS.map((m) => <option key={m.value} value={m.value}>{m.value}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label style={lbl}>
              SEE Doğrudan <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input name="direct_see" type="number" step="0.0000001" required
              placeholder="2.35" className="nctr-input font-mono" />
            <p style={hint}>tCO₂/ton (Specific Embedded Emissions)</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label style={lbl}>Raporlama Metodolojisi (opsiyonel)</label>
          <input name="direct_reporting_methodology"
            placeholder="Ör. EU 2023/956 Annex III §2 BF-BOF metodu" className="nctr-input" />
        </div>
      </div>

      {/* Dolaylı Emisyonlar toggle */}
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => setHasIndirect(!hasIndirect)}
          className={hasIndirect ? "btn-secondary" : "btn-ghost"}
          style={{ fontSize: "0.8125rem" }}>
          {hasIndirect ? "✓ Dolaylı Emisyon Var" : "+ Dolaylı Emisyon Ekle (IndirectEmissions)"}
        </button>
      </div>

      {hasIndirect && (
        <div className="rounded-lg p-4 space-y-4"
          style={{ backgroundColor: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.12)" }}>
          <p style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
            Dolaylı Emisyonlar (IndirectEmissions)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label style={lbl}>Belirleme Tipi</label>
              <select name="indirect_determination_type" className="nctr-input" defaultValue="01">
                {DET_TYPES.map((d) => <option key={d.value} value={d.value}>{d.value}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label style={lbl}>EF Kaynağı</label>
              <select name="indirect_ef_source" className="nctr-input" defaultValue="01">
                {EF_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.value} — {s.label.split("—")[1]?.trim()}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label style={lbl}>Emisyon Faktörü (tCO₂/MWh)</label>
              <input name="indirect_ef" type="number" step="0.00001" placeholder="0.441" className="nctr-input font-mono" />
            </div>
            <div className="space-y-1.5">
              <label style={lbl}>SEE Dolaylı (tCO₂/ton)</label>
              <input name="indirect_see" type="number" step="0.0000001" placeholder="0.50" className="nctr-input font-mono" />
            </div>
            <div className="space-y-1.5">
              <label style={lbl}>Tüketilen Elektrik (MWh)</label>
              <input name="indirect_electricity_consumed" type="number" step="0.000001" className="nctr-input" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label style={lbl}>Elektrik Kaynağı</label>
            <select name="indirect_electricity_source" className="nctr-input" defaultValue="SOE01">
              {ELEC_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.value} — {s.label.split("—")[1]?.trim()}</option>)}
            </select>
          </div>
        </div>
      )}

      {state.error && (
        <div className="badge-danger py-2 px-3 rounded-lg" style={{ display: "flex", fontSize: "0.875rem" }}>
          {state.error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => setExpanded(false)} className="btn-ghost"
          style={{ fontSize: "0.8125rem" }}>İptal</button>
        <button type="submit" disabled={pending} className="btn-primary"
          style={{ opacity: pending ? 0.7 : 1, fontSize: "0.875rem" }}>
          {pending ? "Ekleniyor…" : "Emisyonu Kaydet"}
        </button>
      </div>
    </form>
  );
}

const lbl: React.CSSProperties = { fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 };
const hint: React.CSSProperties = { fontSize: "0.75rem", color: "var(--color-text-disabled)" };
