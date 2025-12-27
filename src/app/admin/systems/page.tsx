"use client";

import { useState } from "react";
import {
  loadLocalCatalog,
  type CatalogSystem,
} from "../_data/localCatalog";

import CatalogEditor from "./_components/CatalogEditor";

export default function SystemsCatalogPage() {
  const [catalog, setCatalog] = useState<CatalogSystem[]>(() =>
    loadLocalCatalog()
  );
  const [editing, setEditing] = useState<CatalogSystem | null>(null);

  function refresh() {
    setCatalog(loadLocalCatalog());
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Header */}
      <div className="rei-card">
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
          Systems Catalog
        </div>
        <div style={{ color: "var(--muted)" }}>
          These systems define <b>default</b> LEAF ranges, labels, and photos.
          Snapshots can override anything.
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            className="rei-btn rei-btnPrimary"
            onClick={() =>
              setEditing({
                id: "",
                category: "HVAC",
                name: "",
                highlights: [],
                defaultAssumptions: {},
                leafSSOverrides: { tiers: {} },
                tags: [],
                photos: [],
              } as CatalogSystem)
            }
          >
            + Add System
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rei-card">
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.6fr 1.2fr 120px",
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
            <div>Tier Ranges</div>
            <div />
          </div>

          {catalog.length === 0 ? (
            <div style={{ padding: 14, color: "var(--muted)" }}>
              No systems yet.
            </div>
          ) : (
            catalog.map((s) => {
              const tiers = s.leafSSOverrides?.tiers || {};

              function range(t: any) {
                if (!t?.leafPriceRange) return "—";
                return `$${t.leafPriceRange.min ?? "—"} – $${t.leafPriceRange.max ?? "—"}`;
              }

              return (
                <div
                  key={s.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.6fr 1.2fr 120px",
                    gap: 10,
                    padding: "12px 14px",
                    borderTop: "1px solid var(--border)",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{s.category}</div>

                  <div>
                    <div style={{ fontWeight: 900 }}>{s.name}</div>
                    {s.highlights?.length > 0 && (
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        {s.highlights.join(" • ")}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Good: {range(tiers.good)} <br />
                    Better: {range(tiers.better)} <br />
                    Best: {range(tiers.best)}
                  </div>

                  <button className="rei-btn" onClick={() => setEditing(s)}>
                    Edit
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor */}
      {editing && (
        <CatalogEditor
          system={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
