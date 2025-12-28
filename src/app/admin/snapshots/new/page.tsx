// src/app/admin/snapshots/new/page.tsx

import { findLocalJob } from "../../_data/localJobs";
import NewSnapshotClient from "./NewSnapshotClient";

type PageProps = {
  searchParams: {
    jobId?: string;
    systemId?: string;
  };
};

export default function NewSnapshotPage({ searchParams }: PageProps) {
  const jobId = searchParams.jobId;
  const systemId = searchParams.systemId;

  if (!jobId || !systemId) {
    return (
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16 }}>
          Missing snapshot context
        </div>
        <div style={{ color: "var(--muted)", marginTop: 6 }}>
          A jobId and systemId are required to create a snapshot.
        </div>
      </div>
    );
  }

  const job = findLocalJob(jobId);

  if (!job) {
    return (
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16 }}>
          Job not found
        </div>
        <div style={{ color: "var(--muted)", marginTop: 6 }}>
          No local job exists with id: <code>{jobId}</code>
        </div>
      </div>
    );
  }

  const system =
    ((job as any).systems || []).find((s: any) => s.id === systemId) ?? null;

  if (!system) {
    return (
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16 }}>
          System not found
        </div>
        <div style={{ color: "var(--muted)", marginTop: 6 }}>
          This system no longer exists on the job.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1100 }}>
      <NewSnapshotClient job={job as any} system={system} />
    </div>
  );
}
