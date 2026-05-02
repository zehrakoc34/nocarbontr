import * as XLSX from "xlsx";
import type { CBAMReportData } from "./xml-generator";

export function generateCBAMXlsx(data: CBAMReportData): Buffer {
  const { report, goods } = data;
  const wb = XLSX.utils.book_new();

  // ─── Metadata header ──────────────────────────────────────────
  const rows: unknown[][] = [
    ["CBAM Quarterly Report", "", "", "", ""],
    ["Declarant",      report.declarant_name ?? "",       "", "Period", `${report.reporting_period} / ${report.year}`],
    ["EORI / Tax No",  report.declarant_id_number ?? "",  "", "Report ID", report.id],
    ["Generated",      new Date().toISOString(),           "", "", ""],
    [], // blank separator
    // Column headers
    [
      "Item #",
      "CN Code",
      "HS Code",
      "Commodity",
      "Origin Country",
      "Net Mass (kg)",
      "Supp. Units",
      "Measurement Unit",
      "Prod. Country",
      "Installation",
      "Direct SEE (tCO₂/t)",
      "Indirect SEE (tCO₂/t)",
      "Indirect EF",
      "Electricity (MWh)",
      "Method",
      "Remarks",
    ],
  ];

  for (const good of goods) {
    if (good.emissions.length === 0) {
      // Good without emissions — one row, emission cols blank
      rows.push([
        good.item_number,
        good.cn_code ?? "",
        good.hs_code ?? "",
        good.commodity_description ?? "",
        good.origin_country ?? "",
        good.net_mass ?? "",
        good.supplementary_units ?? "",
        good.measurement_unit ?? "",
        "", "", "", "", "", "", "", good.remarks ?? "",
      ]);
    } else {
      for (const em of good.emissions) {
        rows.push([
          good.item_number,
          good.cn_code ?? "",
          good.hs_code ?? "",
          good.commodity_description ?? "",
          good.origin_country ?? "",
          good.net_mass ?? "",
          good.supplementary_units ?? "",
          good.measurement_unit ?? "",
          em.production_country ?? "",
          (em.installation as Record<string, unknown> | null)?.installation_name ?? "",
          em.direct_see ?? "",
          em.indirect_see ?? "",
          em.indirect_ef ?? "",
          em.indirect_electricity_consumed ?? "",
          em.direct_reporting_type_method ?? "",
          good.remarks ?? "",
        ]);
      }
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 7 }, { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 24 },
    { wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "CBAM Summary");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
