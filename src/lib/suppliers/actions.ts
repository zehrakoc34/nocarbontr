"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// ─── Rastgele Geçici Şifre Üret ──────────────────────────────────────────────
function generateTempPassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── Resend ile Email Gönder ──────────────────────────────────────────────────
async function sendInviteEmail(to: string, tempPassword: string, companyName: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "nocarbontr <noreply@nocarbontr.com>",
      to: [to],
      subject: `${companyName} sizi nocarbontr CBAM platformuna davet etti`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <div style="background: #0f1117; border-radius: 12px; padding: 32px; color: #fff;">
            <h2 style="color: #22c55e; margin: 0 0 16px;">nocarbontr'a Hoş Geldiniz</h2>
            <p style="color: #a1a1aa; margin: 0 0 24px;">
              <strong style="color: #fff;">${companyName}</strong> firması sizi tedarikçi olarak CBAM emisyon raporlama platformuna davet etti.
            </p>
            <div style="background: #1a1d2e; border: 1px solid #2d2f3e; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 13px;">Giriş Bilgileriniz:</p>
              <p style="margin: 0 0 4px; color: #fff; font-size: 14px;">
                <strong>E-posta:</strong> ${to}
              </p>
              <p style="margin: 0; color: #22c55e; font-size: 18px; font-weight: 700; font-family: monospace; letter-spacing: 1px;">
                Geçici Şifre: ${tempPassword}
              </p>
            </div>
            <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 20px;">
              Giriş yaptıktan sonra şifrenizi değiştirmenizi öneririz. Emisyon verilerinizi girerek CBAM uyumluluk sürecinizi başlatabilirsiniz.
            </p>
            <a href="https://nocarbontr.com/auth/login"
               style="display: inline-block; background: #22c55e; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Platforma Giriş Yap →
            </a>
          </div>
        </div>
      `,
    }),
  });
}

// ─── Tedarikçi Davet Et ──────────────────────────────────────────────────────
export type InviteState = { error?: string; success?: boolean; message?: string };

export async function inviteSupplier(
  prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };
  if (user.user_metadata?.org_type !== "CORPORATE") return { error: "Sadece kurumsal hesaplar davet gönderebilir." };

  const { data: member } = await supabase
    .from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return { error: "Organizasyon bulunamadı." };

  const { data: companyOrg } = await supabase
    .from("organizations").select("name").eq("id", member.org_id).single();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Geçerli bir email adresi girin." };

  const supplierName = (formData.get("supplier_name") as string)?.trim() || email.split("@")[0];

  // Aynı email zaten davet edilmiş mi?
  const { data: existingConn } = await supabase
    .from("network_connections")
    .select("id")
    .eq("company_id", member.org_id)
    .eq("supplier_email", email)
    .maybeSingle();

  if (existingConn) return { error: "Bu email adresi zaten davet edilmiş." };

  const tempPassword = generateTempPassword();

  // Supabase admin ile user oluştur
  const { data: newUser, error: userError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      org_type: "SUPPLIER",
      org_name: supplierName,
    },
  });

  if (userError) {
    // Kullanıcı zaten varsa — mevcut user ile devam et
    if (!userError.message.includes("already registered")) {
      return { error: `Kullanıcı oluşturulamadı: ${userError.message}` };
    }
  }

  let supplierId: string;

  if (newUser?.user) {
    // Yeni org oluştur
    const { data: newOrg, error: orgError } = await admin
      .from("organizations")
      .insert({ name: supplierName, type: "SUPPLIER" })
      .select("id")
      .single();

    if (orgError || !newOrg) return { error: "Organizasyon oluşturulamadı." };

    supplierId = newOrg.id;

    // org_members bağla
    await admin.from("org_members").insert({
      org_id: supplierId,
      user_id: newUser.user.id,
      role: "ADMIN",
    });
  } else {
    // Mevcut kullanıcı — org bul veya oluştur
    const { data: existingUser } = await admin.auth.admin.listUsers();
    const foundUser = existingUser?.users?.find(u => u.email === email);

    if (!foundUser) return { error: "Kullanıcı işlemi başarısız." };

    const { data: existingMember } = await admin
      .from("org_members").select("org_id").eq("user_id", foundUser.id).maybeSingle();

    if (existingMember) {
      supplierId = existingMember.org_id;
    } else {
      const { data: newOrg } = await admin
        .from("organizations")
        .insert({ name: supplierName, type: "SUPPLIER" })
        .select("id")
        .single();
      if (!newOrg) return { error: "Organizasyon oluşturulamadı." };
      supplierId = newOrg.id;
      await admin.from("org_members").insert({ org_id: supplierId, user_id: foundUser.id, role: "ADMIN" });
    }
  }

  // network_connections kaydet
  const { error: connError } = await admin.from("network_connections").insert({
    company_id: member.org_id,
    supplier_id: supplierId,
    status: "PENDING",
    temp_password: tempPassword,
    supplier_email: email,
  });

  if (connError) return { error: `Bağlantı oluşturulamadı: ${connError.message}` };

  // Email gönder
  try {
    await sendInviteEmail(email, tempPassword, companyOrg?.name ?? "Bir şirket");
  } catch {
    // Email gönderimi arka planda — kritik değil
  }

  revalidatePath("/dashboard/company/suppliers");
  return { success: true, message: `${email} adresine davet gönderildi.` };
}

// ─── Emisyon Onay/Red ─────────────────────────────────────────────────────────
export async function approveEmission(emissionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };

  const { error } = await supabase
    .from("emission_data")
    .update({ status: "APPROVED", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", emissionId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/company/approvals");
  return {};
}

export async function rejectEmission(emissionId: string, note: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };

  const { error } = await supabase
    .from("emission_data")
    .update({
      status: "REJECTED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_note: note,
    })
    .eq("id", emissionId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/company/approvals");
  return {};
}

// ─── Emisyon Raporu Gönder ────────────────────────────────────────────────────
export async function submitEmissionReport(emissionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor." };

  const { error } = await supabase
    .from("emission_data")
    .update({ status: "SUBMITTED" })
    .eq("id", emissionId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/supplier/emissions");
  return {};
}
