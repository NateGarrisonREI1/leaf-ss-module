import { MOCK_SYSTEMS } from "../_data/mockSystems";

export default function SystemsCatalogPage() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>Systems Catalog</div>
        <div style={{ color: "var(--muted)" }}>
          Pick “suggested upgrades” from here when creating LEAF System Snapshots (mock data for now).
        </div>
      </div>

      <div className="rei-card">
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.4fr 1fr",
              gap: 10,
              padding: "12px 14px",
              background: "rgba(16,24,40,.03)",
              fontWeight: 900,
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            <div>Category</div>
            <div>System</div>
            <div>Defaults</div>
          </div>

          {MOCK_SYSTEMS.map((s) => (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.4fr 1fr",
                gap: 10,
                padding: "12px 14px",
                borderTop: "1px solid var(--border)",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 900 }}>{s.category}</div>
              <div>
                <div style={{ fontWeight: 900 }}>{s.name}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{s.highlights.join(" • ")}</div>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                Cost: {s.defaultAssumptions.estCost ?? "—"} <br />
                Savings: {s.defaultAssumptions.estAnnualSavings ?? "—"} /yr <br />
                Payback: {s.defaultAssumptions.estPaybackYears ?? "—"} yrs
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
