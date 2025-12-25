export default function SnapshotsPage() {
  return (
    <div className="rei-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>LEAF System Snapshots</div>
          <div style={{ color: "var(--muted)" }}>Snapshot management</div>
        </div>

        <button className="rei-btn rei-btnPrimary" type="button">
          + Create Snapshot
        </button>
      </div>

      <div style={{ height: 12 }} />

      <div className="rei-toolbar">
        <input className="rei-search" placeholder="Search..." />
      </div>

      <div className="rei-loadingBox">
        <div className="rei-spinner" />
        <div style={{ fontWeight: 800 }}>Loading snapshots...</div>
      </div>
    </div>
  );
}
