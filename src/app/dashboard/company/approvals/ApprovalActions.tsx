"use client";

import { useState, useTransition } from "react";
import { approveEmission, rejectEmission } from "@/lib/suppliers/actions";

export function ApprovalActions({ emissionId }: { emissionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [rejectMode, setRejectMode] = useState(false);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return <span style={{ fontSize: "0.8125rem", color: "var(--color-text-disabled)" }}>İşlem tamamlandı</span>;
  }

  if (rejectMode) {
    return (
      <div className="flex flex-col gap-2" style={{ minWidth: "200px" }}>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Red notu (opsiyonel)"
          className="nctr-input"
          style={{ fontSize: "0.8125rem", padding: "4px 8px" }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await rejectEmission(emissionId, note);
                setDone(true);
              })
            }
            className="btn-danger"
            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
          >
            Reddet
          </button>
          <button
            type="button"
            onClick={() => setRejectMode(false)}
            className="btn-ghost"
            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
          >
            İptal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await approveEmission(emissionId);
            setDone(true);
          })
        }
        style={{
          fontSize: "0.75rem",
          padding: "4px 12px",
          borderRadius: "6px",
          backgroundColor: "rgba(34,197,94,0.15)",
          color: "var(--color-primary-400)",
          border: "1px solid rgba(34,197,94,0.3)",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Onayla
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setRejectMode(true)}
        style={{
          fontSize: "0.75rem",
          padding: "4px 12px",
          borderRadius: "6px",
          backgroundColor: "rgba(239,68,68,0.1)",
          color: "#ef4444",
          border: "1px solid rgba(239,68,68,0.25)",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Reddet
      </button>
    </div>
  );
}
