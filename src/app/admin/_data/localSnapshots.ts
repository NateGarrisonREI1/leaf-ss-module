/**
 * Local Snapshots (Compatibility Layer)
 *
 * Goal: keep the app compiling + running while we rebuild
 * the real domain model + persistence.
 *
 * ✅ Exposes the legacy API expected by pages/components
 * ✅ Stores data in-memory only
 * ❌ No business logic here
 */

export type LeafTierKey = "good" | "better" | "best";

/** Minimal shape used by SnapshotEditor + pages */
export type SnapshotDraft = {
  id: string;
  jobId?: string;
  systemId?: string;

  title?: string;

  existing?: {
    type?: string;
    subtype?: string;
    ageYears?: number | null;
    operational?: "Yes" | "No";
    wear?: number | null;
    maintenance?: "Good" | "Average" | "Poor";

    label?: string;
    statusPillText?: string;
    annualCostRange?: { min: number; max: number };
    carbonRange?: { min: number; max: number };
    imageUrl?: string;
  };

  suggested?: {
    catalogSystemId?: string | null;
    name?: string;
    estCost?: number | null;

    estAnnualSavings?: number | null;
    estPaybackYears?: number | null;

    notes?: string;
    tier?: LeafTierKey;

    recommendedNameByTier?: Record<string, string>;
    statusPillTextByTier?: Record<string, string>;
    imageUrl?: string;

    leafSSOverrides?: {
      tiers?: Record<string, any>;
    };
  };

  calculationInputs?: {
    annualUtilitySpend?: number;
    systemShare?: number;
    expectedLife?: number;
    partialFailure?: boolean;
  };

  // Allow future fields without breaking TS while we rebuild
  [key: string]: any;

  createdAt?: string;
  updatedAt?: string;
};

/* ======================================================
 * IN-MEMORY STORE (TEMPORARY)
 * ====================================================== */

let _snapshots: SnapshotDraft[] = [];

/* ======================================================
 * LOADERS
 * ====================================================== */

export function loadLocalSnapshots(): SnapshotDraft[] {
  return _snapshots;
}

export function snapshotsForJob(jobId: string): SnapshotDraft[] {
  return _snapshots.filter((s) => s.jobId === jobId);
}

/* ======================================================
 * MUTATIONS
 * ====================================================== */

export function upsertLocalSnapshot(snapshot: SnapshotDraft): SnapshotDraft {
  const index = _snapshots.findIndex((s) => s.id === snapshot.id);
  const now = new Date().toISOString();

  if (index >= 0) {
    _snapshots[index] = {
      ..._snapshots[index],
      ...snapshot,
      updatedAt: now,
    };
  } else {
    _snapshots.push({
      ...snapshot,
      createdAt: snapshot.createdAt || now,
      updatedAt: now,
    });
  }

  return snapshot;
}

export function deleteLocalSnapshot(snapshotId: string): void {
  _snapshots = _snapshots.filter((s) => s.id !== snapshotId);
}

/**
 * Previously persisted snapshots.
 * Now a no-op for compatibility.
 */
export function saveLocalSnapshots(): void {
  // intentionally empty
}
