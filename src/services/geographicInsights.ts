// ============================================================
// Geographic Highlights generator — factual only.
//
// Every highlight below is derived from the SAME calculation
// primitives used everywhere else on the page. No inference,
// no recommendations, no risk classifications. If a statement
// cannot be traced to a workbook cell, it is not emitted.
//
// The previous "Problem / Impact / Action" recommendation
// generator and the Geographic Risk Index were removed on
// 2026-07-04 per the locked reporting philosophy (facts only).
// ============================================================

import { AlertTriangle, PieChart, TrendingUp, Info } from "lucide-react";
import type { Opportunity, Currency } from "../types/domain";
import type { Insight } from "../components/ExecutiveHighlights";
import {
  MIN_SAMPLE_FOR_WINRATE_RANKING,
  awardedProjects,
  conversionRate,
  countriesWithZeroAwards,
  countryStatsExtended,
  formatAmountsBreakdown,
  formatCompact,
  statsByCountry,
  totalOpportunities,
} from "./calculations";

// ============================================================
// Executive KPI helpers — geographic-page-specific summaries
// that don't fit the general calculation module.
// ============================================================

/** Geographic concentration = share of pipeline held by the single
 * largest country. A currency-agnostic, non-blended metric. */
export function geographicConcentration(opps: Opportunity[]): { country: string | null; share: number } {
  const total = totalOpportunities(opps);
  if (total === 0) return { country: null, share: 0 };
  const stats = statsByCountry(opps);
  const top = stats[0];
  return { country: top?.country ?? null, share: top ? top.totalOpportunities / total : 0 };
}

/** Total awarded value across the geographic footprint, either in the
 * selected currency (single figure) or as a per-currency breakdown when
 * currency is null ("All"). Never blends. */
export function totalAwardedValueGeographic(
  opps: Opportunity[],
  currency: Currency | null,
): { display: string; hasValue: boolean } {
  const ext = countryStatsExtended(opps, currency);
  if (currency) {
    const sum = ext.reduce((acc, r) => acc + r.awardedValue, 0);
    if (sum === 0) return { display: "-", hasValue: false };
    return { display: `${currency} ${formatCompact(sum)}`, hasValue: true };
  }
  // All currencies — combine per-currency amounts without blending
  const totals: Partial<Record<Currency, number>> = {};
  for (const row of ext) {
    for (const [cur, val] of Object.entries(row.amounts)) {
      const c = cur as Currency;
      totals[c] = (totals[c] ?? 0) + (val ?? 0);
    }
  }
  const hasAny = Object.values(totals).some((v) => (v ?? 0) > 0);
  return { display: formatAmountsBreakdown(totals), hasValue: hasAny };
}

/** Number of countries with active pipeline but no awards yet. Drives
 * the "Countries Without Awards" KPI on the strip. */
export function countriesWithoutAwardsCount(opps: Opportunity[]): number {
  return countriesWithZeroAwards(opps).length;
}

/** Best performing country on a real sample (min opportunities). Falls
 * back to the raw best when no country meets the sample threshold — the
 * caller can show the sample size as context. */
export function bestPerformingCountryQualified(
  opps: Opportunity[],
  minSample = MIN_SAMPLE_FOR_WINRATE_RANKING,
): { country: string; winRate: number; totalOpportunities: number; awardedProjects: number; qualifiedSample: boolean } | null {
  const stats = statsByCountry(opps).filter((s) => s.awardedProjects > 0);
  if (stats.length === 0) return null;
  const qualified = stats.filter((s) => s.totalOpportunities >= minSample);
  const pool = qualified.length > 0 ? qualified : stats;
  const best = [...pool].sort((a, b) => b.winRate - a.winRate || b.totalOpportunities - a.totalOpportunities)[0];
  return {
    country: best.country,
    winRate: best.winRate,
    totalOpportunities: best.totalOpportunities,
    awardedProjects: best.awardedProjects,
    qualifiedSample: qualified.length > 0,
  };
}

// Re-export for callers that only need one of the underlying primitives
// alongside the geographic-specific helpers above.
export { awardedProjects };

// ============================================================
// Executive Highlights — factual observations only. Icon + one
// bold headline + one short factual explanation. Every string is
// derived from live metrics; no interpretation, no risk language,
// no "likely" / "should" / "may" / "appears".
// ============================================================

export function generateGeographicHighlights(opps: Opportunity[]): Insight[] {
  const out: Insight[] = [];
  const total = totalOpportunities(opps);
  if (total === 0) {
    return [
      {
        icon: Info,
        tone: "gray",
        title: "No data in current filter.",
        description: "Adjust the filters to see geographic highlights.",
      },
    ];
  }

  const stats = statsByCountry(opps);
  const top = stats[0];

  // 1) Concentration (raw fact)
  if (top) {
    const share = top.totalOpportunities / total;
    out.push({
      icon: PieChart,
      tone: "rose",
      title: `${top.country} holds ${(share * 100).toFixed(0)}% of all opportunities.`,
      description: `${top.totalOpportunities} of ${total} opportunities are in ${top.country}.`,
    });
  }

  // 2) Countries without awards (raw fact)
  const zeroAward = countriesWithZeroAwards(opps);
  if (zeroAward.length > 0) {
    const c = zeroAward[0];
    out.push({
      icon: AlertTriangle,
      tone: "gold",
      title: `${c.country} has ${c.totalOpportunities} opportunit${c.totalOpportunities === 1 ? "y" : "ies"} and 0 awarded projects.`,
      description: `${zeroAward.length} countr${zeroAward.length === 1 ? "y is" : "ies are"} in this state.`,
    });
  }

  // 3) Highest conversion rate (ranking fact, min sample applied)
  const qualified = stats
    .filter((s) => s.totalOpportunities >= MIN_SAMPLE_FOR_WINRATE_RANKING)
    .filter((s) => s.awardedProjects > 0);
  const bestByConversion = [...qualified]
    .map((s) => ({ s, cr: conversionRate(opps.filter((o) => o.country === s.country)) }))
    .sort((a, b) => b.cr - a.cr)[0];
  if (bestByConversion) {
    const { s, cr } = bestByConversion;
    out.push({
      icon: TrendingUp,
      tone: "success",
      title: `${s.country} has the highest conversion rate.`,
      description: `${(cr * 100).toFixed(1)}% (${s.awardedProjects} awarded of ${s.totalOpportunities}).`,
    });
  }

  // 4) Smallest-footprint country (raw count)
  const smallSample = stats.find(
    (s) => s.totalOpportunities > 0 && s.totalOpportunities < MIN_SAMPLE_FOR_WINRATE_RANKING,
  );
  if (smallSample) {
    const noun = smallSample.totalOpportunities === 1 ? "opportunity" : "opportunities";
    out.push({
      icon: Info,
      tone: "navy",
      title: `${smallSample.country} has ${smallSample.totalOpportunities} ${noun}.`,
      description: `${smallSample.awardedProjects} awarded.`,
    });
  }

  return out.slice(0, 4);
}
