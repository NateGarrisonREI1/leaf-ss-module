// src/lib/incentives/incentiveResolver.ts

import type { CatalogIncentive, CatalogSystem } from "../catalog/catalogTypes";
import type { JobAppliedIncentive, JobIncentiveScope } from "./incentiveTypes";

function normalizeState(x: string) {
  return (x || "").trim().toUpperCase();
}

function normalizeZip(x: string) {
  return (x || "").trim();
}

export function incentiveApplies(
  incentive: CatalogIncentive,
  jobZip: string,
  jobState: string
): boolean {
  const zip = normalizeZip(jobZip);
  const state = normalizeState(jobState);

  const scope = incentive.scope;

  if (scope.type === "federal") return true;

  if (scope.type === "state") {
    return scope.states.map(normalizeState).includes(state);
  }

  if (scope.type === "zip") {
    return scope.zips.map(normalizeZip).includes(zip);
  }

  return false;
}

export function incentiveMatchesSystem(
  incentive: CatalogIncentive,
  systemId: string,
  systemTags: string[]
): boolean {
  if (incentive.systemIds?.includes(systemId)) return true;

  const tags = systemTags || [];
  const incTags = incentive.systemTags || [];

  if (incTags.some((t) => tags.includes(t))) return true;

  return false;
}

function mapScopeToJobScope(incentive: CatalogIncentive): JobIncentiveScope {
  if (incentive.scope.type === "federal") return "federal";
  if (incentive.scope.type === "state") return "state";
  return "local";
}

/**
 * Resolves catalog incentives -> job snapshot incentives (editable + toggleable).
 * - system match: systemId OR tags
 * - location match: federal OR state match OR zip match
 */
export function resolveApplicableIncentives(args: {
  catalogSystem: CatalogSystem;
  jobZip: string;
  jobState: string;
}): JobAppliedIncentive[] {
  const { catalogSystem, jobZip, jobState } = args;

  const incentives = catalogSystem.incentives || [];
  if (!incentives.length) return [];

  const systemTags = catalogSystem.tags || [];

  return incentives
    .filter(
      (i) =>
        incentiveMatchesSystem(i, catalogSystem.id, systemTags) &&
        incentiveApplies(i, jobZip, jobState)
    )
    .map((i) => ({
      id: i.id,
      name: i.name,
      amount: Number(i.amount) || 0,
      scope: mapScopeToJobScope(i),
      applied: true,
      source: "catalog",
    }))
    .filter((i) => i.amount > 0);
}

/** Utility: group for UI display */
export function groupJobIncentives(list: JobAppliedIncentive[]) {
  return {
    federal: list.filter((x) => x.scope === "federal"),
    state: list.filter((x) => x.scope === "state"),
    local: list.filter((x) => x.scope === "local"),
  };
}

/** Utility: compute total applied amount */
export function sumAppliedIncentives(list: JobAppliedIncentive[]) {
  return (list || []).reduce((sum, i) => sum + (i.applied ? i.amount : 0), 0);
}
