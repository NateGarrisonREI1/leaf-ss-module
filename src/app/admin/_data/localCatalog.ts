export type LeafTierKey = "good" | "better" | "best";

export type CatalogSystem = {
  id: string;
  category: string;
  name: string;
  highlights: string[];

  /**
   * Incentives attached to this catalog system (IDs only)
   */
  incentiveIds?: string[];

  defaultAssumptions?: {
    estCost?: number;
    estAnnualSavings?: number;
    estPaybackYears?: number;
  };

  leafSSOverrides?: {
    tiers?: {
      [K in LeafTierKey]?: {
        leafPriceRange?: { min?: number; max?: number };
        baseMonthlySavings?: { min?: number; max?: number };
      };
    };
  };

  tags?: string[];
  photos?: string[];
};

// ✅ KEEP YOUR EXISTING KEY so current data still loads
const STORAGE_KEY = "REI_LOCAL_CATALOG_V2";

// Optional legacy keys (if you ever used others)
const LEGACY_KEYS = [
  "rei_leaf_catalog_v1",
  "rei_catalog",
  "leaf_catalog",
  "leaf_ss_catalog",
];

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeCatalog(x: any): CatalogSystem[] {
  if (!Array.isArray(x)) return [];
  return x.filter(Boolean);
}

export function loadLocalCatalog(): CatalogSystem[] {
  if (!isBrowser()) return [];

  // 1) Primary key
  const primary = safeParse<CatalogSystem[]>(localStorage.getItem(STORAGE_KEY));
  if (primary) return normalizeCatalog(primary);

  // 2) Legacy migration
  for (const k of LEGACY_KEYS) {
    const legacy = safeParse<CatalogSystem[]>(localStorage.getItem(k));
    if (legacy && legacy.length) {
      const normalized = normalizeCatalog(legacy);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
  }

  return [];
}

export function saveLocalCatalog(list: CatalogSystem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeCatalog(list)));
}

export function upsertCatalogSystem(sys: CatalogSystem) {
  const list = loadLocalCatalog();
  const idx = list.findIndex((s) => s.id === sys.id);
  if (idx >= 0) list[idx] = sys;
  else list.unshift(sys);
  saveLocalCatalog(list);
}

export function deleteCatalogSystem(id: string) {
  const list = loadLocalCatalog().filter((s) => s.id !== id);
  saveLocalCatalog(list);
}

// Optional helper (handy for debugging)
export function clearLocalCatalog() {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}
