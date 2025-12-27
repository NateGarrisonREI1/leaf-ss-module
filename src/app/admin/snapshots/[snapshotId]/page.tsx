"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { MOCK_JOBS, type Job } from "../../_data/mockJobs";
import { findLocalJob } from "../../_data/localJobs";
import { loadLocalSnapshots, type SnapshotDraft } from "../../_data/localSnapshots";
import { loadLocalCatalog } from "../../_data/localCatalog";

export default function SnapshotDetailPage() {
  const params = useParams();
  const snapshotId = params?.snapshotId as string;

  // Load snapshot
  const snapshot: SnapshotDraft | undefined = useMemo(() => {
    return loadLocalSnapshots().find((s) => s.id === snapshotId);
  }, [snapshotId]);

  // Load job
  const job: Job | null = useMemo(() => {
    if (!snapshot) return null;
    return (
      findLocalJob(snapshot.jobId) ??
      MOCK_JOBS.find((j) => j.id === snapshot.jobId) ??
      null
    );
  }, [snapshot]);

  // Resolve catalog system (if snapshot was created from catalog)
  const catalogSystem = useMemo(() => {
    if (!snapshot?.suggested?.catalogSystemId) return null;
    return loadLocalCatalog().find(
      (s) => s.id === snapshot.suggested.catalogSystemId
    ) ?? null;
  }, [snapshot]);

  if (!snapshot) {
    return (
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16 }}>Snapshot not found</div>
        <Link href="/admin/snapshots" className="rei-btn" style={{ marginTop: 12 }}>
          ← Back to Snapshots
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16 }}>Job not found</div>
        <Link href="/admin/snapshots" className="rei-btn" style={{ marginTop: 12 }}>
          ← Back to Snapshots
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1100 }}>
      {/* Header */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 18 }}>
          Snapshot — {job.customerName ?? job.id}
        </div>
        <div style={{ color: "var(--muted)", marginTop: 4 }}>
          {job.address ?? "—"}
        </div>

        <div style={{ marginTop: 10 }}>
          <Link href={`/admin/jobs/${job.id}`} className="rei-btn">
            ← Back to Job
          </Link>
        </div>
      </div>

      {/* Existing System */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
          Existing System
        </div>

        <div style={{ color: "var(--muted)" }}>
          {snapshot.existing.type} • {snapshot.existing.subtype}
        </div>
      </div>

      {/* Suggested / Proposed System */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
          Suggested Upgrade
        </div>

        <div style={{ fontWeight: 900 }}>
          {snapshot.suggested.name}
        </div>

        <div style={{ color: "var(--muted)", marginTop: 4 }}>
          {catalogSystem ? "From catalog" : "Manual entry"}
        </div>

        <div style={{ marginTop: 8, fontSize: 13 }}>
          Cost: {snapshot.suggested.estCost ?? "—"} <br />
          Savings / yr: {snapshot.suggested.estAnnualSavings ?? "—"} <br />
          Payback: {snapshot.suggested.estPaybackYears ?? "—"} yrs
        </div>
      </div>

      {/* =====================================================
           PHASE 4 WILL BE INSERTED HERE (INCENTIVES PREVIEW)
         ===================================================== */}

      <div className="rei-card" style={{ opacity: 0.5 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>
          Incentives (coming next)
        </div>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          Incentives will auto-populate here based on the selected system and
          job location.
        </div>
      </div>
    </div>
  );
}
