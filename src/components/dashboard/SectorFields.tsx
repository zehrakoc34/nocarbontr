"use client";

import { DEFAULT_FACTORS } from "@/lib/calculations/engine";
import type { Sector } from "@/lib/calculations/types";

interface Props { sector: Sector; }

function Field({
  name, label, unit, defaultValue, hint,
}: {
  name: string; label: string; unit: string;
  defaultValue?: number; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
          {label}
        </label>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-disabled)" }}>{unit}</span>
      </div>
      <input
        name={name}
        type="number"
        step="any"
        min="0"
        required
        defaultValue={defaultValue}
        className="nctr-input"
        placeholder="0.00"
      />
      {hint && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-disabled)", marginTop: "0.25rem" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function SectorFields({ sector }: Props) {
  const def = DEFAULT_FACTORS[sector] ?? {};

  switch (sector) {
    case "steel":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field name="activity_data_ton"      label="Çelik Üretimi"          unit="ton"        hint="Raporlama dönemindeki toplam üretim" />
          <Field name="emission_factor_direct" label="Doğrudan Emisyon Faktörü" unit="tCO₂/ton" defaultValue={def.emission_factor_direct} hint="AB varsayılan: 1.85 tCO₂/ton" />
          <Field name="electricity_mwh"        label="Tüketilen Elektrik"      unit="MWh"       />
          <Field name="ef_grid"                label="Şebeke Emisyon Faktörü"  unit="tCO₂/MWh"  defaultValue={def.ef_grid} hint="Türkiye şebekesi: 0.276" />
        </div>
      );

    case "aluminum":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field name="activity_data_ton"      label="Alüminyum Üretimi"        unit="ton"       />
          <Field name="emission_factor_direct" label="Doğrudan Emisyon Faktörü" unit="tCO₂/ton"  defaultValue={def.emission_factor_direct} hint="AB varsayılan: 1.60" />
          <Field name="electricity_mwh"        label="Tüketilen Elektrik"        unit="MWh"      />
          <Field name="ef_grid"                label="Şebeke Emisyon Faktörü"    unit="tCO₂/MWh" defaultValue={def.ef_grid} />
          <Field name="pfc_emissions_ton"      label="PFC Emisyonları"           unit="tCO₂"     defaultValue={0} hint="Elektroliz kaynaklı; yoksa 0 girin" />
        </div>
      );

    case "cement":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field name="clinker_ton"          label="Klinker Üretimi"       unit="ton"        />
          <Field name="calcination_factor"   label="Kalsinasyon Faktörü"   unit="tCO₂/ton"   defaultValue={def.calcination_factor} hint="Standart değer: 0.525" />
          <Field name="fuel_consumption_gj"  label="Yakıt Tüketimi"        unit="GJ"         />
          <Field name="fuel_emission_factor" label="Yakıt Emisyon Faktörü" unit="tCO₂/GJ"    defaultValue={def.fuel_emission_factor} hint="Doğalgaz: 0.0567" />
          <Field name="electricity_mwh"      label="Tüketilen Elektrik"    unit="MWh"        />
          <Field name="ef_grid"              label="Şebeke Emisyon Faktörü" unit="tCO₂/MWh"  defaultValue={def.ef_grid} />
        </div>
      );

    case "chemicals":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field name="activity_data_ton"       label="Kimyasal Üretimi"        unit="ton"      />
          <Field name="process_emission_factor" label="Proses Emisyon Faktörü"  unit="tCO₂/ton" defaultValue={def.process_emission_factor} />
          <Field name="fuel_consumption_gj"     label="Yakıt Tüketimi"          unit="GJ"       />
          <Field name="fuel_emission_factor"    label="Yakıt Emisyon Faktörü"   unit="tCO₂/GJ"  defaultValue={def.fuel_emission_factor} />
          <Field name="electricity_mwh"         label="Tüketilen Elektrik"      unit="MWh"      />
          <Field name="ef_grid"                 label="Şebeke Emisyon Faktörü"  unit="tCO₂/MWh" defaultValue={def.ef_grid} />
        </div>
      );

    case "electricity":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field name="electricity_mwh" label="Elektrik Üretimi / Tüketimi" unit="MWh"       />
          <Field name="ef_grid"         label="Şebeke Emisyon Faktörü"      unit="tCO₂/MWh"  defaultValue={def.ef_grid} hint="Türkiye 2026: 0.276" />
        </div>
      );
  }
}
