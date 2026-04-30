import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCBAMXml, type CBAMReportData } from "@/lib/reports/xml-generator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Raporu çek (sahiplik kontrolü dahil)
  const { data: report } = await supabase
    .from("cbam_reports")
    .select("*")
    .eq("id", id)
    .eq("org_id", member.org_id)
    .single();

  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  // Malları çek
  const { data: goods } = await supabase
    .from("cbam_imported_goods")
    .select("*")
    .eq("report_id", id)
    .order("item_number");

  const goodIds = (goods ?? []).map((g) => g.id);

  // Emisyonları çek (tesis bilgisi dahil)
  const { data: emissions } = goodIds.length > 0
    ? await supabase
        .from("cbam_goods_emissions")
        .select(`*, installations(*)`)
        .in("good_id", goodIds)
    : { data: [] };

  // evidence_vault, emission_data.id üzerinden bağlı — cbam_imported_goods ile doğrudan ilişkisi yok.
  // cbam_supporting_docs tablosu üzerinden bağlanacak (gelecek aşama). Şimdilik boş.
  const evidencesByGood: Record<string, { file_url: string; verification_hash: string }[]> = {};

  // Veriyi yapılandır
  const emissionsByGood = Object.fromEntries(
    (goods ?? []).map((g) => [
      g.id,
      (emissions ?? []).filter((e) => e.good_id === g.id),
    ])
  );

  const reportData: CBAMReportData = {
    report: {
      id: report.id,
      reporting_period: report.reporting_period,
      year: report.year,
      declarant_id_number: report.declarant_id_number,
      declarant_name: report.declarant_name,
      declarant_role: report.declarant_role,
      decl_city: report.decl_city,
      decl_street: report.decl_street,
      decl_street_additional: report.decl_street_additional,
      decl_street_number: report.decl_street_number,
      decl_postcode: report.decl_postcode,
      decl_subdivision: report.decl_subdivision,
      decl_po_box: report.decl_po_box,
      rep_id_number: report.rep_id_number,
      rep_name: report.rep_name,
      rep_country: report.rep_country,
      rep_city: report.rep_city,
      rep_street: report.rep_street,
      rep_postcode: report.rep_postcode,
      importer_id_number: report.importer_id_number,
      importer_name: report.importer_name,
      importer_country: report.importer_country,
      importer_city: report.importer_city,
      importer_street: report.importer_street,
      importer_postcode: report.importer_postcode,
      global_data_confirmation: report.global_data_confirmation,
      use_of_data_confirmation: report.use_of_data_confirmation,
      other_methodology_confirmation: report.other_methodology_confirmation,
      signature_place: report.signature_place,
      signature: report.signature,
      position_of_person: report.position_of_person,
      remarks: report.remarks,
    },
    goods: (goods ?? []).map((good) => ({
      id: good.id,
      item_number: good.item_number,
      hs_code: good.hs_code,
      cn_code: good.cn_code,
      commodity_description: good.commodity_description,
      origin_country: good.origin_country,
      procedure_requested: good.procedure_requested,
      procedure_previous: good.procedure_previous,
      import_area: good.import_area,
      net_mass: good.net_mass ? Number(good.net_mass) : null,
      supplementary_units: good.supplementary_units ? Number(good.supplementary_units) : null,
      measurement_unit: good.measurement_unit,
      measure_indicator: good.measure_indicator,
      remarks: good.remarks,
      evidences: evidencesByGood[good.id] ?? [],
      emissions: (emissionsByGood[good.id] ?? []).map((em: Record<string, unknown>) => ({
        id: em.id,
        production_country: em.production_country,
        produced_net_mass: em.produced_net_mass ? Number(em.produced_net_mass) : null,
        produced_supplementary_units: em.produced_supplementary_units ? Number(em.produced_supplementary_units) : null,
        produced_measurement_unit: em.produced_measurement_unit,
        direct_determination_type: em.direct_determination_type,
        direct_reporting_type_method: em.direct_reporting_type_method,
        direct_reporting_methodology: em.direct_reporting_methodology,
        direct_see: em.direct_see ? Number(em.direct_see) : null,
        direct_measurement_unit: em.direct_measurement_unit,
        indirect_determination_type: em.indirect_determination_type,
        indirect_ef_source: em.indirect_ef_source,
        indirect_ef: em.indirect_ef ? Number(em.indirect_ef) : null,
        indirect_see: em.indirect_see ? Number(em.indirect_see) : null,
        indirect_measurement_unit: em.indirect_measurement_unit,
        indirect_electricity_consumed: em.indirect_electricity_consumed ? Number(em.indirect_electricity_consumed) : null,
        indirect_electricity_source: em.indirect_electricity_source,
        indirect_ef_source_value: em.indirect_ef_source_value,
        carbon_prices: Array.isArray(em.carbon_prices) ? em.carbon_prices : [],
        remarks: em.remarks,
        installation: em.installations ?? null,
      })),
    })),
  };

  const xml = generateCBAMXml(reportData);
  const filename = `CBAM_QReport_${report.year}_${report.reporting_period}_${id.slice(0, 8)}.xml`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
