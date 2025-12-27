"use client";

import { useEffect, useMemo, useState } from "react";
import { MOCK_SYSTEMS } from "../_data/mockSystems";
import { Incentive, loadIncentives } from "../_data/incentivesModel";

type LeafTierKey = "good" | "better" | "best";

type CatalogSystem = {
  id: string;
  category: "HVAC" | "Water Heater" | "Windows" | "Doors" | "Lighting" | "Insulation" | "Other";
  name: string;
  highlights: string[];
  tags?: string[];

  /** Phase 3 */
  incentiveIds?: string[];

  defaultAssumptions: {
    estCost?: number;
    estAnnualSavings?: number;
    estPaybackYears?: number;
  };

  tiers?: Partial<
    Record<
      LeafTierKey,
      {
        estCostMin?: number;
        estCostMax?: number;
        estSavingsMinAnnual?: number;
        estSavingsMaxAnnual?: number;
      }
    >
  >;
};

const STORAGE_KEY = "REI_LOCAL_CATALOG_V1";

function safeId(prefix = "sys") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function numberOrUndef(v: string): number | undefined {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : undefined;
}

function normalizeTag(t: string): string {
  return String(t || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => normalizeTag(s))
    .filter(Boolean);
}

function loadLocalCatalog(): CatalogSystem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCatalog(list: CatalogSystem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function SystemsCatalogPage() {
  const [systems, setSystems] = useState<CatalogSystem[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);

  const [mode, setMode] = useState<"view" | "add" | "edit">("view");
  const [editingId, setEditingId] = useState<string | null>(null);

  // form
  const [category, setCategory] = useState<CatalogSystem["category"]>("HVAC");
  const [name, setName] = useState("");
  const [highlights, setHighlights] = useState("");
  const [tags, setTags] = useState("");
  const [estCost, setEstCost] = useState("");
  const [estAnnualSavings, setEstAnnualSavings] = useState("");
  const [estPaybackYears, setEstPaybackYears] = useState("");
  const [incentiveIds, setIncentiveIds] = useState<string[]>([]);

  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    setSystems(loadLocalCatalog());
    setIncentives(loadIncentives());
  }, []);

  function resetForm() {
    setCategory("HVAC");
    setName("");
    setHighlights("");
    setTags("");
    setEstCost("");
    setEstAnnualSavings("");
    setEstPaybackYears("");
    setIncentiveIds([]);
    setEditingId(null);
    setErrors({});
  }

  function startAdd() {
    resetForm();
    setMode("add");
  }

  function startEdit(id: string) {
    const s = systems.find((x) => x.id === id);
    if (!s) return;

    setCategory(s.category);
    setName(s.name);
    setHighlights((s.highlights || []).join(", "));
    setTags((s.tags || []).join(", "));
    setEstCost(s.defaultAssumptions?.estCost?.toString() ?? "");
    setEstAnnualSavings(s.defaultAssumptions?.estAnnualSavings?.toString() ?? "");
    setEstPaybackYears(s.defaultAssumptions?.estPaybackYears?.toString() ?? "");
    setIncentiveIds(s.incentiveIds || []);
    setEditingId(id);
    setErrors({});
    setMode("edit");
  }

  function toggleIncentive(id: string) {
    setIncentiveIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function upsert() {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrors({ name: "System name is required." });
      return;
    }

    const next: CatalogSystem = {
      id: editingId || safeId(),
      category,
      name: trimmed,
      highlights: highlights.split(",").map((s) => s.trim()).filter(Boolean),
      tags: parseTags(tags),
      incentiveIds,
      defaultAssumptions: {
        estCost: numberOrUndef(estCost),
        estAnnualSavings: numberOrUndef(estAnnualSavings),
        estPaybackYears: numberOrUndef(estPaybackYears),
      },
    };

    const nextList =
      mode === "edit"
        ? systems.map((x) => (x.id === next.id ? next : x))
        : [next, ...systems];

    setSystems(nextList);
    saveLocalCatalog(nextList);
    setMode("view");
    resetForm();
  }

  function remove(id: string) {
    if (!confirm("Delete this catalog system? (local only)")) return;
    const next = systems.filter((x) => x.id !== id);
    setSystems(next);
    saveLocalCatalog(next);
  }

  function seedFromMock() {
    if (!confirm("Copy MOCK_SYSTEMS into your editable catalog?")) return;

    const existingIds = new Set(systems.map((s) => s.id));
    const seeded: CatalogSystem[] = (MOCK_SYSTEMS as any[]).map((s) => ({
      id: existingIds.has(s.id) ? safeId() : s.id,
      category: s.category,
      name: s.name,
      highlights: s.highlights || [],
      tags: s.tags || [],
      incentiveIds: [],
      defaultAssumptions: s.defaultAssumptions || {},
    }));

    const next = [...seeded, ...systems];
    setSystems(next);
    saveLocalCatalog(next);
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Header */}
      <div className="rei-card" style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Systems Catalog</div>
          <div style={{ color: "var(--muted)" }}>
            Editable catalog for Suggested Upgrades. Incentives attach by ID.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="rei-btn" onClick={seedFromMock}>
            Seed from MOCK_SYSTEMS
          </button>
          <button className="rei-btn rei-btnPrimary" onClick={startAdd}>
            + Add Catalog System
          </button>
        </div>
      </div>

      {/* Form */}
      {(mode === "add" || mode === "edit") && (
        <div className="rei-card">
          <div className="rei-formGrid">
            <Field label="Category">
              <select className="rei-search" value={category} onChange={(e) => setCategory(e.target.value as any)}>
                {["HVAC","Water Heater","Windows","Doors","Lighting","Insulation","Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="System Name *">
              <input
                className="rei-search"
                value={name}
                autoFocus
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setErrors({});
                }}
                placeholder="e.g., Ducted Heat Pump, High-Efficiency Gas Furnace"
                style={{ borderColor: errors.name ? "#ef4444" : undefined }}
              />
              {errors.name && (
                <div style={{ fontSize: 12, color: "#ef4444" }}>{errors.name}</div>
              )}
            </Field>

            <Field label="Highlights (comma separated)">
              <input
                className="rei-search"
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="Lower CO₂, Better comfort, Rebate eligible"
              />
            </Field>

            <Field label="Tags">
              <input
                className="rei-search"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="heat_pump, hvac, electrification"
              />
            </Field>

            <Field label="Install Cost ($)">
              <input className="rei-search" value={estCost} onChange={(e) => setEstCost(e.target.value)} />
            </Field>

            <Field label="Annual Savings ($/yr)">
              <input className="rei-search" value={estAnnualSavings} onChange={(e) => setEstAnnualSavings(e.target.value)} />
            </Field>

            <Field label="Payback (yrs)">
              <input className="rei-search" value={estPaybackYears} onChange={(e) => setEstPaybackYears(e.target.value)} />
            </Field>

            <Field label="Attached Incentives">
              {incentives.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  No incentives defined yet.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 6 }}>
                  {incentives.map((inc) => (
                    <label key={inc.id} style={{ display: "flex", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={incentiveIds.includes(inc.id)}
                        onChange={() => toggleIncentive(inc.id)}
                      />
                      <span>
                        <b>{inc.title}</b>{" "}
                        <span style={{ color: "var(--muted)" }}>({inc.level})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </Field>
          </div>

          <div className="rei-formActions" style={{ marginTop: 14 }}>
            <button className="rei-btn" onClick={() => setMode("view")}>
              Cancel
            </button>
            <button
              className="rei-btn rei-btnPrimary"
              disabled={!name.trim()}
              style={{ opacity: name.trim() ? 1 : 0.5 }}
              onClick={upsert}
            >
              {mode === "add" ? "Add System" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="rei-card">
        {systems.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>
            No catalog systems yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {systems.map((s) => (
              <div
                key={s.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {s.category} • {(s.highlights || []).join(" • ") || "—"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button className="rei-btn" onClick={() => startEdit(s.id)}>
                    Edit
                  </button>
                  <button className="rei-btn" onClick={() => remove(s.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>
        {label}
      </div>
      {children}
    </label>
  );
}
