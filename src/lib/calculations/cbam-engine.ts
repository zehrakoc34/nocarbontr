/**
 * NOCARBONTR CBAM Hesaplama Motoru
 * Kaynak: EU Reg 2023/956 Annex III + EU IR 2024/1235
 * Güncelleme: EU IR 2025/2621 (Kesin dönem varsayılan değerleri)
 *
 * 6 CBAM sektörü:
 *   1. Çimento          — Doğrudan + Dolaylı
 *   2. Demir & Çelik    — Sadece Doğrudan
 *   3. Alüminyum        — Sadece Doğrudan
 *   4. Gübreler         — Doğrudan + Dolaylı
 *   5. Hidrojen         — Sadece Doğrudan
 *   6. Elektrik         — Dolaylı (ülke şebeke faktörü)
 *
 * SEE = (Doğrudan Emisyon + Dolaylı Emisyon) / Net Üretim (ton)
 * Birim: tCO₂e/ton (elektrik: tCO₂e/MWh)
 */

export type CBAMSector =
  | "cement"
  | "steel_bof"
  | "steel_eaf"
  | "aluminum_primary"
  | "aluminum_secondary"
  | "fertilizer_ammonia"
  | "fertilizer_urea"
  | "fertilizer_an"
  | "hydrogen"
  | "electricity";

// ─── EU 2024/1235 Varsayılan Emisyon Faktörleri ───────────────
export const CBAM_DEFAULTS = {
  // Çimento — AB ortalama klinker oranı 0.736, kalsinasyon 0.525 tCO₂/t klinker
  cement: {
    clinker_ratio:          0.736,   // klinker/çimento
    calcination_factor:     0.525,   // tCO₂/t klinker
    fuel_ef_coal:           0.0946,  // tCO₂/GJ kömür
    fuel_ef_gas:            0.0561,  // tCO₂/GJ doğalgaz
    electricity_intensity:  0.088,   // MWh/t çimento
    ef_grid_turkey:         0.441,   // tCO₂/MWh Türkiye (IEA 2022)
    ef_grid_eu:             0.276,   // tCO₂/MWh AB ortalama
  },
  // Demir-Çelik (BF-BOF entegre)
  steel_bof: {
    see_default:            1.767,   // tCO₂/t ham çelik (EU IR 2025/2621 Annex I — Diğer Ülkeler +10%)
    see_eu_benchmark:       1.328,   // tCO₂/t (AB kıyaslama değeri)
    ef_coke:                3.010,   // tCO₂/t kok kömürü
    ef_coal_pci:            3.123,   // tCO₂/t enjeksiyon kömürü
    ef_natural_gas:         2.020,   // tCO₂/Mcm
  },
  // Demir-Çelik (EAF — hurdadan)
  steel_eaf: {
    see_default:            0.283,   // tCO₂/t ham çelik (hurdadan EAF)
    see_eu_benchmark:       0.283,
    ef_grid_turkey:         0.441,
    ef_grid_eu:             0.276,
  },
  // Alüminyum (primer — elektrolitik)
  aluminum_primary: {
    see_direct_default:     1.484,   // tCO₂/t Al (anot oksidasyonu)
    pfc_cf4_gwp:            7380,    // GWP100 CF4
    pfc_c2f6_gwp:           12400,   // GWP100 C2F6
    pfc_cf4_sef:            0.143,   // kg CF4/t Al (Söderberg)
    pfc_c2f6_sef:           0.0143,  // kg C2F6/t Al
    ef_grid_turkey:         0.441,
  },
  // Alüminyum (sekonder — hurdadan)
  aluminum_secondary: {
    see_direct_default:     0.054,   // tCO₂/t Al (yakıt bazlı)
    ef_grid_turkey:         0.441,
  },
  // Gübreler — Amonyak (Haber-Bosch)
  fertilizer_ammonia: {
    see_default:            1.694,   // tCO₂/t NH₃ (doğalgaz SMR)
    see_coal_gasif:         3.900,   // tCO₂/t NH₃ (kömür gazlaştırma)
    ef_natural_gas:         2.020,   // tCO₂/Mcm
    electricity_intensity:  0.730,   // MWh/t NH₃
    ef_grid_turkey:         0.441,
  },
  // Gübreler — Üre
  fertilizer_urea: {
    see_default:            0.730,   // tCO₂/t üre (CO₂ absorpsiyon-re-emisyon dengesi)
    n_content:              0.467,   // kgN/kg üre
  },
  // Gübreler — Amonyum Nitrat
  fertilizer_an: {
    see_default:            1.878,   // tCO₂/t AN
    n2o_ef:                 0.0057,  // tN₂O/t HNO₃ (GWP 273)
  },
  // Hidrojen (gri — SMR)
  hydrogen: {
    see_grey:               9.500,   // tCO₂/t H₂ (doğalgaz SMR)
    see_blue:               2.200,   // tCO₂/t H₂ (SMR + CCS)
    see_green:              0.000,   // tCO₂/t H₂ (yenilenebilir elektroliz)
    ef_natural_gas:         2.020,
    electricity_intensity:  54.00,   // MWh/t H₂ (elektroliz)
    ef_grid_turkey:         0.441,
  },
  // Elektrik
  electricity: {
    ef_turkey:              0.441,   // tCO₂/MWh (IEA 2022)
    ef_eu_average:          0.276,   // tCO₂/MWh
    ef_germany:             0.364,
    ef_poland:              0.723,
    ef_france:              0.052,
  },
} as const;

// ─── Giriş Tipleri ────────────────────────────────────────────

export interface CementInputs {
  production_ton:         number;  // Çimento üretimi (ton)
  clinker_ratio:          number;  // Klinker/çimento oranı (0–1)
  fuel_consumption_gj:    number;  // Toplam fırın yakıt tüketimi (GJ)
  fuel_type:              "coal" | "gas" | "mixed";
  electricity_mwh:        number;  // Elektrik tüketimi (MWh)
  ef_grid:                number;  // Şebeke EF (tCO₂/MWh)
}

export interface SteelBOFInputs {
  production_ton:         number;  // Ham çelik üretimi (ton)
  coke_ton:               number;  // Kok kömürü tüketimi (ton)
  coal_pci_ton:           number;  // PCI kömürü (ton)
  natural_gas_mcm:        number;  // Doğalgaz (Mcm)
  scrap_ratio:            number;  // Hurda oranı (0–1)
  // NOT: BF-BOF dolaylı emisyon CBAM'de dahil edilmez
}

export interface SteelEAFInputs {
  production_ton:         number;  // Ham çelik üretimi (ton)
  electricity_mwh:        number;  // Elektrik tüketimi (MWh)
  ef_grid:                number;  // Şebeke EF
  natural_gas_gj:         number;  // Doğalgaz (GJ)
}

export interface AluminumPrimaryInputs {
  production_ton:         number;  // Alüminyum üretimi (ton)
  anode_consumption_ton:  number;  // Anot tüketimi (ton)
  fuel_combustion_gj:     number;  // Yakıt (GJ)
  electricity_mwh:        number;  // Elektrik (MWh) — bilgi için
  ef_grid:                number;
  pfc_cf4_kg:             number;  // CF4 emisyonu (kg)
  pfc_c2f6_kg:            number;  // C2F6 emisyonu (kg)
}

export interface AluminumSecondaryInputs {
  production_ton:         number;
  fuel_consumption_gj:    number;
  electricity_mwh:        number;
  ef_grid:                number;
}

export interface FertilizerAmmoniaInputs {
  production_ton:         number;  // NH₃ üretimi (ton)
  natural_gas_gj:         number;  // Doğalgaz tüketimi (GJ)
  electricity_mwh:        number;  // Elektrik (MWh)
  ef_grid:                number;
  process_co2_ton:        number;  // Proses CO₂ (ton) — SMR reaksiyonu
}

export interface FertilizerUreaInputs {
  production_ton:         number;  // Üre üretimi (ton)
  ammonia_input_ton:      number;  // NH₃ girdisi (ton)
  co2_absorbed_ton:       number;  // Sentez sırasında absorbe edilen CO₂ (ton)
  electricity_mwh:        number;
  ef_grid:                number;
}

export interface FertilizerANInputs {
  production_ton:         number;  // AN üretimi (ton)
  hno3_production_ton:    number;  // HNO₃ üretimi (ton)
  electricity_mwh:        number;
  ef_grid:                number;
}

export interface HydrogenInputs {
  production_ton:         number;  // H₂ üretimi (ton)
  route:                  "grey" | "blue" | "green";
  natural_gas_gj:         number;  // Doğalgaz (GJ) — grey/blue
  electricity_mwh:        number;  // Elektrik (MWh) — green
  ef_grid:                number;
  ccs_captured_ton:       number;  // CCS ile tutulan CO₂ (ton) — blue
}

export interface ElectricityInputs {
  electricity_mwh:        number;  // Üretilen/tüketilen elektrik (MWh)
  ef_grid:                number;  // Şebeke EF (tCO₂/MWh)
}

// ─── Sonuç Tipi ───────────────────────────────────────────────

export interface CBAMResult {
  sector:                 CBAMSector;
  production_quantity:    number;
  unit:                   string;
  direct_emissions_tco2:  number;
  indirect_emissions_tco2: number;
  total_emissions_tco2:   number;
  see:                    number;   // Specific Embedded Emissions tCO₂/t
  breakdown:              Record<string, number>;
  default_see:            number;   // EU IR 2025/2621 varsayılan değer
  uses_actual_data:       boolean;  // Varsayılan mı, gerçek mi?
  cbam_scope:             "direct_only" | "direct_and_indirect";
  formula_ref:            string;
  formula_version:        string;
}

function r4(n: number) { return Math.round(n * 10000) / 10000; }
function r2(n: number) { return Math.round(n * 100) / 100; }

// ─── 1. ÇİMENTO ───────────────────────────────────────────────
export function calcCement(i: CementInputs): CBAMResult {
  const d = CBAM_DEFAULTS.cement;
  const clinker_ton    = i.production_ton * i.clinker_ratio;
  const calcination    = clinker_ton * d.calcination_factor;
  const ef_fuel        = i.fuel_type === "gas" ? d.fuel_ef_gas
                       : i.fuel_type === "coal" ? d.fuel_ef_coal
                       : (d.fuel_ef_coal + d.fuel_ef_gas) / 2;
  const fuel_direct    = i.fuel_consumption_gj * ef_fuel;
  const direct         = calcination + fuel_direct;
  const indirect       = i.electricity_mwh * i.ef_grid;
  const total          = direct + indirect;
  const see            = i.production_ton > 0 ? total / i.production_ton : 0;

  return {
    sector: "cement",
    production_quantity: i.production_ton,
    unit: "ton çimento",
    direct_emissions_tco2:   r4(direct),
    indirect_emissions_tco2: r4(indirect),
    total_emissions_tco2:    r4(total),
    see:                     r4(see),
    breakdown: {
      "Kalsinasyon (CaCO₃→CaO)": r4(calcination),
      "Yakıt Yakımı":            r4(fuel_direct),
      "Dolaylı (Elektrik)":      r4(indirect),
    },
    default_see:      1.584,
    uses_actual_data: true,
    cbam_scope:       "direct_and_indirect",
    formula_ref:      "EU 2023/956 Annex III §1 + EU IR 2025/2621 Annex I",
    formula_version:  "cbam-v2025",
  };
}

// ─── 2. DEMİR-ÇELİK (BF-BOF) ─────────────────────────────────
export function calcSteelBOF(i: SteelBOFInputs): CBAMResult {
  const d = CBAM_DEFAULTS.steel_bof;
  const coke_co2  = i.coke_ton * d.ef_coke;
  const coal_co2  = i.coal_pci_ton * d.ef_coal_pci;
  const gas_co2   = i.natural_gas_mcm * d.ef_natural_gas;
  const direct    = coke_co2 + coal_co2 + gas_co2;
  const see       = i.production_ton > 0 ? direct / i.production_ton : d.see_default;

  return {
    sector: "steel_bof",
    production_quantity: i.production_ton,
    unit: "ton ham çelik",
    direct_emissions_tco2:   r4(direct),
    indirect_emissions_tco2: 0,
    total_emissions_tco2:    r4(direct),
    see:                     r4(see),
    breakdown: {
      "Kok Kömürü":      r4(coke_co2),
      "PCI Kömürü":      r4(coal_co2),
      "Doğalgaz":        r4(gas_co2),
    },
    default_see:      d.see_default,
    uses_actual_data: i.production_ton > 0,
    cbam_scope:       "direct_only",
    formula_ref:      "EU 2023/956 Annex III §2 + EU IR 2025/2621",
    formula_version:  "cbam-v2025",
  };
}

// ─── 3. DEMİR-ÇELİK (EAF — hurda) ───────────────────────────
export function calcSteelEAF(i: SteelEAFInputs): CBAMResult {
  const gas_co2  = i.natural_gas_gj * 0.0561;
  const elec_co2 = i.electricity_mwh * i.ef_grid;
  const direct   = gas_co2 + elec_co2;
  const see      = i.production_ton > 0 ? direct / i.production_ton : CBAM_DEFAULTS.steel_eaf.see_default;

  return {
    sector: "steel_eaf",
    production_quantity: i.production_ton,
    unit: "ton ham çelik",
    direct_emissions_tco2:   r4(direct),
    indirect_emissions_tco2: 0,
    total_emissions_tco2:    r4(direct),
    see:                     r4(see),
    breakdown: {
      "Doğalgaz (GJ)":         r4(gas_co2),
      "Elektrik (EAF süreci)": r4(elec_co2),
    },
    default_see:      CBAM_DEFAULTS.steel_eaf.see_default,
    uses_actual_data: true,
    cbam_scope:       "direct_only",
    formula_ref:      "EU 2023/956 Annex III §2.2 + EU IR 2025/2621",
    formula_version:  "cbam-v2025",
  };
}

// ─── 4. ALÜMİNYUM (Primer) ───────────────────────────────────
export function calcAluminumPrimary(i: AluminumPrimaryInputs): CBAMResult {
  const d = CBAM_DEFAULTS.aluminum_primary;
  const anode_co2  = i.anode_consumption_ton * 3.3;   // tCO₂/t anot (karbon oksidasyonu)
  const fuel_co2   = i.fuel_combustion_gj * 0.0561;
  const pfc_cf4    = (i.pfc_cf4_kg / 1000) * d.pfc_cf4_gwp;
  const pfc_c2f6   = (i.pfc_c2f6_kg / 1000) * d.pfc_c2f6_gwp;
  const direct     = anode_co2 + fuel_co2 + pfc_cf4 + pfc_c2f6;
  const indirect   = i.electricity_mwh * i.ef_grid;  // bilgi için — CBAM'de dahil değil
  const see        = i.production_ton > 0 ? direct / i.production_ton : d.see_direct_default;

  return {
    sector: "aluminum_primary",
    production_quantity: i.production_ton,
    unit: "ton alüminyum",
    direct_emissions_tco2:   r4(direct),
    indirect_emissions_tco2: r4(indirect),
    total_emissions_tco2:    r4(direct),     // CBAM: sadece doğrudan
    see:                     r4(see),
    breakdown: {
      "Anot Oksidasyonu":         r4(anode_co2),
      "Yakıt Yakımı":             r4(fuel_co2),
      "PFC (CF₄)":               r4(pfc_cf4),
      "PFC (C₂F₆)":              r4(pfc_c2f6),
      "Elektrik (bilgi amaçlı)": r4(indirect),
    },
    default_see:      d.see_direct_default,
    uses_actual_data: true,
    cbam_scope:       "direct_only",
    formula_ref:      "EU 2023/956 Annex III §3 + EU IR 2025/2621",
    formula_version:  "cbam-v2025",
  };
}

// ─── 5. ALÜMİNYUM (Sekonder — hurda) ─────────────────────────
export function calcAluminumSecondary(i: AluminumSecondaryInputs): CBAMResult {
  const fuel_co2   = i.fuel_consumption_gj * 0.0561;
  const indirect   = i.electricity_mwh * i.ef_grid;
  const see        = i.production_ton > 0 ? fuel_co2 / i.production_ton : CBAM_DEFAULTS.aluminum_secondary.see_direct_default;

  return {
    sector: "aluminum_secondary",
    production_quantity: i.production_ton,
    unit: "ton alüminyum",
    direct_emissions_tco2:   r4(fuel_co2),
    indirect_emissions_tco2: r4(indirect),
    total_emissions_tco2:    r4(fuel_co2),
    see:                     r4(see),
    breakdown: {
      "Yakıt Yakımı":            r4(fuel_co2),
      "Elektrik (bilgi amaçlı)": r4(indirect),
    },
    default_see:      CBAM_DEFAULTS.aluminum_secondary.see_direct_default,
    uses_actual_data: true,
    cbam_scope:       "direct_only",
    formula_ref:      "EU 2023/956 Annex III §3.2",
    formula_version:  "cbam-v2025",
  };
}

// ─── 6. GÜBRE — Amonyak ───────────────────────────────────────
export function calcFertilizerAmmonia(i: FertilizerAmmoniaInputs): CBAMResult {
  const gas_co2    = i.natural_gas_gj * 0.0561;
  const direct     = gas_co2 + i.process_co2_ton;
  const indirect   = i.electricity_mwh * i.ef_grid;
  const total      = direct + indirect;
  const see        = i.production_ton > 0 ? total / i.production_ton : CBAM_DEFAULTS.fertilizer_ammonia.see_default;

  return {
    sector: "fertilizer_ammonia",
    production_quantity: i.production_ton,
    unit: "ton NH₃",
    direct_emissions_tco2:   r4(direct),
    indirect_emissions_tco2: r4(indirect),
    total_emissions_tco2:    r4(total),
    see:                     r4(see),
    breakdown: {
      "Doğalgaz Yakımı":    r4(gas_co2),
      "SMR Proses CO₂":     r4(i.process_co2_ton),
      "Dolaylı (Elektrik)": r4(indirect),
    },
    default_see:      CBAM_DEFAULTS.fertilizer_ammonia.see_default,
    uses_actual_data: true,
    cbam_scope:       "direct_and_indirect",
    formula_ref:      "EU 2023/956 Annex III §5 + EU IR 2025/2621",
    formula_version:  "cbam-v2025",
  };
}

// ─── 7. GÜBRE — Üre ───────────────────────────────────────────
export function calcFertilizerUrea(i: FertilizerUreaInputs): CBAMResult {
  const indirect   = i.electricity_mwh * i.ef_grid;
  // Üre sentezinde CO₂ absorbe edilir, ama toprak uygulamasında re-emit olur
  // CBAM'de net emisyon: absorbe edilen CO₂ ÇIKARTILIR (kredi)
  const net_direct = Math.max(0, -i.co2_absorbed_ton); // genellikle negatif → sıfır
  const total      = net_direct + indirect;
  const see        = i.production_ton > 0 ? total / i.production_ton : CBAM_DEFAULTS.fertilizer_urea.see_default;

  return {
    sector: "fertilizer_urea",
    production_quantity: i.production_ton,
    unit: "ton üre",
    direct_emissions_tco2:   r4(net_direct),
    indirect_emissions_tco2: r4(indirect),
    total_emissions_tco2:    r4(total),
    see:                     r4(see),
    breakdown: {
      "Net Doğrudan":       r4(net_direct),
      "Dolaylı (Elektrik)": r4(indirect),
    },
    default_see:      CBAM_DEFAULTS.fertilizer_urea.see_default,
    uses_actual_data: true,
    cbam_scope:       "direct_and_indirect",
    formula_ref:      "EU 2023/956 Annex III §5.3",
    formula_version:  "cbam-v2025",
  };
}

// ─── 8. HİDROJEN ─────────────────────────────────────────────
export function calcHydrogen(i: HydrogenInputs): CBAMResult {
  const d = CBAM_DEFAULTS.hydrogen;
  let direct = 0;

  if (i.route === "grey") {
    direct = i.natural_gas_gj * 0.0561;
  } else if (i.route === "blue") {
    direct = (i.natural_gas_gj * 0.0561) - i.ccs_captured_ton;
  } else {
    direct = 0; // yeşil — yakıt yok
  }

  const indirect = i.electricity_mwh * i.ef_grid;
  const see      = i.production_ton > 0 ? direct / i.production_ton
    : i.route === "grey" ? d.see_grey : i.route === "blue" ? d.see_blue : d.see_green;

  return {
    sector: "hydrogen",
    production_quantity: i.production_ton,
    unit: "ton H₂",
    direct_emissions_tco2:   r4(direct),
    indirect_emissions_tco2: r4(indirect),
    total_emissions_tco2:    r4(direct),
    see:                     r4(see),
    breakdown: {
      "Doğalgaz Yakımı":           r4(i.route !== "green" ? i.natural_gas_gj * 0.0561 : 0),
      "CCS Tutma (-)":             r4(i.route === "blue" ? -i.ccs_captured_ton : 0),
      "Elektrik (bilgi amaçlı)":   r4(indirect),
    },
    default_see:      i.route === "grey" ? d.see_grey : i.route === "blue" ? d.see_blue : d.see_green,
    uses_actual_data: true,
    cbam_scope:       "direct_only",
    formula_ref:      "EU 2023/956 Annex III §6 + EU IR 2025/2621",
    formula_version:  "cbam-v2025",
  };
}

// ─── 9. ELEKTRİK ─────────────────────────────────────────────
export function calcElectricity(i: ElectricityInputs): CBAMResult {
  const total = i.electricity_mwh * i.ef_grid;

  return {
    sector: "electricity",
    production_quantity: i.electricity_mwh,
    unit: "MWh",
    direct_emissions_tco2:   0,
    indirect_emissions_tco2: r4(total),
    total_emissions_tco2:    r4(total),
    see:                     r4(i.ef_grid),
    breakdown: {
      "Şebeke Emisyonu (MWh × EF)": r4(total),
    },
    default_see:      CBAM_DEFAULTS.electricity.ef_turkey,
    uses_actual_data: true,
    cbam_scope:       "direct_and_indirect",
    formula_ref:      "EU 2023/956 Annex III §7",
    formula_version:  "cbam-v2025",
  };
}
