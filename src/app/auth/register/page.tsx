"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { OrgType } from "@/types/database";

const PLANS: { type: OrgType; label: string; price: string; desc: string }[] = [
  {
    type: "SUPPLIER",
    label: "Tedarikçi",
    price: "$30/ay",
    desc: "Veri girişi, OCR kanıt yükleme, emisyon hesaplama",
  },
  {
    type: "CORPORATE",
    label: "Kurumsal",
    price: "$899/ay",
    desc: "Tedarikçi ağı izleme, konsolide raporlama, CBAM risk analizi",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [orgType, setOrgType] = useState<OrgType>("SUPPLIER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const supabase = createClient();

    // Trigger (002_auth_trigger.sql) organizations + org_members'ı otomatik oluşturur
    const { error: signUpError } = await supabase.auth.signUp({
      email: fd.get("email") as string,
      password: fd.get("password") as string,
      options: {
        data: {
          org_name: fd.get("org_name"),
          tax_id:   fd.get("tax_id"),
          org_type: orgType,
        },
      },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    router.push("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-grid px-4 py-12"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center glow-green" style={{ backgroundColor: "var(--color-primary-600)" }}>
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>3 Gün Ücretsiz Dene</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Kredi kartı gerekmez</p>
        </div>

        {/* Plan Seçimi */}
        <div className="grid grid-cols-2 gap-3">
          {PLANS.map((plan) => (
            <button
              key={plan.type}
              type="button"
              onClick={() => setOrgType(plan.type)}
              className={orgType === plan.type ? "nav-item-active flex-col items-start gap-1 h-auto py-3" : "nctr-card flex-col items-start gap-1 h-auto py-3 cursor-pointer hover:border-border-strong transition-colors"}
              style={{ display: "flex", textAlign: "left" }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: orgType === plan.type ? "var(--color-primary-500)" : "var(--color-text-primary)" }}>
                {plan.label}
              </span>
              <span style={{ fontSize: "0.8125rem", color: "var(--color-primary-500)", fontWeight: 500 }}>{plan.price}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.4 }}>{plan.desc}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="nctr-card space-y-4">
          <input type="hidden" name="org_type" value={orgType} />

          <div className="space-y-1.5">
            <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Şirket Adı</label>
            <input name="org_name" type="text" required placeholder="Örnek A.Ş." className="nctr-input" />
          </div>

          <div className="space-y-1.5">
            <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Vergi Kimlik No</label>
            <input name="tax_id" type="text" required placeholder="1234567890" className="nctr-input" />
          </div>

          <div className="space-y-1.5">
            <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>E-posta</label>
            <input name="email" type="email" required autoComplete="email" placeholder="sirket@ornek.com" className="nctr-input" />
          </div>

          <div className="space-y-1.5">
            <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Şifre</label>
            <input name="password" type="password" required minLength={8} placeholder="En az 8 karakter" className="nctr-input" />
          </div>

          {error && (
            <p className="badge-danger justify-center py-2 rounded-lg text-center" style={{ fontSize: "0.8125rem" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2" style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? "Hesap oluşturuluyor…" : "Hesap Oluştur — 3 Gün Ücretsiz"}
          </button>
        </form>

        <p className="text-center" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Zaten hesabın var mı?{" "}
          <a href="/auth/login" style={{ color: "var(--color-primary-500)" }}>Giriş Yap</a>
        </p>
      </div>
    </div>
  );
}
