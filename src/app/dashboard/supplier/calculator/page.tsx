"use client";

import { useState } from "react";
import { CBAMCalculator } from "@/components/calculator/CBAMCalculator";
import { createClient } from "@/lib/supabase/client";
import { recalculateTrustScore } from "@/lib/trust/actions";
import type { CBAMResult, CBAMSector } from "@/lib/calculations/cbam-engine";

export default function CalculatorPage() {
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState<{ label: string; see: number; total: number } | null>(null);
  const [error,  setError]    = useState<string | null>(null);

  async function handleSave(result: CBAMResult, sector: CBAMSector, sectorLabel: string) {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum açmanız gerekiyor.");

      const { data: member } = await supabase
        .from("org_members").select("org_id").eq("user_id", user.id).single();
      if (!member) throw new Error("Organizasyon bulunamadı.");

      const { error: dbErr } = await supabase.from("emission_data").insert({
        supplier_id:       member.org_id,
        sector:            sector,
        year:              new Date().getFullYear(),
        emissions_ton_co2: result.total_emissions_tco2,
        data_source:       "MANUAL",
        formula_version:   result.formula_version,
        raw_inputs: {
          ...result.breakdown,
          see:              result.see,
          default_see:      result.default_see,
          cbam_scope:       result.cbam_scope,
          direct:           result.direct_emissions_tco2,
          indirect:         result.indirect_emissions_tco2,
          production:       result.production_quantity,
          unit:             result.unit,
        },
      });

      if (dbErr) throw new Error(dbErr.message);

      await recalculateTrustScore(member.org_id).catch(() => {});
      setSaved({ label: sectorLabel, see: result.see, total: result.total_emissions_tco2 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div className="nctr-card-elevated animate-fade-in space-y-5"
          style={{ border: "1px solid rgba(22,163,74,0.25)" }}>
          <div className="flex items-center gap-4">
            <div style={{
              width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
              backgroundColor: "var(--color-primary-50)",
              border: "1px solid rgba(22,163,74,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.25rem",
            }}>✅</div>
            <div>
              <p style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{saved.label}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                Emisyon kaydedildi, Trust Score güncellendi
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="nctr-card text-center py-4 space-y-1">
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>Toplam Emisyon</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {saved.total.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>tCO₂e</p>
            </div>
            <div className="nctr-card text-center py-4 space-y-1">
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>SEE (Özgül)</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary-700)", fontVariantNumeric: "tabular-nums" }}>
                {saved.see.toLocaleString("tr-TR", { maximumFractionDigits: 4 })}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>tCO₂e/t</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="/dashboard/supplier/trust" className="btn-primary flex-1 justify-center">
              Trust Score Görüntüle →
            </a>
            <button type="button" className="btn-secondary" onClick={() => setSaved(null)}>
              Yeni Hesaplama
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-green">CBAM Emisyon Hesaplayıcı</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            EU IR 2025/2621 metodolojisi — 6 resmi CBAM sektörü — SEE hesaplama
          </p>
        </div>
        <div style={{
          padding: "4px 10px",
          borderRadius: "6px",
          backgroundColor: "var(--color-info-bg)",
          border: "1px solid rgba(37,99,235,0.15)",
          fontSize: "0.6875rem",
          color: "var(--color-info-fg)",
          fontWeight: 600,
          textAlign: "center",
        }}>
          <div>EU 2023/956</div>
          <div>Annex III</div>
        </div>
      </div>

      {/* Bilgi Bandı */}
      <div style={{
        backgroundColor: "var(--color-primary-50)",
        border: "1px solid rgba(22,163,74,0.2)",
        borderRadius: "0.625rem",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        fontSize: "0.8125rem",
        color: "var(--color-primary-800)",
      }}>
        <span style={{ fontSize: "1rem" }}>ℹ️</span>
        <span>
          <strong>SEE (Specific Embedded Emissions)</strong> — AB CBAM beyanında kullandığınız özgül gömülü emisyon değeri.
          Gerçek veriniz AB varsayılanının altında ise daha az CBAM sertifikası ödersiniz.
        </span>
      </div>

      {error && (
        <div className="badge-danger py-3 px-4 rounded-lg" style={{ fontSize: "0.875rem" }}>
          {error}
        </div>
      )}

      <CBAMCalculator onSave={handleSave} saving={saving} />

      {/* Metodoloji Notu */}
      <div className="nctr-card space-y-3" style={{ backgroundColor: "var(--color-bg-elevated)" }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
          Yasal Dayanak
        </p>
        <div className="grid grid-cols-2 gap-2" style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {[
            ["EU Reg 2023/956",     "CBAM çerçevesi, Annex I–IV"],
            ["EU IR 2023/1773",     "Geçiş dönemi hesaplama kuralları"],
            ["EU IR 2024/1235",     "Kesin dönem metodolojisi"],
            ["EU IR 2025/2621",     "Ülke bazlı varsayılan değerler"],
          ].map(([reg, desc]) => (
            <div key={reg} className="flex gap-2">
              <span style={{ color: "var(--color-primary-600)", fontWeight: 600, flexShrink: 0 }}>{reg}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
