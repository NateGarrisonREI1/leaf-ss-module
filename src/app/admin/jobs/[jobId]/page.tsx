"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { MOCK_JOBS, type Job, type ExistingSystem } from "../../_data/mockJobs";
import { findLocalJob, updateLocalJob } from "../../_data/localJobs";
import Worksheet from "./_components/Worksheet";

export default function JobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId;

  const [localJob, setLocalJob] = useState<Job | null>(null);

  // editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExistingSystem | null>(null);

  useEffect(() => {
    if (!jobId) return;
    setLocalJob(findLocalJob(jobId));
  }, [jobId]);

  const job = useMemo(() => {
    if (!jobId) return null;
    return localJob ?? MOCK_JOBS.find((j) => j.id === jobId) ?? null;
  }, [jobId, localJob]);

  function handleJobUpdated(nextJob: Job) {
    updateLocalJob(nextJob);
    setLocalJob(nextJob);
  }

  function startEdit(system: ExistingSystem) {
    setEditingId(system.id);
    setDraft({ ...system });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    if (!job || !draft || !editingId) return;

    // quick validation
    if (!draft.subtype.trim()) return;
    if (Number.isNaN(Number(draft.ageYears))) return;

    const nextSystems = job.systems.map((s) => (s.id === editingId ? { ...draft, subtype: draft.subtype.trim() } : s));
    handleJobUpdated({ ...job, systems: nextSystems });
    cancelEdit();
  }

  function deleteSystem(systemId: string) {
    if (!job) return;
    const ok = window.confirm("Delete this system? This cannot be undone (for this mock job).");
    if (!ok) return;

    const nextSystems = job.systems.filter((s) => s.id !== systemId);
    handleJobUpdated({ ...job, systems: nextSystems });

    // if we were editing that row, reset edit state
    if (editingId === systemId) cancelEdit();
  }

  if (!jobId) {
    return (
      <div className="rei-card">
        <div style={{ fontWeight: 900 }}>Missing job id</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16 }}>Job not found</div>
        <div style={{ color: "var(--muted)", marginTop: 6 }}>
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
      {/* Header */}
      <div className="rei-card">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
              {job.customerName} —{" "}
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{job.reportId}</span>
            </div>

            <div style={{ color: "var(--muted)" }}>{job.address ?? "—"}</div>

            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                marginTop: 10,
                color: "var(--muted)",
                fontSize: 13,
              }}
            >
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

          <div style={{ display: "flex", gap: 10 }}>
            <Link className="rei-btn" href="/admin/jobs" style={{ textDecoration: "none", color: "inherit" }}>
              ← Jobs
            </Link>
            <button className="rei-btn rei-btnPrimary" type="button" disabled>
              Generate Mock Report
            </button>
          </div>
        </div>
      </div>

      {/* Inspection Upload (placeholder) */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 6 }}>Inspection Upload</div>
        <div style={{ color: "var(--muted)", marginBottom: 12 }}>
          Placeholder: upload inspection/HES PDFs here (Supabase Storage later).
        </div>
        <button className="rei-btn" type="button" disabled style={{ border: "1px solid var(--border)", background: "transparent" }}>
          Upload Inspection PDF (coming next)
        </button>
      </div>

      {/* Worksheet / Intake */}
      <Worksheet job={job} onJobUpdated={handleJobUpdated} />

      {/* Existing Systems */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>Existing Systems</div>

        {job.systems.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No systems on this job yet — add one in the worksheet above.</div>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1.4fr 0.7fr 0.7fr 0.9fr 0.9fr 1.6fr",
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

            {job.systems.map((s) => {
              const isEditing = editingId === s.id;

              return (
                <div
                  key={s.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1.4fr 0.7fr 0.7fr 0.9fr 0.9fr 1.6fr",
                    gap: 10,
                    padding: "12px 14px",
                    borderTop: "1px solid var(--border)",
                    alignItems: "center",
                  }}
                >
                  {/* Type */}
                  <div style={{ fontWeight: 900 }}>{s.type}</div>

                  {/* Subtype */}
                  <div style={{ color: "var(--muted)" }}>
                    {isEditing ? (
                      <input
                        className="rei-search"
                        value={draft?.subtype ?? ""}
                        onChange={(e) => setDraft((d) => (d ? { ...d, subtype: e.target.value } : d))}
                        placeholder="Subtype"
                      />
                    ) : (
                      s.subtype
                    )}
                  </div>

                  {/* Age */}
                  <div style={{ color: "var(--muted)" }}>
                    {isEditing ? (
                      <input
                        className="rei-search"
                        value={String(draft?.ageYears ?? "")}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, ageYears: Number(e.target.value || 0) } : d
                          )
                        }
                        inputMode="numeric"
                        placeholder="Years"
                      />
                    ) : (
                      `${s.ageYears} yrs`
                    )}
                  </div>

                  {/* Operational */}
                  <div style={{ color: "var(--muted)" }}>
                    {isEditing ? (
                      <select
                        className="rei-search"
                        value={draft?.operational ?? "Yes"}
                        onChange={(e) => setDraft((d) => (d ? { ...d, operational: e.target.value as any } : d))}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      s.operational
                    )}
                  </div>

                  {/* Wear */}
                  <div style={{ color: "var(--muted)" }}>
                    {isEditing ? (
                      <select
                        className="rei-search"
                        value={draft?.wear ?? 3}
                        onChange={(e) => setDraft((d) => (d ? { ...d, wear: Number(e.target.value) as any } : d))}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    ) : (
                      `${s.wear}/5`
                    )}
                  </div>

                  {/* Maintenance */}
                  <div style={{ color: "var(--muted)" }}>
                    {isEditing ? (
                      <select
                        className="rei-search"
                        value={draft?.maintenance ?? "Average"}
                        onChange={(e) => setDraft((d) => (d ? { ...d, maintenance: e.target.value as any } : d))}
                      >
                        <option value="Good">Good</option>
                        <option value="Average">Average</option>
                        <option value="Poor">Poor</option>
                      </select>
                    ) : (
                      s.maintenance
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                    {isEditing ? (
                      <>
                        <button className="rei-btn rei-btnPrimary" type="button" onClick={saveEdit}>
                          Save
                        </button>
                        <button className="rei-btn" type="button" onClick={cancelEdit}>
                          Cancel
                        </button>
                        <button className="rei-btn" type="button" onClick={() => deleteSystem(s.id)}>
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="rei-btn" type="button" onClick={() => startEdit(s)}>
                          Edit
                        </button>
                        <button className="rei-btn" type="button" onClick={() => deleteSystem(s.id)}>
                          Delete
                        </button>
                        <Link
                          className="rei-btn rei-btnPrimary"
                          href={`/admin/snapshots/new?jobId=${encodeURIComponent(job.id)}&systemId=${encodeURIComponent(
                            s.id
                          )}`}
                          style={{ textDecoration: "none" }}
                        >
                          Create Snapshot
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
          Next: “Create Snapshot” will load the LEAF SS page using this system’s worksheet data.
        </div>
      </div>
    </div>
  );
}
