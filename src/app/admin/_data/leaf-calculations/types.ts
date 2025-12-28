import type { LeafTierKey } from "../localCatalog";

export type Range = { min: number; max: number; center: number };

export type LeafPreviewInputs = {
  tier: LeafTierKey;

  // existing system condition inputs
  ageYears: number;           // years
  wear: number;               // 1–5
  expectedLifeYears: number;  // years
  partialFailure?: boolean;

  // utility / bill context
  annualUtilitySpend: number; // $
  systemShare: number;        // 0–1

  // optional install cost context (from catalog tier)
  installCostMin?: number;
  installCostMax?: number;
};

export type LeafPreviewResult = {
  currentWaste: number;
  recoverableWaste: number;

  annualSavings: Range;
  monthlySavings: Range;

  // null if we don't have cost info or savings is ~0
  paybackYears: Range | null;
};
