import type { LeafTierKey } from "../localCatalog";

export type ExistingSystemInputs = {
  ageYears: number;
  wear: number; // 1–5
  expectedLifeYears: number;
  partialFailure?: boolean;
  annualUtilitySpend: number;
  systemShare: number; // 0–1
};

export type CatalogTierInputs = {
  tier: LeafTierKey;
  /**
   * 0–100 “strength” of improvement.
   * This is a placeholder until we replace with real physics/engineering calcs.
   */
  efficiencyScore?: number;
};

export type LeafCalculationInput = {
  existing: ExistingSystemInputs;
  catalogTier: CatalogTierInputs;
};

export type LeafCalculationResult = {
  currentWaste: number;
  recoverableWaste: number;

  annualSavings: { min: number; center: number; max: number };
  monthlySavings: { min: number; center: number; max: number };

  paybackYears: { min: number; center: number; max: number };
};
