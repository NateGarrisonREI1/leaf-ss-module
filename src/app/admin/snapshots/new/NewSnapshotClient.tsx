"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { MOCK_JOBS, type Job, type ExistingSystem } from "../../_data/mockJobs";
import { findLocalJob } from "../../_data/localJobs";

import { MOCK_SYSTEMS } from "../../_data/mockSystems";
import { upsertLocalSnapshot, type SnapshotDraft } from "../../_data/localSnapshots";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export default function NewSnapshotClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const jobId = sp.get("jobId") || "";
  const systemId = sp.get("systemId") || "";

  const { job, system } = useMemo(() => {
    let job: Job | null = null;

    if (jobId) {
      job = findLocalJob(jobId) ?? MOCK_JOBS.find((j) => j.id === jobId) ?? null;
    }

    let system: ExistingSystem | null = null;
    if (job && systemId) {
      system = job.systems.find((s) => s.id === systemId) ?? null;
    }

    return { job, system };
  }, [jobId, systemId]);

  // Suggested upgrade options filtered by existing system type
  const suggestedOptions = useMemo(() => {
    if (!system) return [];
    return MOCK_SYSTEMS.filter((s) => s.category === system.type);
  }, [system]);

  // Form state (draft)
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");
  const [suggestedName, setSuggestedName] = useState<string>("");
  const [estCost, setEstCost] = useState<string>("");
  const [estAnnualSavings, setEstAnnualSavings] = useState<string>("");
  const [estPaybackYears, setEstPaybackYears] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  function applyCatalogDefaults() {
    const match = MOCK_SYSTEMS.find((s) => s.id === selectedCatalogId);
    if (!match) return;

    setSuggestedName(match.name);
    setEstCost(match.defaultAssumptions.estCost?.toString() ?? "");
    setEstAnnualSavings(match.defaultAssumptions.estAnnualSavings?.toString() ?? "");
    setEstPaybackYears(match.defaultAssumptions.estPaybackYears?.toString() ?? "");
    setNotes(match.highlights.join(" • "));
  }

  function toNumberOrNull(v: string): number | null {
    const cleaned = v.trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function canSave() {
    // Minimal requirement: suggested name OR catalog selection
    return Boolean(suggestedName.trim() || selectedCatalogId);
  }

  function handleSave() {
    if (!job || !system) return;

    if (!canSave()) {
      alert("Pick a suggested system (or type a name) before saving.");
      return;
    }

    const ts = nowIso();

    const snapshot: SnapshotDraft = {
      id: makeId("snap"),
      jobId: job.id,
      systemId: system.id,

      existing: {
        type: system.type,
        subtype: system.subtype,
        ageYears: system.ageYears,
        operational: system.operational,
        wear: system.wear,
        maintenance: system.maintenance,
      },

      suggested: {
        catalogSystemId: selectedCatalogId || null,
        name: suggestedName.trim() || "Suggested Upgrade",
        estCost: toNumberOrNull(estCost),
        estAnnualSavings: toNumberOrNull(estAnnualSavings),
        estPaybackYears: toNumberOrNull(estPaybackYears),
        notes: notes.trim(),
      },

      createdAt: ts,
      updatedAt: ts,
    };

    upsertLocalSnapshot(snapshot);

    // Back to job page (later we’ll show the snapshot list there)
    router.push(`/admin/jobs/${job.id}`);
  }

  if (!jobId || !systemId) {
    return (
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16 }}>Missing parameters</div>
        <div style={{ color: "var(--muted)", marginTop: 8 }}>
          Expected <code>?jobId=...</code> and <code>&systemId=...</code>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href="/admin/jobs">← Back to Jobs</Link>
        </div>
      </div>
    );
  }

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

  if (!system) {
    return (
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16 }}>System not found</div>
        <div style={{ color: "var(--muted)", marginTop: 8 }}>
          This job exists, but no system matches id: <code>{systemId}</code>
        </div>
        <div style={{ marginTop: 12 }}>
          <Link href={`/admin/jobs/${job.id}`}>← Back to Job</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Header */}
      <div className="rei-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
              New LEAF System Snapshot
            </div>
            <div style={{ color: "var(--muted)" }}>
              Job: <b>{job.customerName}</b> — {job.reportId}
            </div>
          </div>

          <Link
            className="rei-btn"
            href={`/admin/jobs/${job.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            ← Back to Job
          </Link>
        </div>
      </div>

      {/* Existing system summary */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Existing System (from worksheet)</div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 14,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "var(--muted)" }}>
            <div>
              <b style={{ color: "var(--text)" }}>Type:</b> {system.type}
            </div>
            <div>
              <b style={{ color: "var(--text)" }}>Subtype:</b> {system.subtype}
            </div>
            <div>
              <b style={{ color: "var(--text)" }}>Age:</b> {system.ageYears} yrs
            </div>
            <div>
              <b style={{ color: "var(--text)" }}>Operational:</b> {system.operational}
            </div>
            <div>
              <b style={{ color: "var(--text)" }}>Wear:</b> {system.wear}/5
            </div>
            <div>
              <b style={{ color: "var(--text)" }}>Maintenance:</b> {system.maintenance}
            </div>
          </div>

          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            This data was captured from the worksheet so your snapshot has context.
          </div>
        </div>
      </div>

      {/* Suggested upgrade */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Suggested Upgrade (Proposed)</div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 14,
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 6 }}>
                Choose from Systems Catalog (optional)
              </div>
              <select
                className="rei-input"
                value={selectedCatalogId}
                onChange={(e) => setSelectedCatalogId(e.target.value)}
              >
                <option value="">— Select {system.type} upgrade —</option>
                {suggestedOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>

              <div style={{ height: 8 }} />

              <button
                className="rei-btn"
                type="button"
                onClick={applyCatalogDefaults}
                disabled={!selectedCatalogId}
                style={{ opacity: selectedCatalogId ? 1 : 0.5 }}
              >
                Apply catalog defaults
              </button>

              <div style={{ height: 8 }} />
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Catalog numbers are <b>starting assumptions</b>. You can override everything below.
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 6 }}>
                Suggested system name (required)
              </div>
              <input
                className="rei-input"
                value={suggestedName}
                onChange={(e) => setSuggestedName(e.target.value)}
                placeholder="e.g., Heat Pump Water Heater"
              />
              <div style={{ height: 10 }} />
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Tip: use catalog + tweak. Or type a custom upgrade name.
              </div>
            </div>
          </div>

          {/* Overrides */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 6 }}>
                Est. Cost ($)
              </div>
              <input
                className="rei-input"
                value={estCost}
                onChange={(e) => setEstCost(e.target.value)}
                placeholder="e.g., 12000"
                inputMode="numeric"
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 6 }}>
                Est. Savings / yr ($)
              </div>
              <input
                className="rei-input"
                value={estAnnualSavings}
                onChange={(e) => setEstAnnualSavings(e.target.value)}
                placeholder="e.g., 350"
                inputMode="numeric"
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 6 }}>
                Est. Payback (yrs)
              </div>
              <input
                className="rei-input"
                value={estPaybackYears}
                onChange={(e) => setEstPaybackYears(e.target.value)}
                placeholder="e.g., 12"
                inputMode="numeric"
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 6 }}>
              Notes / highlights
            </div>
            <textarea
              className="rei-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Short notes to appear on snapshot/report"
              style={{ minHeight: 90, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button className="rei-btn rei-btnPrimary" type="button" onClick={handleSave} disabled={!canSave()}>
              Save Snapshot
            </button>
          </div>

          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            Saved snapshots are stored in your browser (localStorage) for now.
          </div>
        </div>
      </div>
    </div>
  );
}
