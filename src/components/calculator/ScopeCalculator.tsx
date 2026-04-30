"use client";

import { useState, useMemo } from "react";
import { ProductSearch } from "./ProductSearch";
import { calcScope, type ScopeEngineInputs, type ScopeResult } from "@/lib/calculations/scope-engine";
import { CATEGORY_LABELS, type Product } from "@/constants/productAtlas";

// ─── Field config ────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  unit: string;
  group: "energy" | "materials" | "transport" | "water" | "extra";
  scope: 1 | 2 | 3;
  hint?: string;
}

const ENERGY_FIELDS: FieldDef[] = [
  { key: "electricity_kwh",  label: "Elektrik Tüketimi",    unit: "kWh",    group: "energy",    scope: 2, hint: "Türkiye şebeke EF: 0.441 kgCO₂/kWh" },
  { key: "natural_gas_m3",   label: "Doğal Gaz",            unit: "m³",     group: "energy",    scope: 1 },
  { key: "diesel_litre",     label: "Dizel",                unit: "litre",  group: "energy",    scope: 1 },
  { key: "coal_kg",          label: "Kömür",                unit: "kg",     group: "energy",    scope: 1 },
  { key: "lpg_kg",           label: "LPG",                  unit: "kg",     group: "energy",    scope: 1 },
  { key: "fuel_oil_kg",      label: "Fuel Oil",             unit: "kg",     group: "energy",    scope: 1 },
  { key: "steam_gj",         label: "Satın Alınan Buhar",   unit: "GJ",     group: "energy",    scope: 2 },
];

const MATERIAL_FIELDS: FieldDef[] = [
  { key: "steel_primary_kg",      label: "Birincil Çelik",      unit: "kg", group: "materials", scope: 3 },
  { key: "steel_secondary_kg",    label: "İkincil Çelik (EAF)", unit: "kg", group: "materials", scope: 3 },
  { key: "aluminum_primary_kg",   label: "Birincil Alüminyum",  unit: "kg", group: "materials", scope: 3 },
  { key: "aluminum_secondary_kg", label: "İkincil Alüminyum",   unit: "kg", group: "materials", scope: 3 },
  { key: "copper_kg",             label: "Bakır",               unit: "kg", group: "materials", scope: 3 },
  { key: "cotton_fiber_kg",       label: "Pamuk Lifi",          unit: "kg", group: "materials", scope: 3 },
  { key: "polyester_fiber_kg",    label: "Polyester Lifi",      unit: "kg", group: "materials", scope: 3 },
  { key: "nylon_kg",              label: "Naylon",              unit: "kg", group: "materials", scope: 3 },
  { key: "wool_kg",               label: "Yün",                 unit: "kg", group: "materials", scope: 3 },
  { key: "pet_kg",                label: "PET Plastik",         unit: "kg", group: "materials", scope: 3 },
  { key: "pp_kg",                 label: "PP Plastik",          unit: "kg", group: "materials", scope: 3 },
  { key: "hdpe_kg",               label: "HDPE Plastik",        unit: "kg", group: "materials", scope: 3 },
  { key: "pvc_kg",                label: "PVC",                 unit: "kg", group: "materials", scope: 3 },
  { key: "rubber_natural_kg",     label: "Doğal Kauçuk",        unit: "kg", group: "materials", scope: 3 },
  { key: "rubber_synthetic_kg",   label: "Sentetik Kauçuk",     unit: "kg", group: "materials", scope: 3 },
  { key: "glass_kg",              label: "Cam",                 unit: "kg", group: "materials", scope: 3 },
  { key: "cardboard_kg",          label: "Karton/Ambalaj",      unit: "kg", group: "materials", scope: 3 },
  { key: "paper_kg",              label: "Kağıt",               unit: "kg", group: "materials", scope: 3 },
  { key: "cement_kg",             label: "Çimento",             unit: "kg", group: "materials", scope: 3 },
  { key: "wood_kg",               label: "Ahşap",               unit: "kg", group: "materials", scope: 3 },
  { key: "pcb_kg",                label: "Baskılı Devre (PCB)", unit: "kg", group: "materials", scope: 3 },
  { key: "leather_kg",            label: "Deri",                unit: "kg", group: "materials", scope: 3 },
  { key: "wheat_kg",              label: "Buğday",              unit: "kg", group: "materials", scope: 3 },
  { key: "corn_kg",               label: "Mısır",               unit: "kg", group: "materials", scope: 3 },
  { key: "milk_kg",               label: "Süt",                 unit: "kg", group: "materials", scope: 3 },
  { key: "beef_kg",               label: "Sığır Eti",           unit: "kg", group: "materials", scope: 3 },
  { key: "chicken_kg",            label: "Tavuk",               unit: "kg", group: "materials", scope: 3 },
  { key: "ammonia_kg",            label: "Amonyak",             unit: "kg", group: "materials", scope: 3 },
  { key: "surfactant_kg",         label: "Sürfaktan",           unit: "kg", group: "materials", scope: 3 },
  { key: "solvent_kg",            label: "Çözücü",              unit: "kg", group: "materials", scope: 3 },
];

const TRANSPORT_FIELDS: FieldDef[] = [
  { key: "road_tonne_km",  label: "Karayolu",    unit: "tonne·km", group: "transport", scope: 3 },
  { key: "rail_tonne_km",  label: "Demiryolu",   unit: "tonne·km", group: "transport", scope: 3 },
  { key: "sea_tonne_km",   label: "Denizyolu",   unit: "tonne·km", group: "transport", scope: 3 },
  { key: "air_tonne_km",   label: "Havayolu",    unit: "tonne·km", group: "transport", scope: 3 },
  { key: "van_km",         label: "Hafif Araç",  unit: "km",       group: "transport", scope: 3 },
];

const WATER_FIELDS: FieldDef[] = [
  { key: "water_m3",      label: "Su Tüketimi",       unit: "m³", group: "water", scope: 3 },
  { key: "wastewater_m3", label: "Atıksu Arıtma",     unit: "m³", group: "water", scope: 3 },
  { key: "r404a_kg",      label: "Soğutucu R-404A",   unit: "kg", group: "water", scope: 1 },
  { key: "r134a_kg",      label: "Soğutucu R-134a",   unit: "kg", group: "water", scope: 1 },
];

const SCOPE_COLORS: Record<1 | 2 | 3, string> = {
  1: "#dc2626",
  2: "#2563eb",
  3: "#9333ea",
};
const SCOPE_LABELS: Record<1 | 2 | 3, string> = {
  1: "Kapsam 1",
  2: "Kapsam 2",
  3: "Kapsam 3",
};

function fmt(n: number, d = 4) {
  return n.toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: 0 });
}

// ─── Component ───────────────────────────────────────────────

interface Props {
  onSave?: (result: ScopeResult, product: Product, inputs: ScopeEngineInputs) => Promise<void>;
  saving?: boolean;
}

export function ScopeCalculator({ onSave, saving }: Props) {
  const [product, setProduct]   = useState<Product | null>(null);
  const [qty, setQty]           = useState<string>("1000");
  const [values, setValues]     = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"energy" | "materials" | "transport" | "water">("energy");
  const [computed, setComputed] = useState<ScopeResult | null>(null);

  function setVal(key: string, v: string) {
    setValues(prev => ({ ...prev, [key]: v }));
    setComputed(null);
  }

  function buildInputs(): ScopeEngineInputs {
    const num = (k: string) => parseFloat(values[k] || "0") || 0;

    return {
      formula_type: product?.formulaType ?? "energy",
      production_quantity_kg: parseFloat(qty) || 1,
      energy: {
        electricity_kwh: num("electricity_kwh"),
        natural_gas_m3:  num("natural_gas_m3"),
        diesel_litre:    num("diesel_litre"),
        coal_kg:         num("coal_kg"),
        lpg_kg:          num("lpg_kg"),
        fuel_oil_kg:     num("fuel_oil_kg"),
        steam_gj:        num("steam_gj"),
      },
      materials: Object.fromEntries(
        MATERIAL_FIELDS.map(f => [f.key, num(f.key)]).filter(([, v]) => (v as number) > 0)
      ),
      transport: {
        road_tonne_km: num("road_tonne_km"),
        rail_tonne_km: num("rail_tonne_km"),
        sea_tonne_km:  num("sea_tonne_km"),
        air_tonne_km:  num("air_tonne_km"),
        van_km:        num("van_km"),
      },
      water: {
        water_m3:      num("water_m3"),
        wastewater_m3: num("wastewater_m3"),
      },
      refrigerants: {
        r404a_kg: num("r404a_kg"),
        r134a_kg: num("r134a_kg"),
      },
    };
  }

  function compute() {
    const inputs = buildInputs();
    const result = calcScope(inputs, product?.category);
    setComputed(result);
  }

  const groupFields: Record<string, FieldDef[]> = {
    energy: ENERGY_FIELDS,
    materials: MATERIAL_FIELDS,
    transport: TRANSPORT_FIELDS,
    water: WATER_FIELDS,
  };

  const tabLabels: { key: "energy" | "materials" | "transport" | "water"; label: string; icon: string }[] = [
    { key: "energy",    label: "Enerji",    icon: "⚡" },
    { key: "materials", label: "Malzeme",   icon: "🧱" },
    { key: "transport", label: "Nakliye",   icon: "🚛" },
    { key: "water",     label: "Su/Soğ.",   icon: "💧" },
  ];

  const bd = computed?.breakdown;

  return (
    <div className="space-y-5">
      {/* Product & Quantity */}
      <div className="nctr-card space-y-4">
        <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Ürün Seçimi
        </p>
        <ProductSearch onSelect={p => { setProduct(p); setComputed(null); }} selectedId={product?.id} />
        {product && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
            backgroundColor: "var(--color-primary-50)",
            border: "1px solid rgba(22,163,74,0.2)",
          }}>
            <span style={{ fontSize: "1.25rem" }}>{CATEGORY_LABELS[product.category].icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>{product.name}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                NACE {product.naceCode} · {CATEGORY_LABELS[product.category].label} · {product.formulaType} formülü
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
            Üretim Miktarı (kg)
          </label>
          <input
            type="number"
            className="nctr-input flex-1"
            value={qty}
            onChange={e => { setQty(e.target.value); setComputed(null); }}
            placeholder="ör: 1000"
            min={0}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="nctr-card space-y-4">
        <div style={{ display: "flex", gap: "0.375rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
          {tabLabels.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                padding: "0.4rem 0.875rem", borderRadius: "0.5rem",
                fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
                backgroundColor: activeTab === t.key ? "var(--color-primary-600)" : "var(--color-bg-elevated)",
                color: activeTab === t.key ? "#fff" : "var(--color-text-secondary)",
                border: "none", transition: "all 0.15s",
              }}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {groupFields[activeTab].map(f => (
            <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                {f.label}
                <span style={{
                  marginLeft: "6px", fontSize: "0.6875rem", padding: "1px 5px", borderRadius: "3px",
                  backgroundColor: SCOPE_COLORS[f.scope] + "15",
                  color: SCOPE_COLORS[f.scope],
                  fontWeight: 700,
                }}>
                  K{f.scope}
                </span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <input
                  type="number"
                  className="nctr-input flex-1"
                  value={values[f.key] ?? ""}
                  onChange={e => setVal(f.key, e.target.value)}
                  placeholder="0"
                  min={0}
                  style={{ fontSize: "0.8125rem", padding: "0.4rem 0.625rem" }}
                />
                <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", whiteSpace: "nowrap", minWidth: "40px" }}>
                  {f.unit}
                </span>
              </div>
              {f.hint && <p style={{ fontSize: "0.6rem", color: "var(--color-text-disabled)" }}>{f.hint}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Calculate button */}
      <button
        type="button"
        className="btn-primary w-full justify-center"
        onClick={compute}
        style={{ fontSize: "0.9375rem", padding: "0.75rem" }}
      >
        Kapsam 1/2/3 Hesapla
      </button>

      {/* Results */}
      {computed && bd && (
        <div className="space-y-4 animate-fade-in">
          {/* Outlier warning */}
          {computed.outlier_warning && (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: "0.625rem",
              backgroundColor: "#fef9c3", border: "1px solid #fde047",
              fontSize: "0.8125rem", color: "#713f12",
              display: "flex", gap: "0.5rem",
            }}>
              <span>⚠️</span>
              <span>{computed.outlier_warning}</span>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            {([
              { label: "Toplam", value: bd.total_tco2, unit: "tCO₂e", color: "var(--color-text-primary)" },
              { label: "Kapsam 1", value: bd.scope1_direct_tco2, unit: "tCO₂e", color: SCOPE_COLORS[1] },
              { label: "Kapsam 2", value: bd.scope2_energy_tco2, unit: "tCO₂e", color: SCOPE_COLORS[2] },
              { label: "Kapsam 3", value: bd.scope3_upstream_tco2, unit: "tCO₂e", color: SCOPE_COLORS[3] },
            ] as const).map(c => (
              <div key={c.label} className="nctr-card text-center py-3 space-y-1">
                <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{c.label}</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: c.color, fontVariantNumeric: "tabular-nums" }}>
                  {fmt(c.value, 3)}
                </p>
                <p style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>{c.unit}</p>
              </div>
            ))}
          </div>

          {/* Intensity */}
          <div className="nctr-card flex items-center justify-between" style={{ padding: "0.75rem 1rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>Emisyon Yoğunluğu</span>
            <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-primary-700)", fontVariantNumeric: "tabular-nums" }}>
              {fmt(bd.intensity_kgco2_per_kg, 4)} kgCO₂e/kg
            </span>
          </div>

          {/* Stacked bar */}
          <div className="nctr-card space-y-3">
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)" }}>Kapsam Dağılımı</p>
            {bd.total_tco2 > 0 && (
              <div style={{ display: "flex", height: "16px", borderRadius: "8px", overflow: "hidden", gap: "2px" }}>
                {([1, 2, 3] as const).map(s => {
                  const val = s === 1 ? bd.scope1_direct_tco2 : s === 2 ? bd.scope2_energy_tco2 : bd.scope3_upstream_tco2;
                  const pct = (val / bd.total_tco2) * 100;
                  if (pct < 0.5) return null;
                  return (
                    <div key={s} style={{ width: `${pct}%`, backgroundColor: SCOPE_COLORS[s], transition: "width 0.4s" }} title={`K${s}: ${pct.toFixed(1)}%`} />
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: "1rem" }}>
              {([1, 2, 3] as const).map(s => {
                const val = s === 1 ? bd.scope1_direct_tco2 : s === 2 ? bd.scope2_energy_tco2 : bd.scope3_upstream_tco2;
                const pct = bd.total_tco2 > 0 ? (val / bd.total_tco2) * 100 : 0;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: SCOPE_COLORS[s], flexShrink: 0 }} />
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      {SCOPE_LABELS[s]}: <strong>{pct.toFixed(1)}%</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line items table */}
          {computed.line_items.length > 0 && (
            <div className="nctr-card overflow-hidden" style={{ padding: 0 }}>
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)" }}>Detaylı Dökümü</p>
              </div>
              <table className="nctr-table w-full" style={{ fontSize: "0.8125rem" }}>
                <thead>
                  <tr>
                    <th>Kaynak</th>
                    <th>Kapsam</th>
                    <th style={{ textAlign: "right" }}>tCO₂e</th>
                    <th style={{ textAlign: "right" }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {computed.line_items.filter(li => li.value_tco2 > 0).map((li, i) => (
                    <tr key={i}>
                      <td style={{ textTransform: "capitalize" }}>{li.label}</td>
                      <td>
                        <span style={{
                          fontSize: "0.6875rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                          backgroundColor: SCOPE_COLORS[li.scope] + "15",
                          color: SCOPE_COLORS[li.scope],
                        }}>
                          K{li.scope}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                        {fmt(li.value_tco2, 4)}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--color-text-muted)" }}>
                        {li.pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Save */}
          {onSave && (
            <button
              type="button"
              className="btn-primary w-full justify-center"
              disabled={saving}
              onClick={() => product && onSave(computed, product, buildInputs())}
            >
              {saving ? "Kaydediliyor..." : "Sonucu Kaydet →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
