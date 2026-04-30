"use client";

import { useState } from "react";

export default function FinalizeForm({
  reportId,
  onFinalize,
}: {
  reportId: string;
  onFinalize: (id: string, fd: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    await onFinalize(reportId, fd);
    setPending(false);
    window.location.reload();
  }

  if (!open) {
    return (
      <div className="nctr-card-elevated flex items-center justify-between">
        <div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Raporu Tamamla</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            İmzala ve "Hazır" durumuna getir. Sonrasında XML olarak indirebilirsiniz.
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          İmzala & Onayla →
        </button>
      </div>
    );
  }

  return (
    <div className="nctr-card-elevated space-y-6">
      <div>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)" }}>
          İmza & Onay (Signatures)
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
          CBAM XML ReportConfirmation bloğu için gerekli onaylar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Onay kutuları */}
        <div className="space-y-3 rounded-lg p-4"
          style={{ backgroundColor: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            Zorunlu Beyanlar (GlobalDataConfirmation)
          </p>
          {[
            {
              name: "global_data_confirmation",
              label: "Raporlanan verilerin doğru ve eksiksiz olduğunu onaylıyorum.",
            },
            {
              name: "use_of_data_confirmation",
              label: "Verilerin CBAM kapsamında kullanımına onay veriyorum.",
            },
            {
              name: "other_methodology_confirmation",
              label: "Diğer geçerli raporlama metodolojisi kullanıldı. (opsiyonel)",
            },
          ].map((item) => (
            <label key={item.name}
              className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name={item.name}
                value="true"
                className="mt-0.5"
                required={item.name !== "other_methodology_confirmation"}
              />
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                {item.label}
              </span>
            </label>
          ))}
        </div>

        {/* İmza bilgileri */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label style={lbl}>İmzalayan (Ad Soyad) <span style={{ color: "var(--color-danger)" }}>*</span></label>
            <input name="signature" required placeholder="Ad Soyad" className="nctr-input" />
          </div>
          <div className="space-y-1.5">
            <label style={lbl}>İmza Yeri <span style={{ color: "var(--color-danger)" }}>*</span></label>
            <input name="signature_place" required placeholder="İstanbul" className="nctr-input" />
          </div>
          <div className="space-y-1.5">
            <label style={lbl}>Pozisyon / Unvan <span style={{ color: "var(--color-danger)" }}>*</span></label>
            <input name="position_of_person" required placeholder="CBAM Uyum Müdürü" className="nctr-input" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label style={lbl}>Ek Notlar (Remarks, opsiyonel)</label>
          <textarea name="remarks" rows={2} placeholder="Ek bilgi veya açıklama..."
            className="nctr-input" style={{ resize: "vertical" }} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
            İptal
          </button>
          <button type="submit" disabled={pending} className="btn-primary flex-1 justify-center"
            style={{ opacity: pending ? 0.7 : 1 }}>
            {pending ? "Kaydediliyor…" : "✓ Onayla ve Raporu Hazırla"}
          </button>
        </div>
      </form>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 };
