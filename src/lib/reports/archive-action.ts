"use server";

import JSZip from "jszip";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCBAMXml } from "./xml-generator";
import { generateCBAMXlsx } from "./xlsx-generator";
import { fetchReportData } from "./data-fetcher";

const BUCKET = "cbam-archives";

export async function archiveReport(
  reportId: string,
  orgId: string,
  userId: string
): Promise<void> {
  try {
    const admin = createAdminClient();

    // Mevcut en yüksek versiyonu bul → nextVersion
    const { data: existing } = await admin
      .from("reports_archive")
      .select("version_number")
      .eq("report_id", reportId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (existing?.version_number ?? 0) + 1;

    // Rapor verisini admin ile çek (RLS bypass)
    const result = await fetchReportData(admin as Parameters<typeof fetchReportData>[0], reportId, orgId);
    if (!result) throw new Error(`Report not found: ${reportId}`);

    const { reportData, report } = result;

    // Dosya isim tabanı
    const basename = `CBAM_${report.year}_${report.reporting_period}_${reportId.slice(0, 8)}_v${nextVersion}`;

    // Dosya üretimi
    const xml = generateCBAMXml(reportData);
    const xlsx = generateCBAMXlsx(reportData);

    const zip = new JSZip();
    zip.file(`${basename}.xml`, xml);
    zip.file(`${basename}.xlsx`, xlsx);
    const zipBytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });

    // SHA-256 checksum (ZIP bytes üzerinden)
    const hashBuffer = await crypto.subtle.digest("SHA-256", zipBytes.buffer as ArrayBuffer);
    const checksum = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Storage path
    const basePath = `${orgId}/${report.year}/${reportId}/v${nextVersion}`;

    // Upload XML
    const { error: xmlErr } = await admin.storage.from(BUCKET).upload(
      `${basePath}/${basename}.xml`,
      Buffer.from(xml, "utf-8"),
      { contentType: "application/xml; charset=utf-8", upsert: false }
    );
    if (xmlErr) throw new Error(`XML upload failed: ${xmlErr.message}`);

    // Upload XLSX
    const { error: xlsxErr } = await admin.storage.from(BUCKET).upload(
      `${basePath}/${basename}.xlsx`,
      xlsx,
      { contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", upsert: false }
    );
    if (xlsxErr) throw new Error(`XLSX upload failed: ${xlsxErr.message}`);

    // Upload ZIP
    const { error: zipErr } = await admin.storage.from(BUCKET).upload(
      `${basePath}/${basename}.zip`,
      zipBytes,
      { contentType: "application/zip", upsert: false }
    );
    if (zipErr) throw new Error(`ZIP upload failed: ${zipErr.message}`);

    // DB kaydı
    const { error: insertErr } = await admin.from("reports_archive").insert({
      report_id:      reportId,
      version_number: nextVersion,
      importer_id:    orgId,
      xml_url:        `${basePath}/${basename}.xml`,
      excel_url:      `${basePath}/${basename}.xlsx`,
      zip_url:        `${basePath}/${basename}.zip`,
      checksum,
      created_by:     userId,
    });

    // Unique constraint → concurrent finalize, sessizce geç
    if (insertErr && !insertErr.message.includes("unique")) {
      throw new Error(`Archive insert failed: ${insertErr.message}`);
    }

    // cbam_reports.current_version güncelle
    await admin.from("cbam_reports")
      .update({ current_version: nextVersion })
      .eq("id", reportId);

  } catch (err) {
    // Arşivleme hatası finalizeReport'u durdurmaz — sadece logla
    console.error("[archiveReport] Failed:", err);
  }
}
