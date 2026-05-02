import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCBAMXml } from "@/lib/reports/xml-generator";
import { fetchReportData } from "@/lib/reports/data-fetcher";

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

  const result = await fetchReportData(supabase as Parameters<typeof fetchReportData>[0], id, member.org_id);
  if (!result) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const xml = generateCBAMXml(result.reportData);
  const filename = `CBAM_QReport_${result.report.year}_${result.report.reporting_period}_${id.slice(0, 8)}.xml`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
