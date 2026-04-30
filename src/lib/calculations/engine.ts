// EU 2023/956 Hesaplama Motoru — nctr_1.md §4
// Formül: E_total = Σ(ActivityData_i × EmissionFactor_i) + (Electricity_MWh × EF_grid)

import type {
  CalculationResult,
  SteelInputs,
  AluminumInputs,
  CementInputs,
  ChemicalsInputs,
  ElectricityInputs,
  SectorInputs,
} from "./types";

const FORMULA_VERSION = "v1";

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ─── Demir-Çelik ───────────────────────────────────────────
function calcSteel(i: SteelInputs): CalculationResult {
  const direct   = i.activity_data_ton * i.emission_factor_direct;
  const indirect = i.electricity_mwh * i.ef_grid;
  const total    = direct + indirect;

  return {
    sector: "steel",
    total_emissions_tco2: round4(total),
    breakdown: {
      direct_process_tco2:   round4(direct),
      indirect_electric_tco2: round4(indirect),
    },
    formula_version: FORMULA_VERSION,
    inputs_snapshot: i,
  };
}

// ─── Alüminyum ─────────────────────────────────────────────
function calcAluminum(i: AluminumInputs): CalculationResult {
  const direct   = i.activity_data_ton * i.emission_factor_direct;
  const indirect = i.electricity_mwh * i.ef_grid;
  const pfc      = i.pfc_emissions_ton;
  const total    = direct + indirect + pfc;

  return {
    sector: "aluminum",
    total_emissions_tco2: round4(total),
    breakdown: {
      direct_process_tco2:   round4(direct),
      indirect_electric_tco2: round4(indirect),
      pfc_tco2:              round4(pfc),
    },
    formula_version: FORMULA_VERSION,
    inputs_snapshot: i,
  };
}

// ─── Çimento ───────────────────────────────────────────────
function calcCement(i: CementInputs): CalculationResult {
  const calcination = i.clinker_ton * i.calcination_factor;
  const fuel        = i.fuel_consumption_gj * i.fuel_emission_factor;
  const indirect    = i.electricity_mwh * i.ef_grid;
  const total       = calcination + fuel + indirect;

  return {
    sector: "cement",
    total_emissions_tco2: round4(total),
    breakdown: {
      calcination_tco2:      round4(calcination),
      fuel_combustion_tco2:  round4(fuel),
      indirect_electric_tco2: round4(indirect),
    },
    formula_version: FORMULA_VERSION,
    inputs_snapshot: i,
  };
}

// ─── Kimyasallar ───────────────────────────────────────────
function calcChemicals(i: ChemicalsInputs): CalculationResult {
  const process  = i.activity_data_ton * i.process_emission_factor;
  const fuel     = i.fuel_consumption_gj * i.fuel_emission_factor;
  const indirect = i.electricity_mwh * i.ef_grid;
  const total    = process + fuel + indirect;

  return {
    sector: "chemicals",
    total_emissions_tco2: round4(total),
    breakdown: {
      process_tco2:          round4(process),
      fuel_combustion_tco2:  round4(fuel),
      indirect_electric_tco2: round4(indirect),
    },
    formula_version: FORMULA_VERSION,
    inputs_snapshot: i,
  };
}

// ─── Elektrik ──────────────────────────────────────────────
function calcElectricity(i: ElectricityInputs): CalculationResult {
  const total = i.electricity_mwh * i.ef_grid;

  return {
    sector: "electricity",
    total_emissions_tco2: round4(total),
    breakdown: {
      indirect_electric_tco2: round4(total),
    },
    formula_version: FORMULA_VERSION,
    inputs_snapshot: i,
  };
}

// ─── Ana dispatch fonksiyonu ───────────────────────────────
export function calculate(data: SectorInputs): CalculationResult {
  switch (data.sector) {
    case "steel":       return calcSteel(data.inputs);
    case "aluminum":    return calcAluminum(data.inputs);
    case "cement":      return calcCement(data.inputs);
    case "chemicals":   return calcChemicals(data.inputs);
    case "electricity": return calcElectricity(data.inputs);
  }
}

// Sektöre göre varsayılan emisyon faktörleri (AB ortalama 2026)
export const DEFAULT_FACTORS: Record<string, Record<string, number>> = {
  steel:       { emission_factor_direct: 1.85, ef_grid: 0.276 },
  aluminum:    { emission_factor_direct: 1.60, ef_grid: 0.276, pfc_emissions_ton: 0 },
  cement:      { calcination_factor: 0.525,    fuel_emission_factor: 0.0567, ef_grid: 0.276 },
  chemicals:   { process_emission_factor: 1.20, fuel_emission_factor: 0.0567, ef_grid: 0.276 },
  electricity: { ef_grid: 0.276 },
};

export const SECTOR_LABELS: Record<string, string> = {
  steel:       "Demir-Çelik",
  aluminum:    "Alüminyum",
  cement:      "Çimento",
  chemicals:   "Kimyasallar",
  electricity: "Elektrik",
};
