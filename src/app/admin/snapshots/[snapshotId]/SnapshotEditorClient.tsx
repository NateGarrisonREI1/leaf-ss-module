"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteLocalSnapshot,
  getSnapshotById,
  loadLocalSnapshots,
  upsertLocalSnapshot,
  type LeafTierKey,
  type SnapshotDraft,
} from "../../_data/localSnapshots";

export default function SnapshotEditorClient({ snapshotId }: { snapshotId: string }) {
  const router = useRouter();
  const [snap, setSnap] = useState<SnapshotDraft | null>(null);

  useEffect(() => {
    loadLocalSnapshots();
    setSnap(getSnapshotById(snapshotId));
  }, [snapshotId]);

  const title = snap?.title ?? "";
  const existingType = snap?.existing?.type ?? "";
  const existingSubtype = snap?.existing?.subtype ?? "";
  const tier = (snap?.suggested?.tier ?? "better") as LeafTierKey;
  const suggestedName = snap?.suggested?.name ?? "";

  const canSave = useMemo(() => Boolean(snap), [snap]);

  function patch(partial: Partial<SnapshotDraft>) {
    if (!snap) return;
    const next = { ...snap, ...partial };
    const saved = upsertLocalSnapshot(next);
    setSnap(saved);
  }

  function updateExisting(partial: any) {
    if (!snap) return;
    patch({ existing: { ...snap.existing, ...partial } });
  }

  function updateSuggested(partial: any) {
    if (!snap) return;
    patch({ suggested: { ...snap.suggested, ...partial } });
  }

  function remove() {
    deleteLocalSnapshot(snapshotId);
    router.push("/admin/snapshots");
  }

  if (!snap) {
    return (
      <main style={{ padding: 24 }}>
        <div style={{ fontWeight: 900 }}>Snapshot not found</div>
        <div style={{ marginTop: 10 }}>
          <Link href="/admin/snapshots">← Back to Snapshots</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 14, maxWidth: 820 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Snapshot Editor</h1>
          <div style={{ color: "#6b7280", marginTop: 6 }}>
            ID: <b>{snap.id}</b> • Job: <b>{snap.jobId || "—"}</b> • System: <b>{snap.systemId || "—"}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin/snapshots" style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10, textDecoration: "none" }}>
            Back
          </Link>
          <button onClick={remove} style={{ padding: "10px 12px", border: "1px solid #ef4444", borderRadius: 10, background: "white", color: "#ef4444", fontWeight: 900 }}>
            Delete
          </button>
        </div>
      </header>

      <section style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "white" }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Meta</div>

        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>Title</div>
          <input
            value={title}
            onChange={(e) => patch({ title: e.target.value })}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
        </label>
      </section>

      <section style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "white" }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Existing System</div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Type</div>
            <input value={existingType} onChange={(e) => updateExisting({ type: e.target.value })} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Subtype</div>
            <input value={existingSubtype} onChange={(e) => updateExisting({ subtype: e.target.value })} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </label>
        </div>
      </section>

      <section style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "white" }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Suggested Upgrade</div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Tier</div>
            <select value={tier} onChange={(e) => updateSuggested({ tier: e.target.value as LeafTierKey })} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}>
              <option value="good">good</option>
              <option value="better">better</option>
              <option value="best">best</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Suggested Name</div>
            <input value={suggestedName} onChange={(e) => updateSuggested({ name: e.target.value })} style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </label>
        </div>

        <div style={{ marginTop: 10, color: "#6b7280", fontSize: 12 }}>
          (We’ll add the “Existing chunk / Proposed chunk / Calcs chunk / Incentives chunk” as separate components next.)
        </div>
      </section>

      <div style={{ color: "#6b7280", fontSize: 12 }}>
        {canSave ? "Auto-saves to localSnapshots.ts store on every change." : ""}
      </div>
    </main>
  );
}
