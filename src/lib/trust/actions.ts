"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateTrustScore, getBenchmarkRatio } from "./score";

export async function recalculateTrustScore(supplier_org_id: string) {
  const supabase = await createClient();

  // Emisyon sayısı ve son 3 aydaki kayıt
  const { data: emissions } = await supabase
    .from("emission_data")
    .select("id, sector, year, emissions_ton_co2, created_at")
    .eq("supplier_id", supplier_org_id)
    .order("created_at", { ascending: false });

  // Kanıt sayısı
  const { count: evidenceCount } = await supabase
    .from("evidence_vault")
    .select("id", { count: "exact", head: true })
    .in("report_id", (emissions ?? []).map((e) => e.id));

  // Aktif ay sayısı (distinct months)
  const months = new Set(
    (emissions ?? []).map((e) =>
      new Date(e.created_at).toISOString().slice(0, 7)
    )
  ).size;

  // Benchmark oranı (en son emisyon kaydından)
  let benchmarkRatio = 0.5;
  if (emissions && emissions.length > 0) {
    const latest = emissions[0];
    benchmarkRatio = getBenchmarkRatio(latest.sector, latest.emissions_ton_co2);
  }

  const result = calculateTrustScore({
    emission_count:  (emissions ?? []).length,
    evidence_count:  evidenceCount ?? 0,
    months_active:   months,
    benchmark_ratio: benchmarkRatio,
  });

  // Upsert trust_scores
  await supabase.from("trust_scores").upsert({
    supplier_id:       supplier_org_id,
    score:             result.total,
    evidence_score:    result.evidence_score,
    continuity_score:  result.continuity_score,
    benchmark_score:   result.benchmark_score,
    last_calculated_at: new Date().toISOString(),
  }, { onConflict: "supplier_id" });

  return result;
}
