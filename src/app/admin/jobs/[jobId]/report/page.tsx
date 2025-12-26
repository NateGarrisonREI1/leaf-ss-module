"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";

import { MOCK_JOBS, type Job } from "../../../_data/mockJobs";
import { findLocalJob } from "../../../_data/localJobs";
import { loadLocalSnapshots, snapshotsForJob } from "../../../_data/localSnapshots";
import { MOCK_SYSTEMS } from "../../../_data/mockSystems";
import { getIncentivesForSystemType, type IncentiveResource } from "../../../../../lib/incentives/incentiveRules";

import { LEAF_SS_CONFIG } from "../../../_data/leafSSConfig";
import {
  getSnapshotByIndex,
  getTier,
  classifyCostFromThresholds,
  dynamicSavingsRangeFromRule,
  type LeafTierKey,
} from "../../../_data/leafSSConfigRuntime";

function normalizeTag(t: string): string {
  return String(t || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

function money(n?: number | null) {
  const v = typeof n === "number" && isFinite(n) ? n : null;
  if (v == null) return "—";
  return "$" + Math.round(v).toLocaleString("en-US");
}

function incentiveAmountText(r: IncentiveResource): string {
  const a: any = (r as any).amount;
  if (!a) return "";
  if (a.kind === "text") return String(a.value || "").trim();
  if (a.kind === "flat") {
    const unit = a.unit ? ` (${a.unit})` : "";
    return `${money(Number(a.value || 0))}${unit}`;
  }
  if (a.kind === "range") {
    const unit = a.unit ? ` (${a.unit})` : "";
    return `${money(Number(a.min || 0))}–${money(Number(a.max || 0))}${unit}`;
  }
  return "";
}

export default function JobReportPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId;

  const job: Job | null = useMemo(() => {
    if (!jobId) return null;
    return findLocalJob(jobId) || MOCK_JOBS.find((j) => j.id === jobId) || null;
  }, [jobId]);

  const snaps: any[] = useMemo(() => {
    if (!jobId) return [];
    try {
      loadLocalSnapshots();
      return snapshotsForJob(jobId) || [];
    } catch {
      return [];
    }
  }, [jobId]);

  const pages = useMemo(() => {
    const list = Array.isArray(snaps) ? snaps : [];
    return list.slice(0, 3).map((s, idx) => {
      const existingType = String(s?.existing?.type || "").trim();
      const existingSubtype = String(s?.existing?.subtype || "").trim();

      const catalogId = s?.suggested?.catalogSystemId || null;
      const catalog = catalogId ? (MOCK_SYSTEMS as any[]).find((x) => x.id === catalogId) : null;
      const tags: string[] = (catalog?.tags || [])
        .map((t: any) => normalizeTag(String(t || "")))
        .filter(Boolean);

      const incentives = getIncentivesForSystemType(existingType, { tags }).filter(
        (r: any) => !(r as any).disabled
      );

      return {
        id: s?.id || `page_${idx}`,
        existingType,
        existingSubtype,
        ageYears: s?.existing?.ageYears ?? null,
        wear: s?.existing?.wear ?? null,
        suggestedName: String(s?.suggested?.name || "Suggested upgrade").trim(),
        estCost: s?.suggested?.estCost ?? null,
        estAnnualSavings: s?.suggested?.estAnnualSavings ?? null,
        estPaybackYears: s?.suggested?.estPaybackYears ?? null,
        tags,
        incentives,
      };
    });
  }, [snaps]);

  useEffect(() => {
    const pagesEl = document.getElementById("pages");
    const pagerEl = document.getElementById("pager");
    const dots = pagerEl
      ? Array.from(pagerEl.querySelectorAll<HTMLButtonElement>(".dot"))
      : [];
    const pageLabel = document.getElementById("pageLabel");

    function setActiveDot(i: number) {
      dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
      const tpl =
        LEAF_SS_CONFIG.global.uiText.headerPageLabelTemplate ||
        "Snapshot {current} of {total}";
      if (pageLabel)
        pageLabel.textContent = tpl
          .replace("{current}", String(i + 1))
          .replace("{total}", String(dots.length || 0));
    }

    function scrollToPage(i: number) {
      if (!pagesEl) return;
      const w = pagesEl.clientWidth || 1;
      pagesEl.scrollTo({ left: i * w, behavior: "smooth" });
      setActiveDot(i);
    }

    function onPagerClick(e: any) {
      const btn = e?.target?.closest?.("[data-page]");
      if (!btn) return;
      scrollToPage(Number(btn.dataset.page || 0));
    }

    function onScroll() {
      if (!pagesEl) return;
      const w = pagesEl.clientWidth || 1;
      const i = Math.round(pagesEl.scrollLeft / w);
      setActiveDot(Math.max(0, Math.min(dots.length - 1, i)));
    }

    function onResize() {
      const i = dots.findIndex((d) => d.classList.contains("active"));
      scrollToPage(Math.max(0, i));
    }

    pagerEl?.addEventListener("click", onPagerClick);
    pagesEl?.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);

    const global = LEAF_SS_CONFIG.global;
    const globalSlider = global.slider;
    const globalIncentives = global.incentives;
    const msgLib = LEAF_SS_CONFIG.messageLibrary;

    const clamp = (v: number, min: number, max: number) =>
      Math.min(max, Math.max(min, v));
    const formatMoney = (n: number) =>
      "$" + Math.round(n).toLocaleString(global.format.currencyLocale || "en-US");
    const formatMoneyRange = (a: number, b: number) =>
      `${formatMoney(a)}–${formatMoney(b)}`;

    function setBadge(
      el: HTMLElement,
      tone: "good" | "warn" | "bad" | "neutral",
      text: string
    ) {
      el.setAttribute("data-tone", tone);
      el.textContent = text;
    }

    function setBand(
      okEl: HTMLElement,
      sliderMin: number,
      sliderMax: number,
      okMin: number,
      okMax: number
    ) {
      const span = sliderMax - sliderMin || 1;
      const L = ((okMin - sliderMin) / span) * 100;
      const R = ((okMax - sliderMin) / span) * 100;
      okEl.style.left = `${clamp(L, 0, 100)}%`;
      okEl.style.width = `${Math.max(
        0,
        clamp(R, 0, 100) - clamp(L, 0, 100)
      )}%`;
    }

    function setFill(
      fillEl: HTMLElement,
      sliderMin: number,
      sliderMax: number,
      value: number
    ) {
      const span = sliderMax - sliderMin || 1;
      const pct = ((value - sliderMin) / span) * 100;
      fillEl.style.width = `${clamp(pct, 0, 100)}%`;
    }

    function renderList(el: HTMLElement | null, items: string[]) {
      if (!el) return;
      el.innerHTML = (items || []).map((t) => `<li>${t}</li>`).join("");
    }

    function computeNetCostRange(installCost: number) {
      const low = Number(globalIncentives.low || 0);
      const high = Number(globalIncentives.high || 0);
      const netLow = Math.max(0, installCost - high);
      const netHigh = Math.max(0, installCost - low);
      return { netLow, netHigh };
    }

    function initLeafPage(root: Element) {
      const $ = (sel: string) => root.querySelector(sel) as HTMLElement | null;

      const priceSlider =
        root.querySelector<HTMLInputElement>('[data-el="priceSlider"]');
      if (!priceSlider) return () => {};

      const pageIndex = Number(root.getAttribute("data-page-index") || "0");
      const snapshot = getSnapshotByIndex(pageIndex);

      let tierKey: LeafTierKey = "better";

      const priceValue = $('[data-el="priceValue"]');
      const costBadge = $('[data-el="costBadge"]');
      const overallBadge = $('[data-el="overallBadge"]');
      const overallHeadline = $('[data-el="overallHeadline"]');

      const quickReadWhy = $('[data-el="quickReadWhy"]');
      const qVisible = $('[data-el="quickReadQuestionsVisible"]');
      const qMore = $('[data-el="quickReadQuestionsMore"]');

      const msNetCostRange = $('[data-el="msNetCostRange"]');
      const msSavingsRange = $('[data-el="msSavingsRange"]');
      const heroSavingsPill = $('[data-el="heroSavingsPill"]');

      const recommendedNameEl = $('[data-el="recommendedName"]');
      const recommendedStatusPill = $('[data-el="recommendedStatusPill"]');

      const priceBandOK = $('[data-el="priceBandOK"]');
      const priceBandFill = $('[data-el="priceBandFill"]');

      const dynSavings = $('[data-el="dynamicSavingsRange"]');
      const leafRangeText = $('[data-el="leafRangeText"]');
      const resetBtn = $('[data-el="resetBtn"]');

      const tierButtons = Array.from(
        root.querySelectorAll<HTMLButtonElement>('[data-el="tierBtn"]')
      );

      priceSlider.min = String(globalSlider.min);
      priceSlider.max = String(globalSlider.max);
      priceSlider.step = String(globalSlider.step);

      function getRuleOverrides() {
        // ✅ FIX: don’t let TS infer {}. Cast to a shaped object / any.
        const snapOverrides = (snapshot?.rulesOverrides ?? {}) as {
          costClassThresholds?: {
            unrealLowOffsetFromMin?: number;
            overpricedOffsetFromMax?: number;
          };
          dynamicSavingsRule?: {
            type?: string;
            stepSizeDollars?: number;
            bumpPerStepMonthlyDollars?: number;
          };
        };

        const thresholds =
          snapOverrides.costClassThresholds ||
          global.rangesAndClassifications.costClassThresholds;

        const dynRule =
          snapOverrides.dynamicSavingsRule ||
          global.rangesAndClassifications.dynamicSavingsRule;

        return { thresholds, dynRule };
      }

      function setTier(next: LeafTierKey) {
        tierKey = next;

        tierButtons.forEach((b) =>
          b.classList.toggle("active", b.dataset.tier === tierKey)
        );

        const t = getTier(snapshot, tierKey);
        const min = Number(t?.leafPriceRange?.min || globalSlider.min);
        const max = Number(t?.leafPriceRange?.max || globalSlider.max);
        const mid = Math.round((min + max) / 2);

        priceSlider.value = String(mid);
        updateUI();
      }

      function updateUI() {
        const price = Number(priceSlider.value);

        const t = getTier(snapshot, tierKey);
        const tierMin = Number(t?.leafPriceRange?.min || 0);
        const tierMax = Number(t?.leafPriceRange?.max || 0);

        const baseMin = Number(t?.baseMonthlySavings?.min || 0);
        const baseMax = Number(t?.baseMonthlySavings?.max || 0);

        const { thresholds, dynRule } = getRuleOverrides();

        const recName = snapshot?.recommendedSystemCard?.recommendedNameByTier?.[tierKey];
        const recStatus = snapshot?.recommendedSystemCard?.statusPillTextByTier?.[tierKey];
        if (recommendedNameEl && recName) recommendedNameEl.textContent = String(recName);
        if (recommendedStatusPill && recStatus) recommendedStatusPill.textContent = String(recStatus);

        if (priceValue) priceValue.textContent = formatMoney(price);

        const dyn = dynamicSavingsRangeFromRule({
          baseMin,
          baseMax,
          price,
          tierMax,
          stepSizeDollars: Number(dynRule?.stepSizeDollars ?? 1000),
          bumpPerStepMonthlyDollars: Number(dynRule?.bumpPerStepMonthlyDollars ?? 2),
        });

        const savText = `${formatMoney(dyn.min)}–${formatMoney(dyn.max)}/mo`;
        if (dynSavings) dynSavings.textContent = savText;
        if (msSavingsRange) msSavingsRange.textContent = savText;
        if (heroSavingsPill)
          heroSavingsPill.textContent = `Save ~${formatMoney(dyn.min)}–${formatMoney(dyn.max)}/mo`;

        if (leafRangeText) leafRangeText.textContent = formatMoneyRange(tierMin, tierMax);

        if (priceBandOK) setBand(priceBandOK, Number(priceSlider.min), Number(priceSlider.max), tierMin, tierMax);
        if (priceBandFill) setFill(priceBandFill, Number(priceSlider.min), Number(priceSlider.max), price);

        const costClass = classifyCostFromThresholds({
          price,
          tierMin,
          tierMax,
          unrealLowOffsetFromMin: Number(thresholds?.unrealLowOffsetFromMin ?? -500),
          overpricedOffsetFromMax: Number(thresholds?.overpricedOffsetFromMax ?? 3000),
        });

        const costBadgeText = (msgLib as any).costBadgeTextByClass?.[costClass] || "—";
        if (costBadge) {
          const tone =
            costClass === "in"
              ? "good"
              : costClass === "low" || costClass === "likely_over"
              ? "warn"
              : "bad";
          setBadge(costBadge, tone, costBadgeText);
        }

        const overallText = (msgLib as any).overallBadgeTextByClass?.[costClass] || "—";
        if (overallBadge) {
          const tone = costClass === "in" ? "good" : costClass === "over" ? "bad" : "warn";
          setBadge(overallBadge, tone, overallText);
        }

        const quick = (msgLib as any).quickReadByCostClass?.[costClass];
        if (overallHeadline && quick?.headline) overallHeadline.textContent = quick.headline;
        renderList(quickReadWhy, quick?.why || []);
        renderList(qVisible, quick?.qVisible || []);
        renderList(qMore, quick?.qMore || []);

        const decision = (msgLib as any).decisionByCostClass?.[costClass];
        const decisionBadgeEl = $('[data-el="decisionBadge"]');
        const decisionHeadlineEl = $('[data-el="decisionHeadline"]');
        const decisionTextEl = $('[data-el="decisionText"]');
        const msValueCheckEl = $('[data-el="msValueCheck"]');
        const msMeaningEl = $('[data-el="msMeaning"]');

        if (decisionBadgeEl && decision?.decisionBadge) decisionBadgeEl.textContent = decision.decisionBadge;
        if (decisionHeadlineEl && decision?.summaryHeadline) decisionHeadlineEl.textContent = decision.summaryHeadline;
        if (decisionTextEl && decision?.summaryText) decisionTextEl.textContent = decision.summaryText;
        if (msValueCheckEl && decision?.msValueCheck) msValueCheckEl.textContent = decision.msValueCheck;
        if (msMeaningEl && decision?.msMeaning) msMeaningEl.textContent = decision.msMeaning;

        const net = computeNetCostRange(price);
        const netMin = Math.min(net.netLow, net.netHigh);
        const netMax = Math.max(net.netLow, net.netHigh);
        if (msNetCostRange) msNetCostRange.textContent = formatMoneyRange(netMin, netMax);
      }

      function resetToTierMid() {
        const t = getTier(snapshot, tierKey);
        const min = Number(t?.leafPriceRange?.min || globalSlider.min);
        const max = Number(t?.leafPriceRange?.max || globalSlider.max);
        const mid = Math.round((min + max) / 2);
        priceSlider.value = String(mid);
        updateUI();
      }

      const onTierClick = (e: Event) => {
        const btn = (e.target as HTMLElement | null)?.closest?.(
          '[data-el="tierBtn"]'
        ) as HTMLButtonElement | null;
        if (!btn) return;
        const t = (btn.dataset.tier || "better") as LeafTierKey;
        setTier(t);
      };

      const onInput = () => updateUI();
      const onReset = () => resetToTierMid();

      priceSlider.addEventListener("input", onInput);
      resetBtn?.addEventListener("click", onReset);
      root.addEventListener("click", onTierClick);

      setTier("better");

      return () => {
        priceSlider.removeEventListener("input", onInput);
        resetBtn?.removeEventListener("click", onReset);
        root.removeEventListener("click", onTierClick);
      };
    }

    const cleanups: Array<() => void> = [];
    document.querySelectorAll(".leaf-page").forEach((el) => {
      const c = initLeafPage(el);
      if (typeof c === "function") cleanups.push(c);
    });

    setActiveDot(0);

    return () => {
      pagerEl?.removeEventListener("click", onPagerClick);
      pagesEl?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cleanups.forEach((fn) => fn());
    };
  }, [pages.length]);

  if (!jobId) return <div style={{ padding: 24 }}>Missing jobId</div>;
  if (!job) return <div style={{ padding: 24 }}>Job not found</div>;
  if (!pages.length) return <div style={{ padding: 24 }}>No snapshots yet</div>;

  const ui = LEAF_SS_CONFIG.global.uiText;
  const incentivesUi = LEAF_SS_CONFIG.global.incentives.labels;

  return (
    <>
      {/* (styles + JSX remain the same as your prior version) */}
      {/* IMPORTANT: keep the JSX block you already pasted from the previous message.
          This patch is ONLY about the TS error on snapOverrides typing. */}
      {/* If you want, paste your current JSX/styles here and I’ll return a single-file
          unified copy — but this fix alone should compile. */}
      <div style={{ padding: 24 }}>
        You replaced the logic section. Keep the rest of your file unchanged.
      </div>
    </>
  );
}
