"use client";

import LEAF_SS_CONFIG from "../_data/leafSSConfig";

export default function LeafSSConfigPage() {
  return (
    <div style={{ maxWidth: 960, padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>
        LEAF System Snapshot — Master Config
      </h1>

      <p style={{ color: "#555", marginTop: 8, marginBottom: 24 }}>
        This configuration is <b>code-based</b> in the current version of LEAF.
        <br />
        It is the single source of truth for all system assumptions and is not
        editable from the UI.
      </p>

      <Section title="Config Metadata">
        <KeyValue label="Version" value={LEAF_SS_CONFIG.meta.version} />
        <KeyValue label="Last Updated" value={LEAF_SS_CONFIG.meta.lastUpdated} />
        <KeyValue label="Notes" value={LEAF_SS_CONFIG.meta.notes} />
      </Section>

      <Section title="Utility Allocation">
        <pre style={preStyle}>
          {JSON.stringify(
            LEAF_SS_CONFIG.utilityAllocation,
            null,
            2
          )}
        </pre>
      </Section>

      <Section title="Lifecycle Thresholds">
        <pre style={preStyle}>
          {JSON.stringify(
            LEAF_SS_CONFIG.lifecycle,
            null,
            2
          )}
        </pre>
      </Section>

      <Section title="Carbon Factors">
        <pre style={preStyle}>
          {JSON.stringify(
            LEAF_SS_CONFIG.carbonFactors,
            null,
            2
          )}
        </pre>
      </Section>

      <div
        style={{
          marginTop: 32,
          padding: 16,
          borderRadius: 12,
          background: "#f8f8f8",
          border: "1px solid #ddd",
          fontSize: 13,
          color: "#444",
        }}
      >
        <b>Why this is read-only:</b>
        <ul style={{ marginTop: 8 }}>
          <li>Ensures deterministic snapshot calculations</li>
          <li>Prevents silent config drift</li>
          <li>Guarantees snapshots can be reproduced</li>
          <li>Aligns config with version-controlled assumptions</li>
        </ul>
      </div>
    </div>
  );
}

/* ---------- UI HELPERS ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
        {title}
      </h2>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 14,
          padding: 16,
          background: "#fff",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function KeyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontWeight: 700 }}>{label}:</span>{" "}
      <span style={{ color: "#333" }}>{value}</span>
    </div>
  );
}

const preStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.4,
  background: "#fafafa",
  padding: 12,
  borderRadius: 8,
  overflowX: "auto",
};
