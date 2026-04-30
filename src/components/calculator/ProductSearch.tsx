"use client";

import { useState, useRef, useEffect } from "react";
import { searchProducts, CATEGORY_LABELS, type Product } from "@/constants/productAtlas";

interface Props {
  onSelect: (product: Product) => void;
  selectedId?: string;
}

export function ProductSearch({ onSelect, selectedId }: Props) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<Product[]>([]);
  const [open, setOpen]         = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    const r = searchProducts(query, 8);
    setResults(r);
    setOpen(r.length > 0);
  }, [query]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function select(p: Product) {
    setQuery(p.name);
    setOpen(false);
    onSelect(p);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        className="nctr-input w-full"
        placeholder="Ürün adı veya NACE kodu ile ara... (ör: çelik, 13.10, polyester)"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "0.625rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          overflow: "hidden",
          maxHeight: "320px",
          overflowY: "auto",
        }}>
          {results.map((p) => {
            const cat = CATEGORY_LABELS[p.category];
            const isSelected = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => select(p)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  width: "100%", textAlign: "left",
                  padding: "0.625rem 0.875rem",
                  backgroundColor: isSelected ? "var(--color-primary-50)" : "transparent",
                  borderBottom: "1px solid var(--color-border)",
                  cursor: "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-elevated)"; }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                <span style={{ fontSize: "1.125rem", flexShrink: 0 }}>{cat.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                    NACE {p.naceCode} · {cat.label}
                  </p>
                </div>
                <span style={{
                  fontSize: "0.625rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                  backgroundColor: cat.color + "20",
                  color: cat.color,
                  flexShrink: 0,
                }}>
                  {p.formulaType.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
