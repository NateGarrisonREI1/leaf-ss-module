"use client";

import { Incentive } from "../_data/incentivesModel";
import { groupIncentivesByLevel } from "../_data/filterIncentivesForJob";

function money(n?: number) {
  if (typeof n !== "number" || !isFinite(n)) return null;
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default function IncentivePreview({
  incentives,
}: {
  incentives: Incentive[];
}) {
  if (!incentives.length) {
    return (
      <div style={{ color: "var(--muted)", fontSize: 13 }}>
        No incentives apply to this system for this job.
      </div>
    );
  }

  const grouped = groupIncentivesByLevel(incentives);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {(["federal", "state", "local"] as const).map((level) => {
        const list = grouped[level];
        if (!list?.length) return null;

        return (
          <div key={level}>
            <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 6 }}>
              {level.charAt(0).toUpperCase() + level.slice(1)} Incentives
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {list.map((i) => (
                <div
                  key={i.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "8px 10px",
                    background: "white",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{i.title}</div>

                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {i.amount != null
                      ? money(i.amount)
                      : i.valueText || "—"}
                  </div>

                  {(i.appliesTo?.states || i.appliesTo?.zips) && (
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      Applies to{" "}
                      {i.appliesTo.states?.join(", ") ||
                        i.appliesTo.zips?.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
