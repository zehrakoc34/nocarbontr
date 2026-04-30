/**
 * Nocarbontr Design Tokens — JS/TS referansı
 * Kaynak: globals.css @theme bloğu ile senkronize
 */

export const colors = {
  bg: {
    base:     "#0D0D0D",
    surface:  "#111111",
    card:     "#1A1A1A",
    elevated: "#1E1E1E",
    hover:    "#242424",
    input:    "#161616",
  },
  border: {
    default: "#2A2A2A",
    subtle:  "#1F1F1F",
    strong:  "#3A3A3A",
  },
  primary: {
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
  },
  text: {
    primary:   "#FFFFFF",
    secondary: "#D1D5DB",
    muted:     "#9CA3AF",
    disabled:  "#4B5563",
  },
  status: {
    success: "#22C55E",
    danger:  "#EF4444",
    warning: "#F59E0B",
    info:    "#3B82F6",
  },
  risk: {
    low:      "#22C55E",
    medium:   "#F59E0B",
    high:     "#EF4444",
    critical: "#DC2626",
  },
  chart: ["#22C55E", "#3B82F6", "#F59E0B", "#A855F7", "#EC4899", "#14B8A6"],
} as const;

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type StatusVariant = "success" | "danger" | "warning" | "info";

export const riskLabel: Record<RiskLevel, string> = {
  low:      "Düşük Risk",
  medium:   "Orta Risk",
  high:     "Yüksek Risk",
  critical: "Kritik Risk",
};

export const riskBadgeClass: Record<RiskLevel, string> = {
  low:      "badge-success",
  medium:   "badge-warning",
  high:     "badge-danger",
  critical: "badge-danger",
};
