// src/app/admin/_data/incentives/incentiveResolver.ts
"use client";

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
  // optional flags used by UI
  disabled?: boolean;
  tags?: string[];
  source?: "catalog" | "manual";
};

/**
 * Copy blocks used by NewSnapshotClient to write a notes block.
 * Keep these simple for now.
 */
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

/**
 * Normalizes a system/category string into a stable key.
 * Example: "Water Heater" -> "water_heater"
 */
export function normalizeSystemType(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

/**
 * ✅ TEMP COMPAT:
 * Return incentives based on a simple in-file rule set,
 * plus any locally-saved overrides (if you add that later).
 *
 * Right now this is intentionally conservative: it returns []
 * unless you add rules below.
 */
export function getIncentivesForSystemType(
  systemType: string,
  ctx?: { tags?: string[]; zip?: string; state?: string }
): IncentiveResource[] {
  const key = normalizeSystemType(systemType);
  const tags = (ctx?.tags || []).map((t) => normalizeSystemType(t));

  // --- Minimal starter rules (edit whenever) ---
  // Add your real rules here as you build out the incentives catalog.
  const RULES: IncentiveResource[] = [
    // Example:
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

  // Match if:
  // - rule tag matches system key OR
  // - rule tag matches any ctx tag
  const out = RULES.filter((r) => {
    const rTags = (r.tags || []).map((t) => normalizeSystemType(t));
    if (rTags.includes(key)) return true;
    return rTags.some((t) => tags.includes(t));
  });

  return out;
}
