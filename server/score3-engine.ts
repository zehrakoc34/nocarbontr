/**
 * Score3 CBAM Calculation Engine
 * Calculates Emission Score, Responsibility Score, and Supply Chain Score
 */

import { getEmissionFactorByHsCode, getEmissionFactorsBySector, getSectorById } from "./db";

export interface Score3Result {
  emissionScore: number;
  responsibilityScore: number;
  supplyChainScore: number;
  compositeScore: number;
  scoreRating: "red" | "yellow" | "green";
  details: {
    totalEmissions: number;
    scope1: number;
    scope2: number;
    scope3: number;
    tierDistribution: Record<string, number>;
  };
}

export interface UploadRow {
  hsCode: string;
  quantity: number;
  unit: string;
  supplierId?: string;
  tier?: "1" | "2" | "3";
  co2e?: number;
}

/**
 * Calculate Emission Score (0-100)
 * Based on total CO2e emissions and scope breakdown
 */
export async function calculateEmissionScore(
  rows: UploadRow[],
  sectorId: number
): Promise<{ score: number; details: any }> {
  let totalEmissions = 0;
  let scope1 = 0;
  let scope2 = 0;
  let scope3 = 0;

  for (const row of rows) {
    const factor = await getEmissionFactorByHsCode(row.hsCode);
    if (!factor) continue;

    const emissions = row.quantity * parseFloat(factor.scope1Factor.toString());
    totalEmissions += emissions;
    scope1 += emissions * 0.4; // Scope 1: 40%
    scope2 += emissions * 0.3; // Scope 2: 30%
    scope3 += emissions * 0.3; // Scope 3: 30%
  }

  // Normalize to 0-100 scale (baseline: 1000 kg CO2e = 50 points)
  const baseline = 1000;
  const score = Math.min(100, Math.max(0, 100 - (totalEmissions / baseline) * 50));

  return {
    score: Math.round(score * 100) / 100,
    details: {
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      scope1: Math.round(scope1 * 100) / 100,
      scope2: Math.round(scope2 * 100) / 100,
      scope3: Math.round(scope3 * 100) / 100,
    },
  };
}

/**
 * Calculate Responsibility Score (0-100)
 * Based on supplier tier and data completeness
 */
export function calculateResponsibilityScore(rows: UploadRow[]): {
  score: number;
  details: any;
} {
  let totalResponsibility = 0;
  const tierDistribution = { "1": 0, "2": 0, "3": 0 };
  let dataCompleteness = 0;

  for (const row of rows) {
    const tier = row.tier || "3";
    tierDistribution[tier as "1" | "2" | "3"]++;

    // Tier 1 = 100 points, Tier 2 = 70 points, Tier 3 = 40 points
    const tierScore = tier === "1" ? 100 : tier === "2" ? 70 : 40;
    totalResponsibility += tierScore;

    // Data completeness: 10 points per field
    if (row.hsCode) dataCompleteness += 10;
    if (row.quantity) dataCompleteness += 10;
    if (row.unit) dataCompleteness += 10;
    if (row.supplierId) dataCompleteness += 10;
    if (row.tier) dataCompleteness += 10;
  }

  const avgTierScore = rows.length > 0 ? totalResponsibility / rows.length : 0;
  const avgDataCompleteness = rows.length > 0 ? dataCompleteness / (rows.length * 50) * 100 : 0;

  // Weighted average: 70% tier score, 30% data completeness
  const score = avgTierScore * 0.7 + avgDataCompleteness * 0.3;

  return {
    score: Math.round(score * 100) / 100,
    details: {
      tierDistribution,
      avgTierScore: Math.round(avgTierScore * 100) / 100,
      dataCompleteness: Math.round(avgDataCompleteness * 100) / 100,
    },
  };
}

/**
 * Calculate Supply Chain Score (0-100)
 * Based on supplier diversity and geographic distribution
 */
export function calculateSupplyChainScore(rows: UploadRow[]): {
  score: number;
  details: any;
} {
  const uniqueSuppliers = new Set(rows.map((r) => r.supplierId).filter(Boolean));
  const tierCounts = { "1": 0, "2": 0, "3": 0 };

  for (const row of rows) {
    const tier = row.tier || "3";
    tierCounts[tier as "1" | "2" | "3"]++;
  }

  // Supplier diversity score: more suppliers = higher score
  const diversityScore = Math.min(100, (uniqueSuppliers.size / 5) * 100);

  // Tier balance score: balanced distribution = higher score
  const totalRows = rows.length;
  const tier1Ratio = totalRows > 0 ? tierCounts["1"] / totalRows : 0;
  const tier2Ratio = totalRows > 0 ? tierCounts["2"] / totalRows : 0;
  const tier3Ratio = totalRows > 0 ? tierCounts["3"] / totalRows : 0;

  // Ideal: 40% Tier 1, 40% Tier 2, 20% Tier 3
  const balanceScore =
    100 -
    Math.abs(tier1Ratio - 0.4) * 100 -
    Math.abs(tier2Ratio - 0.4) * 100 -
    Math.abs(tier3Ratio - 0.2) * 100;

  // Weighted average: 60% diversity, 40% balance
  const score = diversityScore * 0.6 + Math.max(0, balanceScore) * 0.4;

  return {
    score: Math.round(score * 100) / 100,
    details: {
      uniqueSuppliers: uniqueSuppliers.size,
      tierCounts,
      diversityScore: Math.round(diversityScore * 100) / 100,
      balanceScore: Math.round(Math.max(0, balanceScore) * 100) / 100,
    },
  };
}

/**
 * Calculate composite Score3 (0-100)
 * Weighted average of three scores
 */
export async function calculateScore3(
  rows: UploadRow[],
  sectorId: number
): Promise<Score3Result> {
  if (rows.length === 0) {
    return {
      emissionScore: 0,
      responsibilityScore: 0,
      supplyChainScore: 0,
      compositeScore: 0,
      scoreRating: "red",
      details: {
        totalEmissions: 0,
        scope1: 0,
        scope2: 0,
        scope3: 0,
        tierDistribution: {},
      },
    };
  }

  const emissionResult = await calculateEmissionScore(rows, sectorId);
  const responsibilityResult = calculateResponsibilityScore(rows);
  const supplyChainResult = calculateSupplyChainScore(rows);

  // Weighted average: 40% Emission, 35% Responsibility, 25% Supply Chain
  const compositeScore =
    emissionResult.score * 0.4 +
    responsibilityResult.score * 0.35 +
    supplyChainResult.score * 0.25;

  // Determine rating based on composite score
  let scoreRating: "red" | "yellow" | "green";
  if (compositeScore >= 70) {
    scoreRating = "green";
  } else if (compositeScore >= 40) {
    scoreRating = "yellow";
  } else {
    scoreRating = "red";
  }

  return {
    emissionScore: Math.round(emissionResult.score * 100) / 100,
    responsibilityScore: Math.round(responsibilityResult.score * 100) / 100,
    supplyChainScore: Math.round(supplyChainResult.score * 100) / 100,
    compositeScore: Math.round(compositeScore * 100) / 100,
    scoreRating,
    details: {
      totalEmissions: emissionResult.details.totalEmissions,
      scope1: emissionResult.details.scope1,
      scope2: emissionResult.details.scope2,
      scope3: emissionResult.details.scope3,
      tierDistribution: responsibilityResult.details.tierDistribution,
    },
  };
}

/**
 * Parse Excel/CSV data and validate
 */
export function parseUploadData(
  data: Array<Record<string, any>>
): { rows: UploadRow[]; errors: Array<{ rowIndex: number; error: string }> } {
  const rows: UploadRow[] = [];
  const errors: Array<{ rowIndex: number; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    try {
      // Validate required fields
      if (!row.hsCode) {
        errors.push({ rowIndex: i, error: "HS Code is required" });
        continue;
      }

      if (!row.quantity || isNaN(parseFloat(row.quantity))) {
        errors.push({ rowIndex: i, error: "Quantity must be a valid number" });
        continue;
      }

      if (!row.unit) {
        errors.push({ rowIndex: i, error: "Unit is required" });
        continue;
      }

      rows.push({
        hsCode: row.hsCode.toString().trim(),
        quantity: parseFloat(row.quantity),
        unit: row.unit.toString().trim(),
        supplierId: row.supplierId?.toString().trim(),
        tier: row.tier as "1" | "2" | "3" | undefined,
        co2e: row.co2e ? parseFloat(row.co2e) : undefined,
      });
    } catch (error) {
      errors.push({
        rowIndex: i,
        error: `Invalid data: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  return { rows, errors };
}
