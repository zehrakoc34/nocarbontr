"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    fd.get("email") as string,
      password: fd.get("password") as string,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-grid px-4"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div
            className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center glow-green"
            style={{ backgroundColor: "var(--color-primary-600)" }}
          >
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            nocarbontr
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            CBAM Uyumluluk Platformuna Giriş
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="nctr-card space-y-4">
          <div className="space-y-1.5">
            <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
              E-posta
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="sirket@ornek.com"
              className="nctr-input"
            />
          </div>

          <div className="space-y-1.5">
            <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
              Şifre
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="nctr-input"
            />
          </div>

          {error && (
            <p
              className="badge-danger justify-center py-2 rounded-lg text-center"
              style={{ fontSize: "0.8125rem", display: "flex" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-2"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>

        <p className="text-center" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Hesabın yok mu?{" "}
          <a href="/auth/register" style={{ color: "var(--color-primary-500)" }}>
            Ücretsiz Dene — 3 Gün
          </a>
        </p>
      </div>
    </div>
  );
}
