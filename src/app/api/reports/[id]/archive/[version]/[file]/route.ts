import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "cbam-archives";
const SIGNED_URL_TTL = 300; // 5 dakika

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; version: string; file: string }> }
) {
  const { id, version, file } = await params;

  if (!["xml", "xlsx", "zip"].includes(file)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Arşiv kaydını sahiplik kontrolüyle çek
  const { data: archive } = await supabase
    .from("reports_archive")
    .select("xml_url, excel_url, zip_url")
    .eq("report_id", id)
    .eq("version_number", parseInt(version, 10))
    .eq("importer_id", member.org_id)
    .single();

  if (!archive) return NextResponse.json({ error: "Archive not found" }, { status: 404 });

  const urlCol = file === "xml" ? archive.xml_url
               : file === "xlsx" ? archive.excel_url
               : archive.zip_url;

  if (!urlCol) return NextResponse.json({ error: "File not available" }, { status: 404 });

  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(urlCol, SIGNED_URL_TTL);

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
