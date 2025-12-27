// src/app/admin/_data/incentives/incentiveRules.ts
// TEMP COMPAT: legacy incentive API returns none
// Keeps older UI/report pages compiling while we migrate to catalog-attached incentives.

export type IncentiveLink = {
  label: string;
  url: string;
};

export type IncentiveAmount =
  | { kind: "range"; min: number; max: number; unit?: string }
  | { kind: "flat"; value: number; unit?: string }
  | { kind: "text"; value: string };

export type IncentiveResource = {
  id: string;
  programName?: string;
  level?: "federal" | "state" | "utility" | "local" | "other";
  amount?: IncentiveAmount;
  disabled?: boolean;
  shortBlurb?: string;
  details?: string;
  links?: IncentiveLink[];
};

export type IncentiveContext = {
  state?: string;
  zipcode?: string;
  tags?: string[];
};

export function getIncentivesForSystemType(
  _systemType?: string,
  _context?: IncentiveContext
): IncentiveResource[] {
  return [];
}
