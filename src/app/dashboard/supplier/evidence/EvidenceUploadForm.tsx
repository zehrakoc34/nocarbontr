"use client";

import { useActionState, useRef, useState } from "react";
import { uploadEvidence, type EvidenceState } from "@/lib/evidence/actions";

type Emission = { id: string; sector: string; year: number; emissions_ton_co2: number };

const SECTOR: Record<string, string> = {
  steel: "Demir-Çelik", aluminum: "Alüminyum",
  cement: "Çimento", chemicals: "Kimyasallar", electricity: "Elektrik",
};

const initial: EvidenceState = {};

export default function EvidenceUploadForm({ emissions }: { emissions: Emission[] }) {
  const [state, formAction, pending] = useActionState(uploadEvidence, initial);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (state.success) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center glow-green"
          style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <span style={{ fontSize: "1.5rem" }}>✓</span>
        </div>
        <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Kanıt Belgesi Yüklendi</p>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          SHA-256 hash ile doğrulandı ve kaydedildi.
        </p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          + Yeni Belge Yükle
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Emisyon seçimi */}
      <div className="space-y-1.5">
        <label style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
          Emisyon Kaydı Seçin <span style={{ color: "var(--color-danger)" }}>*</span>
        </label>
        <select name="emission_id" required className="nctr-input">
          <option value="">— Emisyon kaydı seçin —</option>
          {emissions.map((e) => (
            <option key={e.id} value={e.id}>
              {SECTOR[e.sector] ?? e.sector} — {e.year} —{" "}
              {Number(e.emissions_ton_co2).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} tCO₂
            </option>
          ))}
        </select>
      </div>

      {/* Dosya yükleme alanı */}
      <div
        className="rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors"
        style={{
          border: `2px dashed ${dragOver ? "var(--color-primary-500)" : "var(--color-border)"}`,
          backgroundColor: dragOver ? "rgba(34,197,94,0.06)" : "var(--color-bg-input)",
          padding: "2rem",
          minHeight: "140px",
        }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f && fileRef.current) {
            const dt = new DataTransfer();
            dt.items.add(f);
            fileRef.current.files = dt.files;
            setSelectedFile(f);
          }
        }}
      >
        {selectedFile ? (
          <>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <span style={{ fontSize: "1.5rem" }}>📄</span>
            </div>
            <p style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.9375rem" }}>
              {selectedFile.name}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB — Değiştirmek için tıklayın
            </p>
          </>
        ) : (
          <>
            <span style={{ fontSize: "2rem" }}>📁</span>
            <p style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
              Dosyayı buraya sürükleyin veya seçin
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              PDF, DOCX, XLSX, JPG, PNG — max 20 MB
            </p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        name="file"
        type="file"
        accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
      />

      {state.error && (
        <div className="badge-danger py-2 px-3 rounded-lg" style={{ display: "flex", fontSize: "0.875rem" }}>
          {state.error}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Dosya SHA-256 hash ile imzalanır — değiştirilemezlik kanıtı.
        </p>
        <button
          type="submit"
          disabled={pending || !selectedFile}
          className="btn-primary"
          style={{ opacity: pending || !selectedFile ? 0.6 : 1, minWidth: "160px", justifyContent: "center" }}
        >
          {pending ? "Yükleniyor…" : "Belgeyi Yükle"}
        </button>
      </div>
    </form>
  );
}
