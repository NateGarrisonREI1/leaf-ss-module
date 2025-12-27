"use client";

import { useEffect, useMemo, useState } from "react";

import {
  type SnapshotDraft,
  upsertLocalSnapshot,
} from "../../../_data/localSnapshots";

import { MOCK_SYSTEMS, type CatalogSystem } from "../../../_data/mockSystems";
import { listCatalogSystems } from "../../../_data/catalogStore";
import { calculateLeafSavings, type LeafTierKey } from "../../../_data/leafSSConfigRuntime";

function makeSnapshotId(systemId: string) {
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `snap_${systemId}_${rand}`;
}

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

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

type TierOverride = NonNullable<
  NonNullable<SnapshotDraft["suggested"]["leafSSOverrides"]>["tiers"]
>[LeafTierKey];

function mapRuntimeToSnapshot(result: ReturnType<typeof calculateLeafSavings>) {
  return {
    currentWaste: result.currentWaste,
    recoverableWaste: result.recoverableWaste,

    minAnnual: result.minAnnualSavings,
    maxAnnual: result.maxAnnualSavings,
    centerAnnual: result.annualSavingsCenter,

    minMonthly: result.minMonthlySavings,
    maxMonthly: result.maxMonthlySavings,
    centerMonthly: result.centerMonthlySavings,
  };
}

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

        // report-facing optional fields start empty (user edits here)
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

        // legacy fields kept for now but NOT used as fixed report data
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

  /* ─────────────────────────────────────────────
     CATALOG (local editable store)
  ────────────────────────────────────────────── */

  const catalogSystems = useMemo(() => listCatalogSystems(MOCK_SYSTEMS), []);
  const selectedCatalog: CatalogSystem | null = useMemo(() => {
    if (!working.suggested.catalogSystemId) return null;
    return (
      catalogSystems.find((s) => s.id === working.suggested.catalogSystemId) ||
      null
    );
  }, [working.suggested.catalogSystemId, catalogSystems]);

  // Auto-fill suggested base name when catalog changes
  useEffect(() => {
    if (!selectedCatalog) return;
    setWorking((w) => ({
      ...w,
      suggested: {
        ...w.suggested,
        name: w.suggested.name?.trim() ? w.suggested.name : selectedCatalog.name,
      },
      updatedAt: new Date().toISOString(),
    }));
  }, [selectedCatalog]);

  /* ─────────────────────────────────────────────
     UPDATE HELPERS
  ────────────────────────────────────────────── */

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

  function updateCalc<K extends keyof NonNullable<SnapshotDraft["calculationInputs"]>>(
    key: K,
    value: NonNullable<SnapshotDraft["calculationInputs"]>[K]
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

  function patchTierOverride(
    s: SnapshotDraft,
    tier: LeafTierKey,
    patch: Partial<TierOverride>
  ): SnapshotDraft {
    const prevTiers = s.suggested.leafSSOverrides?.tiers || {};
    const prevTier = prevTiers[tier] || {};
    return {
      ...s,
      suggested: {
        ...s.suggested,
        leafSSOverrides: {
          ...(s.suggested.leafSSOverrides || {}),
          tiers: {
            ...prevTiers,
            [tier]: { ...prevTier, ...patch },
          },
        },
      },
      updatedAt: new Date().toISOString(),
    };
  }

  function updateTierOverride(
    tier: LeafTierKey,
    patch: Partial<TierOverride>
  ) {
    setWorking((w) => patchTierOverride(w, tier, patch));
  }

  /* ─────────────────────────────────────────────
     LIVE CALC PREVIEW (no fixed report numbers)
  ────────────────────────────────────────────── */

  const calcPreview = useMemo(() => {
    const tier = working.suggested.tier;
    if (!tier) return null;

    const annualUtilitySpend = working.calculationInputs?.annualUtilitySpend ?? 2400;
    const systemShare = working.calculationInputs?.systemShare ?? 0.4;
    const expectedLife = working.calculationInputs?.expectedLife ?? 20;
    const partialFailure = working.calculationInputs?.partialFailure;

    const wear = working.existing.wear ?? 3;
    const age = working.existing.ageYears ?? 10;

    const result = calculateLeafSavings({
      wear,
      age,
      tier,
      annualUtilitySpend,
      systemShare,
      expectedLife,
      partialFailure,
    });

    return mapRuntimeToSnapshot(result);
  }, [
    working.suggested.tier,
    working.calculationInputs?.annualUtilitySpend,
    working.calculationInputs?.systemShare,
    working.calculationInputs?.expectedLife,
    working.calculationInputs?.partialFailure,
    working.existing.wear,
    working.existing.ageYears,
  ]);

  function handleSave() {
    upsertLocalSnapshot(working);
    onSaved();
  }

  const tier: LeafTierKey = (working.suggested.tier || "better") as LeafTierKey;
  const tierOverride = working.suggested.leafSSOverrides?.tiers?.[tier] || {};

  /* ─────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────── */

  return (
    <div className="rei-card" style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 6 }}>
        {isEdit ? "Edit LEAF Snapshot" : "Create LEAF Snapshot"}
      </div>

      <div style={{ color: "var(--muted)", marginBottom: 16 }}>
        Everything that shows up in the report should be editable here. Calculations preview live.
      </div>

      {/* ───────────────── Existing System ───────────────── */}
      <SectionTitle>Existing System (Inputs)</SectionTitle>

      <div className="rei-formGrid">
        <Field label="Age (years)">
          <input
            className="rei-search"
            type="number"
            value={working.existing.ageYears ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateExisting("ageYears", v === "" ? null : Number(v));
            }}
          />
        </Field>

        <Field label="Wear (1–5)">
          <select
            className="rei-search"
            value={working.existing.wear ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateExisting("wear", v === "" ? null : Number(v));
            }}
          >
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Operational">
          <select
            className="rei-search"
            value={working.existing.operational}
            onChange={(e) => updateExisting("operational", e.target.value as any)}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </Field>

        <Field label="Maintenance">
          <select
            className="rei-search"
            value={working.existing.maintenance}
            onChange={(e) => updateExisting("maintenance", e.target.value as any)}
          >
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>
        </Field>
      </div>

      {/* ───────────────── Calculation Inputs ───────────────── */}
      <SectionTitle>Calculation Inputs (Editable)</SectionTitle>

      <div className="rei-formGrid">
        <Field label="Annual utility spend ($/yr)">
          <input
            className="rei-search"
            type="number"
            value={working.calculationInputs?.annualUtilitySpend ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateCalc("annualUtilitySpend", v === "" ? undefined : Number(v));
            }}
          />
        </Field>

        <Field label="System share of utility (0–1)">
          <input
            className="rei-search"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={working.calculationInputs?.systemShare ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateCalc("systemShare", v === "" ? undefined : Number(v));
            }}
          />
        </Field>

        <Field label="Expected life (years)">
          <input
            className="rei-search"
            type="number"
            value={working.calculationInputs?.expectedLife ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateCalc("expectedLife", v === "" ? undefined : Number(v));
            }}
          />
        </Field>

        <Field label="Partial failure (broken-but-still-used)">
          <select
            className="rei-search"
            value={working.calculationInputs?.partialFailure ? "Yes" : "No"}
            onChange={(e) => updateCalc("partialFailure", e.target.value === "Yes")}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </Field>
      </div>

      {/* ───────────────── Suggested Upgrade ───────────────── */}
      <SectionTitle>Suggested Upgrade (Editable)</SectionTitle>

      <div className="rei-formGrid">
        <Field label="Catalog System">
          <select
            className="rei-search"
            value={working.suggested.catalogSystemId || ""}
            onChange={(e) =>
              updateSuggested("catalogSystemId", e.target.value || null)
            }
          >
            <option value="">— Select system —</option>
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
            value={working.suggested.tier || "better"}
            onChange={(e) => updateSuggested("tier", e.target.value as any)}
          >
            <option value="good">Good</option>
            <option value="better">Better</option>
            <option value="best">Best</option>
          </select>
        </Field>

        <Field label="Suggested display name (base)">
          <input
            className="rei-search"
            value={working.suggested.name}
            onChange={(e) => updateSuggested("name", e.target.value)}
            placeholder="What the report should show"
          />
        </Field>

        <Field label="Install cost (est.)">
          <input
            className="rei-search"
            type="number"
            value={working.suggested.estCost ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateSuggested("estCost", v === "" ? null : Number(v));
            }}
            placeholder="Optional"
          />
        </Field>
      </div>

      {/* ───────────────── Tier Overrides ───────────────── */}
      <SectionTitle>Tier Overrides (This drives report ranges)</SectionTitle>

      <div className="rei-formGrid">
        <Field label={`${tier.toUpperCase()} price range min`}>
          <input
            className="rei-search"
            type="number"
            value={tierOverride?.leafPriceRange?.min ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateTierOverride(tier, {
                leafPriceRange: {
                  ...(tierOverride?.leafPriceRange || {}),
                  min: v === "" ? undefined : Number(v),
                },
              });
            }}
          />
        </Field>

        <Field label={`${tier.toUpperCase()} price range max`}>
          <input
            className="rei-search"
            type="number"
            value={tierOverride?.leafPriceRange?.max ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateTierOverride(tier, {
                leafPriceRange: {
                  ...(tierOverride?.leafPriceRange || {}),
                  max: v === "" ? undefined : Number(v),
                },
              });
            }}
          />
        </Field>

        <Field label={`${tier.toUpperCase()} monthly savings min`}>
          <input
            className="rei-search"
            type="number"
            value={tierOverride?.baseMonthlySavings?.min ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateTierOverride(tier, {
                baseMonthlySavings: {
                  ...(tierOverride?.baseMonthlySavings || {}),
                  min: v === "" ? undefined : Number(v),
                },
              });
            }}
          />
        </Field>

        <Field label={`${tier.toUpperCase()} monthly savings max`}>
          <input
            className="rei-search"
            type="number"
            value={tierOverride?.baseMonthlySavings?.max ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateTierOverride(tier, {
                baseMonthlySavings: {
                  ...(tierOverride?.baseMonthlySavings || {}),
                  max: v === "" ? undefined : Number(v),
                },
              });
            }}
          />
        </Field>
      </div>

      {/* ───────────────── Live Preview ───────────────── */}
      <SectionTitle>Live Calculation Preview</SectionTitle>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: 14,
          background: "rgba(0,0,0,0.12)",
        }}
      >
        {!calcPreview ? (
          <div style={{ color: "var(--muted)" }}>Select a tier to see preview.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <Row k="Current waste" v={`${Math.round(calcPreview.currentWaste)}%`} />
            <Row k="Recoverable waste" v={`${Math.round(calcPreview.recoverableWaste)}%`} />
            <Row
              k="Annual savings range"
              v={`$${Math.round(calcPreview.minAnnual)} – $${Math.round(calcPreview.maxAnnual)} (center $${Math.round(calcPreview.centerAnnual)})`}
            />
            <Row
              k="Monthly savings range"
              v={`$${Math.round(calcPreview.minMonthly)} – $${Math.round(calcPreview.maxMonthly)} (center $${Math.round(calcPreview.centerMonthly)})`}
            />
          </div>
        )}
      </div>

      {/* ───────────────── Actions ───────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 20,
        }}
      >
        <button className="rei-btn" type="button" onClick={onClose}>
          Cancel
        </button>
        <button className="rei-btn rei-btnPrimary" type="button" onClick={handleSave}>
          Save Snapshot
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   UI HELPERS
───────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontWeight: 800, margin: "18px 0 8px" }}>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div style={{ color: "var(--muted)", fontWeight: 800 }}>{k}</div>
      <div style={{ fontWeight: 900 }}>{v}</div>
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
