import IncentivesClient from "./IncentivesClient";

export default function IncentivesPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header>
        <h1 style={{ margin: 0 }}>Incentives</h1>
        <p style={{ marginTop: 8, color: "var(--muted)" }}>
          Edit which rebates/credits apply to each system type. Saved to your browser (localStorage).
        </p>
      </header>

      <IncentivesClient />
    </div>
  );
}
