// src/app/admin/_data/incentives/incentiveResolver.ts

export type IncentiveLink = { label: string; url: string };

export type IncentiveAmount =
  | { kind: "flat"; value: number; unit?: string }
  | { kind: "range"; min: number; max: number; unit?: string }
  | { kind: "text"; value: string };

export type IncentiveResource = {
  id: string;
  programName: string;
  amount?: IncentiveAmount;
  shortBlurb?: string;
  links?: IncentiveLink[];
  disabled?: boolean;
  tags?: string[];
  source?: "catalog" | "manual";
};

export const INCENTIVE_COPY: Array<{ key: string; body: string }> = [
  {
    key: "general_disclaimer",
    body:
      "Incentives vary by location, income, utility territory, and program funding. Final eligibility and amounts must be confirmed with the program administrator.",
  },
  {
    key: "federal_tax_credit_blurb",
    body:
      "Federal tax credits may require tax liability and are claimed when you file your taxes. Keep invoices and manufacturer certificates where applicable.",
  },
  {
    key: "utility_rebate_blurb",
    body:
      "Utility rebates often require pre-approval, specific equipment, and licensed installation. Program funding can change or run out.",
  },
];

export function normalizeSystemType(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

/**
 * TEMP: simple rule list. Returns [] until you add rules.
 * ✅ Exports match what your UI imports expect:
 * - getIncentivesForSystemType
 * - normalizeSystemType
 * - INCENTIVE_COPY
 */
export function getIncentivesForSystemType(
  systemType: string,
  ctx?: { tags?: string[]; zip?: string; state?: string }
): IncentiveResource[] {
  const key = normalizeSystemType(systemType);
  const tags = (ctx?.tags || []).map(normalizeSystemType);

  const RULES: IncentiveResource[] = [
    // Add real incentives here.
    // {
    //   id: "fed_25c_hpwh",
    //   programName: "Federal Tax Credit (25C) — Heat Pump Water Heater",
    //   amount: { kind: "flat", value: 2000 },
    //   shortBlurb: "Up to $2,000 credit for qualifying HPWH installs (limits apply).",
    //   links: [{ label: "IRS 25C", url: "https://www.irs.gov/" }],
    //   tags: ["water_heater", "heat_pump"],
    //   source: "catalog",
    // },
  ];

  return RULES.filter((r) => {
    const rTags = (r.tags || []).map(normalizeSystemType);
    if (r.disabled) return false;
    if (rTags.includes(key)) return true;
    return rTags.some((t) => tags.includes(t));
  });
}
