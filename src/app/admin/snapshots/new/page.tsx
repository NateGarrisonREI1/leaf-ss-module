export default function NewSnapshotPage({
  searchParams,
}: {
  searchParams: { jobId?: string; systemId?: string };
}) {
  return (
    <div className="rei-card">
      <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>Create Snapshot</div>
      <div style={{ color: "var(--muted)" }}>
        Placeholder page — next we’ll drop your LEAF System Snapshot UI here.
      </div>

      <div style={{ marginTop: 12, fontSize: 13 }}>
        <div><b>jobId:</b> {searchParams.jobId ?? "—"}</div>
        <div><b>systemId:</b> {searchParams.systemId ?? "—"}</div>
      </div>
    </div>
  );
}
