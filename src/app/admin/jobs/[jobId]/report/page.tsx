"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";

import { MOCK_JOBS, type Job } from "../../../_data/mockJobs";
import { findLocalJob } from "../../../_data/localJobs";
import { loadLocalSnapshots, snapshotsForJob } from "../../../_data/localSnapshots";
import { MOCK_SYSTEMS } from "../../../_data/mockSystems";
import { getIncentivesForSystemType, type IncentiveResource } from "../../../../../lib/incentives/incentiveRules";

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

  // Build “pages” from snapshots (cap to 3 for now to match your UI)
  const pages = useMemo(() => {
    const list = Array.isArray(snaps) ? snaps : [];
    return list.slice(0, 3).map((s, idx) => {
      const existingType = String(s?.existing?.type || "").trim();
      const existingSubtype = String(s?.existing?.subtype || "").trim();

      const catalogId = s?.suggested?.catalogSystemId || null;
      const catalog = catalogId ? (MOCK_SYSTEMS as any[]).find((x) => x.id === catalogId) : null;
      const tags: string[] = (catalog?.tags || []).map((t: any) => normalizeTag(String(t || ""))).filter(Boolean);

      const incentives = getIncentivesForSystemType(existingType, { tags })
        .filter((r: any) => !(r as any).disabled);

      return {
        id: s?.id || `page_${idx}`,
        pageIndex: idx,
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

  // Your HTML’s JS moved into useEffect so it behaves the same in Next.js
  useEffect(() => {
    const pagesEl = document.getElementById("pages");
    const pagerEl = document.getElementById("pager");
    const dots = pagerEl ? Array.from(pagerEl.querySelectorAll<HTMLButtonElement>(".dot")) : [];
    const pageLabel = document.getElementById("pageLabel");

    function setActiveDot(i: number) {
      dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
      if (pageLabel) pageLabel.textContent = `Snapshot ${i + 1} of ${dots.length || 0}`;
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

    // ---- Slider logic (your exact script behavior) ----
    const LEAF_PRICE_MIN = 5000;
    const LEAF_PRICE_MAX = 7000;
    const BASE_SAVINGS_MIN = 19;
    const BASE_SAVINGS_MAX = 35;

    const INCENTIVES_LOW = 750;
    const INCENTIVES_HIGH = 3000;

    const COST_UNREALISTIC_BELOW = LEAF_PRICE_MIN - 500;
    const COST_OVERPRICED_ABOVE = LEAF_PRICE_MAX + 3000;

    const formatMoney = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

    function dynamicSavingsRange(price: number) {
      const over = Math.max(0, price - LEAF_PRICE_MAX);
      const steps = Math.floor(over / 1000);
      const bump = steps * 2;
      return { min: BASE_SAVINGS_MIN + bump, max: BASE_SAVINGS_MAX + bump };
    }

    function classifyCost(price: number) {
      if (price < COST_UNREALISTIC_BELOW) return "unreal_low";
      if (price < LEAF_PRICE_MIN) return "low";
      if (price > COST_OVERPRICED_ABOVE) return "over";
      if (price > LEAF_PRICE_MAX) return "likely_over";
      return "in";
    }

    function setBadge(el: HTMLElement, tone: "good" | "warn" | "bad" | "neutral", text: string) {
      const tones: Record<string, string> = {
        good: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
        warn: "bg-yellow-500/15 text-yellow-200 border border-yellow-500/30",
        bad: "bg-red-500/15 text-red-200 border border-red-500/25",
        neutral: "bg-neutral-800/60 text-neutral-200 border border-neutral-700",
      };
      const isSquare = el.classList.contains("rounded-md");
      el.className = `text-[11px] px-3 py-1 ${isSquare ? "rounded-md" : "rounded-full"} ${tones[tone] || tones.neutral}`;
      el.textContent = text;
    }

    function setBand(okEl: HTMLElement, sliderMin: number, sliderMax: number, okMin: number, okMax: number) {
      const span = sliderMax - sliderMin;
      const L = ((okMin - sliderMin) / span) * 100;
      const R = ((okMax - sliderMin) / span) * 100;
      (okEl as any).style.left = `${clamp(L, 0, 100)}%`;
      (okEl as any).style.width = `${Math.max(0, clamp(R, 0, 100) - clamp(L, 0, 100))}%`;
    }

    function setFill(fillEl: HTMLElement, sliderMin: number, sliderMax: number, value: number) {
      const span = sliderMax - sliderMin;
      const pct = ((value - sliderMin) / span) * 100;
      (fillEl as any).style.width = `${clamp(pct, 0, 100)}%`;
    }

    function setMarker(markerEl: HTMLElement, sliderMin: number, sliderMax: number, value: number) {
      const span = sliderMax - sliderMin;
      const pct = ((value - sliderMin) / span) * 100;
      (markerEl as any).style.left = `${clamp(pct, 0, 100)}%`;
    }

    function computeNetCostRange(installCost: number) {
      const netLow = Math.max(0, installCost - INCENTIVES_HIGH);
      const netHigh = Math.max(0, installCost - INCENTIVES_LOW);
      return { netLow, netHigh };
    }

    function formatMoneyRange(a: number, b: number) {
      return `${formatMoney(a)}–${formatMoney(b)}`;
    }

    function quickReadMessage(costClass: string) {
      const premiumWhy = [
        "More expensive systems can provide slightly higher savings (better efficiency/controls/commissioning) — usually incremental.",
        "ROI can drop when cost climbs faster than savings. A premium quote should come with clear, measurable value.",
      ];

      if (costClass === "unreal_low") {
        return {
          tone: "warn",
          headline: "This price is extremely low — verify scope before scheduling.",
          why: ["Very low pricing often means partial scope or missing line items.", "Confirming scope protects you from surprise add-ons later."],
          qVisible: [
            "Is this a full replacement quote (equipment, labor, permits, startup/commissioning)?",
            "What’s excluded that could be added later (venting, thermostat, disposal, permits)?",
          ],
          qMore: ["Can you itemize model numbers + warranty terms in writing?", "Is there any scenario where price changes after work begins?"],
        };
      }

      if (costClass === "low") {
        return {
          tone: "good",
          headline: "Competitive quote — great sign if scope is complete.",
          why: ["Competitive bids happen and can be a win for the homeowner.", "A quick scope check ensures it’s apples-to-apples."],
          qVisible: ["Can you walk me through exactly what’s included in this price?", "Are permits/inspections and commissioning included?"],
          qMore: ["Is the thermostat included? What about haul-away/disposal?", "Can you confirm final scope and model numbers in writing?"],
        };
      }

      if (costClass === "in") {
        return {
          tone: "good",
          headline: "This looks like a fair, in-range quote.",
          why: ["Pricing aligns with what LEAF typically sees for this replacement category.", "In-range quotes usually indicate predictable scope and fewer surprises."],
          qVisible: ["What’s the install timeline and what prep do you need from me?", "What warranty coverage comes with the equipment and labor?"],
          qMore: ["Do you handle permits and inspection sign-off?", "What maintenance keeps performance strong long-term?"],
        };
      }

      if (costClass === "likely_over") {
        return {
          tone: "warn",
          headline: "Higher than LEAF range — confirm what’s driving the price.",
          why: [
            "Higher quotes can be justified by site conditions (access, venting, ductwork, electrical).",
            "It can also reflect premium add-ons you may not need.",
            ...premiumWhy,
          ],
          qVisible: ["What specifically is driving the price above typical range?", "Is there a simpler option that still meets the goals?"],
          qMore: ["Can you provide an itemized quote so I can compare bids accurately?", "Which add-ons are optional vs required?"],
        };
      }

      return {
        tone: "warn",
        headline: "Major caution — this looks overpriced for the category.",
        why: ["This is significantly above typical replacement pricing.", "Before committing, compare at least one more itemized bid.", ...premiumWhy],
        qVisible: ["Can you itemize the quote (equipment, labor, permits, extras) line-by-line?", "What would the ‘standard replacement’ option cost and what changes?"],
        qMore: [
          "Are there scope items here that belong in a separate project (duct redesign, electrical upgrades)?",
          "Can you confirm model numbers and efficiency details to justify pricing?",
        ],
      };
    }

    function renderList(el: HTMLElement | null, items: string[]) {
      if (!el) return;
      el.innerHTML = (items || []).map((t) => `<li>${t}</li>`).join("");
    }

    function initLeafPage(root: Element) {
      const $ = (sel: string) => root.querySelector(sel) as HTMLElement | null;
      const priceSlider = root.querySelector<HTMLInputElement>('[data-el="priceSlider"]');
      if (!priceSlider) return;

      const priceValue = $('[data-el="priceValue"]');
      const staticPriceValue = $('[data-el="staticPriceValue"]');
      const costBadge = $('[data-el="costBadge"]');
      const overallBadge = $('[data-el="overallBadge"]');
      const overallHeadline = $('[data-el="overallHeadline"]');

      const quickReadWhy = $('[data-el="quickReadWhy"]');
      const qVisible = $('[data-el="quickReadQuestionsVisible"]');
      const qMore = $('[data-el="quickReadQuestionsMore"]');

      const decisionBadge = $('[data-el="decisionBadge"]');
      const priceBandOK = $('[data-el="priceBandOK"]');
      const priceBandFill = $('[data-el="priceBandFill"]');
      const priceBandMinLabel = $('[data-el="priceBandMinLabel"]');
      const priceBandMaxLabel = $('[data-el="priceBandMaxLabel"]');

      const dynSavings = $('[data-el="dynamicSavingsRange"]');
      const summarySavings = $('[data-el="summarySavingsRange"]');
      const heroSavingsPill = $('[data-el="heroSavingsPill"]');
      const msSavingsRange = $('[data-el="msSavingsRange"]');

      const msInstallCost = $('[data-el="msInstallCost"]');
      const msNetCostRange = $('[data-el="msNetCostRange"]');
      const msValueCheck = $('[data-el="msValueCheck"]');
      const msMeaning = $('[data-el="msMeaning"]');
      const msSummaryHeadline = $('[data-el="msSummaryHeadline"]');
      const msSummaryText = $('[data-el="msSummaryText"]');

      const resetBtn = $('[data-el="resetBtn"]');
      const priceBandTrack = $('[data-el="priceBandTrack"]');

      const staticCostFill = $('[data-el="staticCostFill"]');
      const staticCostOK = $('[data-el="staticCostOK"]');
      const staticCostMarker = $('[data-el="staticCostMarker"]');
      const staticCostMinLabel = $('[data-el="staticCostMinLabel"]');
      const staticCostMaxLabel = $('[data-el="staticCostMaxLabel"]');

      function updateUI() {
        const price = Number(priceSlider.value);

        if (priceValue) priceValue.textContent = formatMoney(price);
        if (staticPriceValue) staticPriceValue.textContent = formatMoney(price);
        if (msInstallCost) msInstallCost.textContent = formatMoney(price);

        const dyn = dynamicSavingsRange(price);
        const savText = `$${dyn.min}–$${dyn.max}/mo`;

        if (dynSavings) dynSavings.textContent = savText;
        if (summarySavings) summarySavings.textContent = `$${dyn.min}–$${dyn.max}`;
        if (heroSavingsPill) heroSavingsPill.textContent = `Save ~$${dyn.min}–$${dyn.max}/mo`;
        if (msSavingsRange) msSavingsRange.textContent = savText;

        if (priceBandMinLabel) priceBandMinLabel.textContent = formatMoney(LEAF_PRICE_MIN);
        if (priceBandMaxLabel) priceBandMaxLabel.textContent = formatMoney(LEAF_PRICE_MAX);

        if (priceBandOK) setBand(priceBandOK, Number(priceSlider.min), Number(priceSlider.max), LEAF_PRICE_MIN, LEAF_PRICE_MAX);
        if (priceBandFill) setFill(priceBandFill, Number(priceSlider.min), Number(priceSlider.max), price);

        if (staticCostMinLabel) staticCostMinLabel.textContent = formatMoney(LEAF_PRICE_MIN);
        if (staticCostMaxLabel) staticCostMaxLabel.textContent = formatMoney(LEAF_PRICE_MAX);
        if (staticCostOK) setBand(staticCostOK, Number(priceSlider.min), Number(priceSlider.max), LEAF_PRICE_MIN, LEAF_PRICE_MAX);
        if (staticCostFill) setFill(staticCostFill, Number(priceSlider.min), Number(priceSlider.max), price);
        if (staticCostMarker) setMarker(staticCostMarker, Number(priceSlider.min), Number(priceSlider.max), price);

        const costClass = classifyCost(price);
        if (costBadge) {
          if (costClass === "unreal_low") setBadge(costBadge, "bad", "Unrealistic");
          else if (costClass === "low") setBadge(costBadge, "warn", "Low (verify scope)");
          else if (costClass === "over") setBadge(costBadge, "bad", "Overpriced");
          else if (costClass === "likely_over") setBadge(costBadge, "warn", "Likely overpriced");
          else setBadge(costBadge, "good", "Within range");
        }

        const msg = quickReadMessage(costClass);

        if (overallBadge) {
          if (costClass === "over") setBadge(overallBadge, "bad", "Major caution 🚩");
          else if ((msg as any).tone === "good") setBadge(overallBadge, "good", "Looks good ✅");
          else setBadge(overallBadge, "warn", "Proceed smart ⚠️");
        }
        if (overallHeadline) overallHeadline.textContent = (msg as any).headline;

        renderList(quickReadWhy, (msg as any).why);
        renderList(qVisible, (msg as any).qVisible);
        renderList(qMore, (msg as any).qMore);

        const net = computeNetCostRange(price);
        const netMin = Math.min(net.netLow, net.netHigh);
        const netMax = Math.max(net.netLow, net.netHigh);
        if (msNetCostRange) msNetCostRange.textContent = formatMoneyRange(netMin, netMax);

        if (msValueCheck && msMeaning) {
          if (costClass === "in") {
            msValueCheck.textContent = "Within range ✅";
            msMeaning.textContent = "Quotes in-range usually indicate predictable scope + fair pricing.";
          } else if (costClass === "low") {
            msValueCheck.textContent = "Below range ⚠️";
            msMeaning.textContent = "Could be a great deal — just confirm it’s a full scope replacement quote.";
          } else if (costClass === "unreal_low") {
            msValueCheck.textContent = "Very low 🚩";
            msMeaning.textContent = "High chance something is missing. Get scope in writing before scheduling.";
          } else if (costClass === "likely_over") {
            msValueCheck.textContent = "Above range ⚠️";
            msMeaning.textContent = "Premium cost can bump savings slightly, but ROI may drop. Ask what justifies the cost.";
          } else {
            msValueCheck.textContent = "Far above range 🚩";
            msMeaning.textContent = "This is likely overpriced. Compare another itemized bid before committing.";
          }
        }

        if (decisionBadge && msSummaryHeadline && msSummaryText) {
          if (costClass === "over") {
            setBadge(decisionBadge, "bad", "Unclear 🚩");
            msSummaryHeadline.textContent = "This needs a closer look.";
            msSummaryText.textContent =
              "The quote is well above typical range. Request an itemized scope and compare at least one more bid.";
          } else if (costClass === "in") {
            setBadge(decisionBadge, "good", "Likely yes ✅");
            msSummaryHeadline.textContent = "This looks financially reasonable.";
            msSummaryText.textContent =
              "If the contractor quote lands within the LEAF range, this is typically a strong replacement decision.";
          } else {
            setBadge(decisionBadge, "warn", "Likely yes (with clarity) ⚠️");
            msSummaryHeadline.textContent = "This can still make sense — confirm a few details.";
            msSummaryText.textContent =
              "Use the questions above to confirm scope and what’s driving price. Premium cost can bump savings slightly, but ROI often drops if price rises too fast.";
          }
        }
      }

      function resetToLeafMid() {
        const mid = Math.round((LEAF_PRICE_MIN + LEAF_PRICE_MAX) / 2);
        priceSlider.value = String(mid);
        updateUI();
      }

      const onInput = () => updateUI();
      const onReset = () => resetToLeafMid();

      priceSlider.addEventListener("input", onInput);
      resetBtn?.addEventListener("click", onReset);

      updateUI();

      // cleanup for this page root
      return () => {
        priceSlider.removeEventListener("input", onInput);
        resetBtn?.removeEventListener("click", onReset);
      };
    }

    const cleanups: Array<() => void> = [];
    document.querySelectorAll(".leaf-page").forEach((el) => {
      const c = initLeafPage(el);
      if (typeof c === "function") cleanups.push(c);
    });

    // Ensure pager label correct on load
    setActiveDot(0);

    return () => {
      pagerEl?.removeEventListener("click", onPagerClick);
      pagesEl?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cleanups.forEach((fn) => fn());
    };
  }, [pages.length]);

  if (!jobId) {
    return <div className="p-6">Missing jobId</div>;
  }

  if (!job) {
    return <div className="p-6">Job not found</div>;
  }

  if (!pages.length) {
    return <div className="p-6">No snapshots yet</div>;
  }

  return (
    <>
      {/* Your original CSS (moved into Next) */}
      <style jsx global>{`
        :root { --leaf:#43a419; }
        body{ -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .glass{ background: rgba(24,24,27,.78); backdrop-filter: blur(12px); }
        .soft-shadow{ box-shadow: 0 18px 45px rgba(0,0,0,.42); }
        .pop{ transition: transform .18s ease; }
        .pop:hover{ transform: translateY(-1px) scale(1.01); }
        summary::-webkit-details-marker{ display:none; }

        input[type="range"]{ -webkit-appearance:none; appearance:none; width:100%; height:32px; background:transparent; outline:none; position:relative; z-index:3; }
        input[type="range"]::-webkit-slider-runnable-track{ height:12px; background:transparent; border-radius:999px; }
        input[type="range"]::-moz-range-track{ height:12px; background:transparent; border-radius:999px; }
        input[type="range"]::-webkit-slider-thumb{
          -webkit-appearance:none; appearance:none; width:30px; height:30px; border-radius:999px;
          background: var(--leaf); border:2px solid rgba(0,0,0,.55);
          box-shadow: 0 12px 22px rgba(0,0,0,.45), 0 0 0 6px rgba(67,164,25,.12);
          cursor:pointer; margin-top:1px; transform: translateZ(0);
        }
        input[type="range"]::-moz-range-thumb{
          width:30px; height:30px; border-radius:999px; background: var(--leaf);
          border:2px solid rgba(0,0,0,.55);
          box-shadow: 0 12px 22px rgba(0,0,0,.45), 0 0 0 6px rgba(67,164,25,.12);
          cursor:pointer; transform: translateZ(0);
        }

        .slider-wrap{ position:relative; padding-top:6px; padding-bottom:6px; }

        .range-band{
          position:absolute; left:0; right:0; top:50%; transform: translateY(-50%);
          height:14px; border-radius:999px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.10);
          overflow:hidden; z-index:1;
        }
        .range-band .fill{
          position:absolute; top:0; bottom:0; left:0; width:0%;
          border-radius:999px; background: rgba(67,164,25,.18);
          z-index:0; transition: width .06s linear;
        }
        .range-band .ok{
          position:absolute; top:0; bottom:0; left:0%; width:0%;
          border-radius:999px;
          background: linear-gradient(90deg, rgba(67,164,25,.18), rgba(67,164,25,.55), rgba(67,164,25,.18));
          border: 1px solid rgba(67,164,25,.55);
          box-shadow: 0 0 0 1px rgba(0,0,0,.25) inset, 0 0 16px rgba(67,164,25,.22);
          z-index:2; pointer-events:none;
        }

        .range-band .marker{
          position:absolute; top:-6px; width:0; height:26px;
          border-left: 2px solid rgba(255,255,255,.75);
          filter: drop-shadow(0 4px 10px rgba(0,0,0,.55));
          z-index:3; pointer-events:none;
        }
        .range-band .marker::after{
          content:""; position:absolute; left:-6px; top:-2px; width:12px; height:12px; border-radius:999px;
          background: var(--leaf); border:2px solid rgba(0,0,0,.55);
          box-shadow: 0 10px 18px rgba(0,0,0,.40), 0 0 0 6px rgba(67,164,25,.10);
        }

        .band-label{ font-size:10px; color: rgba(255,255,255,.45); display:flex; justify-content:space-between; margin-top:6px; }

        .snap-scroll{ scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
        .snap-scroll::-webkit-scrollbar{ display:none; }
        .snap-page{ scroll-snap-align:center; width:100%; flex: 0 0 100%; }

        .dot{ width:8px; height:8px; border-radius:999px; background: rgba(255,255,255,.22); border:1px solid rgba(255,255,255,.18);
          transition: transform .15s ease, background .15s ease; }
        .dot.active{ background: rgba(67,164,25,.95); border-color: rgba(67,164,25,.75); transform: scale(1.12); }
      `}</style>

      <div className="bg-black text-white min-h-screen">
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-black/70 border-b border-neutral-800 backdrop-blur">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">LEAF System Snapshot</div>
              <div className="text-[11px] text-neutral-400">
                <span id="pageLabel">Snapshot 1 of {pages.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-2" id="pager">
              {pages.map((p, i) => (
                <button
                  key={p.id}
                  className={`dot ${i === 0 ? "active" : ""}`}
                  aria-label={`Go to snapshot ${i + 1}`}
                  data-page={i}
                />
              ))}
            </div>
          </div>
        </header>

        {/* SWIPE CONTAINER */}
        <div id="pages" className="snap-scroll overflow-x-auto flex">
          {pages.map((p) => (
            <div className="snap-page" key={p.id}>
              <main className="leaf-page max-w-md mx-auto px-4 pt-5 pb-28 space-y-4">
                {/* HERO */}
                <section className="glass rounded-3xl p-4 border border-neutral-800 soft-shadow pop">
                  <div className="text-lg font-extrabold tracking-tight mb-1" data-el="heroSystemTitle">
                    {p.existingType ? `🔥 ${p.existingType} • ${p.existingSubtype || ""}` : "🔥 System"}
                  </div>
                  <div className="text-sm font-semibold text-neutral-200" data-el="heroSystemSubtitle">
                    {p.existingSubtype ? `Upgrade for: ${p.existingSubtype}` : "Direct-replacement upgrade"}
                  </div>

                  <div className="text-xs text-neutral-300 mt-1">
                    LEAF provides ranges so you can evaluate contractor quotes with confidence.
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span
                      data-el="heroSavingsPill"
                      className="px-3 py-1 rounded-full bg-[var(--leaf)] text-black text-xs font-semibold"
                    >
                      Save ~$19–$35/mo
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 text-xs border border-emerald-500/30">
                      ~30–45% less CO₂
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-400 mt-2">
                    Note: higher-priced systems can increase savings slightly — but ROI can drop if the added cost doesn’t pay back over time.
                  </div>
                </section>

                {/* CURRENT */}
                <section className="glass rounded-3xl p-4 border border-red-500/30 soft-shadow pop">
                  <div className="flex justify-between mb-3">
                    <div className="text-sm font-semibold">📷 Current system</div>
                    <span className="text-[11px] px-3 py-1 rounded-full bg-red-500/15 text-red-200 border border-red-500/25">
                      Near end of life
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900" />
                    <div className="flex-1 text-xs space-y-1">
                      <div className="font-semibold">
                        {p.existingSubtype ? `Existing ${p.existingSubtype}` : "Existing system"}
                      </div>
                      <div>Age: <b>{p.ageYears ?? "—"} yrs</b></div>
                      <div>Wear: <b>{p.wear ?? "—"}/5</b></div>
                    </div>
                  </div>
                </section>

                {/* RECOMMENDED */}
                <section className="glass rounded-3xl p-4 border border-[var(--leaf)]/35 soft-shadow pop">
                  <div className="flex justify-between mb-3">
                    <div className="text-sm font-semibold">✨ Recommended upgrade</div>
                    <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
                      High efficiency
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900" />
                    <div className="flex-1 text-xs space-y-1">
                      <div className="font-semibold" data-el="recommendedName">{p.suggestedName}</div>
                      <div>Estimated cost: <b>{money(p.estCost)}</b></div>
                      <div>Est. savings / yr: <b>{money(p.estAnnualSavings)}</b></div>
                      <div>Payback: <b>{p.estPaybackYears ?? "—"} yrs</b></div>
                    </div>
                  </div>
                </section>

                {/* SLIDER SECTION (unchanged behavior) */}
                <section className="glass rounded-3xl p-4 border border-neutral-800 soft-shadow pop">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">🎚️ Test your quote</div>
                      <div className="text-[11px] text-neutral-400 mt-1">
                        Slide the price. Savings bumps slightly with higher system cost — but ROI can drop if price rises faster than savings.
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button data-el="resetBtn" className="text-[11px] px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 pop">
                        Reset
                      </button>
                      <span data-el="overallBadge" className="text-[11px] px-3 py-1 rounded-md bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
                        Looks good ✅
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-neutral-400">Contractor price</div>
                      <div className="flex items-center gap-2">
                        <span data-el="costBadge" className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
                          Within range
                        </span>
                        <div className="text-sm font-bold" data-el="priceValue">$6,000</div>
                      </div>
                    </div>

                    <div className="mt-3 slider-wrap">
                      <div className="range-band" aria-hidden="true" data-el="priceBandTrack">
                        <div data-el="priceBandFill" className="fill"></div>
                        <div data-el="priceBandOK" className="ok"></div>
                      </div>
                      <input data-el="priceSlider" type="range" min="3000" max="15000" step="100" defaultValue="6000" />
                      <div className="band-label">
                        <span data-el="priceBandMinLabel">$5,000</span>
                        <span data-el="priceBandMaxLabel">$7,000</span>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-neutral-400">
                      LEAF price range: <b>$5,000–$7,000</b>
                    </div>
                    <div className="mt-2 text-[11px] text-neutral-400">
                      Estimated savings at this price: <b data-el="dynamicSavingsRange">$19–$35/mo</b>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-black/30 border border-neutral-800 p-3">
                    <div className="text-xs text-neutral-400">Quick read</div>
                    <div className="text-sm font-semibold mt-1" data-el="overallHeadline">This looks like a solid deal.</div>

                    <div className="mt-2 text-[11px] text-neutral-300">
                      <div className="font-semibold text-neutral-200">Good questions to ask the contractor</div>
                      <ul data-el="quickReadQuestionsVisible" className="list-disc list-inside mt-1 space-y-1"></ul>
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] text-emerald-300">
                        Why this message + more questions
                      </summary>

                      <div className="mt-2 text-[11px] text-neutral-300 space-y-3">
                        <div>
                          <div className="font-semibold text-neutral-200">Why LEAF is saying this</div>
                          <ul data-el="quickReadWhy" className="list-disc list-inside mt-1 space-y-1"></ul>
                        </div>

                        <div>
                          <div className="font-semibold text-neutral-200">More questions (optional)</div>
                          <ul data-el="quickReadQuestionsMore" className="list-disc list-inside mt-1 space-y-1"></ul>
                        </div>
                      </div>
                    </details>
                  </div>
                </section>

                {/* INCENTIVES (NOW REAL + DYNAMIC) */}
                <details className="glass rounded-3xl p-4 border border-neutral-800 soft-shadow pop">
                  <summary className="cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-semibold">🏷️ Incentives & rebates</div>
                      <span className="text-[11px] text-neutral-400">Tap for details</span>
                    </div>
                    <div className="mt-2 text-xs font-bold">
                      {p.incentives.length ? `${p.incentives.length} incentive${p.incentives.length === 1 ? "" : "s"} matched` : "No incentives matched"}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-1">Federal • State • Utility</div>
                  </summary>

                  <div className="mt-4 space-y-3 text-xs">
                    {p.incentives.length === 0 ? (
                      <div className="text-[11px] text-neutral-400">
                        No incentives matched this upgrade. Check Incentives tags + this system type.
                      </div>
                    ) : (
                      p.incentives.map((r) => {
                        const amt = incentiveAmountText(r);
                        return (
                          <div key={r.id} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
                            <div className="font-semibold">
                              {r.programName}
                              {amt ? <span className="text-neutral-300 font-normal"> — {amt}</span> : null}
                            </div>
                            {(r as any).shortBlurb ? (
                              <div className="text-[11px] text-neutral-400 mt-1">{(r as any).shortBlurb}</div>
                            ) : null}
                          </div>
                        );
                      })
                    )}

                    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
                      <div className="font-semibold">🔗 Helpful links</div>
                      <div className="mt-2 flex flex-col gap-2">
                        <a href="https://www.irs.gov/pub/irs-pdf/f5695.pdf" target="_blank" className="text-emerald-300 underline text-[11px]">
                          IRS Form 5695 (PDF)
                        </a>
                        <a href="https://www.energystar.gov/rebate-finder" target="_blank" className="text-emerald-300 underline text-[11px]">
                          ENERGY STAR Rebate Finder
                        </a>
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-400">
                      LEAF identifies likely incentives based on system type and location. Contractors confirm eligibility,
                      pricing, and paperwork requirements.
                    </div>
                  </div>
                </details>

                {/* DOES THIS MAKE SENSE */}
                <section className="glass rounded-3xl p-4 border border-neutral-800 soft-shadow pop">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">🧠 Does this decision make sense?</div>
                    <span data-el="decisionBadge" className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
                      Likely yes ✅
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
                      <div className="text-neutral-400">Install cost (slider)</div>
                      <div className="text-base font-bold" data-el="msInstallCost">$6,000</div>
                    </div>

                    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
                      <div className="text-neutral-400">Estimated savings (at this price)</div>
                      <div className="text-base font-bold" data-el="msSavingsRange">$19–$35/mo</div>
                      <div className="text-[11px] text-neutral-400 mt-1">Higher cost can bump savings slightly, but ROI may drop.</div>
                    </div>

                    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 col-span-2">
                      <div className="text-neutral-400">Estimated net cost (after incentives)</div>
                      <div className="text-base font-bold" data-el="msNetCostRange">$3,500–$4,500</div>
                      <div className="text-[11px] text-neutral-400 mt-1">
                        Based on incentive estimates shown above (contractor confirms final eligibility).
                      </div>
                    </div>

                    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
                      <div className="text-neutral-400">Quote value check</div>
                      <div className="text-base font-bold" data-el="msValueCheck">Within range ✅</div>
                    </div>
                    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
                      <div className="text-neutral-400">What this means</div>
                      <div className="text-[11px] text-neutral-300 mt-1" data-el="msMeaning">
                        Quotes in-range usually indicate predictable scope + fair pricing.
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-black/30 border border-neutral-800 p-3">
                    <div className="text-xs text-neutral-400">Decision summary</div>
                    <div className="text-sm font-semibold mt-1" data-el="msSummaryHeadline">This looks financially reasonable.</div>
                    <div className="text-[11px] text-neutral-300 mt-1" data-el="msSummaryText">
                      If the contractor quote lands within the LEAF range, this is typically a strong replacement decision.
                    </div>
                  </div>
                </section>
              </main>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="fixed bottom-0 inset-x-0 bg-black/80 border-t border-neutral-800 backdrop-blur">
          <div className="max-w-md mx-auto px-4 py-3">
            <button className="w-full bg-[var(--leaf)] text-black font-semibold py-3 rounded-full text-sm pop">
              🔎 Get an exact bid from a contractor
            </button>
            <div className="text-[11px] text-neutral-400 text-center mt-1">
              Compare the quote against your LEAF range
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
