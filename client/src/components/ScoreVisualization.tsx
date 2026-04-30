import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface Score {
  emissionScore: number;
  responsibilityScore: number;
  supplyChainScore: number;
  compositeScore: number;
  scoreRating: "red" | "yellow" | "green";
}

interface ScoreVisualizationProps {
  score: Score;
  title?: string;
  showDetails?: boolean;
}

const RATING_MAP = {
  green: { bg: "bg-green-100", text: "text-green-800", label: "Mükemmel" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Orta" },
  red: { bg: "bg-red-100", text: "text-red-800", label: "Geliştirilmeli" },
};

const SCORE_COLOR = (v: number) => v >= 70 ? "text-green-600" : v >= 40 ? "text-yellow-600" : "text-red-600";

export function ScoreVisualization({ score, title = "Score3 Sonucu", showDetails = true }: ScoreVisualizationProps) {
  const r = RATING_MAP[score.scoreRating];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5" style={{ color: "#10b981" }} />
              {title}
            </CardTitle>
            <CardDescription>Tedarik zinciri emisyon skoru</CardDescription>
          </div>
          <Badge className={`${r.bg} ${r.text}`}>{r.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-end justify-between">
            <label className="text-sm font-semibold text-foreground">Bileşik Skor</label>
            <span className={`text-3xl font-bold ${SCORE_COLOR(score.compositeScore)}`}>
              {score.compositeScore.toFixed(1)}
            </span>
          </div>
          <Progress value={score.compositeScore} className="h-3" />
          <p className="text-xs text-muted-foreground">Ölçek: 0-100 (yüksek = daha iyi)</p>
        </div>

        {showDetails && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Emisyon Skoru", value: score.emissionScore, sub: "Kapsam 1-2-3" },
              { label: "Sorumluluk", value: score.responsibilityScore, sub: "Tedarik şeffaflığı" },
              { label: "Tedarik Zinciri", value: score.supplyChainScore, sub: "Tier 1-2-3 verimi" },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {item.label}
                </label>
                <div className={`text-2xl font-bold ${SCORE_COLOR(item.value)}`}>
                  {item.value.toFixed(1)}
                </div>
                <Progress value={item.value} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-muted-foreground">70-100: Mükemmel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">40-69: Orta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-muted-foreground">0-39: Düşük</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ScoreGridProps {
  scores: Score[];
  title?: string;
}

export function ScoreGrid({ scores, title = "Sektör Skorları" }: ScoreGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Hesaplanan tüm skorlara genel bakış</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scores.map((score, i) => {
            const r = RATING_MAP[score.scoreRating];
            return (
              <div
                key={i}
                className={`p-4 rounded-xl border-2 ${
                  score.scoreRating === "green"
                    ? "border-green-200 bg-green-50"
                    : score.scoreRating === "yellow"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-foreground text-sm">Sektör {i + 1}</span>
                  <Badge className={`${r.bg} ${r.text} text-xs`}>{score.compositeScore.toFixed(1)}</Badge>
                </div>
                <div className="space-y-1.5 text-sm">
                  {[
                    { label: "Emisyon", val: score.emissionScore },
                    { label: "Sorumluluk", val: score.responsibilityScore },
                    { label: "Tedarik Zinciri", val: score.supplyChainScore },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-muted-foreground">{item.label}:</span>
                      <span className={`font-semibold ${SCORE_COLOR(item.val)}`}>{item.val.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
