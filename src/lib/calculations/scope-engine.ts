/**
 * Scope 1/2/3 Modular Carbon Calculation Engine
 * Master formula: E_total = Σ(Qi × EFi × GWPi) + Σ(Tj × Dj × EF_trans)
 * Kaynak: GHG Protocol Corporate Standard, IPCC AR6
 */

import { EF, SECTOR_BENCHMARKS, type FormulaType } from "@/constants/emissionFactors";
import type { ProductCategory } from "@/constants/productAtlas";

// ─── Input Types ─────────────────────────────────────────────

export interface EnergyInputs {
  electricity_kwh?: number;
  natural_gas_m3?: number;
  diesel_litre?: number;
  coal_kg?: number;
  lpg_kg?: number;
  fuel_oil_kg?: number;
  steam_gj?: number;
}

export interface MaterialInputs {
  // Raw material key from EF.materials, value in kg
  [key: string]: number;
}

export interface TransportInputs {
  road_tonne_km?: number;
  rail_tonne_km?: number;
  sea_tonne_km?: number;
  air_tonne_km?: number;
  van_km?: number;
}

export interface WaterInputs {
  water_m3?: number;
  wastewater_m3?: number;
}

export interface RefrigerantInputs {
  r404a_kg?: number;
  r134a_kg?: number;
}

export interface ScopeEngineInputs {
  formula_type: FormulaType;
  production_quantity_kg: number;
  energy?: EnergyInputs;
  materials?: MaterialInputs;
  transport?: TransportInputs;
  water?: WaterInputs;
  refrigerants?: RefrigerantInputs;
  // Agriculture-specific
  fertilizer_kg?: number;
  irrigation_m3?: number;
  // Process-specific
  chemical_inputs_kg?: number;
  chemical_ef?: number; // kgCO₂e/kg, default EF.materials.surfactant_kg
  waste_kg?: number;
  waste_ef?: number;   // kgCO₂e/kg, default 0.5
}

// ─── Output Types ────────────────────────────────────────────

export interface ScopeBreakdown {
  scope1_direct_tco2: number;    // Combustion, process emissions
  scope2_energy_tco2: number;    // Grid electricity, district heat
  scope3_upstream_tco2: number;  // Materials, transport, water
  total_tco2: number;
  intensity_kgco2_per_kg: number; // per kg product
}

export interface ScopeLineItem {
  label: string;
  scope: 1 | 2 | 3;
  value_tco2: number;
  pct: number;
}

export interface ScopeResult {
  breakdown: ScopeBreakdown;
  line_items: ScopeLineItem[];
  outlier_warning: string | null;
  formula_type: FormulaType;
}

// ─── Engine ──────────────────────────────────────────────────

function kg2t(kg: number): number { return kg / 1000; }

function calcEnergy(e: EnergyInputs = {}): { scope1: number; scope2: number; items: ScopeLineItem[] } {
  const items: ScopeLineItem[] = [];
  let scope1 = 0;
  let scope2 = 0;

  const add1 = (label: string, val: number) => {
    const t = kg2t(val);
    scope1 += t;
    if (t > 0) items.push({ label, scope: 1, value_tco2: t, pct: 0 });
  };
  const add2 = (label: string, val: number) => {
    const t = kg2t(val);
    scope2 += t;
    if (t > 0) items.push({ label, scope: 2, value_tco2: t, pct: 0 });
  };

  if (e.electricity_kwh)  add2("Elektrik",       e.electricity_kwh  * EF.energy.electricity_turkey);
  if (e.natural_gas_m3)   add1("Doğal Gaz",      e.natural_gas_m3   * EF.energy.natural_gas_m3);
  if (e.diesel_litre)     add1("Dizel",           e.diesel_litre     * EF.energy.diesel_litre);
  if (e.coal_kg)          add1("Kömür",           e.coal_kg          * EF.energy.coal_kg);
  if (e.lpg_kg)           add1("LPG",             e.lpg_kg           * EF.energy.lpg_kg);
  if (e.fuel_oil_kg)      add1("Fuel Oil",        e.fuel_oil_kg      * EF.energy.fuel_oil_kg);
  if (e.steam_gj)         add2("Buhar (dışarıdan)", e.steam_gj * 1000 * EF.energy.steam_gj / 1000);

  return { scope1, scope2, items };
}

function calcMaterials(m: MaterialInputs = {}): { scope3: number; items: ScopeLineItem[] } {
  const items: ScopeLineItem[] = [];
  let scope3 = 0;
  for (const [key, qty_kg] of Object.entries(m)) {
    if (!qty_kg) continue;
    const ef = (EF.materials as Record<string, number>)[key];
    if (ef === undefined) continue;
    const t = kg2t(qty_kg * ef);
    scope3 += t;
    items.push({ label: key.replace(/_kg$/, "").replace(/_/g, " "), scope: 3, value_tco2: t, pct: 0 });
  }
  return { scope3, items };
}

function calcTransport(tr: TransportInputs = {}): { scope3: number; items: ScopeLineItem[] } {
  const items: ScopeLineItem[] = [];
  let scope3 = 0;

  const add = (label: string, val: number) => {
    const t = kg2t(val);
    scope3 += t;
    if (t > 0) items.push({ label, scope: 3, value_tco2: t, pct: 0 });
  };

  if (tr.road_tonne_km) add("Karayolu Taşıma",  tr.road_tonne_km * EF.transport.road_tonne_km);
  if (tr.rail_tonne_km) add("Demiryolu Taşıma", tr.rail_tonne_km * EF.transport.rail_tonne_km);
  if (tr.sea_tonne_km)  add("Denizyolu Taşıma", tr.sea_tonne_km  * EF.transport.sea_tonne_km);
  if (tr.air_tonne_km)  add("Havayolu Taşıma",  tr.air_tonne_km  * EF.transport.air_tonne_km);
  if (tr.van_km)        add("Hafif Araç",        tr.van_km        * EF.transport.van_km);

  return { scope3, items };
}

function calcWater(w: WaterInputs = {}, r: RefrigerantInputs = {}): { scope1: number; scope3: number; items: ScopeLineItem[] } {
  const items: ScopeLineItem[] = [];
  let scope1 = 0;
  let scope3 = 0;

  if (w.water_m3) {
    const t = kg2t(w.water_m3 * EF.water.water_m3);
    scope3 += t;
    if (t > 0) items.push({ label: "Su Tüketimi", scope: 3, value_tco2: t, pct: 0 });
  }
  if (w.wastewater_m3) {
    const t = kg2t(w.wastewater_m3 * EF.water.wastewater_m3);
    scope3 += t;
    if (t > 0) items.push({ label: "Atıksu Arıtma", scope: 3, value_tco2: t, pct: 0 });
  }
  if (r.r404a_kg) {
    const t = kg2t(r.r404a_kg * EF.water.refrigerant_r404a_kg);
    scope1 += t;
    if (t > 0) items.push({ label: "Soğutucu R-404A (kaçak)", scope: 1, value_tco2: t, pct: 0 });
  }
  if (r.r134a_kg) {
    const t = kg2t(r.r134a_kg * EF.water.refrigerant_r134a_kg);
    scope1 += t;
    if (t > 0) items.push({ label: "Soğutucu R-134a (kaçak)", scope: 1, value_tco2: t, pct: 0 });
  }

  return { scope1, scope3, items };
}

// ─── Category → Benchmark Key Mapping ───────────────────────
const CATEGORY_BENCHMARK: Record<ProductCategory, string> = {
  textile_apparel: "textile_apparel",
  food_beverage:   "food_beverage",
  metal_machinery: "metal_machinery",
  automotive:      "automotive",
  chemical_pharma: "chemical_pharma",
  tech_electronics:"tech_electronics",
};

export function calcScope(
  inputs: ScopeEngineInputs,
  category?: ProductCategory,
): ScopeResult {
  const { energy = {}, materials = {}, transport = {}, water = {}, refrigerants = {} } = inputs;

  const e = calcEnergy(energy);
  const m = calcMaterials(materials);
  const tr = calcTransport(transport);
  const w = calcWater(water, refrigerants);

  // Agriculture / process extras
  let extra_scope1 = 0;
  let extra_scope3 = 0;
  const extra_items: ScopeLineItem[] = [];

  if (inputs.fertilizer_kg) {
    const ef = 1.694; // ammonia-based fertilizer avg
    const t = kg2t(inputs.fertilizer_kg * ef);
    extra_scope1 += t;
    extra_items.push({ label: "Gübre (tarla N₂O)", scope: 1, value_tco2: t, pct: 0 });
  }
  if (inputs.irrigation_m3) {
    const t = kg2t(inputs.irrigation_m3 * EF.water.water_m3);
    extra_scope3 += t;
    extra_items.push({ label: "Sulama Suyu", scope: 3, value_tco2: t, pct: 0 });
  }
  if (inputs.chemical_inputs_kg) {
    const ef = inputs.chemical_ef ?? EF.materials.surfactant_kg;
    const t = kg2t(inputs.chemical_inputs_kg * ef);
    extra_scope3 += t;
    extra_items.push({ label: "Kimyasal Girdi", scope: 3, value_tco2: t, pct: 0 });
  }
  if (inputs.waste_kg) {
    const ef = inputs.waste_ef ?? 0.5;
    const t = kg2t(inputs.waste_kg * ef);
    extra_scope3 += t;
    extra_items.push({ label: "Atık İşleme", scope: 3, value_tco2: t, pct: 0 });
  }

  const scope1 = e.scope1 + w.scope1 + extra_scope1;
  const scope2 = e.scope2;
  const scope3 = m.scope3 + tr.scope3 + w.scope3 + extra_scope3;
  const total  = scope1 + scope2 + scope3;

  const all_items: ScopeLineItem[] = [
    ...e.items, ...m.items, ...tr.items, ...w.items, ...extra_items,
  ].map(item => ({
    ...item,
    pct: total > 0 ? (item.value_tco2 / total) * 100 : 0,
  }));

  const intensity = inputs.production_quantity_kg > 0
    ? (total * 1000) / inputs.production_quantity_kg
    : 0;

  // Outlier detection
  let outlier_warning: string | null = null;
  if (category) {
    const benchKey = CATEGORY_BENCHMARK[category];
    if (benchKey) {
      const bench = SECTOR_BENCHMARKS[benchKey];
      if (bench && intensity > 0) {
        const deviation = Math.abs(intensity - bench.avg_intensity) / bench.avg_intensity * 100;
        if (deviation > bench.tolerance) {
          const dir = intensity > bench.avg_intensity ? "yüksek" : "düşük";
          outlier_warning = `Hesaplanan yoğunluk (${intensity.toFixed(2)} kgCO₂e/kg) sektör ortalamasından %${deviation.toFixed(0)} ${dir}. Lütfen girdileri kontrol edin. (Sektör ort: ${bench.avg_intensity} ${bench.unit})`;
        }
      }
    }
  }

  return {
    breakdown: {
      scope1_direct_tco2:    scope1,
      scope2_energy_tco2:    scope2,
      scope3_upstream_tco2:  scope3,
      total_tco2:            total,
      intensity_kgco2_per_kg: intensity,
    },
    line_items: all_items.sort((a, b) => b.value_tco2 - a.value_tco2),
    outlier_warning,
    formula_type: inputs.formula_type,
  };
}
