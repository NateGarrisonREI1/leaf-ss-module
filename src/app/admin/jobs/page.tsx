"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MOCK_JOBS, type Job } from "../_data/mockJobs";
import { loadLocalJobs } from "../_data/localJobs";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export default function JobsPage() {
  const [localJobs, setLocalJobs] = useState<Job[]>([]);

  useEffect(() => {
    setLocalJobs(loadLocalJobs());
  }, []);

  const allJobs = useMemo(() => {
    // local jobs first, then mock jobs that aren’t duplicates
    const localIds = new Set(localJobs.map((j) => j.id));
    return [...localJobs, ...MOCK_JOBS.filter((j) => !localIds.has(j.id))];
  }, [localJobs]);

  return (
    <div className="rei-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>Jobs</div>
          <div style={{ color: "var(--muted)" }}>Create a job → upload inspection → fill worksheet → generate snapshot</div>
        </div>

        <Link className="rei-btn rei-btnPrimary" href="/admin/jobs/new" style={{ textDecoration: "none" }}>
          + Create Job
        </Link>
      </div>

      <div style={{ height: 14 }} />

      <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.4fr 1fr 0.8fr",
            gap: 10,
            padding: "12px 14px",
            background: "rgba(16,24,40,.03)",
            fontWeight: 900,
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          <div>Customer</div>
          <div>Address</div>
          <div>Report ID</div>
          <div>Updated</div>
        </div>

        {allJobs.map((job) => (
          <Link
            key={job.id}
            href={`/admin/jobs/${job.id}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.4fr 1fr 0.8fr",
              gap: 10,
              padding: "12px 14px",
              textDecoration: "none",
              color: "inherit",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div style={{ fontWeight: 900 }}>{job.customerName}</div>
            <div style={{ color: "var(--muted)" }}>{job.address ?? "—"}</div>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{job.reportId}</div>
            <div style={{ color: "var(--muted)" }}>{formatDate(job.createdAt)}</div>
          </Link>
        ))}
      </div>

      <div style={{ height: 10 }} />
      <div style={{ fontSize: 12, color: "var(--muted)" }}>
        Jobs created via <b>Create Job</b> are stored in your browser (localStorage) for now.
      </div>
    </div>
  );
}
