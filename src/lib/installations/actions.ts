"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type InstallationState = { error?: string; success?: boolean };

export async function saveInstallation(
  _prev: InstallationState,
  formData: FormData
): Promise<InstallationState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return { error: "Organizasyon bulunamadı." };

  const id = formData.get("id") as string | null;
  const payload = {
    supplier_id:          member.org_id,
    installation_ref:     (formData.get("installation_ref") as string).trim(),
    installation_name:    (formData.get("installation_name") as string).trim(),
    economic_activity:    (formData.get("economic_activity") as string).trim() || null,
    country:              (formData.get("country") as string) || "TR",
    subdivision:          (formData.get("subdivision") as string).trim() || null,
    city:                 (formData.get("city") as string).trim() || null,
    street:               (formData.get("street") as string).trim() || null,
    street_additional:    (formData.get("street_additional") as string).trim() || null,
    street_number:        (formData.get("street_number") as string).trim() || null,
    postcode:             (formData.get("postcode") as string).trim() || null,
    po_box:               (formData.get("po_box") as string).trim() || null,
    plot_parcel_number:   (formData.get("plot_parcel_number") as string).trim() || null,
    latitude:             parseFloat(formData.get("latitude") as string) || null,
    longitude:            parseFloat(formData.get("longitude") as string) || null,
    operator_ref:         (formData.get("operator_ref") as string).trim() || null,
    operator_name:        (formData.get("operator_name") as string).trim() || null,
    op_country:           (formData.get("op_country") as string) || null,
    op_city:              (formData.get("op_city") as string).trim() || null,
    op_street:            (formData.get("op_street") as string).trim() || null,
    op_postcode:          (formData.get("op_postcode") as string).trim() || null,
    op_contact_name:      (formData.get("op_contact_name") as string).trim() || null,
    op_phone:             (formData.get("op_phone") as string).trim() || null,
    op_email:             (formData.get("op_email") as string).trim() || null,
  };

  if (!payload.installation_ref || !payload.installation_name) {
    return { error: "Tesis ID ve Tesis Adı zorunludur." };
  }

  const { error } = id
    ? await supabase.from("installations").update(payload).eq("id", id).eq("supplier_id", member.org_id)
    : await supabase.from("installations").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/supplier/installations");
  return { success: true };
}

export async function deleteInstallation(id: string): Promise<InstallationState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return { error: "Organizasyon bulunamadı." };

  const { error } = await supabase
    .from("installations")
    .delete()
    .eq("id", id)
    .eq("supplier_id", member.org_id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/supplier/installations");
  return { success: true };
}
