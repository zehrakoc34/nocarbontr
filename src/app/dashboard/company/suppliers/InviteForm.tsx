"use client";

import { useActionState, useEffect, useRef } from "react";
import { inviteSupplier, type InviteState } from "@/lib/suppliers/actions";
import { useState } from "react";

const initial: InviteState = {};

export function InviteForm({ companyOrgId }: { companyOrgId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(inviteSupplier, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setTimeout(() => setOpen(false), 1500);
    }
  }, [state.success]);

  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(!open)} className="btn-primary">
        + Tedarikçi Davet Et
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "340px",
            zIndex: 50,
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: "16px" }}>
            Tedarikçi Davet Et
          </p>

          <form ref={formRef} action={formAction} className="space-y-3">
            <input type="hidden" name="company_org_id" value={companyOrgId} />

            <div className="space-y-1">
              <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                E-posta Adresi
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="tedarikci@firma.com"
                className="nctr-input"
                style={{ width: "100%" }}
              />
            </div>

            <div className="space-y-1">
              <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                Firma Adı (opsiyonel)
              </label>
              <input
                name="supplier_name"
                type="text"
                placeholder="Tedarikçi Firma A.Ş."
                className="nctr-input"
                style={{ width: "100%" }}
              />
            </div>

            {state.error && (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-danger, #ef4444)" }}>
                {state.error}
              </p>
            )}
            {state.success && (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-primary-500)" }}>
                {state.message}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost flex-1 justify-center"
                style={{ fontSize: "0.8125rem" }}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={pending}
                className="btn-primary flex-1 justify-center"
                style={{ opacity: pending ? 0.7 : 1, fontSize: "0.8125rem" }}
              >
                {pending ? "Gönderiliyor…" : "Davet Gönder"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
