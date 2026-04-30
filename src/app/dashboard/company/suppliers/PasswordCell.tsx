"use client";

import { useState } from "react";

export function PasswordCell({ password }: { password: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "0.8125rem",
          color: visible ? "var(--color-primary-400)" : "var(--color-text-disabled)",
          letterSpacing: visible ? "0.05em" : "0.1em",
          minWidth: "90px",
        }}
      >
        {visible ? password : "••••••••••"}
      </span>
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        title={visible ? "Gizle" : "Göster"}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px",
          color: "var(--color-text-muted)",
          lineHeight: 1,
        }}
      >
        {visible ? (
          // Eye-off icon
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          // Eye icon
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}
