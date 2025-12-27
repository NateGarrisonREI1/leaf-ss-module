"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { MOCK_JOBS, type Job, type ExistingSystem } from "../../_data/mockJobs";
import { findLocalJob, updateLocalJob } from "../../_data/localJobs";

import {
  deleteLocalSnapshot,
  loadLocalSnapshots,
  saveLocalSnapshots,
  snapshotsForJob,
  type SnapshotDraft,
} from "../../_data/localSnapshots";

import Worksheet from "./_components/Worksheet";

/**
 * Job detail page
 * - Shows Existing Systems
 * - Add/Delete Existing Systems (localStorage)
 * - Shows Saved Snapshots (Edit/Delete)
 * - "Generate Mock Report (N)" disabled if N===0
 */

function pretty(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export default function JobPage() {
  const params = useParams();
  const jobId = (params?.jobId as string) || "";

  const initialJob: Job | null = useMemo(() => {
    if (!jobId) return null;
    return findLocalJob(jobId) ?? MOCK_JOBS.find((j) => j.id === jobId) ?? null;
  }, [jobId]);

  const [job, setJob] = useState<Job | null>(initialJob);

  const [snapshots, setSnapshots] = useState<SnapshotDraft[]>(() => {
    loadLocalSnapshots();
    return jobId ? snapshotsForJob(jobId) : [];
  });

  function refreshSnapshots() {
    loadLocalSnapshots();
    setSnapshots(jobId ? snapshotsForJob(jobId) : []);
  }

  function persistJob(nextJob: Job) {
    setJob(nextJob);
    updateLocalJob(nextJob);
  }

  function onDeleteSnapshot(id: string) {
    const ok = confirm("Delete this snapshot? This cannot be undone (local only).");
    if (!ok) return;
    deleteLocalSnapshot(id);
    refreshSnapshots();
  }

  function onDeleteSystem(systemId: string) {
    if (!job) return;

    const sys = (job.systems || []).find((s) => s.id === systemId);
    const label = sys ? `${sys.type} • ${sys.subtype}` : systemId;

    const ok = confirm(
      `Delete this system?\n\n${label}\n\nThis will also delete any snapshots created from it (local only).`
    );
    if (!ok) return;

    // 1) remove system
    const nextJob: Job = {
      ...job,
      systems: (job.systems || []).filter((s) => s.id !== systemId),
    };
    persistJob(nextJob);

    // 2) remove orphan snapshots tied to that system
    const all = loadLocalSnapshots();
    const next = all.filter((s) => !(s.jobId === job.id && s.systemId === systemId));
    saveLocalSnapshots(next);

    refreshSnapshots();
  }

  if (!job) {
    return (
      <div className="rei-card" style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Job not found</div>
        <div style={{ color: "var(--muted)" }}>
          No job exists with id: <code>{jobId}</code>
        </div>
        <Link className="rei-btn" href="/admin/jobs" style={{ width: "fit-content" }}>
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  const addressLine =
    (job as any).address ??
    (job as any).propertyAddress ??
    (job as any).addressLine ??
    (job as any).location ??
    "";

  const reportId = (job as any).reportId ?? (job as any).leafId ?? job.id;

  const existingSystems: ExistingSystem[] = (job.systems || []) as any[];

  const snapshotCount = snapshots.length;

  return (
    <div style={{ padding: 20, maxWidth: 1100 }}>
      {/* Header */}
      <div
        className="rei-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            {(job as any).customerName ? `${(job as any).customerName} — ${reportId}` : reportId}
          </div>
          <div style={{ color: "var(--muted)", marginTop: 4 }}>{addressLine}</div>

          <div style={{ display: "flex", gap: 14, marginTop: 10, color: "var(--text)" }}>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>Sq Ft:</span>{" "}
              <b>{pretty((job as any).sqft ?? (job as any).squareFeet)}</b>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>Year Built:</span>{" "}
              <b>{pretty((job as any).yearBuilt)}</b>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>Systems:</span>{" "}
              <b>{existingSystems?.length ?? 0}</b>
            </div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: "var(--muted)" }}>Snapshots:</span>{" "}
              <b>{snapshotCount}</b>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link className="rei-btn" href="/admin/jobs" style={{ textDecoration: "none" }}>
            ← Jobs
          </Link>

          <Link
            className={`rei-btn rei-btnPrimary ${snapshotCount === 0 ? "rei-btnDisabled" : ""}`}
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
              pointerEvents: "auto",
              opacity: snapshotCount === 0 ? 0.6 : 1,
            }}
          >
            Generate Mock Report ({snapshotCount})
          </Link>
        </div>
      </div>

      {/* Worksheet (Add Existing Systems) */}
      <div style={{ marginTop: 16 }}>
        <Worksheet
          job={job}
          onJobUpdated={(nextJob) => {
            persistJob(nextJob);
          }}
        />
      </div>

      {/* Existing Systems */}
      <div className="rei-card" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Existing Systems</div>
        <div style={{ color: "var(--muted)", marginTop: 6 }}>
          Create a snapshot from any existing system. Delete systems you don’t want to snapshot.
        </div>

        <div
          style={{
            marginTop: 12,
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            overflow: "hidden",
            background: "white",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.6fr 1fr 1fr 1fr 1fr 220px",
              padding: "10px 12px",
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 700,
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
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
            const systemId = sys.id ?? `sys_${idx}`;

            return (
              <div
                key={systemId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.6fr 1fr 1fr 1fr 1fr 220px",
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

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <Link
                    href={`/admin/snapshots/new?jobId=${encodeURIComponent(job.id)}&systemId=${encodeURIComponent(
                      systemId
                    )}`}
                    className="rei-btn rei-btnPrimary"
                    style={{
                      textDecoration: "none",
                      width: 150,
                      justifyContent: "center",
                      display: "inline-flex",
                    }}
                  >
                    Create Snapshot
                  </Link>

                  <button
                    className="rei-btn"
                    type="button"
                    onClick={() => onDeleteSystem(systemId)}
                    style={{
                      borderColor: "#fecaca",
                      color: "#b91c1c",
                      background: "white",
                      fontWeight: 900,
                      width: 60,
                      justifyContent: "center",
                      display: "inline-flex",
                    }}
                    title="Delete system"
                    aria-label="Delete system"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Snapshots */}
      <div className="rei-card" style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Saved Snapshots</div>
            <div style={{ color: "var(--muted)", marginTop: 6 }}>
              Edit and delete snapshots here (localStorage for now).
            </div>
          </div>

          <button className="rei-btn" type="button" onClick={refreshSnapshots}>
            Refresh
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div style={{ marginTop: 14, color: "var(--muted)" }}>
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
                    background: "white",
                  }}
                >
                  <div style={{ minWidth: 260 }}>
                    <div style={{ fontWeight: 900 }}>{title}</div>
                    <div style={{ color: "#6b7280", marginTop: 2, fontSize: 12 }}>
                      Suggested: <b style={{ color: "#111827" }}>{suggested}</b>
                    </div>
                    <div style={{ color: "#6b7280", marginTop: 2, fontSize: 12 }}>
                      Updated: {new Date(s.updatedAt ?? s.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Link
                      href={`/admin/snapshots/${encodeURIComponent(s.id)}`}
                      className="rei-btn"
                      style={{ textDecoration: "none" }}
                    >
                      Edit
                    </Link>

                    <button
                      className="rei-btn"
                      type="button"
                      onClick={() => onDeleteSnapshot(s.id)}
                      style={{
                        borderColor: "#fecaca",
                        color: "#b91c1c",
                        background: "white",
                        fontWeight: 900,
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
