"use client";

import { useState } from "react";
import { ScopeCalculator } from "@/components/calculator/ScopeCalculator";
import { createClient } from "@/lib/supabase/client";
import { recalculateTrustScore } from "@/lib/trust/actions";
import type { ScopeResult, ScopeEngineInputs } from "@/lib/calculations/scope-engine";
import type { Product } from "@/constants/productAtlas";

export default function ScopePage() {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState<{ product: string; total: number; intensity: number } | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  async function handleSave(result: ScopeResult, product: Product, inputs: ScopeEngineInputs) {
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
        sector:            product.category.toLowerCase(),
        year:              new Date().getFullYear(),
        emissions_ton_co2: result.breakdown.total_tco2,
        data_source:       "MANUAL",
        formula_version:   `scope-engine-v1/${result.formula_type}`,
        raw_inputs: {
          product_id:    product.id,
          product_name:  product.name,
          nace_code:     product.naceCode,
          formula_type:  result.formula_type,
          scope1:        result.breakdown.scope1_direct_tco2,
          scope2:        result.breakdown.scope2_energy_tco2,
          scope3:        result.breakdown.scope3_upstream_tco2,
          intensity:     result.breakdown.intensity_kgco2_per_kg,
          production_kg: inputs.production_quantity_kg,
          line_items:    result.line_items,
        },
      });

      if (dbErr) throw new Error(dbErr.message);

      await recalculateTrustScore(member.org_id).catch(() => {});
      setSaved({
        product:   product.name,
        total:     result.breakdown.total_tco2,
        intensity: result.breakdown.intensity_kgco2_per_kg,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div className="nctr-card-elevated animate-fade-in space-y-5" style={{ border: "1px solid rgba(22,163,74,0.25)" }}>
          <div className="flex items-center gap-4">
            <div style={{
              width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
              backgroundColor: "var(--color-primary-50)",
              border: "1px solid rgba(22,163,74,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.25rem",
            }}>✅</div>
            <div>
              <p style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{saved.product}</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Kapsam analizi kaydedildi, Trust Score güncellendi</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="nctr-card text-center py-4 space-y-1">
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>Toplam Emisyon</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {saved.total.toLocaleString("tr-TR", { maximumFractionDigits: 3 })}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>tCO₂e</p>
            </div>
            <div className="nctr-card text-center py-4 space-y-1">
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>Yoğunluk</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary-700)", fontVariantNumeric: "tabular-nums" }}>
                {saved.intensity.toLocaleString("tr-TR", { maximumFractionDigits: 4 })}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>kgCO₂e/kg</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="/dashboard/supplier/trust" className="btn-primary flex-1 justify-center">
              Trust Score Görüntüle →
            </a>
            <button type="button" className="btn-secondary" onClick={() => setSaved(null)}>
              Yeni Analiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient-green">Kapsam 1/2/3 Analizi</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            500 ürün atlası · GHG Protocol · IPCC AR6 emisyon faktörleri
          </p>
        </div>
        <div style={{
          padding: "4px 10px", borderRadius: "6px",
          backgroundColor: "var(--color-info-bg)",
          border: "1px solid rgba(37,99,235,0.15)",
          fontSize: "0.6875rem", color: "var(--color-info-fg)", fontWeight: 600, textAlign: "center",
        }}>
          <div>GHG Protocol</div>
          <div>Corp. Standard</div>
        </div>
      </div>

      <div style={{
        backgroundColor: "var(--color-primary-50)",
        border: "1px solid rgba(22,163,74,0.2)",
        borderRadius: "0.625rem", padding: "0.75rem 1rem",
        display: "flex", alignItems: "flex-start", gap: "0.75rem",
        fontSize: "0.8125rem", color: "var(--color-primary-800)",
      }}>
        <span style={{ fontSize: "1rem", flexShrink: 0 }}>ℹ️</span>
        <span>
          <strong>Kapsam 1</strong> (doğrudan yanma) · <strong>Kapsam 2</strong> (satın alınan elektrik/ısı) ·
          <strong> Kapsam 3</strong> (malzeme tedariki, nakliye, su). Ürün seçin, girdileri doldurun ve hesaplayın.
        </span>
      </div>

      {error && (
        <div className="badge-danger py-3 px-4 rounded-lg" style={{ fontSize: "0.875rem" }}>
          {error}
        </div>
      )}

      <ScopeCalculator onSave={handleSave} saving={saving} />

      <div className="nctr-card space-y-2" style={{ backgroundColor: "var(--color-bg-elevated)" }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Veri Kaynakları</p>
        <div className="grid grid-cols-2 gap-2" style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {[
            ["IPCC AR6 (2021)",       "GWP100 değerleri"],
            ["GHG Protocol",          "Kapsam 1/2/3 metodolojisi"],
            ["Ecoinvent 3.9",         "Malzeme emisyon faktörleri"],
            ["IEA 2022",              "Türkiye şebeke: 0.441 kgCO₂/kWh"],
          ].map(([src, desc]) => (
            <div key={src} className="flex gap-2">
              <span style={{ color: "var(--color-primary-600)", fontWeight: 600, flexShrink: 0 }}>{src}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
