import { calculateLeafSavings, type LeafTierKey } from "./leafSSConfigRuntime";

/**
 * This module is the “permanent home” for LEAF snapshot calculations.
 * Snapshot pages should call this module (UI should not own the math).
 *
 * Today: wraps leafSSConfigRuntime.calculateLeafSavings() into stable “range” objects.
 * Future: this becomes the single orchestrator for full LEAF calcs (cost, carbon, incentives, etc).
 */

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

export type LeafSnapshotCalcInputs = {
  // customer / job-side inputs
  annualUtilitySpend: number; // $/yr for the relevant utility or total, depending on your future model
  systemShare: number; // 0..1 portion attributed to the system
  expectedLife: number; // years

  // existing system condition inputs
  age: number; // years
  wear: number; // 1..5 (or 0..5) depending on your scale
  partialFailure?: boolean;

  // tier selector
  tier: LeafTierKey;

  // optional install cost context to compute payback
  // If you provide a range, payback range is computed properly.
  installCostMin?: number;
  installCostMax?: number;
};

export type Range = { min: number; max: number; center: number };

export type LeafSnapshotCalcResult = {
  annualSavingsRange: Range;
  monthlySavingsRange: Range;

  /**
   * Payback is only computed if install costs are provided AND savings > 0.
   * If missing, these values are still returned but set to 0.
   * (UI can choose to hide payback if install costs aren't known yet.)
   */
  paybackYearsRange: Range;

  // raw engine output, kept for debugging + future evolution
  engine: ReturnType<typeof calculateLeafSavings>;
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeRange(min: number, max: number): Range {
  const lo = Number.isFinite(min) ? min : 0;
  const hi = Number.isFinite(max) ? max : lo;
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  return { min: a, max: b, center: (a + b) / 2 };
}

/**
 * Payback range:
 * - best payback (min years) = lowest cost / highest annual savings
 * - worst payback (max years) = highest cost / lowest annual savings
 */
function computePaybackRange(
  installMin: number | undefined,
  installMax: number | undefined,
  annualMinSavings: number,
  annualMaxSavings: number
): Range {
  const cMin = typeof installMin === "number" ? installMin : undefined;
  const cMax = typeof installMax === "number" ? installMax : undefined;

  // if no costs, return zeros (caller can hide)
  if (cMin == null && cMax == null) return safeRange(0, 0);

  const costLo = clamp(cMin ?? cMax ?? 0, 0, Number.MAX_SAFE_INTEGER);
  const costHi = clamp(cMax ?? cMin ?? 0, 0, Number.MAX_SAFE_INTEGER);

  const sLo = Math.max(annualMinSavings, 0.0001);
  const sHi = Math.max(annualMaxSavings, 0.0001);

  const payMin = costLo / sHi; // best case
  const payMax = costHi / sLo; // worst case

  // guard weirdness
  return safeRange(payMin, payMax);
}

/* ─────────────────────────────────────────────
   Public API
───────────────────────────────────────────── */

export function calculateLeafSnapshotPreview(input: LeafSnapshotCalcInputs): LeafSnapshotCalcResult {
  const engine = calculateLeafSavings({
    annualUtilitySpend: input.annualUtilitySpend,
    systemShare: input.systemShare,
    tier: input.tier,
    expectedLife: input.expectedLife,
    age: input.age,
    wear: input.wear,
    partialFailure: input.partialFailure ?? false,
  });

  // leafSSConfigRuntime currently returns:
  // - minAnnualSavings / maxAnnualSavings
  // - minMonthlySavings / maxMonthlySavings
  const annualSavingsRange = safeRange(engine.minAnnualSavings, engine.maxAnnualSavings);
  const monthlySavingsRange = safeRange(engine.minMonthlySavings, engine.maxMonthlySavings);

  const paybackYearsRange = computePaybackRange(
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

/**
 * Back-compat aliases (in case your snapshot page uses a different name)
 * Keep these while you’re iterating so builds don’t break.
 */
export const calculateLeafSavingsPreview = calculateLeafSnapshotPreview;
export type { LeafTierKey };

// ✅ alias for what NewSnapshotClient is importing
export const calculateLeafPreview = calculateLeafSnapshotPreview;
