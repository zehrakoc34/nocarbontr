/**
 * NOCARBONTR Emisyon Faktörleri Veritabanı
 * Kaynak: IPCC AR6 (2021), GHG Protocol, Ecoinvent 3.9, IEA 2022
 * Birim: kgCO₂e / belirtilen birim
 */

export const EF = {
  // ─── ENERJİ ──────────────────────────────────────────────
  energy: {
    electricity_turkey:   0.441,    // kgCO₂e/kWh — IEA 2022 Türkiye
    electricity_eu:       0.276,    // kgCO₂e/kWh — AB ortalama
    natural_gas_m3:       2.020,    // kgCO₂e/m³
    natural_gas_gj:       56.1,     // kgCO₂e/GJ
    diesel_litre:         2.680,    // kgCO₂e/litre
    coal_kg:              2.420,    // kgCO₂e/kg
    fuel_oil_kg:          3.170,    // kgCO₂e/kg
    lpg_kg:               2.980,    // kgCO₂e/kg
    steam_gj:             67.0,     // kgCO₂e/GJ buhar (doğalgaz kaynaklı)
  },

  // ─── LOJİSTİK ─────────────────────────────────────────────
  transport: {
    road_tonne_km:       0.110,     // kgCO₂e/tonne-km (TIR)
    rail_tonne_km:       0.028,     // kgCO₂e/tonne-km (elektrikli)
    sea_tonne_km:        0.011,     // kgCO₂e/tonne-km (bulk carrier)
    air_tonne_km:        0.800,     // kgCO₂e/tonne-km
    van_km:              0.210,     // kgCO₂e/km (hafif ticari araç)
  },

  // ─── TEMEL MALZEMELER ─────────────────────────────────────
  materials: {
    // Metaller
    steel_primary_kg:    1.850,     // kgCO₂e/kg — BF-BOF
    steel_secondary_kg:  0.420,     // kgCO₂e/kg — EAF hurda
    aluminum_primary_kg: 8.140,     // kgCO₂e/kg — primer
    aluminum_secondary_kg:0.540,    // kgCO₂e/kg — sekonder
    copper_kg:           3.150,     // kgCO₂e/kg
    stainless_steel_kg:  6.150,     // kgCO₂e/kg
    iron_casting_kg:     1.510,     // kgCO₂e/kg

    // Plastik & Kauçuk
    pet_kg:              2.530,     // kgCO₂e/kg
    hdpe_kg:             1.570,     // kgCO₂e/kg
    pvc_kg:              3.100,     // kgCO₂e/kg
    pp_kg:               1.950,     // kgCO₂e/kg
    rubber_natural_kg:   3.140,     // kgCO₂e/kg
    rubber_synthetic_kg: 2.850,     // kgCO₂e/kg
    foam_polyurethane_kg:3.500,     // kgCO₂e/kg

    // Tekstil
    cotton_fiber_kg:     5.890,     // kgCO₂e/kg (tarım dahil)
    polyester_fiber_kg:  7.210,     // kgCO₂e/kg
    nylon_kg:            7.900,     // kgCO₂e/kg
    wool_kg:             27.00,     // kgCO₂e/kg
    viscose_kg:          4.500,     // kgCO₂e/kg
    dye_process_kg:      4.120,     // kgCO₂e/kg kumaş (boyama)
    fabric_cotton_kg:    15.00,     // kgCO₂e/kg (iplikten kumaşa)
    fabric_polyester_kg: 9.520,     // kgCO₂e/kg

    // Gıda ham
    wheat_kg:            0.430,     // kgCO₂e/kg
    corn_kg:             0.380,     // kgCO₂e/kg
    soybean_kg:          0.560,     // kgCO₂e/kg
    sugar_kg:            0.630,     // kgCO₂e/kg
    sunflower_oil_kg:    2.190,     // kgCO₂e/kg
    milk_kg:             3.200,     // kgCO₂e/kg
    beef_kg:             27.00,     // kgCO₂e/kg
    chicken_kg:          6.900,     // kgCO₂e/kg
    fish_kg:             3.950,     // kgCO₂e/kg

    // Kimya & İlaç
    ethanol_kg:          0.880,     // kgCO₂e/kg
    surfactant_kg:       3.750,     // kgCO₂e/kg
    ammonia_kg:          1.694,     // kgCO₂e/kg
    api_pharma_kg:       6.150,     // kgCO₂e/kg (active pharma ingredient)
    solvent_kg:          2.950,     // kgCO₂e/kg

    // Elektronik
    pcb_kg:              47.00,     // kgCO₂e/kg (baskılı devre)
    silicon_wafer_kg:    380.0,     // kgCO₂e/kg
    battery_li_kwh:      110.0,     // kgCO₂e/kWh (üretim)
    copper_wire_kg:      4.100,     // kgCO₂e/kg

    // İnşaat/Ambalaj
    glass_kg:            0.850,     // kgCO₂e/kg
    cardboard_kg:        0.910,     // kgCO₂e/kg
    paper_kg:            0.790,     // kgCO₂e/kg
    cement_kg:           0.830,     // kgCO₂e/kg
    wood_kg:             0.110,     // kgCO₂e/kg (ormanlık)
    leather_kg:          8.450,     // kgCO₂e/kg (krom tabaklama)
  },

  // ─── SU & ATIK ────────────────────────────────────────────
  water: {
    water_m3:             0.344,    // kgCO₂e/m³ (pompalama+arıtma)
    wastewater_m3:        0.708,    // kgCO₂e/m³ (arıtma)
    refrigerant_r404a_kg:3922.0,    // kgCO₂e/kg (HFC kaçak GWP100)
    refrigerant_r134a_kg:1430.0,    // kgCO₂e/kg
  },
} as const;

// ─── Sektör Ortalamaları (Outlier Detection için) ──────────
export const SECTOR_BENCHMARKS: Record<string, {
  name: string;
  avg_intensity: number;   // kgCO₂e/birim ürün
  unit: string;
  tolerance: number;        // ±% sapma toleransı
}> = {
  textile_apparel: {   name: "Tekstil/Hazır Giyim", avg_intensity: 8.5,   unit: "kgCO₂e/kg ürün", tolerance: 50 },
  food_beverage:   {   name: "Gıda/İçecek",         avg_intensity: 2.1,   unit: "kgCO₂e/kg",       tolerance: 60 },
  metal_machinery: {   name: "Metal/Makine",         avg_intensity: 2.8,   unit: "kgCO₂e/kg",       tolerance: 50 },
  automotive:      {   name: "Otomotiv",             avg_intensity: 3.5,   unit: "kgCO₂e/kg",       tolerance: 50 },
  chemical_pharma: {   name: "Kimya/İlaç",           avg_intensity: 3.2,   unit: "kgCO₂e/kg",       tolerance: 60 },
  tech_electronics:{   name: "Teknoloji/Elektronik", avg_intensity: 12.0,  unit: "kgCO₂e/kg",       tolerance: 70 },
};

export type FormulaType = "energy" | "process" | "logistics" | "agriculture";
