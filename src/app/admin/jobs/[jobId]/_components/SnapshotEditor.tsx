"use client";

import { useEffect, useMemo, useState } from "react";

import {
  type SnapshotDraft,
  upsertLocalSnapshot,
} from "../../../_data/localSnapshots";

import { MOCK_SYSTEMS, type CatalogSystem } from "../../../_data/mockSystems";
import { listCatalogSystems } from "../../../_data/catalogStore";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

function makeSnapshotId(systemId: string) {
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `snap_${systemId}_${rand}`;
}

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

type LeafTierKey = "good" | "better" | "best";

type Props = {
  jobId: string;
  existingSystem: {
    id: string;
    type: string;
    subtype: string;
    ageYears: number;
    operational: "Yes" | "No";
    wear: number;
    maintenance: "Good" | "Average" | "Poor";
  };
  snapshot?: SnapshotDraft | null;
  onClose: () => void;
  onSaved: () => void;
};

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */

export default function SnapshotEditor({
  jobId,
  existingSystem,
  snapshot,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(snapshot);

  const [working, setWorking] = useState<SnapshotDraft>(() => {
    if (snapshot) return snapshot;

    return {
      id: makeSnapshotId(existingSystem.id),
      jobId,
      systemId: existingSystem.id,

      existing: {
        type: existingSystem.type,
        subtype: existingSystem.subtype,
        ageYears: existingSystem.ageYears ?? null,
        operational: existingSystem.operational,
        wear: existingSystem.wear ?? null,
        maintenance: existingSystem.maintenance,

        label: "",
        statusPillText: "",
        annualCostRange: { min: 0, max: 0 },
        carbonRange: { min: 0, max: 0 },
        imageUrl: "",
      },

      suggested: {
        catalogSystemId: null,
        name: "",
        estCost: null,

        estAnnualSavings: null,
        estPaybackYears: null,

        notes: "",
        tier: "better",

        recommendedNameByTier: {},
        statusPillTextByTier: {},
        imageUrl: "",

        leafSSOverrides: { tiers: {} },
      },

      calculationInputs: {
        annualUtilitySpend: 2400,
        systemShare: 0.4,
        expectedLife: 20,
        partialFailure: false,
      },

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  /* ───────────────── Catalog ───────────────── */

  const catalogSystems = useMemo(
    () => listCatalogSystems(MOCK_SYSTEMS),
    []
  );

  const selectedCatalog: CatalogSystem | null = useMemo(() => {
    if (!working.suggested.catalogSystemId) return null;
    return (
      catalogSystems.find(
        (s) => s.id === working.suggested.catalogSystemId
      ) || null
    );
  }, [working.suggested.catalogSystemId, catalogSystems]);

  useEffect(() => {
    if (!selectedCatalog) return;
    setWorking((w) => ({
      ...w,
      suggested: {
        ...w.suggested,
        name: w.suggested.name || selectedCatalog.name,
      },
      updatedAt: new Date().toISOString(),
    }));
  }, [selectedCatalog]);

  /* ───────────────── Update Helpers ───────────────── */

  function updateExisting<K extends keyof SnapshotDraft["existing"]>(
    key: K,
    value: SnapshotDraft["existing"][K]
  ) {
    setWorking((w) => ({
      ...w,
      existing: { ...w.existing, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  }

  function updateSuggested<K extends keyof SnapshotDraft["suggested"]>(
    key: K,
    value: SnapshotDraft["suggested"][K]
  ) {
    setWorking((w) => ({
      ...w,
      suggested: { ...w.suggested, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  }

  function updateCalc<K extends keyof SnapshotDraft["calculationInputs"]>(
    key: K,
    value: SnapshotDraft["calculationInputs"][K]
  ) {
    setWorking((w) => ({
      ...w,
      calculationInputs: {
        ...(w.calculationInputs || {}),
        [key]: value,
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  /* ───────────────── Actions ───────────────── */

  function handleSave() {
    upsertLocalSnapshot(working);
    onSaved();
  }

  /* ───────────────── Render ───────────────── */

  return (
    <div className="rei-card" style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 6 }}>
        {isEdit ? "Edit LEAF Snapshot" : "Create LEAF Snapshot"}
      </div>

      <div style={{ color: "var(--muted)", marginBottom: 16 }}>
        This editor defines everything the LEAF System Snapshot will display.
        Calculations are handled elsewhere.
      </div>

      {/* Existing */}
      <SectionTitle>Existing System</SectionTitle>

      <div className="rei-formGrid">
        <Field label="Age (years)">
          <input
            type="number"
            className="rei-search"
            value={working.existing.ageYears ?? ""}
            onChange={(e) =>
              updateExisting(
                "ageYears",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />
        </Field>

        <Field label="Wear (1–5)">
          <select
            className="rei-search"
            value={working.existing.wear ?? ""}
            onChange={(e) =>
              updateExisting(
                "wear",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          >
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>

        <Field label="Operational">
          <select
            className="rei-search"
            value={working.existing.operational}
            onChange={(e) =>
              updateExisting("operational", e.target.value as any)
            }
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </Field>
      </div>

      {/* Suggested */}
      <SectionTitle>Suggested Upgrade</SectionTitle>

      <div className="rei-formGrid">
        <Field label="Catalog System">
          <select
            className="rei-search"
            value={working.suggested.catalogSystemId || ""}
            onChange={(e) =>
              updateSuggested(
                "catalogSystemId",
                e.target.value || null
              )
            }
          >
            <option value="">— Select —</option>
            {catalogSystems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.category} — {s.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tier">
          <select
            className="rei-search"
            value={working.suggested.tier}
            onChange={(e) =>
              updateSuggested("tier", e.target.value as LeafTierKey)
            }
          >
            <option value="good">Good</option>
            <option value="better">Better</option>
            <option value="best">Best</option>
          </select>
        </Field>

        <Field label="Display Name">
          <input
            className="rei-search"
            value={working.suggested.name}
            onChange={(e) =>
              updateSuggested("name", e.target.value)
            }
          />
        </Field>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 20,
        }}
      >
        <button className="rei-btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="rei-btn rei-btnPrimary"
          onClick={handleSave}
        >
          Save Snapshot
        </button>
      </div>
    </div>
  );
}

/* ───────────────── UI Helpers ───────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontWeight: 800, margin: "18px 0 8px" }}>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
        {label}
      </div>
      {children}
    </label>
  );
}
