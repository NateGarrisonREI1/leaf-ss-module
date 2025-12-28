import { calculateLeafSavings, type LeafTierKey } from "./leafSSConfigRuntime";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

export type Range = {
  min: number;
  max: number;
  center: number;
};

export type LeafPreviewInputs = {
  annualUtilitySpend: number;
  systemShare: number;       // 0..1
  expectedLife: number;      // years
  ageYears: number;
  wear: number;              // 0..5
  partialFailure?: boolean;
  tier: LeafTierKey;

  installCostMin?: number;
  installCostMax?: number;
};

export type LeafPreviewResult = {
  annualSavingsRange: Range;
  monthlySavingsRange: Range;
  paybackYearsRange: Range;

  // raw engine output (future-proofing)
  engine: ReturnType<typeof calculateLeafSavings>;
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function range(min: number, max: number): Range {
  const lo = Number.isFinite(min) ? min : 0;
  const hi = Number.isFinite(max) ? max : lo;
  return {
    min: Math.min(lo, hi),
    max: Math.max(lo, hi),
    center: (lo + hi) / 2,
  };
}

function paybackRange(
  costMin: number | undefined,
  costMax: number | undefined,
  savingsMin: number,
  savingsMax: number
): Range {
  if (!costMin && !costMax) return range(0, 0);

  const loCost = Math.max(costMin ?? costMax ?? 0, 0);
  const hiCost = Math.max(costMax ?? costMin ?? 0, 0);

  const loSave = Math.max(savingsMin, 0.01);
  const hiSave = Math.max(savingsMax, 0.01);

  return range(loCost / hiSave, hiCost / loSave);
}

/* ─────────────────────────────────────────────
   PUBLIC API (THIS IS THE ONLY ONE)
───────────────────────────────────────────── */

export function calculateLeafPreview(
  input: LeafPreviewInputs
): LeafPreviewResult {
  const engine = calculateLeafSavings({
    annualUtilitySpend: input.annualUtilitySpend,
    systemShare: input.systemShare,
    expectedLife: input.expectedLife,
    age: input.ageYears,
    wear: input.wear,
    partialFailure: input.partialFailure ?? false,
    tier: input.tier,
  });

  const annualSavingsRange = range(
    engine.minAnnualSavings,
    engine.maxAnnualSavings
  );

  const monthlySavingsRange = range(
    engine.minMonthlySavings,
    engine.maxMonthlySavings
  );

  const paybackYearsRange = paybackRange(
    input.installCostMin,
    input.installCostMax,
    annualSavingsRange.min,
    annualSavingsRange.max
  );

  return {
    annualSavingsRange,
    monthlySavingsRange,
    paybackYearsRange,
    engine,
  };
}
