interface TrustScoreProps {
  score: number; // 0-100
  showLabel?: boolean;
}

export function TrustScore({ score, showLabel = true }: TrustScoreProps) {
  const color =
    score >= 80 ? "from-primary-600 to-primary-400" :
    score >= 50 ? "from-yellow-600 to-yellow-400" :
                  "from-red-700 to-red-500";

  return (
    <div className="flex items-center gap-3">
      <div className="trust-bar-track flex-1">
        <div
          className={`trust-bar-fill bg-gradient-to-r ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-text-muted w-8 text-right">
          {score}
        </span>
      )}
    </div>
  );
}
