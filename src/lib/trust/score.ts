// Trust Score Algoritması — nctr_1.md §4
// Kanıt Belgesi:   max 40 puan
// Veri Sürekliliği: max 30 puan
// Benchmark Uyumu:  max 30 puan

export interface TrustScoreInput {
  emission_count: number;       // toplam emisyon kaydı
  evidence_count: number;       // yüklenen kanıt sayısı
  months_active: number;        // kaç aydır veri girilmiş
  benchmark_ratio: number;      // 0-1: sektör ortalamasına yakınlık
}

export interface TrustScoreBreakdown {
  evidence_score: number;       // 0-40
  continuity_score: number;     // 0-30
  benchmark_score: number;      // 0-30
  total: number;                // 0-100
  level: "low" | "medium" | "high";
  next_actions: string[];
}

export function calculateTrustScore(input: TrustScoreInput): TrustScoreBreakdown {
  // 1. Kanıt skoru (max 40)
  // Her kanıt belgesi 10 puan, max 4 belge
  const evidence_score = Math.min(input.evidence_count * 10, 40);

  // 2. Süreklilik skoru (max 30)
  // 3+ ay = 30, 2 ay = 20, 1 ay = 10, 0 = 0
  const continuity_score = Math.min(input.months_active * 10, 30);

  // 3. Benchmark skoru (max 30)
  // Sektör ortalamasının ±%20 içindeyse tam puan
  const benchmark_score = Math.round(input.benchmark_ratio * 30);

  const total = evidence_score + continuity_score + benchmark_score;

  const level: TrustScoreBreakdown["level"] =
    total >= 70 ? "high" : total >= 40 ? "medium" : "low";

  const next_actions: string[] = [];
  if (evidence_score < 40)
    next_actions.push(`${Math.ceil((40 - evidence_score) / 10)} kanıt belgesi daha yükle (+${40 - evidence_score} puan)`);
  if (continuity_score < 30)
    next_actions.push(`${Math.ceil((30 - continuity_score) / 10)} ay daha veri gir (+${30 - continuity_score} puan)`);
  if (benchmark_score < 25)
    next_actions.push("Emisyon değerin sektör ortalamasından sapıyor, veriyi gözden geçir");

  return { evidence_score, continuity_score, benchmark_score, total, level, next_actions };
}

// Sektör benchmark değerleri (tCO₂/ton — AB 2026 ortalaması)
export const SECTOR_BENCHMARKS: Record<string, number> = {
  steel:       1.85,
  aluminum:    1.60,
  cement:      0.83,
  chemicals:   1.20,
  electricity: 0.276,
};

export function getBenchmarkRatio(sector: string, emissions_per_unit: number): number {
  const benchmark = SECTOR_BENCHMARKS[sector];
  if (!benchmark) return 0.5;
  const ratio = emissions_per_unit / benchmark;
  // 0.8–1.2 arası = iyi (1.0), dışında ceza
  if (ratio >= 0.8 && ratio <= 1.2) return 1.0;
  if (ratio < 0.8) return Math.max(0, ratio / 0.8);
  return Math.max(0, 1 - (ratio - 1.2) / 2);
}
