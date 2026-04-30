import { describe, expect, it } from "vitest";
import {
  calculateEmissionScore,
  calculateResponsibilityScore,
  calculateSupplyChainScore,
  calculateCompositeScore,
  getScoreRating,
} from "./score3-engine";

describe("Score3 Engine", () => {
  describe("calculateEmissionScore", () => {
    it("should calculate emission score based on CO2e", () => {
      const score = calculateEmissionScore(50, 100); // 50 kg CO2e per 100 units
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should return 100 for zero emissions", () => {
      const score = calculateEmissionScore(0, 100);
      expect(score).toBe(100);
    });

    it("should return lower scores for higher emissions", () => {
      const lowEmission = calculateEmissionScore(10, 100);
      const highEmission = calculateEmissionScore(100, 100);
      expect(lowEmission).toBeGreaterThan(highEmission);
    });
  });

  describe("calculateResponsibilityScore", () => {
    it("should calculate responsibility score based on tier and data completeness", () => {
      const score = calculateResponsibilityScore("1", 0.95);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should give higher scores for Tier 1 suppliers", () => {
      const tier1 = calculateResponsibilityScore("1", 0.9);
      const tier3 = calculateResponsibilityScore("3", 0.9);
      expect(tier1).toBeGreaterThan(tier3);
    });

    it("should give higher scores for complete data", () => {
      const complete = calculateResponsibilityScore("1", 1.0);
      const incomplete = calculateResponsibilityScore("1", 0.5);
      expect(complete).toBeGreaterThan(incomplete);
    });
  });

  describe("calculateSupplyChainScore", () => {
    it("should calculate supply chain score based on supplier count", () => {
      const score = calculateSupplyChainScore(5, 3);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should return higher scores for more suppliers per tier", () => {
      const manySuppliers = calculateSupplyChainScore(10, 3);
      const fewSuppliers = calculateSupplyChainScore(2, 3);
      expect(manySuppliers).toBeGreaterThan(fewSuppliers);
    });

    it("should return higher scores for more tiers", () => {
      const threeTiers = calculateSupplyChainScore(5, 3);
      const oneTier = calculateSupplyChainScore(5, 1);
      expect(threeTiers).toBeGreaterThan(oneTier);
    });
  });

  describe("calculateCompositeScore", () => {
    it("should calculate average of three sub-scores", () => {
      const composite = calculateCompositeScore(80, 70, 90);
      const expected = (80 + 70 + 90) / 3;
      expect(composite).toBeCloseTo(expected, 1);
    });

    it("should return value between 0 and 100", () => {
      const composite = calculateCompositeScore(25, 50, 75);
      expect(composite).toBeGreaterThanOrEqual(0);
      expect(composite).toBeLessThanOrEqual(100);
    });
  });

  describe("getScoreRating", () => {
    it("should return green for scores 70-100", () => {
      expect(getScoreRating(70)).toBe("green");
      expect(getScoreRating(85)).toBe("green");
      expect(getScoreRating(100)).toBe("green");
    });

    it("should return yellow for scores 40-69", () => {
      expect(getScoreRating(40)).toBe("yellow");
      expect(getScoreRating(55)).toBe("yellow");
      expect(getScoreRating(69)).toBe("yellow");
    });

    it("should return red for scores 0-39", () => {
      expect(getScoreRating(0)).toBe("red");
      expect(getScoreRating(25)).toBe("red");
      expect(getScoreRating(39)).toBe("red");
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero values gracefully", () => {
      expect(() => {
        calculateEmissionScore(0, 0);
        calculateResponsibilityScore("1", 0);
        calculateSupplyChainScore(0, 0);
      }).not.toThrow();
    });

    it("should handle very large values", () => {
      const score = calculateEmissionScore(1000000, 1000000);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should handle decimal values", () => {
      const score = calculateEmissionScore(12.5, 50.75);
      expect(typeof score).toBe("number");
    });
  });
});
