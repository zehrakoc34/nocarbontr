"use client";

import { useState, useCallback, useMemo } from "react";
import type { EmissionParameter } from "@/constants/sectorLibrary";

export interface ParameterValue {
  parameterId: string;
  quantity: number;
}

export interface CalculationLine {
  parameter: EmissionParameter;
  quantity: number;
  emissions: number;   // quantity × emissionFactor
}

export interface CarbonCalculationResult {
  lines: CalculationLine[];
  total: number;        // toplam tCO₂
  groupId: string;
  industryId: string;
}

export function useCarbonCalculator(parameters: EmissionParameter[]) {
  const [values, setValues] = useState<Record<string, number>>({});

  const setValue = useCallback((parameterId: string, quantity: number) => {
    setValues((prev) => ({ ...prev, [parameterId]: quantity }));
  }, []);

  const reset = useCallback(() => setValues({}), []);

  const result: CarbonCalculationResult = useMemo(() => {
    const lines: CalculationLine[] = parameters.map((p) => {
      const quantity = values[p.id] ?? 0;
      return { parameter: p, quantity, emissions: quantity * p.emissionFactor };
    });
    const total = lines.reduce((sum, l) => sum + l.emissions, 0);
    return { lines, total, groupId: "", industryId: "" };
  }, [parameters, values]);

  const hasInput = Object.values(values).some((v) => v > 0);

  return { values, setValue, reset, result, hasInput };
}
