"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MOCK_JOBS, type Job } from "../_data/mockJobs";
import { loadLocalJobs } from "../_data/localJobs";
import {
  deleteLocalSnapshot,
  loadLocalSnapshots,
  upsertLocalSnapshot,
  type SnapshotDraft,
} from "../_data/localSnapshots";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function nowIso() {
  return new Date().toISOString();
}

export default function SnapshotsPage() {
  const [localJobs, setLocalJobs] = useState<Job[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotDraft[]>([]);

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string>("");
  const [draftCost, setDraftCost] = useState<string>("");
  const [draftSavings, setDraftSavings] = useState<string>("");
  const [draftPayback, setDraftPayback] = useState<string>("");
  const [draftNotes, setDraftNotes] = useState<string>("");

  useEffect(() => {
    setLocalJobs(loadLocalJobs());
    setSnapshots(loadLocalSnapshots());
  }, []);

  function refreshSnapshots() {
    setSnapshots(loadLocalSnapshots());
  }

  const jobsById = useMemo(() => {
    const merged = [...MOCK_JOBS, ...localJobs];
    const map = new Map<string, Job>();
    for (const j of merged) map.set(j.id, j);
    return map;
  }, [localJobs]);

  const ordered = useMemo(() => {
    return [...snapshots].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }, [snapshots]);

  function toNumberOrNull(v: string): number | null {
    const cleaned = v.trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function startEdit(snap: SnapshotDraft) {
    setEditingId(snap.id);
    setDraftName(snap.suggested.name ?? "");
    setDraftCost(snap.suggested.estCost?.toString() ?? "");
    setDraftSavings(snap.suggested.estAnnualSavings?.toString() ?? "");
    setDraftPayback(snap.suggested.estPaybackYears?.toString() ?? "");
    setDraftNotes(snap.suggested.notes ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftName("");
    setDraftCost("");
    setDraftSavings("");
    setDraftPayback("");
    setDraftNotes("");
  }

  function saveEdit(snap: SnapshotDraft) {
    const name = draftName.trim();
    if (!name) {
      alert("Suggested system name is required.");
      return;
    }

    const next: SnapshotDraft = {
      ...snap,
      suggested: {
        ...snap.suggested,
        name,
        estCost: toNumberOrNull(draftCost),
        estAnnualSavings: toNumberOrNull(draftSavings),
        estPaybackYears: toNumberOrNull(draftPayback),
        notes: draftNotes.trim(),
      },
      updatedAt: nowIso(),
    };

    upsertLocalSnapshot(next);
    refreshSnapshots();
    cancelEdit();
  }

  function handleDelete(snapshotId: string) {
    const ok = window.confirm("Delete this snapshot?");
    if (!ok) return;

    deleteLocalSnapshot(snapshotId);
    refreshSnapshots();

    if (editingId === snapshotId) cancelEdit();
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="rei-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>LEAF System Snapshots</div>
            <div style={{ color: "var(--muted)" }}>
              All snapshots saved in your browser (localStorage) for now.
            </div>
          </div>

          <Link className="rei-btn rei-btnPrimary" href="/admin/jobs" style={{ textDecoration: "none" }}>
            Create from Jobs
          </Link>
        </div>
      </div>

      <div className="rei-card">
        {ordered.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No snapshots saved yet.</div>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.1fr 1.3fr 0.8fr 0.8fr 0.7fr 0.9fr 1.2fr",
                gap: 10,
                padding: "12px 14px",
                background: "rgba(16,24,40,.03)",
                fontWeight: 900,
                fontSize: 12,
                color: "var(--muted)",
              }}
            >
              <div>Job</div>
              <div>Existing</div>
              <div>Suggested</div>
              <div>Cost</div>
              <div>Savings/yr</div>
              <div>Payback</div>
              <div>Updated</div>
              <div style={{ textAlign: "right" }}>Actions</div>
            </div>

            {ordered.map((snap) => {
              const job = jobsById.get(snap.jobId);
              const jobLabel = job ? `${job.customerName} — ${job.reportId}` : snap.jobId;
              const isEditing = editingId === snap.id;

              return (
                <div
                  key={snap.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.1fr 1.3fr 0.8fr 0.8fr 0.7fr 0.9fr 1.2fr",
                    gap: 10,
                    padding: "12px 14px",
                    borderTop: "1px solid var(--border)",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Link
                      href={`/admin/jobs/${snap.jobId}`}
                      style={{ textDecoration: "none", color: "inherit", fontWeight: 900 }}
                    >
                      {jobLabel}
                    </Link>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>{job?.address ?? "—"}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 900 }}>{snap.existing.type}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>{snap.existing.subtype}</div>
                  </div>

                  <div>
                    {isEditing ? (
                      <div style={{ display: "grid", gap: 6 }}>
                        <input
                          className="rei-input"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          placeholder="Suggested system name"
                        />
                        <textarea
                          className="rei-input"
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                          placeholder="Notes"
                          style={{ minHeight: 60, resize: "vertical" }}
                        />
                      </div>
                    ) : (
                      <>
                        <div style={{ fontWeight: 900 }}>{snap.suggested.name}</div>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>
                          {snap.suggested.catalogSystemId ? "From catalog" : "Manual"}
                          {snap.suggested.notes ? ` • ${snap.suggested.notes}` : ""}
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ color: "var(--muted)" }}>
                    {isEditing ? (
                      <input
                        className="rei-input"
                        value={draftCost}
                        onChange={(e) => setDraftCost(e.target.value)}
                        placeholder="Cost"
                        inputMode="numeric"
                      />
                    ) : (
                      snap.suggested.estCost ?? "—"
                    )}
                  </div>

                  <div style={{ color: "var(--muted)" }}>
                    {isEditing ? (
                      <input
                        className="rei-input"
                        value={draftSavings}
                        onChange={(e) => setDraftSavings(e.target.value)}
                        placeholder="Savings/yr"
                        inputMode="numeric"
                      />
                    ) : (
                      snap.suggested.estAnnualSavings ?? "—"
                    )}
                  </div>

                  <div style={{ color: "var(--muted)" }}>
                    {isEditing ? (
                      <input
                        className="rei-input"
                        value={draftPayback}
                        onChange={(e) => setDraftPayback(e.target.value)}
                        placeholder="Payback"
                        inputMode="numeric"
                      />
                    ) : (
                      snap.suggested.estPaybackYears ?? "—"
                    )}
                  </div>

                  <div style={{ color: "var(--muted)" }}>{formatDate(snap.updatedAt)}</div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                    {isEditing ? (
                      <>
                        <button className="rei-btn rei-btnPrimary" type="button" onClick={() => saveEdit(snap)}>
                          Save
                        </button>
                        <button className="rei-btn" type="button" onClick={cancelEdit}>
                          Cancel
                        </button>
                        <button className="rei-btn" type="button" onClick={() => handleDelete(snap.id)}>
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="rei-btn" type="button" onClick={() => startEdit(snap)}>
                          Edit
                        </button>
                        <button className="rei-btn" type="button" onClick={() => handleDelete(snap.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: 10 }} />
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Next: add a dedicated snapshot detail page (<code>/admin/snapshots/[snapshotId]</code>) and a mock report preview.
        </div>
      </div>
    </div>
  );
}
