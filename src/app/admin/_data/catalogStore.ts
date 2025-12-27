import type { CatalogSystem } from "./mockSystems";

/**
 * Local editable catalog key
 * Stored in localStorage (browser) with server-safe fallback
 */
export const REI_LOCAL_CATALOG_V1_KEY = "REI_LOCAL_CATALOG_V1";

/**
 * Server-side in-memory fallback (prevents build/SSR crashes)
 */
let serverMemorySystems: CatalogSystem[] | null = null;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParseSystems(json: string | null): CatalogSystem[] | null {
  if (!json) return null;

  try {
    const parsed = JSON.parse(json);

    // supports:
    // - { systems: [...] }
    // - [...]
    const systems = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.systems)
      ? parsed.systems
      : null;

    return systems && Array.isArray(systems) ? systems : null;
  } catch {
    return null;
  }
}

/**
 * Load catalog systems
 * - Browser: localStorage (editable)
 * - Server/build: in-memory fallback
 */
export function loadLocalCatalogSystems(
  fallbackSystems: CatalogSystem[]
): CatalogSystem[] {
  // Browser path
  if (isBrowser()) {
    const parsed = safeParseSystems(
      window.localStorage.getItem(REI_LOCAL_CATALOG_V1_KEY)
    );

    if (parsed && parsed.length) return parsed;

    // Seed localStorage on first load
    const seeded = fallbackSystems;
    window.localStorage.setItem(
      REI_LOCAL_CATALOG_V1_KEY,
      JSON.stringify({
        version: 1,
        updatedAt: new Date().toISOString(),
        systems: seeded,
      })
    );

    return seeded;
  }

  // Server / build fallback
  if (serverMemorySystems && serverMemorySystems.length) {
    return serverMemorySystems;
  }

  serverMemorySystems = fallbackSystems;
  return serverMemorySystems;
}

/**
 * Local-first system lookup
 * Used by leafSSConfigRuntime
 */
export function getCatalogSystemByIdLocal(
  systemId: string,
  fallbackSystems: CatalogSystem[]
): CatalogSystem | null {
  if (!systemId) return null;

  const systems = loadLocalCatalogSystems(fallbackSystems);
  return systems.find((s) => s.id === systemId) || null;
}

/**
 * Optional helpers (nice to have)
 */

export function listCatalogSystems(
  fallbackSystems: CatalogSystem[]
): CatalogSystem[] {
  return loadLocalCatalogSystems(fallbackSystems);
}

export function saveLocalCatalogSystems(systems: CatalogSystem[]) {
  if (!isBrowser()) {
    serverMemorySystems = systems;
    return;
  }

  window.localStorage.setItem(
    REI_LOCAL_CATALOG_V1_KEY,
    JSON.stringify({
      version: 1,
      updatedAt: new Date().toISOString(),
      systems,
    })
  );
}
