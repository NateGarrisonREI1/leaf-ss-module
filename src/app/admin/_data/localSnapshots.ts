// src/app/admin/_data/localSnapshots.ts
/* ──────────────────────────────────────────────────────────────
   Local Snapshots (Single Source of Truth)
   - Client-side persistence (localStorage)
   - Zero "calculation engine" / zero "config master" assumptions
   - Only stores snapshot draft + metadata

   Any UI page that needs snapshots imports from THIS file.
────────────────────────────────────────────────────────────── */

export type SnapshotId = string;

/** Minimal snapshot shape. Keep it flexible. */
export type SnapshotDraft = {
  id: SnapshotId;

  // What this snapshot is associated with
  jobId?: string;
  systemId?: string;

  // Core editable sections (intake-first; can be expanded later)
  title?: string;
  notes?: string;

  // Existing system intake (minimal, expandable)
  existing?: {
    systemType?: string;
    utilityType?: string; // e.g. "Electric", "Gas"
    ageYears?: number;
    shareOfUtility?: number; // 0..1 (customizable)
    // add fields as needed later
    [k: string]: unknown;
  };

  // Proposed system selection/intake (minimal, expandable)
  proposed?: {
    catalogSystemId?: string;
    make?: string;
    model?: string;
    efficiency?: string;
    installCost?: number;
    // add fields as needed later
    [k: string]: unknown;
  };

  // Derived values (optional; can be empty for now)
  computed?: {
    [k: string]: unknown;
  };

  createdAt: string; // ISO
  updatedAt: string; // ISO

  // Allow future expansion without breaking types
  [k: string]: unknown;
};

export type LocalSnapshotsState = SnapshotDraft[];

const STORAGE_KEY = "leaf:ss:snapshots:v1";

/** SSR-safe localStorage getter */
function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function nowISO() {
  return new Date().toISOString();
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeSnapshots(list: unknown): LocalSnapshotsState {
  if (!Array.isArray(list)) return [];
  // Do minimal validation so we don’t crash on old/bad data
  return list
    .filter(Boolean)
    .map((x: any) => {
      const id = typeof x?.id === "string" ? x.id : makeSnapshotId("snap");
      const createdAt = typeof x?.createdAt === "string" ? x.createdAt : nowISO();
      const updatedAt = typeof x?.updatedAt === "string" ? x.updatedAt : createdAt;
      return { ...x, id, createdAt, updatedAt } as SnapshotDraft;
    });
}

/** Loads ALL snapshots from localStorage */
export function loadLocalSnapshots(): LocalSnapshotsState {
  const storage = getStorage();
  if (!storage) return [];
  const raw = storage.getItem(STORAGE_KEY);
  const parsed = safeParse<unknown>(raw, []);
  return normalizeSnapshots(parsed);
}

/** Saves ALL snapshots (overwrites) */
export function saveLocalSnapshots(next: LocalSnapshotsState): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(next ?? []));
}

/** Convenience: find a snapshot by id */
export function getSnapshotById(snapshotId: string): SnapshotDraft | null {
  const all = loadLocalSnapshots();
  return all.find((s) => s.id === snapshotId) ?? null;
}

/** Insert or update snapshot */
export function upsertLocalSnapshot(draft: SnapshotDraft): SnapshotDraft {
  const all = loadLocalSnapshots();

  const incoming: SnapshotDraft = {
    ...draft,
    id: draft.id || makeSnapshotId("snap"),
    createdAt: draft.createdAt || nowISO(),
    updatedAt: nowISO(),
  };

  const idx = all.findIndex((s) => s.id === incoming.id);
  const next =
    idx >= 0
      ? all.map((s, i) => (i === idx ? { ...s, ...incoming } : s))
      : [incoming, ...all];

  saveLocalSnapshots(next);
  return incoming;
}

/** Delete snapshot by id */
export function deleteLocalSnapshot(snapshotId: string): void {
  const all = loadLocalSnapshots();
  const next = all.filter((s) => s.id !== snapshotId);
  saveLocalSnapshots(next);
}

/** Filter helper (commonly needed on job page) */
export function snapshotsForJob(jobId: string): SnapshotDraft[] {
  const all = loadLocalSnapshots();
  return all.filter((s) => s.jobId === jobId);
}

/** Creates a new draft (does NOT auto-save unless you call upsert) */
export function createSnapshotDraft(args: {
  jobId?: string;
  systemId?: string;
  title?: string;
  existingSystemType?: string;
}): SnapshotDraft {
  const id = makeSnapshotId(args.systemId ?? "snap");

  const createdAt = nowISO();
  const draft: SnapshotDraft = {
    id,
    jobId: args.jobId,
    systemId: args.systemId,
    title: args.title ?? "New Snapshot",
    existing: args.existingSystemType
      ? { systemType: args.existingSystemType }
      : undefined,
    createdAt,
    updatedAt: createdAt,
  };

  return draft;
}

/** Small stable id generator */
export function makeSnapshotId(seed: string) {
  const rand = Math.floor(Math.random() * 900000) + 100000;
  const clean = String(seed || "snap")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${clean}-${rand}`;
}

/** Optional convenience export (prevents “Did you mean localSnapshots?” issues) */
export const localSnapshots = {
  loadLocalSnapshots,
  saveLocalSnapshots,
  getSnapshotById,
  upsertLocalSnapshot,
  deleteLocalSnapshot,
  snapshotsForJob,
  createSnapshotDraft,
  makeSnapshotId,
};
