export type LeafTierKey = "good" | "better" | "best";

export type CatalogSystem = {
  id: string;
  category: string;
  name: string;
  highlights: string[];

  defaultAssumptions?: {
    estCost?: number;
    estAnnualSavings?: number;
    estPaybackYears?: number;
  };

  leafSSOverrides?: {
    tiers?: {
      [K in LeafTierKey]?: {
        leafPriceRange?: {
          min?: number;
          max?: number;
        };
        baseMonthlySavings?: {
          min?: number;
          max?: number;
        };
      };
    };
  };

  tags?: string[];
  photos?: string[];
};

const STORAGE_KEY = "LEAF_LOCAL_CATALOG";

export function loadLocalCatalog(): CatalogSystem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCatalog(list: CatalogSystem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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
