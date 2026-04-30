"use client";

import { useActionState } from "react";
import { saveInstallation, type InstallationState } from "@/lib/installations/actions";
import { useState } from "react";

const COUNTRIES = [
  { code: "TR", name: "Türkiye" },
  { code: "DE", name: "Almanya" },
  { code: "US", name: "ABD" },
  { code: "CN", name: "Çin" },
  { code: "RU", name: "Rusya" },
  { code: "UA", name: "Ukrayna" },
  { code: "IN", name: "Hindistan" },
  { code: "BR", name: "Brezilya" },
  { code: "KR", name: "Güney Kore" },
  { code: "JP", name: "Japonya" },
];

const initial: InstallationState = {};

export default function InstallationForm() {
  const [state, formAction, pending] = useActionState(saveInstallation, initial);
  const [tab, setTab] = useState<"installation" | "operator">("installation");

  if (state.success) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center glow-green"
          style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <span style={{ fontSize: "1.5rem" }}>✓</span>
        </div>
        <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Tesis Kaydedildi</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          + Yeni Tesis Ekle
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Tab seçimi */}
      <div className="flex gap-2 border-b" style={{ borderColor: "var(--color-border)" }}>
        {(["installation", "operator"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={tab === t ? "nav-item-active" : "nav-item"}
          >
            {t === "installation" ? "🏭 Tesis Bilgileri" : "👤 Operatör Bilgileri"}
          </button>
        ))}
      </div>

      {tab === "installation" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label style={labelStyle}>Tesis ID <span style={{ color: "var(--color-danger)" }}>*</span></label>
              <input name="installation_ref" required placeholder="IN01" className="nctr-input" />
              <p style={hintStyle}>CBAM XML'de InstallationId olarak kullanılır</p>
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>Tesis Adı <span style={{ color: "var(--color-danger)" }}>*</span></label>
              <input name="installation_name" required placeholder="Ör. İstanbul Çelik Fabrikası" className="nctr-input" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label style={labelStyle}>Ekonomik Faaliyet</label>
            <input name="economic_activity" placeholder="Ör. Birincil çelik üretimi — BF-BOF prosesi" className="nctr-input" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label style={labelStyle}>Ülke</label>
              <select name="country" className="nctr-input" defaultValue="TR">
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>Şehir</label>
              <input name="city" placeholder="İstanbul" className="nctr-input" />
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>Posta Kodu</label>
              <input name="postcode" placeholder="34000" className="nctr-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label style={labelStyle}>Sokak / Adres</label>
              <input name="street" placeholder="Sanayi Caddesi" className="nctr-input" />
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>Adres Devamı</label>
              <input name="street_additional" placeholder="Bina No: 42" className="nctr-input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label style={labelStyle}>Alt Bölge / İlçe</label>
              <input name="subdivision" placeholder="Pendik" className="nctr-input" />
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>Parsel No</label>
              <input name="plot_parcel_number" placeholder="IN01-34000" className="nctr-input" />
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>PO Box</label>
              <input name="po_box" className="nctr-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label style={labelStyle}>Enlem (GPS)</label>
              <input name="latitude" type="number" step="0.0000001" placeholder="41.0091982" className="nctr-input" />
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>Boylam (GPS)</label>
              <input name="longitude" type="number" step="0.0000001" placeholder="28.9662187" className="nctr-input" />
            </div>
          </div>
        </div>
      )}

      {tab === "operator" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label style={labelStyle}>Operatör ID</label>
              <input name="operator_ref" placeholder="OP01-0001" className="nctr-input" />
              <p style={hintStyle}>CBAM XML'de OperatorId olarak kullanılır</p>
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>Operatör Adı</label>
              <input name="operator_name" placeholder="TR Steel Operator LTD" className="nctr-input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label style={labelStyle}>Ülke</label>
              <select name="op_country" className="nctr-input" defaultValue="TR">
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>Şehir</label>
              <input name="op_city" placeholder="İstanbul" className="nctr-input" />
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>Posta Kodu</label>
              <input name="op_postcode" className="nctr-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label style={labelStyle}>Sokak</label>
              <input name="op_street" className="nctr-input" />
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>Sokak Devamı</label>
              <input name="op_street_additional" className="nctr-input" />
            </div>
          </div>

          <div className="border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>
              İletişim Bilgileri
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label style={labelStyle}>Yetkili Adı</label>
                <input name="op_contact_name" placeholder="Ad Soyad" className="nctr-input" />
              </div>
              <div className="space-y-1.5">
                <label style={labelStyle}>Telefon</label>
                <input name="op_phone" placeholder="+90 212 000 0000" className="nctr-input" />
              </div>
              <div className="space-y-1.5">
                <label style={labelStyle}>E-posta</label>
                <input name="op_email" type="email" placeholder="operator@firma.com" className="nctr-input" />
              </div>
            </div>
          </div>
        </div>
      )}

      {state.error && (
        <div className="badge-danger py-2 px-3 rounded-lg" style={{ display: "flex", fontSize: "0.875rem" }}>
          {state.error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Her iki sekmedeki bilgileri doldurduktan sonra kaydedin.
        </p>
        <button type="submit" disabled={pending} className="btn-primary" style={{ opacity: pending ? 0.7 : 1 }}>
          {pending ? "Kaydediliyor…" : "Tesisi Kaydet"}
        </button>
      </div>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  color: "var(--color-text-secondary)",
  fontWeight: 500,
};

const hintStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--color-text-disabled)",
};
