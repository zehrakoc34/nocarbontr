"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EvidenceState = {
  error?: string;
  success?: boolean;
  fileUrl?: string;
};

// SHA-256 hash (Web Crypto API — Node.js 18+ destekler)
async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function uploadEvidence(
  _prev: EvidenceState,
  formData: FormData
): Promise<EvidenceState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return { error: "Organizasyon bulunamadı." };

  const file = formData.get("file") as File | null;
  const emissionId = formData.get("emission_id") as string;

  if (!file || file.size === 0) return { error: "Dosya seçilmedi." };
  if (!emissionId) return { error: "Emisyon kaydı seçilmedi." };

  // Dosya boyutu max 20 MB
  if (file.size > 20 * 1024 * 1024) return { error: "Dosya en fazla 20 MB olabilir." };

  // Emisyon kaydı bu tedarikçiye ait mi kontrol et
  const { data: emission } = await supabase
    .from("emission_data")
    .select("id, supplier_id, sector, year")
    .eq("id", emissionId)
    .eq("supplier_id", member.org_id)
    .single();

  if (!emission) return { error: "Emisyon kaydı bulunamadı." };

  // Dosyayı buffer'a çevir ve hash hesapla
  const arrayBuffer = await file.arrayBuffer();
  const hash = await sha256Hex(arrayBuffer);

  // Supabase Storage'a yükle
  // Bucket: evidence / Path: {org_id}/{emission_id}/{filename}
  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${member.org_id}/${emissionId}/${Date.now()}.${ext}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("evidence")
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    // Bucket yoksa anlamlı hata ver
    if (uploadError.message.includes("Bucket not found")) {
      return { error: "Supabase Storage'da 'evidence' bucket'ı oluşturulmalı. Dashboard > Storage > New bucket." };
    }
    return { error: uploadError.message };
  }

  // Public URL al
  const { data: urlData } = supabase.storage
    .from("evidence")
    .getPublicUrl(uploadData.path);

  const fileUrl = urlData.publicUrl;

  // evidence_vault tablosuna kaydet
  const { error: dbError } = await supabase
    .from("evidence_vault")
    .insert({
      report_id:         emissionId,
      file_url:          fileUrl,
      verification_hash: hash,
    });

  if (dbError) return { error: dbError.message };

  revalidatePath("/dashboard/supplier/evidence");
  return { success: true, fileUrl };
}

export async function deleteEvidence(evidenceId: string): Promise<EvidenceState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return { error: "Organizasyon bulunamadı." };

  // Kaydı al (storage path için URL'i parse et)
  const { data: ev } = await supabase
    .from("evidence_vault")
    .select("id, file_url, report_id")
    .eq("id", evidenceId)
    .single();

  if (!ev) return { error: "Kayıt bulunamadı." };

  // Sahiplik kontrolü
  const { data: emission } = await supabase
    .from("emission_data")
    .select("supplier_id")
    .eq("id", ev.report_id)
    .single();

  if (emission?.supplier_id !== member.org_id) return { error: "Yetkisiz işlem." };

  // Storage'dan sil
  const url = new URL(ev.file_url);
  const pathParts = url.pathname.split("/evidence/");
  if (pathParts[1]) {
    await supabase.storage.from("evidence").remove([pathParts[1]]);
  }

  // DB'den sil
  await supabase.from("evidence_vault").delete().eq("id", evidenceId);

  revalidatePath("/dashboard/supplier/evidence");
  return { success: true };
}
