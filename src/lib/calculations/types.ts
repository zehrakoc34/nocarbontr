// EU 2023/956 — nctr_1.md §4 Hesaplama Motoru

export type Sector = "steel" | "aluminum" | "cement" | "chemicals" | "electricity";

export interface SteelInputs {
  activity_data_ton: number;        // Üretim miktarı (ton)
  emission_factor_direct: number;   // Doğrudan EF (tCO2/ton ürün)
  electricity_mwh: number;          // Tüketilen elektrik (MWh)
  ef_grid: number;                  // Şebeke emisyon faktörü (tCO2/MWh)
}

export interface AluminumInputs {
  activity_data_ton: number;
  emission_factor_direct: number;
  electricity_mwh: number;
  ef_grid: number;
  pfc_emissions_ton: number;        // PFC emisyonları (elektroliz)
}

export interface CementInputs {
  clinker_ton: number;              // Klinker üretim miktarı (ton)
  calcination_factor: number;       // Kalsinasyon faktörü (tCO2/ton klinker) ~0.525
  fuel_consumption_gj: number;      // Yakıt tüketimi (GJ)
  fuel_emission_factor: number;     // Yakıt EF (tCO2/GJ)
  electricity_mwh: number;
  ef_grid: number;
}

export interface ChemicalsInputs {
  activity_data_ton: number;
  process_emission_factor: number;  // Proses EF (tCO2/ton)
  fuel_consumption_gj: number;
  fuel_emission_factor: number;
  electricity_mwh: number;
  ef_grid: number;
}

export interface ElectricityInputs {
  electricity_mwh: number;
  ef_grid: number;                  // Ulusal şebeke faktörü
}

export type SectorInputs =
  | { sector: "steel";       inputs: SteelInputs }
  | { sector: "aluminum";    inputs: AluminumInputs }
  | { sector: "cement";      inputs: CementInputs }
  | { sector: "chemicals";   inputs: ChemicalsInputs }
  | { sector: "electricity"; inputs: ElectricityInputs };

export interface CalculationResult {
  sector: Sector;
  total_emissions_tco2: number;     // Ana sonuç
  breakdown: Record<string, number>; // Bileşen bazlı dökümü
  formula_version: string;
  inputs_snapshot: object;          // raw_inputs için JSONB
}
