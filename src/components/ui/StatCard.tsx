interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
}

export function StatCard({ label, value, unit, delta, deltaLabel }: StatCardProps) {
  const isUp = delta !== undefined && delta >= 0;

  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <div className="flex items-end gap-1.5">
        <span className="stat-value">{value}</span>
        {unit && <span className="text-sm text-text-muted mb-1">{unit}</span>}
      </div>
      {delta !== undefined && (
        <span className={isUp ? "stat-delta-up" : "stat-delta-down"}>
          {isUp ? "▲" : "▼"} {Math.abs(delta)}% {deltaLabel}
        </span>
      )}
    </div>
  );
}
