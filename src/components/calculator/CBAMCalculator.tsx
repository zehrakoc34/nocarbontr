"use client";

import { useState, useCallback } from "react";
import {
  CBAM_DEFAULTS,
  calcCement, calcSteelBOF, calcSteelEAF,
  calcAluminumPrimary, calcAluminumSecondary,
  calcFertilizerAmmonia, calcFertilizerUrea,
  calcHydrogen, calcElectricity,
  type CBAMSector, type CBAMResult,
} from "@/lib/calculations/cbam-engine";

// ─── Sektör Tanımları ────────────────────────────────────────
const SECTORS: {
  id: CBAMSector;
  label: string;
  cn: string;
  scope: string;
  defaultSEE: number;
  unit: string;
}[] = [
  { id: "cement",              label: "Çimento",                cn: "CN 2523",      scope: "Doğrudan + Dolaylı", defaultSEE: 1.584, unit: "tCO₂e/t" },
  { id: "steel_bof",           label: "Çelik — BF-BOF",        cn: "CN 7207–7229", scope: "Sadece Doğrudan",    defaultSEE: 1.767, unit: "tCO₂e/t" },
  { id: "steel_eaf",           label: "Çelik — EAF (hurda)",   cn: "CN 7207–7229", scope: "Sadece Doğrudan",    defaultSEE: 0.283, unit: "tCO₂e/t" },
  { id: "aluminum_primary",    label: "Alüminyum — Primer",    cn: "CN 7601",      scope: "Sadece Doğrudan",    defaultSEE: 1.484, unit: "tCO₂e/t" },
  { id: "aluminum_secondary",  label: "Alüminyum — Sekonder",  cn: "CN 7601",      scope: "Sadece Doğrudan",    defaultSEE: 0.054, unit: "tCO₂e/t" },
  { id: "fertilizer_ammonia",  label: "Gübre — Amonyak (NH₃)", cn: "CN 2814",      scope: "Doğrudan + Dolaylı", defaultSEE: 1.694, unit: "tCO₂e/t" },
  { id: "fertilizer_urea",     label: "Gübre — Üre",           cn: "CN 3102 10",   scope: "Doğrudan + Dolaylı", defaultSEE: 0.730, unit: "tCO₂e/t" },
  { id: "hydrogen",            label: "Hidrojen",              cn: "CN 2804 10",   scope: "Sadece Doğrudan",    defaultSEE: 9.500, unit: "tCO₂e/t" },
  { id: "electricity",         label: "Elektrik",              cn: "CN 2716",      scope: "Dolaylı",            defaultSEE: 0.441, unit: "tCO₂e/MWh" },
];

// ─── Alan Tipi ───────────────────────────────────────────────
interface Field {
  key: string;
  label: string;
  unit: string;
  default: number;
  hint?: string;
  type?: "select";
  options?: { value: string; label: string }[];
}

const FIELDS: Record<CBAMSector, Field[]> = {
  cement: [
    { key: "production_ton",      label: "Çimento Üretimi",         unit: "ton",  default: 1000 },
    { key: "clinker_ratio",        label: "Klinker/Çimento Oranı",  unit: "0–1",  default: 0.736, hint: "AB ortalaması 0.736" },
    { key: "fuel_consumption_gj",  label: "Yakıt Tüketimi",         unit: "GJ",   default: 3500 },
    { key: "fuel_type",            label: "Yakıt Tipi",             unit: "",     default: 0, type: "select",
      options: [{ value: "gas", label: "Doğalgaz" }, { value: "coal", label: "Kömür" }, { value: "mixed", label: "Karışık" }] },
    { key: "electricity_mwh",      label: "Elektrik Tüketimi",      unit: "MWh",  default: 88 },
    { key: "ef_grid",              label: "Şebeke Emisyon Faktörü", unit: "tCO₂/MWh", default: 0.441, hint: "Türkiye 0.441" },
  ],
  steel_bof: [
    { key: "production_ton",    label: "Ham Çelik Üretimi",   unit: "ton",  default: 1000 },
    { key: "coke_ton",          label: "Kok Kömürü",          unit: "ton",  default: 380, hint: "Tipik ~380 kg/t çelik" },
    { key: "coal_pci_ton",      label: "PCI Kömürü",          unit: "ton",  default: 150 },
    { key: "natural_gas_mcm",   label: "Doğalgaz",            unit: "Mcm",  default: 0.015 },
    { key: "scrap_ratio",       label: "Hurda Oranı",         unit: "0–1",  default: 0.15 },
  ],
  steel_eaf: [
    { key: "production_ton",    label: "Ham Çelik Üretimi",         unit: "ton", default: 1000 },
    { key: "electricity_mwh",   label: "Elektrik Tüketimi",         unit: "MWh", default: 550, hint: "Tipik ~550 kWh/t" },
    { key: "ef_grid",           label: "Şebeke Emisyon Faktörü",    unit: "tCO₂/MWh", default: 0.441 },
    { key: "natural_gas_gj",    label: "Doğalgaz Tüketimi",         unit: "GJ",  default: 200 },
  ],
  aluminum_primary: [
    { key: "production_ton",        label: "Alüminyum Üretimi",      unit: "ton", default: 1000 },
    { key: "anode_consumption_ton", label: "Anot Tüketimi",          unit: "ton", default: 430, hint: "Tipik ~430 kg/t Al" },
    { key: "fuel_combustion_gj",    label: "Yakıt Yakımı",           unit: "GJ",  default: 500 },
    { key: "electricity_mwh",       label: "Elektrik (bilgi)",        unit: "MWh", default: 14500, hint: "~14.5 MWh/t Al" },
    { key: "ef_grid",               label: "Şebeke EF",              unit: "tCO₂/MWh", default: 0.441 },
    { key: "pfc_cf4_kg",            label: "PFC CF₄ Emisyonu",       unit: "kg",  default: 0.143, hint: "Anode effect" },
    { key: "pfc_c2f6_kg",           label: "PFC C₂F₆ Emisyonu",     unit: "kg",  default: 0.0143 },
  ],
  aluminum_secondary: [
    { key: "production_ton",      label: "Alüminyum Üretimi", unit: "ton", default: 1000 },
    { key: "fuel_consumption_gj", label: "Yakıt Tüketimi",    unit: "GJ",  default: 3500 },
    { key: "electricity_mwh",     label: "Elektrik (bilgi)",   unit: "MWh", default: 750 },
    { key: "ef_grid",             label: "Şebeke EF",         unit: "tCO₂/MWh", default: 0.441 },
  ],
  fertilizer_ammonia: [
    { key: "production_ton",    label: "NH₃ Üretimi",           unit: "ton", default: 1000 },
    { key: "natural_gas_gj",    label: "Doğalgaz Tüketimi",     unit: "GJ",  default: 36000, hint: "~36 GJ/t NH₃" },
    { key: "process_co2_ton",   label: "SMR Proses CO₂",        unit: "ton", default: 1200, hint: "Steam Methane Reforming" },
    { key: "electricity_mwh",   label: "Elektrik Tüketimi",     unit: "MWh", default: 730 },
    { key: "ef_grid",           label: "Şebeke EF",             unit: "tCO₂/MWh", default: 0.441 },
  ],
  fertilizer_urea: [
    { key: "production_ton",    label: "Üre Üretimi",         unit: "ton", default: 1000 },
    { key: "ammonia_input_ton", label: "NH₃ Girdisi",         unit: "ton", default: 567 },
    { key: "co2_absorbed_ton",  label: "Absorbe Edilen CO₂",  unit: "ton", default: 733, hint: "Sentez sırasında bağlanan CO₂" },
    { key: "electricity_mwh",   label: "Elektrik",            unit: "MWh", default: 160 },
    { key: "ef_grid",           label: "Şebeke EF",           unit: "tCO₂/MWh", default: 0.441 },
  ],
  fertilizer_an: [
    { key: "production_ton",     label: "AN Üretimi",       unit: "ton", default: 1000 },
    { key: "hno3_production_ton",label: "HNO₃ Üretimi",    unit: "ton", default: 780 },
    { key: "electricity_mwh",    label: "Elektrik",         unit: "MWh", default: 140 },
    { key: "ef_grid",            label: "Şebeke EF",        unit: "tCO₂/MWh", default: 0.441 },
  ],
  hydrogen: [
    { key: "production_ton",    label: "H₂ Üretimi",             unit: "ton", default: 100 },
    { key: "route",             label: "Üretim Yöntemi",         unit: "", default: 0, type: "select",
      options: [{ value: "grey", label: "Gri H₂ (SMR)" }, { value: "blue", label: "Mavi H₂ (SMR+CCS)" }, { value: "green", label: "Yeşil H₂ (elektroliz)" }] },
    { key: "natural_gas_gj",    label: "Doğalgaz Tüketimi",      unit: "GJ",  default: 170000, hint: "~170 GJ/t H₂ (SMR)" },
    { key: "electricity_mwh",   label: "Elektrik (yeşil yol)",   unit: "MWh", default: 5400 },
    { key: "ef_grid",           label: "Şebeke EF",              unit: "tCO₂/MWh", default: 0.441 },
    { key: "ccs_captured_ton",  label: "CCS Tutulan CO₂",       unit: "ton", default: 0, hint: "Mavi H₂ için" },
  ],
  electricity: [
    { key: "electricity_mwh", label: "Elektrik Miktarı",      unit: "MWh", default: 1000 },
    { key: "ef_grid",          label: "Şebeke Emisyon Faktörü",unit: "tCO₂/MWh", default: 0.441, hint: "Türkiye 0.441 | AB 0.276" },
  ],
};

// ─── Hesaplama dispatch ───────────────────────────────────────
function compute(sector: CBAMSector, vals: Record<string, number | string>): CBAMResult {
  const n = (k: string) => Number(vals[k] ?? 0);
  switch (sector) {
    case "cement":             return calcCement({ production_ton: n("production_ton"), clinker_ratio: n("clinker_ratio"), fuel_consumption_gj: n("fuel_consumption_gj"), fuel_type: (vals.fuel_type as any) ?? "gas", electricity_mwh: n("electricity_mwh"), ef_grid: n("ef_grid") });
    case "steel_bof":          return calcSteelBOF({ production_ton: n("production_ton"), coke_ton: n("coke_ton"), coal_pci_ton: n("coal_pci_ton"), natural_gas_mcm: n("natural_gas_mcm"), scrap_ratio: n("scrap_ratio") });
    case "steel_eaf":          return calcSteelEAF({ production_ton: n("production_ton"), electricity_mwh: n("electricity_mwh"), ef_grid: n("ef_grid"), natural_gas_gj: n("natural_gas_gj") });
    case "aluminum_primary":   return calcAluminumPrimary({ production_ton: n("production_ton"), anode_consumption_ton: n("anode_consumption_ton"), fuel_combustion_gj: n("fuel_combustion_gj"), electricity_mwh: n("electricity_mwh"), ef_grid: n("ef_grid"), pfc_cf4_kg: n("pfc_cf4_kg"), pfc_c2f6_kg: n("pfc_c2f6_kg") });
    case "aluminum_secondary": return calcAluminumSecondary({ production_ton: n("production_ton"), fuel_consumption_gj: n("fuel_consumption_gj"), electricity_mwh: n("electricity_mwh"), ef_grid: n("ef_grid") });
    case "fertilizer_ammonia": return calcFertilizerAmmonia({ production_ton: n("production_ton"), natural_gas_gj: n("natural_gas_gj"), electricity_mwh: n("electricity_mwh"), ef_grid: n("ef_grid"), process_co2_ton: n("process_co2_ton") });
    case "fertilizer_urea":    return calcFertilizerUrea({ production_ton: n("production_ton"), ammonia_input_ton: n("ammonia_input_ton"), co2_absorbed_ton: n("co2_absorbed_ton"), electricity_mwh: n("electricity_mwh"), ef_grid: n("ef_grid") });
    case "hydrogen":           return calcHydrogen({ production_ton: n("production_ton"), route: (vals.route as any) ?? "grey", natural_gas_gj: n("natural_gas_gj"), electricity_mwh: n("electricity_mwh"), ef_grid: n("ef_grid"), ccs_captured_ton: n("ccs_captured_ton") });
    case "electricity":        return calcElectricity({ electricity_mwh: n("electricity_mwh"), ef_grid: n("ef_grid") });
    default: return calcElectricity({ electricity_mwh: 0, ef_grid: 0 });
  }
}

// ─── Bileşen ─────────────────────────────────────────────────
interface Props {
  onSave?: (result: CBAMResult, sector: CBAMSector, sectorLabel: string) => Promise<void>;
  saving?: boolean;
}

export function CBAMCalculator({ onSave, saving }: Props) {
  const [selectedSector, setSelectedSector] = useState<CBAMSector | "">("");
  const [values, setValues] = useState<Record<string, number | string>>({});
  const [result, setResult]  = useState<CBAMResult | null>(null);

  const sector = SECTORS.find((s) => s.id === selectedSector);
  const fields  = selectedSector ? FIELDS[selectedSector] : [];

  function handleSectorChange(id: CBAMSector | "") {
    setSelectedSector(id);
    setResult(null);
    if (id) {
      const defaults: Record<string, number | string> = {};
      FIELDS[id].forEach((f) => {
        if (f.type === "select") defaults[f.key] = f.options![0].value;
        else defaults[f.key] = f.default;
      });
      setValues(defaults);
    } else {
      setValues({});
    }
  }

  const handleChange = useCallback((key: string, val: number | string) => {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      if (selectedSector) setResult(compute(selectedSector as CBAMSector, next));
      return next;
    });
  }, [selectedSector]);

  const seeVsDefault = result
    ? ((result.see - result.default_see) / result.default_see) * 100
    : 0;

  return (
    <div className="space-y-6">

      {/* Sektör Seçimi */}
      <div className="nctr-card space-y-3">
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          CBAM Sektörü
        </p>
        <div className="grid grid-cols-3 gap-2">
          {SECTORS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSectorChange(s.id)}
              style={{
                padding: "0.625rem 0.75rem",
                borderRadius: "0.5rem",
                border: selectedSector === s.id
                  ? "2px solid var(--color-primary-500)"
                  : "1px solid var(--color-border)",
                backgroundColor: selectedSector === s.id
                  ? "var(--color-primary-50)"
                  : "var(--color-bg-surface)",
                cursor: "pointer",
                transition: "all 150ms",
                textAlign: "left",
              }}
            >
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: selectedSector === s.id ? "var(--color-primary-700)" : "var(--color-text-primary)" }}>
                {s.label}
              </p>
              <p style={{ fontSize: "0.6875rem", color: "var(--color-text-disabled)", marginTop: "2px" }}>
                {s.cn}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Giriş Alanları */}
      {selectedSector && sector && (
        <div className="nctr-card space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                {sector.label}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                Kapsam: {sector.scope} — Kaynak: EU IR 2025/2621
              </p>
            </div>
            <span style={{
              padding: "3px 10px",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              backgroundColor: "var(--color-primary-50)",
              color: "var(--color-primary-700)",
              border: "1px solid rgba(22,163,74,0.25)",
            }}>
              Varsayılan SEE: {sector.defaultSEE} {sector.unit}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-secondary)", display: "block" }}>
                  {f.label}
                  {f.unit && (
                    <span style={{ marginLeft: "4px", color: "var(--color-text-disabled)", fontWeight: 400 }}>
                      ({f.unit})
                    </span>
                  )}
                </label>
                {f.type === "select" ? (
                  <select
                    className="nctr-input"
                    value={(values[f.key] as string) ?? f.options![0].value}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                  >
                    {f.options!.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="nctr-input"
                    value={values[f.key] ?? ""}
                    onChange={(e) => handleChange(f.key, parseFloat(e.target.value) || 0)}
                  />
                )}
                {f.hint && (
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-text-disabled)" }}>{f.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sonuç Paneli */}
      {result && (
        <div className="nctr-card-elevated space-y-5 animate-fade-in">
          {/* Başlık */}
          <div className="flex items-start justify-between">
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Hesaplama Sonucu
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-disabled)", marginTop: "2px" }}>
                {result.formula_ref}
              </p>
            </div>
            <span style={{
              fontSize: "0.6875rem",
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: "var(--color-info-bg)",
              color: "var(--color-info-fg)",
              border: "1px solid rgba(37,99,235,0.15)",
              fontWeight: 500,
            }}>
              Gerçek Veri
            </span>
          </div>

          {/* Ana SEE */}
          <div style={{
            background: "linear-gradient(135deg, var(--color-primary-50), #fff)",
            border: "1px solid rgba(22,163,74,0.2)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
          }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>Toplam Emisyon</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1.2, marginTop: "4px" }}>
                  {result.total_emissions_tco2.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>tCO₂e</p>
              </div>
              <div style={{ borderLeft: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>SEE (Özgül)</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-primary-700)", fontVariantNumeric: "tabular-nums", lineHeight: 1.2, marginTop: "4px" }}>
                  {result.see.toLocaleString("tr-TR", { maximumFractionDigits: 4 })}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{sector?.unit ?? "tCO₂e/t"}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>AB Varsayılanı</p>
                <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-secondary)", fontVariantNumeric: "tabular-nums", lineHeight: 1.2, marginTop: "4px" }}>
                  {result.default_see.toLocaleString("tr-TR", { maximumFractionDigits: 3 })}
                </p>
                <div style={{ marginTop: "4px" }}>
                  <span style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: seeVsDefault <= 0 ? "var(--color-success)" : "var(--color-danger)",
                  }}>
                    {seeVsDefault <= 0 ? "▼" : "▲"} {Math.abs(seeVsDefault).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Döküm */}
          <div className="space-y-2">
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Emisyon Dökümü</p>
            {Object.entries(result.breakdown).map(([key, val]) => {
              const pct = result.total_emissions_tco2 > 0
                ? Math.abs(val / result.total_emissions_tco2) * 100 : 0;
              const isNote = key.includes("bilgi amaçlı");
              return (
                <div key={key} style={{ opacity: isNote ? 0.5 : 1 }}>
                  <div className="flex justify-between" style={{ fontSize: "0.8125rem", marginBottom: "3px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {key}
                      {isNote && <span style={{ marginLeft: "4px", fontSize: "0.6875rem", color: "var(--color-text-disabled)" }}>(CBAM dışı)</span>}
                    </span>
                    <span style={{ fontWeight: 600, color: val < 0 ? "var(--color-success)" : "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      {val.toLocaleString("tr-TR", { maximumFractionDigits: 4 })} tCO₂e
                    </span>
                  </div>
                  {!isNote && (
                    <div style={{ height: "5px", backgroundColor: "#E5E7EB", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", backgroundColor: val < 0 ? "var(--color-success)" : "var(--color-primary-500)", borderRadius: "3px" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Doğrudan / Dolaylı ayrımı */}
          <div className="grid grid-cols-2 gap-3">
            <div style={{ backgroundColor: "var(--color-bg-elevated)", borderRadius: "0.5rem", padding: "0.75rem" }}>
              <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Doğrudan</p>
              <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums", marginTop: "4px" }}>
                {result.direct_emissions_tco2.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} tCO₂e
              </p>
            </div>
            <div style={{ backgroundColor: "var(--color-bg-elevated)", borderRadius: "0.5rem", padding: "0.75rem" }}>
              <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Dolaylı {result.cbam_scope === "direct_only" && <span style={{ color: "var(--color-warning-fg)" }}>(CBAM dışı)</span>}
              </p>
              <p style={{ fontSize: "1.125rem", fontWeight: 700, color: result.cbam_scope === "direct_only" ? "var(--color-text-disabled)" : "var(--color-text-primary)", fontVariantNumeric: "tabular-nums", marginTop: "4px" }}>
                {result.indirect_emissions_tco2.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} tCO₂e
              </p>
            </div>
          </div>

          {/* Kaydet */}
          {onSave && (
            <button
              type="button"
              className="btn-primary w-full"
              style={{ padding: "0.75rem" }}
              disabled={saving || result.total_emissions_tco2 === 0}
              onClick={() => onSave(result, selectedSector as CBAMSector, sector?.label ?? "")}
            >
              {saving ? "Kaydediliyor…" : "Emisyonu Kaydet & Trust Score Güncelle"}
            </button>
          )}
        </div>
      )}

      {!selectedSector && (
        <div className="nctr-card text-center py-14 space-y-3">
          <div style={{
            width: "48px", height: "48px", borderRadius: "12px", margin: "0 auto",
            backgroundColor: "var(--color-primary-50)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(22,163,74,0.2)",
          }}>
            <span style={{ fontSize: "1.375rem" }}>🏭</span>
          </div>
          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
            CBAM Sektörünüzü Seçin
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", maxWidth: "360px", margin: "0 auto", lineHeight: 1.6 }}>
            AB CBAM kapsamındaki 6 sektör, EU IR 2025/2621 metodolojisine göre hesaplanır
          </p>
        </div>
      )}
    </div>
  );
}
