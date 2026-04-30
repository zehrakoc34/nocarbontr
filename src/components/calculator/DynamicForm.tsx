"use client";

import { useState } from "react";
import { SECTOR_LIBRARY, getIndustry } from "@/constants/sectorLibrary";
import { useCarbonCalculator } from "@/hooks/useCarbonCalculator";

interface Props {
  onSave?: (payload: {
    groupId: string;
    industryId: string;
    naceCode: string;
    industryName: string;
    totalEmissions: number;
    breakdown: Record<string, number>;
  }) => void;
  saving?: boolean;
}

export function DynamicForm({ onSave, saving }: Props) {
  const [groupId,    setGroupId]    = useState("");
  const [industryId, setIndustryId] = useState("");

  const group    = SECTOR_LIBRARY.find((g) => g.id === groupId);
  const industry = group?.industries.find((i) => i.id === industryId);

  const { values, setValue, reset, result, hasInput } =
    useCarbonCalculator(industry?.parameters ?? []);

  function handleGroupChange(gid: string) {
    setGroupId(gid);
    setIndustryId("");
    reset();
  }

  function handleIndustryChange(iid: string) {
    setIndustryId(iid);
    reset();
  }

  function handleSave() {
    if (!industry || !onSave) return;
    const breakdown: Record<string, number> = {};
    result.lines.forEach((l) => {
      if (l.emissions > 0) breakdown[l.parameter.name] = l.emissions;
    });
    onSave({
      groupId,
      industryId,
      naceCode: industry.naceCode,
      industryName: industry.name,
      totalEmissions: result.total,
      breakdown,
    });
  }

  return (
    <div className="space-y-6">
      {/* Grup + Sektör Seçimi */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            Sektör Grubu
          </label>
          <select
            className="nctr-input"
            value={groupId}
            onChange={(e) => handleGroupChange(e.target.value)}
          >
            <option value="">— Grup Seçin —</option>
            {SECTOR_LIBRARY.map((g) => (
              <option key={g.id} value={g.id}>
                {g.code}. {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            Alt Sektör (NACE)
          </label>
          <select
            className="nctr-input"
            value={industryId}
            onChange={(e) => handleIndustryChange(e.target.value)}
            disabled={!group}
          >
            <option value="">— Sektör Seçin —</option>
            {group?.industries.map((i) => (
              <option key={i.id} value={i.id}>
                {i.naceCode} — {i.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Parametre Giriş Alanları */}
      {industry && (
        <div className="nctr-card space-y-4">
          <div className="flex items-center justify-between">
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
              {industry.name}
              <span style={{
                marginLeft: "0.5rem",
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: "rgba(34,197,94,0.12)",
                color: "var(--color-primary-500)",
                fontWeight: 500,
              }}>
                NACE {industry.naceCode}
              </span>
            </p>
            <button
              type="button"
              onClick={reset}
              className="btn-ghost"
              style={{ fontSize: "0.75rem" }}
            >
              Sıfırla
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {industry.parameters.map((param) => (
              <div key={param.id} className="space-y-1">
                <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", display: "block" }}>
                  {param.name}
                  <span style={{ marginLeft: "0.25rem", color: "var(--color-text-disabled)", fontSize: "0.75rem" }}>
                    ({param.unit})
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="nctr-input"
                  placeholder="0"
                  value={values[param.id] ?? ""}
                  onChange={(e) => setValue(param.id, parseFloat(e.target.value) || 0)}
                />
                {param.description && (
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-text-disabled)" }}>
                    {param.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Canlı Sonuç */}
      {industry && hasInput && (
        <div
          className="nctr-card-elevated space-y-4"
          style={{ border: "1px solid rgba(34,197,94,0.25)", backgroundColor: "rgba(34,197,94,0.04)" }}
        >
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Hesaplama Önizlemesi
          </p>

          <div className="space-y-2">
            {result.lines
              .filter((l) => l.emissions > 0)
              .map((l) => (
                <div key={l.parameter.id} className="flex items-center justify-between"
                  style={{ fontSize: "0.8125rem", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {l.parameter.name}
                    <span style={{ color: "var(--color-text-disabled)", marginLeft: "0.375rem" }}>
                      {l.quantity.toLocaleString("tr-TR")} {l.parameter.unit} × {l.parameter.emissionFactor}
                    </span>
                  </span>
                  <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--color-text-primary)", fontWeight: 500 }}>
                    {l.emissions.toLocaleString("tr-TR", { maximumFractionDigits: 4 })} tCO₂
                  </span>
                </div>
              ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>Toplam</span>
            <span style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              color: "var(--color-primary-500)",
            }}>
              {result.total.toLocaleString("tr-TR", { maximumFractionDigits: 4 })}
              <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", marginLeft: "0.375rem" }}>
                tCO₂
              </span>
            </span>
          </div>

          {onSave && (
            <button
              type="button"
              className="btn-primary w-full"
              onClick={handleSave}
              disabled={saving || result.total === 0}
            >
              {saving ? "Kaydediliyor…" : "Emisyonu Kaydet"}
            </button>
          )}
        </div>
      )}

      {/* Boş durum */}
      {!industry && (
        <div className="nctr-card text-center py-12 space-y-3">
          <span style={{ fontSize: "2.5rem" }}>🏭</span>
          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Sektörünüzü Seçin
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            10 sektör grubu, 20 NACE alt sektörü ve 84 emisyon parametresi
          </p>
        </div>
      )}
    </div>
  );
}
