"use client";

import { useActionState, useState, useTransition } from "react";
import { saveEmission, type SaveEmissionState } from "@/lib/calculations/actions";
import { submitEmissionReport } from "@/lib/suppliers/actions";
import { calculate, DEFAULT_FACTORS, SECTOR_LABELS } from "@/lib/calculations/engine";
import { SectorFields } from "@/components/dashboard/SectorFields";
import { Badge } from "@/components/ui/Badge";
import type { Sector } from "@/lib/calculations/types";

const SECTORS: { value: Sector; label: string; icon: string }[] = [
  { value: "steel",       label: "Demir-Çelik",  icon: "⚙️" },
  { value: "aluminum",    label: "Alüminyum",     icon: "🔩" },
  { value: "cement",      label: "Çimento",       icon: "🏗️" },
  { value: "chemicals",   label: "Kimyasallar",   icon: "🧪" },
  { value: "electricity", label: "Elektrik",      icon: "⚡" },
];

const CURRENT_YEAR = 2026;

const initialState: SaveEmissionState = {};

export default function EmissionsPage() {
  const [sector, setSector] = useState<Sector>("steel");
  const [preview, setPreview] = useState<number | null>(null);
  const [state, formAction, pending] = useActionState(saveEmission, initialState);

  // Canlı ön hesaplama (kaydetmeden önce sonucu göster)
  function handlePreview(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    try {
      const def = DEFAULT_FACTORS[sector];
      let result;

      if (sector === "steel") {
        result = calculate({
          sector: "steel",
          inputs: {
            activity_data_ton:      parseFloat(fd.get("activity_data_ton") as string) || 0,
            emission_factor_direct: parseFloat(fd.get("emission_factor_direct") as string) || def.emission_factor_direct,
            electricity_mwh:        parseFloat(fd.get("electricity_mwh") as string) || 0,
            ef_grid:                parseFloat(fd.get("ef_grid") as string) || def.ef_grid,
          },
        });
      } else if (sector === "aluminum") {
        result = calculate({
          sector: "aluminum",
          inputs: {
            activity_data_ton:      parseFloat(fd.get("activity_data_ton") as string) || 0,
            emission_factor_direct: parseFloat(fd.get("emission_factor_direct") as string) || def.emission_factor_direct,
            electricity_mwh:        parseFloat(fd.get("electricity_mwh") as string) || 0,
            ef_grid:                parseFloat(fd.get("ef_grid") as string) || def.ef_grid,
            pfc_emissions_ton:      parseFloat(fd.get("pfc_emissions_ton") as string) || 0,
          },
        });
      } else if (sector === "cement") {
        result = calculate({
          sector: "cement",
          inputs: {
            clinker_ton:            parseFloat(fd.get("clinker_ton") as string) || 0,
            calcination_factor:     parseFloat(fd.get("calcination_factor") as string) || def.calcination_factor,
            fuel_consumption_gj:    parseFloat(fd.get("fuel_consumption_gj") as string) || 0,
            fuel_emission_factor:   parseFloat(fd.get("fuel_emission_factor") as string) || def.fuel_emission_factor,
            electricity_mwh:        parseFloat(fd.get("electricity_mwh") as string) || 0,
            ef_grid:                parseFloat(fd.get("ef_grid") as string) || def.ef_grid,
          },
        });
      } else if (sector === "chemicals") {
        result = calculate({
          sector: "chemicals",
          inputs: {
            activity_data_ton:       parseFloat(fd.get("activity_data_ton") as string) || 0,
            process_emission_factor: parseFloat(fd.get("process_emission_factor") as string) || def.process_emission_factor,
            fuel_consumption_gj:     parseFloat(fd.get("fuel_consumption_gj") as string) || 0,
            fuel_emission_factor:    parseFloat(fd.get("fuel_emission_factor") as string) || def.fuel_emission_factor,
            electricity_mwh:         parseFloat(fd.get("electricity_mwh") as string) || 0,
            ef_grid:                 parseFloat(fd.get("ef_grid") as string) || def.ef_grid,
          },
        });
      } else {
        result = calculate({
          sector: "electricity",
          inputs: {
            electricity_mwh: parseFloat(fd.get("electricity_mwh") as string) || 0,
            ef_grid:         parseFloat(fd.get("ef_grid") as string) || def.ef_grid,
          },
        });
      }
      setPreview(result.total_emissions_tco2);
    } catch {
      // input eksik — preview gösterme
    }
  }

  // Kayıt başarılıysa sonuç ekranı
  if (state.result) {
    return <SuccessScreen result={state.result} onNew={() => window.location.reload()} />;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-gradient-green">Emisyon Girişi</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          EU 2023/956 metodolojisi — {CURRENT_YEAR} CBAM beyan dönemi
        </p>
      </div>

      {/* Sektör seçimi */}
      <div className="space-y-2">
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
          Sektör Seçin
        </p>
        <div className="grid grid-cols-5 gap-2">
          {SECTORS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => { setSector(s.value); setPreview(null); }}
              className={sector === s.value ? "nav-item-active flex-col items-center gap-1 py-3 h-auto" : "nctr-card flex-col items-center gap-1 py-3 h-auto cursor-pointer"}
              style={{ display: "flex", textAlign: "center" }}
            >
              <span style={{ fontSize: "1.25rem" }}>{s.icon}</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form
        action={formAction}
        onChange={handlePreview}
        className="nctr-card space-y-6"
      >
        <input type="hidden" name="sector" value={sector} />

        {/* Yıl */}
        <div className="flex items-center gap-4">
          <div className="space-y-1 flex-1">
            <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
              Raporlama Yılı
            </label>
            <select name="year" className="nctr-input" defaultValue={CURRENT_YEAR}>
              {[2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Formül Versiyonu</p>
            <Badge variant="info">v1 — EU 2023/956</Badge>
          </div>
        </div>

        {/* Sektöre özel alanlar */}
        <div className="space-y-2">
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
            {SECTOR_LABELS[sector]} Verileri
          </p>
          <SectorFields sector={sector} />
        </div>

        {/* Canlı Önizleme */}
        {preview !== null && (
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Tahmini Toplam Emisyon</p>
              <p className="text-gradient-green" style={{ fontSize: "1.75rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {preview.toLocaleString("tr-TR", { maximumFractionDigits: 4 })}
                <span style={{ fontSize: "1rem", fontWeight: 400, marginLeft: "0.25rem" }}>tCO₂</span>
              </p>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textAlign: "right" }}>
              <p>Kaydedilmeden önce</p>
              <p>tahmini hesaplama</p>
            </div>
          </div>
        )}

        {/* Hata */}
        {state.error && (
          <div className="badge-danger py-2 px-3 rounded-lg" style={{ display: "flex", fontSize: "0.875rem" }}>
            {state.error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Kaydedilen veriler CBAM beyanınıza eklenir.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary"
            style={{ opacity: pending ? 0.7 : 1, minWidth: "140px", justifyContent: "center" }}
          >
            {pending ? "Hesaplanıyor…" : "Hesapla & Kaydet"}
          </button>
        </div>
      </form>

      {/* Formül açıklaması */}
      <div className="nctr-card-elevated space-y-3">
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
          Kullanılan Formül — EU 2023/956 §{sector === "cement" ? "4" : "3"}
        </p>
        <FormulaDisplay sector={sector} />
      </div>
    </div>
  );
}

function FormulaDisplay({ sector }: { sector: Sector }) {
  const formulas: Record<Sector, string> = {
    steel:       "E = (Üretim × EF_doğrudan) + (Elektrik_MWh × EF_şebeke)",
    aluminum:    "E = (Üretim × EF_doğrudan) + (Elektrik_MWh × EF_şebeke) + PFC",
    cement:      "E = (Klinker × EF_kalsinasyon) + (Yakıt_GJ × EF_yakıt) + (Elektrik_MWh × EF_şebeke)",
    chemicals:   "E = (Üretim × EF_proses) + (Yakıt_GJ × EF_yakıt) + (Elektrik_MWh × EF_şebeke)",
    electricity: "E = Elektrik_MWh × EF_şebeke",
  };

  return (
    <code
      style={{
        display: "block",
        backgroundColor: "var(--color-bg-input)",
        border: "1px solid var(--color-border)",
        borderRadius: "0.5rem",
        padding: "0.75rem 1rem",
        fontSize: "0.8125rem",
        color: "var(--color-primary-400)",
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {formulas[sector]}
    </code>
  );
}

function SubmitReportButton({ emissionId }: { emissionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <span style={{ fontSize: "0.875rem", color: "var(--color-primary-400)", fontWeight: 600 }}>
        Onay bekleniyor
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await submitEmissionReport(emissionId);
          setSubmitted(true);
        })
      }
      className="btn-primary flex-1 justify-center"
      style={{ opacity: isPending ? 0.7 : 1 }}
    >
      {isPending ? "Gönderiliyor…" : "Raporu Gönder"}
    </button>
  );
}

function SuccessScreen({
  result,
  onNew,
}: {
  result: NonNullable<SaveEmissionState["result"]>;
  onNew: () => void;
}) {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="nctr-card-elevated space-y-6">
        {/* Başarı başlığı */}
        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center glow-green"
            style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <span style={{ fontSize: "2rem" }}>✓</span>
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Emisyon Verisi Kaydedildi
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            CBAM beyanınıza eklendi — ID: <code style={{ color: "var(--color-primary-500)", fontSize: "0.8125rem" }}>{result.id.slice(0, 8)}…</code>
          </p>
        </div>

        {/* Toplam */}
        <div
          className="rounded-xl p-5 text-center"
          style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Toplam Emisyon</p>
          <p className="text-gradient-green" style={{ fontSize: "2.5rem", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
            {result.total_emissions_tco2.toLocaleString("tr-TR", { maximumFractionDigits: 4 })}
            <span style={{ fontSize: "1.25rem", fontWeight: 400, marginLeft: "0.375rem" }}>tCO₂</span>
          </p>
        </div>

        {/* Dökümü */}
        <div className="space-y-2">
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>Emisyon Dökümü</p>
          {Object.entries(result.breakdown).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                {key.replace(/_/g, " ").replace("tco2", "").trim()}
              </span>
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {val.toLocaleString("tr-TR", { maximumFractionDigits: 4 })} tCO₂
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <SubmitReportButton emissionId={result.id} />
          <button onClick={onNew} className="btn-secondary flex-1 justify-center">
            + Yeni Emisyon Girişi
          </button>
        </div>
        <a href="/dashboard" className="btn-ghost w-full justify-center" style={{ display: "flex", alignItems: "center", fontSize: "0.8125rem" }}>
          Dashboard'a Dön
        </a>
      </div>
    </div>
  );
}
