"use client";

import { useState } from "react";
import {
  type CatalogSystem,
  upsertCatalogSystem,
  deleteCatalogSystem,
} from "../../_data/localCatalog";

type Props = {
  system: CatalogSystem;
  onSaved: () => void;
  onClose: () => void;
};

function makeId() {
  return `cat_${Math.random().toString(36).slice(2, 10)}`;
}

export default function CatalogEditor({ system, onSaved, onClose }: Props) {
  const [draft, setDraft] = useState<CatalogSystem>({
    ...system,
    id: system.id || makeId(),
    highlights: system.highlights ?? [],
    leafSSOverrides: system.leafSSOverrides ?? { tiers: {} },
  });

  function save() {
    upsertCatalogSystem(draft);
    onSaved();
  }

  function remove() {
    const ok = confirm("Delete this system? This cannot be undone.");
    if (!ok) return;
    deleteCatalogSystem(draft.id);
    onSaved();
  }

  function setTierRange(tier: "good" | "better" | "best", key: "min" | "max", value: string) {
    const n = Number(value);
    setDraft((d) => ({
      ...d,
      leafSSOverrides: {
        tiers: {
          ...d.leafSSOverrides?.tiers,
          [tier]: {
            ...d.leafSSOverrides?.tiers?.[tier],
            leafPriceRange: {
              ...d.leafSSOverrides?.tiers?.[tier]?.leafPriceRange,
              [key]: Number.isFinite(n) ? n : undefined,
            },
          },
        },
      },
    }));
  }

  return (
    <div className="rei-card">
      <div style={{ fontWeight: 900, fontSize: 16 }}>Edit Catalog System</div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <input
          className="rei-search"
          placeholder="System name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />

        <input
          className="rei-search"
          placeholder="Category"
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
        />

        {(["good", "better", "best"] as const).map((t) => (
          <div key={t} style={{ display: "flex", gap: 8 }}>
            <b style={{ width: 60 }}>{t}</b>
            <input
              className="rei-search"
              placeholder="Min $"
              onChange={(e) => setTierRange(t, "min", e.target.value)}
            />
            <input
              className="rei-search"
              placeholder="Max $"
              onChange={(e) => setTierRange(t, "max", e.target.value)}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button className="rei-btn rei-btnPrimary" onClick={save}>
          Save
        </button>
        <button className="rei-btn" onClick={onClose}>
          Cancel
        </button>
        {system.id && (
          <button
            className="rei-btn"
            onClick={remove}
            style={{ color: "#b91c1c", borderColor: "#fecaca" }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
