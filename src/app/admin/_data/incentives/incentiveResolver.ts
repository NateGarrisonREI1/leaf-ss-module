// src/app/admin/_data/incentives/incentiveResolver.ts
"use client";

/**
 * ✅ DROP-IN incentive resolver (local-first, no backend)
 * Goals:
 * - Stop import whiplash (exports match what the UI expects)
 * - Allow incentives to come from:
 *    (A) Catalog system–attached incentives (preferred)
 *    (B) Simple in-file RULES fallback
 * - Keep API stable for NewSnapshotClient + Report page
 */

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

/* ─────────────────────────────────────────────
   INTERNAL HELPERS
───────────────────────────────────────────── */

function uniqById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of list || []) {
    if (!x || !x.id) continue;
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    out.push(x);
  }
  return out;
}

function normalizeTags(tags?: string[]) {
  return (tags || []).map((t) => normalizeSystemType(t)).filter(Boolean);
}

function matchesByTags(args: {
  systemKey: string;
  ctxTags: string[];
  rule: IncentiveResource;
}) {
  const rTags = normalizeTags(args.rule.tags);
  if (!rTags.length) return false;
  if (rTags.includes(args.systemKey)) return true;
  return rTags.some((t) => args.ctxTags.includes(t));
}

function coerceAmount(raw: any): IncentiveAmount | undefined {
  // Accept:
  // - number -> flat
  // - {kind:"flat"/"range"/"text"} -> as-is (sanitized)
  // - {min,max} -> range
  // - {value} -> flat (if numeric) else text
  if (raw == null) return undefined;

  if (typeof raw === "number" && isFinite(raw)) {
    return { kind: "flat", value: Number(raw) };
  }

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return undefined;
    return { kind: "text", value: s };
  }

  if (typeof raw === "object") {
    if (raw.kind === "flat") {
      const v = Number(raw.value);
      if (!isFinite(v)) return undefined;
      return { kind: "flat", value: v, unit: raw.unit ? String(raw.unit) : undefined };
    }
    if (raw.kind === "range") {
      const min = Number(raw.min);
      const max = Number(raw.max);
      if (!isFinite(min) || !isFinite(max)) return undefined;
      return {
        kind: "range",
        min,
        max,
        unit: raw.unit ? String(raw.unit) : undefined,
      };
    }
    if (raw.kind === "text") {
      const v = String(raw.value ?? "").trim();
      if (!v) return undefined;
      return { kind: "text", value: v };
    }

    // Generic shapes
    if ("min" in raw && "max" in raw) {
      const min = Number((raw as any).min);
      const max = Number((raw as any).max);
      if (!isFinite(min) || !isFinite(max)) return undefined;
      return {
        kind: "range",
        min,
        max,
        unit: (raw as any).unit ? String((raw as any).unit) : undefined,
      };
    }
    if ("value" in raw) {
      const vNum = Number((raw as any).value);
      if (isFinite(vNum)) {
        return {
          kind: "flat",
          value: vNum,
          unit: (raw as any).unit ? String((raw as any).unit) : undefined,
        };
      }
      const vStr = String((raw as any).value ?? "").trim();
      return vStr ? { kind: "text", value: vStr } : undefined;
    }
  }

  return undefined;
}

function normalizeResource(r: any, source: "catalog" | "manual"): IncentiveResource | null {
  if (!r) return null;

  const id = String(r.id || r.key || r.code || "").trim();
  if (!id) return null;

  const programName = String(r.programName || r.name || r.title || "").trim();
  if (!programName) return null;

  const amount = coerceAmount(r.amount ?? r.value ?? r.rebate ?? r.credit);

  const linksRaw = Array.isArray(r.links) ? r.links : [];
  const links: IncentiveLink[] = linksRaw
    .map((x: any) => ({
      label: String(x?.label || x?.text || "Learn more").trim(),
      url: String(x?.url || "").trim(),
    }))
    .filter((x: IncentiveLink) => !!x.url);

  const tags = normalizeTags(r.tags || r.systemTags || r.matchTags);

  return {
    id,
    programName,
    amount,
    shortBlurb: r.shortBlurb ? String(r.shortBlurb) : r.description ? String(r.description) : undefined,
    links: links.length ? links : undefined,
    disabled: Boolean(r.disabled),
    tags: tags.length ? tags : undefined,
    source,
  };
}

/* ─────────────────────────────────────────────
   FALLBACK RULES (edit anytime)
───────────────────────────────────────────── */

const RULES: IncentiveResource[] = [
  // Starter examples (safe defaults; remove if you want totally empty):
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

/* ─────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────── */

/**
 * ✅ Main function your UI calls today.
 * - Matches by normalized systemType AND ctx.tags
 * - Pulls catalog-attached incentives if ctx.catalogSystem is provided
 * - Adds RULES fallback
 */
export function getIncentivesForSystemType(
  systemType: string,
  ctx?: {
    tags?: string[];
    zip?: string;
    state?: string;

    /** Preferred: pass the catalog system so incentives can be attached to catalog entries */
    catalogSystem?: any;
  }
): IncentiveResource[] {
  const systemKey = normalizeSystemType(systemType);
  const ctxTags = normalizeTags(ctx?.tags);

  const out: IncentiveResource[] = [];

  // A) Catalog-attached incentives (preferred)
  const cat = ctx?.catalogSystem;
  if (cat && Array.isArray((cat as any).incentives)) {
    const fromCatalog = (cat as any).incentives
      .map((r: any) => normalizeResource(r, "catalog"))
      .filter(Boolean) as IncentiveResource[];

    // If catalog incentives have tags, filter them; if they don't, assume they apply to that system.
    const filtered = fromCatalog.filter((r) => {
      const rTags = normalizeTags(r.tags);
      if (!rTags.length) return true;
      if (rTags.includes(systemKey)) return true;
      return rTags.some((t) => ctxTags.includes(t));
    });

    out.push(...filtered);
  }

  // B) RULES fallback (tag match)
  const fromRules = RULES.filter((r) =>
    matchesByTags({ systemKey, ctxTags, rule: r })
  );
  out.push(...fromRules);

  // Remove disabled + dedupe
  return uniqById(out).filter((r) => !r.disabled);
}

/**
 * ✅ Convenience for older code paths that pass a CatalogSystem directly.
 */
export function getIncentivesForCatalogSystem(
  catalogSystem: any,
  ctx?: { zip?: string; state?: string; extraTags?: string[] }
): IncentiveResource[] {
  const systemType = String(catalogSystem?.category || catalogSystem?.name || "");
  const tags = [
    ...(Array.isArray(catalogSystem?.tags) ? catalogSystem.tags : []),
    ...(ctx?.extraTags || []),
  ];
  return getIncentivesForSystemType(systemType, {
    tags,
    zip: ctx?.zip,
    state: ctx?.state,
    catalogSystem,
  });
}
