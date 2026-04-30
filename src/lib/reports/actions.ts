"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ─── Rapor Oluştur (1. adım) ──────────────────────────────────
export type ReportHeaderState = { error?: string; reportId?: string };

export async function createReport(
  _prev: ReportHeaderState,
  formData: FormData
): Promise<ReportHeaderState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };
  if (user.user_metadata?.org_type !== "CORPORATE") return { error: "Sadece kurumsal hesaplar rapor oluşturabilir." };

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return { error: "Organizasyon bulunamadı." };

  const { data: org } = await supabase
    .from("organizations").select("name, tax_id").eq("id", member.org_id).single();

  const period = formData.get("reporting_period") as string;
  const year   = parseInt(formData.get("year") as string);

  if (!["Q1","Q2","Q3","Q4"].includes(period)) return { error: "Geçersiz dönem." };
  if (year < 2026) return { error: "Yıl 2026 veya sonrası olmalı." };

  // Aynı dönem için mevcut rapor var mı kontrol et
  const { data: existing } = await supabase
    .from("cbam_reports")
    .select("id")
    .eq("org_id", member.org_id)
    .eq("reporting_period", period)
    .eq("year", year)
    .maybeSingle();

  if (existing) {
    redirect(`/dashboard/company/reports/${existing.id}`);
  }

  const { data: report, error } = await supabase
    .from("cbam_reports")
    .insert({
      org_id:            member.org_id,
      reporting_period:  period,
      year,
      declarant_name:    org?.name ?? user.user_metadata?.org_name,
      declarant_id_number: formData.get("declarant_id_number") as string || org?.tax_id,
      declarant_role:    formData.get("declarant_role") as string || "01",
      decl_city:         formData.get("decl_city") as string || null,
      decl_street:       formData.get("decl_street") as string || null,
      decl_postcode:     formData.get("decl_postcode") as string || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/company/reports");
  redirect(`/dashboard/company/reports/${report.id}`);
}

// ─── İthal Edilen Mal Ekle ─────────────────────────────────────
export type GoodState = { error?: string; success?: boolean; goodId?: string };

export async function addImportedGood(
  _prev: GoodState,
  formData: FormData
): Promise<GoodState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return { error: "Organizasyon bulunamadı." };

  const reportId = formData.get("report_id") as string;

  // Rapor bu org'a ait mi?
  const { data: report } = await supabase
    .from("cbam_reports").select("id, org_id").eq("id", reportId).single();
  if (!report || report.org_id !== member.org_id) return { error: "Rapor bulunamadı." };

  // Mevcut item_number sayısı
  const { count } = await supabase
    .from("cbam_imported_goods")
    .select("*", { count: "exact", head: true })
    .eq("report_id", reportId);

  const netMassRaw = formData.get("net_mass") as string;
  const suppUnitsRaw = formData.get("supplementary_units") as string;

  const { data: good, error } = await supabase
    .from("cbam_imported_goods")
    .insert({
      report_id:           reportId,
      item_number:         (count ?? 0) + 1,
      hs_code:             (formData.get("hs_code") as string).trim() || null,
      cn_code:             (formData.get("cn_code") as string).trim() || null,
      commodity_description: (formData.get("commodity_description") as string).trim() || null,
      origin_country:      formData.get("origin_country") as string || "TR",
      procedure_requested: formData.get("procedure_requested") as string || "40",
      procedure_previous:  (formData.get("procedure_previous") as string).trim() || null,
      import_area:         formData.get("import_area") as string || "EU",
      net_mass:            netMassRaw ? parseFloat(netMassRaw) : null,
      supplementary_units: suppUnitsRaw ? parseFloat(suppUnitsRaw) : null,
      measurement_unit:    formData.get("measurement_unit") as string || "01",
      remarks:             (formData.get("remarks") as string).trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/company/reports/${reportId}`);
  return { success: true, goodId: good.id };
}

// ─── Mal Emisyonu Ekle ─────────────────────────────────────────
export type EmissionState = { error?: string; success?: boolean };

export async function addGoodsEmission(
  _prev: EmissionState,
  formData: FormData
): Promise<EmissionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return { error: "Organizasyon bulunamadı." };

  const goodId         = formData.get("good_id") as string;
  const installationId = (formData.get("installation_id") as string) || null;

  const directSEERaw    = formData.get("direct_see") as string;
  const indirectSEERaw  = formData.get("indirect_see") as string;
  const elecConsumedRaw = formData.get("indirect_electricity_consumed") as string;
  const indirectEFRaw   = formData.get("indirect_ef") as string;
  const producedMassRaw = formData.get("produced_net_mass") as string;
  const producedSuppRaw = formData.get("produced_supplementary_units") as string;

  const hasIndirect = !!indirectSEERaw;

  const { error } = await supabase
    .from("cbam_goods_emissions")
    .insert({
      good_id:                      goodId,
      installation_id:              installationId || null,
      production_country:           formData.get("production_country") as string || "TR",
      produced_net_mass:            producedMassRaw ? parseFloat(producedMassRaw) : null,
      produced_supplementary_units: producedSuppRaw ? parseFloat(producedSuppRaw) : null,
      produced_measurement_unit:    formData.get("produced_measurement_unit") as string || "01",
      direct_determination_type:    formData.get("direct_determination_type") as string || "01",
      direct_reporting_type_method: formData.get("direct_reporting_type_method") as string || "TOM02",
      direct_reporting_methodology: (formData.get("direct_reporting_methodology") as string).trim() || null,
      direct_see:                   directSEERaw ? parseFloat(directSEERaw) : null,
      direct_measurement_unit:      "EMU1",
      indirect_determination_type:  hasIndirect ? (formData.get("indirect_determination_type") as string || "01") : null,
      indirect_ef_source:           hasIndirect ? (formData.get("indirect_ef_source") as string || "01") : null,
      indirect_ef:                  hasIndirect && indirectEFRaw ? parseFloat(indirectEFRaw) : null,
      indirect_see:                 hasIndirect ? parseFloat(indirectSEERaw) : null,
      indirect_electricity_consumed: hasIndirect && elecConsumedRaw ? parseFloat(elecConsumedRaw) : null,
      indirect_electricity_source:  hasIndirect ? (formData.get("indirect_electricity_source") as string || "SOE01") : null,
      remarks:                      (formData.get("remarks") as string).trim() || null,
    });

  if (error) return { error: error.message };

  // good'un report_id'sini bul
  const { data: good } = await supabase
    .from("cbam_imported_goods").select("report_id").eq("id", goodId).single();

  if (good) revalidatePath(`/dashboard/company/reports/${good.report_id}`);
  return { success: true };
}

// ─── Rapor İmzala / Onayla ────────────────────────────────────
export async function finalizeReport(reportId: string, formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return;

  await supabase
    .from("cbam_reports")
    .update({
      global_data_confirmation:       formData.get("global_data_confirmation") === "true",
      use_of_data_confirmation:       formData.get("use_of_data_confirmation") === "true",
      other_methodology_confirmation: formData.get("other_methodology_confirmation") === "true",
      signature_place:  formData.get("signature_place") as string,
      signature:        formData.get("signature") as string,
      position_of_person: formData.get("position_of_person") as string,
      remarks:          formData.get("remarks") as string || null,
      status:           "READY",
    })
    .eq("id", reportId)
    .eq("org_id", member.org_id);

  revalidatePath(`/dashboard/company/reports/${reportId}`);
}

// ─── Mal Sil ──────────────────────────────────────────────────
export async function deleteImportedGood(goodId: string, reportId: string) {
  "use server";
  const supabase = await createClient();
  await supabase.from("cbam_imported_goods").delete().eq("id", goodId);
  revalidatePath(`/dashboard/company/reports/${reportId}`);
}
