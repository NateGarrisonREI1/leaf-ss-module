"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { MOCK_JOBS, type Job } from "../_data/mockJobs";
import { findLocalJob } from "../_data/localJobs";
import {
  loadLocalSnapshots,
  snapshotsForJob,
  deleteLocalSnapshot,
  type SnapshotDraft,
} from "../_data/localSnapshots";

/**
 * Job detail page
 * - Shows Existing Systems
 * - Shows Saved Snapshots
 * - "Generate Mock Report (N)" disabled if N===0
 * - Adds "View Mock Report" under Saved Snapshots
 */

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function pretty(s: any) {
  if (s === null || s === undefined) return "—";
  return String(s);
}

export default function JobPage() {
  const params = useParams();
  const jobId = (params?.jobId as string) || "";

  const job: Job | null = useMemo(() => {
    if (!jobId) return null;
    return findLocalJob(jobId) ?? MOCK_JOBS.find((j) => j.id === jobId) ?? null;
  }, [jobId]);

  const [snapshots, setSnapshots] = useState<SnapshotDraft[]>(() => {
    loadLocalSnapshots();
    return jobId ? snapshotsForJob(jobId) : [];
  });

  const snapshotCount = snapshots.length;

  function refreshSnapshots() {
    loadLocalSnapshots();
    setSnapshots(jobId ? snapshotsForJob(jobId) : []);
  }

  function onDeleteSnapshot(id: string) {
    const ok = confirm("Delete this snapshot? This cannot be undone (local only).");
    if (!ok) return;
    deleteLocalSnapshot(id);
    refreshSnapshots();
  }

  if (!job) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Job not found</h1>
        <p style={{ color: "#666" }}>No job exists with id: {jobId}</p>
        <Link href="/admin/jobs" style={{ textDecoration: "underline" }}>
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  // ✅ tolerate different job schemas (your mock data may differ by key names)
  const addressLine =
    (job as any).address ??
    (job as any).propertyAddress ??
    (job as any).addressLine ??
    (job as any).location ??
    "";

  const reportId = (job as any).reportId ?? (job as any).leafId ?? job.id;

  const existingSystems: any[] =
    (job as any).existingSystems ??
    (job as any).systems ??
    (job as any).existing ??
    [];

  return (
    <div style={{ padding: 20, maxWidth: 1100 }}>
      {/* Header Card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ minWidth: 260 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>
            {(job as any).customerName ? `${(job as any).customerName} — ${reportId}` : reportId}
          </div>
          <div style={{ color: "#6b7280", marginTop: 4 }}>{addressLine}</div>

          <div style={{ display: "flex", gap: 14, marginTop: 10, color: "#111827" }}>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: "#6b7280" }}>Sq Ft:</span>{" "}
              <b>{pretty((job as any).sqft ?? (job as any).squareFeet)}</b>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: "#6b7280" }}>Year Built:</span>{" "}
              <b>{pretty((job as any).yearBuilt)}</b>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: "#6b7280" }}>Systems:</span>{" "}
              <b>{existingSystems?.length ?? 0}</b>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: "#6b7280" }}>Snapshots:</span>{" "}
              <b>{snapshotCount}</b>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/admin/jobs"
            style={{
              color: "#111827",
              textDecoration: "none",
              fontWeight: 700,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            ← Jobs
          </Link>

          {/* ✅ Generate Mock Report (N) */}
          <Link
            href={snapshotCount > 0 ? `/admin/jobs/${job.id}/report` : "#"}
            aria-disabled={snapshotCount === 0}
            onClick={(e) => {
              if (snapshotCount === 0) {
                e.preventDefault();
                alert("No snapshots yet. Create at least one snapshot to generate the mock report.");
              }
            }}
            style={{
              textDecoration: "none",
              fontWeight: 800,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #2563eb",
              background: snapshotCount === 0 ? "#93c5fd" : "#2563eb",
              color: "#fff",
              cursor: snapshotCount === 0 ? "not-allowed" : "pointer",
              opacity: snapshotCount === 0 ? 0.75 : 1,
              pointerEvents: "auto",
            }}
          >
            Generate Mock Report ({snapshotCount})
          </Link>
        </div>
      </div>

      {/* Inspection Upload (placeholder) */}
      <div
        style={{
          marginTop: 18,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 900 }}>Inspection Upload</div>
        <div style={{ color: "#6b7280", marginTop: 6 }}>
          Placeholder: upload inspection/HES PDFs here (Supabase Storage later).
        </div>
        <button
          disabled
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#f3f4f6",
            color: "#9ca3af",
            fontWeight: 700,
          }}
        >
          Upload Inspection PDF (coming next)
        </button>
      </div>

      {/* Existing Systems */}
      <div
        style={{
          marginTop: 18,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 900 }}>Existing Systems</div>
        <div style={{ color: "#6b7280", marginTop: 6 }}>
          Create a snapshot from any existing system.
        </div>

        <div
          style={{
            marginTop: 14,
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.6fr 1fr 1fr 1fr 1fr 180px",
              gap: 0,
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              padding: "10px 12px",
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 700,
            }}
          >
            <div>Type</div>
            <div>Subtype</div>
            <div>Age</div>
            <div>Operational</div>
            <div>Wear</div>
            <div>Maint.</div>
            <div />
          </div>

          {(existingSystems || []).map((sys: any, idx: number) => {
            const type = sys.type ?? sys.category ?? "—";
            const subtype = sys.subtype ?? sys.name ?? sys.detail ?? "—";
            const ageYears = sys.ageYears ?? sys.age ?? "—";
            const operational = sys.operational ?? sys.working ?? "—";
            const wear = sys.wear ?? sys.wearScore ?? "—";
            const maintenance = sys.maintenance ?? sys.maint ?? "—";

            return (
              <div
                key={sys.id ?? idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.6fr 1fr 1fr 1fr 1fr 180px",
                  padding: "14px 12px",
                  borderBottom: idx === existingSystems.length - 1 ? "none" : "1px solid #e5e7eb",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 900 }}>{type}</div>
                <div style={{ color: "#374151" }}>{subtype}</div>
                <div style={{ color: "#374151" }}>{pretty(ageYears)} yrs</div>
                <div style={{ color: "#374151" }}>{pretty(operational)}</div>
                <div style={{ color: "#374151" }}>{pretty(wear)}</div>
                <div style={{ color: "#374151" }}>{pretty(maintenance)}</div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Link
                    href={`/admin/jobs/${job.id}/snapshots/new?systemIndex=${idx}`}
                    style={{
                      textDecoration: "none",
                      background: "#2563eb",
                      color: "#fff",
                      fontWeight: 900,
                      padding: "10px 12px",
                      borderRadius: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 150,
                      textAlign: "center",
                    }}
                  >
                    Create Snapshot
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Snapshots */}
      <div
        style={{
          marginTop: 18,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Saved Snapshots</div>
            <div style={{ color: "#6b7280", marginTop: 6 }}>
              Stored locally for now (Supabase later). These should persist across deployments once backed by DB/storage.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={refreshSnapshots}
              style={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#fff",
                padding: "10px 12px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>

            {/* ✅ View Mock Report */}
            <Link
              href={snapshotCount > 0 ? `/admin/jobs/${job.id}/report` : "#"}
              aria-disabled={snapshotCount === 0}
              onClick={(e) => {
                if (snapshotCount === 0) {
                  e.preventDefault();
                  alert("No snapshots yet.");
                }
              }}
              style={{
                textDecoration: "none",
                borderRadius: 12,
                border: "1px solid #2563eb",
                background: snapshotCount === 0 ? "#93c5fd" : "#2563eb",
                color: "#fff",
                padding: "10px 12px",
                fontWeight: 900,
                cursor: snapshotCount === 0 ? "not-allowed" : "pointer",
                opacity: snapshotCount === 0 ? 0.75 : 1,
              }}
            >
              View Mock Report
            </Link>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <div style={{ marginTop: 14, color: "#6b7280" }}>
            No snapshots saved yet. Click <b>Create Snapshot</b> on an existing system.
          </div>
        ) : (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {snapshots.map((s) => {
              const title = `${s.existing.type ?? "System"} • ${s.existing.subtype ?? "—"}`;
              const suggested = s.suggested?.name ?? "Suggested Upgrade";

              return (
                <div
                  key={s.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 260 }}>
                    <div style={{ fontWeight: 900 }}>{title}</div>
                    <div style={{ color: "#6b7280", marginTop: 2, fontSize: 12 }}>
                      Suggested: <b style={{ color: "#111827" }}>{suggested}</b>
                    </div>
                    <div style={{ color: "#6b7280", marginTop: 2, fontSize: 12 }}>
                      Saved: {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Link
                      href={`/admin/jobs/${job.id}/snapshots/${s.id}`}
                      style={{
                        textDecoration: "none",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        padding: "10px 12px",
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => onDeleteSnapshot(s.id)}
                      style={{
                        borderRadius: 12,
                        border: "1px solid #fecaca",
                        background: "#fff",
                        padding: "10px 12px",
                        fontWeight: 900,
                        color: "#b91c1c",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
