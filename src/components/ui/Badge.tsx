import { type RiskLevel, type StatusVariant } from "@/lib/tokens";

interface BadgeProps {
  variant?: StatusVariant;
  risk?: RiskLevel;
  children: React.ReactNode;
}

const variantClass: Record<StatusVariant, string> = {
  success: "badge-success",
  danger:  "badge-danger",
  warning: "badge-warning",
  info:    "badge-info",
};

const riskToVariant: Record<RiskLevel, StatusVariant> = {
  low:      "success",
  medium:   "warning",
  high:     "danger",
  critical: "danger",
};

export function Badge({ variant, risk, children }: BadgeProps) {
  const cls = risk
    ? variantClass[riskToVariant[risk]]
    : variantClass[variant ?? "info"];

  return <span className={cls}>{children}</span>;
}
