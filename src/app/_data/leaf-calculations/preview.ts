import {
  LeafCalculationInput,
  LeafCalculationResult,
} from "./types";

export function calculateLeafPreview(
  input: LeafCalculationInput
): LeafCalculationResult {
  const {
    ageYears,
    wear,
    expectedLifeYears,
    partialFailure,
    annualUtilitySpend,
    systemShare,
  } = input.existing;

  const { efficiencyScore = 50 } = input.catalogTier;

  // ---- BASE WASTE MODEL ----
  const ageFactor = Math.min(ageYears / expectedLifeYears, 1);
  const wearFactor = wear / 5;

  let currentWaste =
    0.3 +
    ageFactor * 0.4 +
    wearFactor * 0.3;

  if (partialFailure) currentWaste += 0.15;
  currentWaste = Math.min(currentWaste, 0.9);

  // ---- RECOVERABLE WASTE ----
  const recoveryStrength = efficiencyScore / 100;
  const recoverableWaste = currentWaste * recoveryStrength;

  // ---- SAVINGS ----
  const annualBase =
    annualUtilitySpend * systemShare * recoverableWaste;

  const min = annualBase * 0.7;
  const center = annualBase;
  const max = annualBase * 1.3;

  return {
    currentWaste,
    recoverableWaste,

    annualSavings: {
      min,
      center,
      max,
    },

    monthlySavings: {
      min: min / 12,
      center: center / 12,
      max: max / 12,
    },

    paybackYears: {
      min: 1, // placeholder (future: install cost based)
      center: 1,
      max: 1,
    },
  };
}
