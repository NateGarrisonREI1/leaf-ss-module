"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";

import { MOCK_JOBS, type Job } from "../../_data/mockJobs";
import { findLocalJob } from "../../_data/localJobs";
import { loadLocalSnapshots, snapshotsForJob, type SnapshotDraft } from "../../_data/localSnapshots";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = (params?.jobId as string) || "";

  const job: Job | null = useMemo(() => {
    if (!jobId) return null;
    return findLocalJob(jobId) ?? MOCK_JOBS.find((j) => j.id === jobId) ?? null;
  }, [jobId]);

  const jobSnapshots: SnapshotDraft[] = useMemo(() => {
    // ensure localSnapshots is initialized at least once in the browser
    loadLocalSnapshots();
    return jobId ? snapshotsForJob(jobId) : [];
  }, [jobId]);

  if (!job) {
    return (
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16 }}>Job not found</div>
        <div style={{ color: "var(--muted)", marginTop: 8 }}>
          No job exists with id: <code>{jobId}</code>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/admin/jobs">← Back to Jobs</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* HEADER */}
      <div className="rei-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
              {job.customerName} — {job.reportId}
            </div>
            <div style={{ color: "var(--muted)" }}>{job.address ?? "—"}</div>

            <div style={{ height: 10 }} />

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "var(--muted)", fontSize: 12 }}>
              <div>
                <b style={{ color: "var(--text)" }}>Sq Ft:</b> {job.sqft ?? "—"}
              </div>
              <div>
                <b style={{ color: "var(--text)" }}>Year Built:</b> {job.yearBuilt ?? "—"}
              </div>
              <div>
                <b style={{ color: "var(--text)" }}>Systems:</b> {job.systems.length}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/admin/jobs" className="rei-btn" style={{ textDecoration: "none", color: "inherit" }}>
              ← Jobs
            </Link>
            <button className="rei-btn rei-btnPrimary" type="button">
              Generate Mock Report
            </button>
          </div>
        </div>
      </div>

      {/* INSPECTION UPLOAD PLACEHOLDER */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Inspection Upload</div>
        <div style={{ color: "var(--muted)" }}>
          Placeholder: upload inspection/HES PDFs here (Supabase Storage later).
        </div>
        <div style={{ height: 10 }} />
        <button className="rei-btn" type="button" disabled style={{ opacity: 0.6 }}>
          Upload Inspection PDF (coming next)
        </button>
      </div>

      {/* WORKSHEET / SYSTEMS LIST */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Existing Systems</div>
        <div style={{ color: "var(--muted)" }}>
          These come from your worksheet intake. Create a snapshot from any existing system.
        </div>

        <div style={{ height: 12 }} />

        <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.4fr 0.8fr 0.9fr 0.8fr 0.9fr 160px",
              gap: 10,
              padding: "12px 14px",
              background: "rgba(16,24,40,.03)",
              fontWeight: 900,
              fontSize: 12,
              color: "var(--muted)",
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

          {job.systems.length === 0 ? (
            <div style={{ padding: 14, color: "var(--muted)" }}>No systems added yet.</div>
          ) : (
            job.systems.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.4fr 0.8fr 0.9fr 0.8fr 0.9fr 160px",
                  gap: 10,
                  padding: "12px 14px",
                  borderTop: "1px solid var(--border)",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 900 }}>{s.type}</div>
                <div style={{ color: "var(--muted)" }}>{s.subtype}</div>
                <div style={{ color: "var(--muted)" }}>{s.ageYears} yrs</div>
                <div style={{ color: "var(--muted)" }}>{s.operational}</div>
                <div style={{ color: "var(--muted)" }}>{s.wear}/5</div>
                <div style={{ color: "var(--muted)" }}>{s.maintenance}</div>

                <Link
                  className="rei-btn rei-btnPrimary"
                  href={`/admin/snapshots/new?jobId=${job.id}&systemId=${s.id}`}
                  style={{ textDecoration: "none", textAlign: "center" }}
                >
                  Create Snapshot
                </Link>
              </div>
            ))
          )}
        </div>

        <div style={{ height: 10 }} />
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Next: we can add Edit/Delete for existing systems here after we finalize snapshots.
        </div>
      </div>

      {/* SNAPSHOTS FOR THIS JOB */}
      <div className="rei-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Saved Snapshots</div>
            <div style={{ color: "var(--muted)" }}>
              These are saved in your browser (localStorage) for now.
            </div>
          </div>

          <Link href="/admin/snapshots" className="rei-btn" style={{ textDecoration: "none", color: "inherit" }}>
            View all snapshots
          </Link>
        </div>

        <div style={{ height: 12 }} />

        {jobSnapshots.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No snapshots saved for this job yet.</div>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.4fr 0.9fr 0.9fr 0.8fr",
                gap: 10,
                padding: "12px 14px",
                background: "rgba(16,24,40,.03)",
                fontWeight: 900,
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              <div>Existing</div>
              <div>Suggested</div>
              <div>Cost</div>
              <div>Savings/yr</div>
              <div>Updated</div>
            </div>

            {jobSnapshots.map((snap) => (
              <div
                key={snap.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.4fr 0.9fr 0.9fr 0.8fr",
                  gap: 10,
                  padding: "12px 14px",
                  borderTop: "1px solid var(--border)",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>{snap.existing.type}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{snap.existing.subtype}</div>
                </div>

                <div>
                  <div style={{ fontWeight: 900 }}>{snap.suggested.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    {snap.suggested.catalogSystemId ? "From catalog" : "Manual"}
                    {snap.suggested.notes ? ` • ${snap.suggested.notes}` : ""}
                  </div>
                </div>

                <div style={{ color: "var(--muted)" }}>
                  {snap.suggested.estCost ?? "—"}
                </div>

                <div style={{ color: "var(--muted)" }}>
                  {snap.suggested.estAnnualSavings ?? "—"}
                </div>

                <div style={{ color: "var(--muted)" }}>{formatDate(snap.updatedAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
