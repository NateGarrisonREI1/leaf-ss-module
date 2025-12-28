/**
 * LEAF Snapshot Calculations
 *
 * This file orchestrates snapshot preview calculations.
 * It does NOT define assumptions — it only coordinates inputs
 * and calls pure calculation helpers.
 */

import { calculateLeafSavings, type LeafTierKey } from "./leafSavings";

/* ======================================================
 * TYPES
 * ====================================================== */

export type LeafPreviewInput = {
  /** Total annual utility spend for the job */
  annualUtilitySpend: number;

  /** Portion of utilities attributed to this system (0–1) */
  systemShare: number;

  /** System age in years */
  ageYears: number;

  /** Expected system life in years */
  expectedLife: number;

  /** Savings tier */
  tier?: LeafTierKey;
};

export type LeafPreviewResult = {
  baselineAnnualCost: number;
  baselineMonthlyCost: number;

  annualSavings: number;
  monthlySavings: number;

  tier: LeafTierKey;
};

/* ======================================================
 * MAIN PREVIEW CALCULATION
 * ====================================================== */

/**
 * Generates a LEAF snapshot preview result.
 *
 * NOTE:
 * - `systemShare` is TEMPORARY
 * - This will be replaced by the utility allocation engine
 */
export function calculateLeafPreview(
  input: LeafPreviewInput
): LeafPreviewResult {
  const {
    annualUtilitySpend,
    systemShare,
    tier = "expected"
  } = input;

  // -------------------------------
  // Baseline cost (temporary logic)
  // -------------------------------
  const baselineAnnualCost = annualUtilitySpend * systemShare;
  const baselineMonthlyCost = baselineAnnualCost / 12;

  // -------------------------------
  // Savings calculation
  // -------------------------------
  const savings = calculateLeafSavings({
    baselineAnnualCost,
    tier
  });

  return {
    baselineAnnualCost,
    baselineMonthlyCost,
    annualSavings: savings.annualSavings,
    monthlySavings: savings.monthlySavings,
    tier: savings.tier
  };
}
