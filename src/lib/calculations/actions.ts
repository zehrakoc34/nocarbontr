"use server";

import { createClient } from "@/lib/supabase/server";
import { calculate } from "./engine";
import type { SectorInputs, Sector } from "./types";
import { redirect } from "next/navigation";
import { recalculateTrustScore } from "@/lib/trust/actions";

export type SaveEmissionState = {
  error?: string;
  result?: {
    total_emissions_tco2: number;
    breakdown: Record<string, number>;
    id: string;
  };
};

export async function saveEmission(
  _prev: SaveEmissionState,
  formData: FormData
): Promise<SaveEmissionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };

  const orgType = user.user_metadata?.org_type;
  if (orgType !== "SUPPLIER") return { error: "Yalnızca tedarikçiler emisyon girebilir." };

  // Organizasyon ID
  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single();
  if (!member) return { error: "Organizasyon bulunamadı." };

  const sector = formData.get("sector") as Sector;
  const year   = parseInt(formData.get("year") as string);

  if (year < 2026) return { error: "Yıl 2026 veya daha büyük olmalıdır." };

  // Sektöre göre input'ları topla ve hesapla
  let sectorInputs: SectorInputs;

  try {
    sectorInputs = buildSectorInputs(sector, formData);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const result = calculate(sectorInputs);

  // Supabase'e kaydet
  const { data: inserted, error: dbError } = await supabase
    .from("emission_data")
    .insert({
      supplier_id:       member.org_id,
      sector,
      year,
      emissions_ton_co2: result.total_emissions_tco2,
      data_source:       "MANUAL",
      formula_version:   result.formula_version,
      raw_inputs:        result.inputs_snapshot,
    })
    .select("id")
    .single();

  if (dbError) return { error: dbError.message };

  // Emisyon kaydedilince trust score'u güncelle (arka plan)
  recalculateTrustScore(member.org_id).catch(() => {});

  return {
    result: {
      total_emissions_tco2: result.total_emissions_tco2,
      breakdown: result.breakdown,
      id: inserted.id,
    },
  };
}

function num(formData: FormData, key: string): number {
  const val = parseFloat(formData.get(key) as string);
  if (isNaN(val) || val < 0) throw new Error(`"${key}" geçersiz değer.`);
  return val;
}

function buildSectorInputs(sector: Sector, fd: FormData): SectorInputs {
  switch (sector) {
    case "steel":
      return {
        sector: "steel",
        inputs: {
          activity_data_ton:       num(fd, "activity_data_ton"),
          emission_factor_direct:  num(fd, "emission_factor_direct"),
          electricity_mwh:         num(fd, "electricity_mwh"),
          ef_grid:                 num(fd, "ef_grid"),
        },
      };
    case "aluminum":
      return {
        sector: "aluminum",
        inputs: {
          activity_data_ton:       num(fd, "activity_data_ton"),
          emission_factor_direct:  num(fd, "emission_factor_direct"),
          electricity_mwh:         num(fd, "electricity_mwh"),
          ef_grid:                 num(fd, "ef_grid"),
          pfc_emissions_ton:       num(fd, "pfc_emissions_ton"),
        },
      };
    case "cement":
      return {
        sector: "cement",
        inputs: {
          clinker_ton:             num(fd, "clinker_ton"),
          calcination_factor:      num(fd, "calcination_factor"),
          fuel_consumption_gj:     num(fd, "fuel_consumption_gj"),
          fuel_emission_factor:    num(fd, "fuel_emission_factor"),
          electricity_mwh:         num(fd, "electricity_mwh"),
          ef_grid:                 num(fd, "ef_grid"),
        },
      };
    case "chemicals":
      return {
        sector: "chemicals",
        inputs: {
          activity_data_ton:        num(fd, "activity_data_ton"),
          process_emission_factor:  num(fd, "process_emission_factor"),
          fuel_consumption_gj:      num(fd, "fuel_consumption_gj"),
          fuel_emission_factor:     num(fd, "fuel_emission_factor"),
          electricity_mwh:          num(fd, "electricity_mwh"),
          ef_grid:                  num(fd, "ef_grid"),
        },
      };
    case "electricity":
      return {
        sector: "electricity",
        inputs: {
          electricity_mwh: num(fd, "electricity_mwh"),
          ef_grid:         num(fd, "ef_grid"),
        },
      };
    default:
      throw new Error("Geçersiz sektör.");
  }
}
