import { LeafTierKey } from "../leafSSConfigRuntime";

export type ExistingSystemInputs = {
  ageYears: number;
  wear: number;              // 1–5
  expectedLifeYears: number;
  partialFailure?: boolean;
  annualUtilitySpend: number;
  systemShare: number;       // 0–1
};

export type CatalogTierInputs = {
  tier: LeafTierKey;
  efficiencyScore?: number;  // 0–100
};

export type LeafCalculationInput = {
  existing: ExistingSystemInputs;
  catalogTier: CatalogTierInputs;
};

export type LeafCalculationResult = {
  // Waste
  currentWaste: number;
  recoverableWaste: number;

  // Savings
  annualSavings: {
    min: number;
    center: number;
    max: number;
  };

  monthlySavings: {
    min: number;
    center: number;
    max: number;
  };

  // Payback
  paybackYears: {
    min: number;
    center: number;
    max: number;
  };
};
