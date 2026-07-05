import type { AgreementCategory, AgreementRecord, Currency, DashboardFilters, Opportunity } from "../types/domain";
import { CURRENCY_SORT_ORDER } from "../types/domain";

// ============================================================
// BR-001 — Awarded definition (LOCKED by business owner 2026-07-04):
// A project is Awarded ↔ Flag_Award === 1. The canonical H1 2026
// workbook derives Flag_Award directly from "Amount > 0 in any
// currency", so this and the amount-check are equivalent by
// construction — but the source of truth is the flag column.
// Do not extend this rule without a written business decision.
// ============================================================
export function isAwarded(o: Opportunity): boolean {
  return o.flagAward === 1;
}

// ============================================================
// Filtering — Country/Assignee/Status apply to every widget.
// Currency is a disconnected selector: it only scopes financial
// widgets, it never filters counts (mirrors the Power BI model
// where Currency Selector has no relationship to Fact_Opportunities).
// ============================================================
export function applyCoreFilters(
  opportunities: Opportunity[],
  filters: Pick<DashboardFilters, "country" | "assignee" | "status">,
): Opportunity[] {
  return opportunities.filter(
    (o) =>
      (!filters.country || o.country === filters.country) &&
      (!filters.assignee || o.assignee === filters.assignee) &&
      (!filters.status || o.status === filters.status),
  );
}

// ============================================================
// Core KPIs
// ============================================================
export function totalOpportunities(opps: Opportunity[]): number {
  return opps.length;
}

export function awardedProjects(opps: Opportunity[]): number {
  return opps.filter(isAwarded).length;
}

export function openOpportunities(opps: Opportunity[]): number {
  return totalOpportunities(opps) - awardedProjects(opps);
}

export function winRate(opps: Opportunity[]): number {
  const total = totalOpportunities(opps);
  return total === 0 ? 0 : awardedProjects(opps) / total;
}

export function countriesCovered(opps: Opportunity[]): number {
  return new Set(opps.map((o) => o.country)).size;
}

export function assigneesCovered(opps: Opportunity[]): number {
  return new Set(opps.map((o) => o.assignee)).size;
}

// ============================================================
// Milestone Completion — independent counts, NOT a funnel.
// (Verified non-monotonic on the reference data: Negotiation can
// exceed Contract Summary. Never sort/plot these as a cumulative
// decreasing sequence.)
// ============================================================
export interface MilestoneCounts {
  contractQualifications: number;
  riskAssessment: number;
  contractSummary: number;
  negotiation: number;
  award: number;
}

export function milestoneCounts(opps: Opportunity[]): MilestoneCounts {
  return {
    contractQualifications: opps.filter((o) => o.flagContractQualifications === 1).length,
    riskAssessment: opps.filter((o) => o.flagRiskAssessment === 1).length,
    contractSummary: opps.filter((o) => o.flagContractSummary === 1).length,
    negotiation: opps.filter((o) => o.flagNegotiation === 1).length,
    award: awardedProjects(opps),
  };
}

// ============================================================
// Currency-safe value measures — never sum across currencies.
// ============================================================
export function totalValue(opps: Opportunity[], currency: Currency): number {
  return opps.reduce((sum, o) => sum + (o.amounts[currency] ?? 0), 0);
}

export function awardedValue(opps: Opportunity[], currency: Currency): number {
  return opps.filter(isAwarded).reduce((sum, o) => sum + (o.amounts[currency] ?? 0), 0);
}

export function averageAwardValue(opps: Opportunity[], currency: Currency): number {
  const awarded = opps.filter(isAwarded).filter((o) => (o.amounts[currency] ?? 0) > 0);
  if (awarded.length === 0) return 0;
  return awardedValue(opps, currency) / awarded.length;
}

export function largestAwardValue(opps: Opportunity[], currency: Currency): number {
  const values = opps.filter(isAwarded).map((o) => o.amounts[currency] ?? 0);
  return values.length ? Math.max(...values) : 0;
}

export function awardedValueByCurrency(opps: Opportunity[]): { currency: Currency; value: number }[] {
  return CURRENCY_SORT_ORDER.map((currency) => ({ currency, value: awardedValue(opps, currency) }));
}

/** Awarded value broken down by country, scoped to ONE selected currency
 * (the disconnected Currency selector) — this is a per-country split of a
 * single currency's figures, never a cross-currency sum (BR: never blend
 * currencies). Sorted descending so the largest country leads. */
export function awardedValueByCountry(
  opps: Opportunity[],
  currency: Currency,
): { country: string; value: number }[] {
  const countries = Array.from(new Set(opps.map((o) => o.country)));
  return countries
    .map((country) => ({ country, value: awardedValue(opps.filter((o) => o.country === country), currency) }))
    .sort((a, b) => b.value - a.value);
}

/** Awarded value per currency, kept separate — never summed into one
 * blended figure. Used whenever the Currency selector is "All". */
export function awardedValueAllCurrencies(opps: Opportunity[]): Partial<Record<Currency, number>> {
  const out: Partial<Record<Currency, number>> = {};
  for (const currency of CURRENCY_SORT_ORDER) {
    const v = awardedValue(opps, currency);
    if (v > 0) out[currency] = v;
  }
  return out;
}

/** Country x currency matrix of awarded value, for the grouped/stacked
 * column chart shown when Currency = "All". Each currency stays its own
 * series — this is the multi-currency-safe equivalent of
 * awardedValueByCountry, never a blended total. Sort order comes from
 * total opportunity count per country (a currency-agnostic, non-blended
 * metric), not from summing money across currencies. */
export function awardedValueByCountryAllCurrencies(
  opps: Opportunity[],
): ({ country: string } & Partial<Record<Currency, number>>)[] {
  const order = statsByCountry(opps).map((s) => s.country);
  return order.map((country) => {
    const subset = opps.filter((o) => o.country === country);
    return { country, ...awardedValueAllCurrencies(subset) };
  });
}

/** Compact "EGP 7.60M, USD 500K" style rendering of a per-currency amount
 * map, in the workbook's fixed currency order. Used anywhere a single
 * blended number would be mathematically wrong (Currency = "All"). */
export function formatAmountsBreakdown(amounts: Partial<Record<Currency, number>>): string {
  const parts = CURRENCY_SORT_ORDER.filter((c) => (amounts[c] ?? 0) > 0).map(
    (c) => `${c} ${formatCompact(amounts[c] as number)}`,
  );
  return parts.length > 0 ? parts.join(", ") : "No awarded value recorded";
}

/** Pipeline conversion: Award / Contract Qualifications. Distinct from
 * winRate (Award / Total Opportunities) — this measures how much of the
 * qualified pipeline converts through to Award. */
export function conversionRate(opps: Opportunity[]): number {
  const m = milestoneCounts(opps);
  return m.contractQualifications === 0 ? 0 : m.award / m.contractQualifications;
}

// ============================================================
// Country / Assignee breakdowns
// ============================================================
export interface CountryStats {
  country: string;
  totalOpportunities: number;
  awardedProjects: number;
  winRate: number;
}

export function statsByCountry(opps: Opportunity[]): CountryStats[] {
  const countries = Array.from(new Set(opps.map((o) => o.country)));
  return countries
    .map((country) => {
      const subset = opps.filter((o) => o.country === country);
      return {
        country,
        totalOpportunities: totalOpportunities(subset),
        awardedProjects: awardedProjects(subset),
        winRate: winRate(subset),
      };
    })
    .sort((a, b) => b.totalOpportunities - a.totalOpportunities);
}

export interface AssigneeStats {
  assignee: string;
  totalOpportunities: number;
  awardedProjects: number;
  winRate: number;
  /** 0 when currency is null ("All") — use `amounts` instead in that case. */
  awardedValue: number;
  /** Always populated, per-currency, never blended. The only correct field
   * to read when the Currency selector is "All". */
  amounts: Partial<Record<Currency, number>>;
}

/** currency: null means "All" — awardedValue is meaningless (0) in that
 * case; read `amounts` for the per-currency breakdown instead. Default sort
 * is by awarded project count (currency-agnostic); callers needing a
 * value-ranked view (e.g. Top Assignees by Awarded Value) re-sort by
 * `awardedValue` themselves once a concrete currency is active. */
export function statsByAssignee(opps: Opportunity[], currency: Currency | null): AssigneeStats[] {
  const assignees = Array.from(new Set(opps.map((o) => o.assignee)));
  return assignees
    .map((assignee) => {
      const subset = opps.filter((o) => o.assignee === assignee);
      return {
        assignee,
        totalOpportunities: totalOpportunities(subset),
        awardedProjects: awardedProjects(subset),
        winRate: winRate(subset),
        awardedValue: currency ? awardedValue(subset, currency) : 0,
        amounts: awardedValueAllCurrencies(subset),
      };
    })
    .sort((a, b) => b.awardedProjects - a.awardedProjects);
}

// ============================================================
// Agreements — standalone, never filtered by Country/Assignee/Status
// ============================================================
export function totalAgreements(agreements: AgreementRecord[]): number {
  return agreements.length;
}

export function agreementsByCategory(agreements: AgreementRecord[]): Record<AgreementCategory, number> {
  const base: Record<AgreementCategory, number> = {
    JV: 0,
    Consortium: 0,
    Cooperation: 0,
    Subcontract: 0,
    NDA: 0,
    MOU: 0,
    Other: 0,
  };
  for (const a of agreements) base[a.agreementCategory]++;
  return base;
}

// ============================================================
// Executive Insights — dynamic, filter-aware, no fabricated trends
// (no date dimension exists anywhere in the source data — never
// synthesize a "vs previous period" comparison).
// ============================================================
export function insightTopCountry(opps: Opportunity[]): string {
  const stats = statsByCountry(opps);
  if (stats.length === 0) return "No data in current filter.";
  const top = stats[0];
  const pct = totalOpportunities(opps) === 0 ? 0 : top.totalOpportunities / totalOpportunities(opps);
  return `${top.country} leads with ${top.totalOpportunities} of ${totalOpportunities(opps)} opportunities (${(pct * 100).toFixed(1)}%).`;
}

export function insightTopAssignee(opps: Opportunity[]): string {
  const stats = statsByAssignee(opps, null);
  if (stats.length === 0) return "No data in current filter.";
  const top = stats[0];
  return `${top.assignee} leads with ${top.awardedProjects} awarded of ${top.totalOpportunities} assigned opportunities.`;
}

export function insightMilestoneGap(opps: Opportunity[]): string {
  const m = milestoneCounts(opps);
  const gap = m.negotiation - m.contractSummary;
  if (gap > 0) {
    return `${gap} project(s) reached Negotiation without a recorded Contract Summary.`;
  }
  return "No sequencing gap between Contract Summary and Negotiation.";
}

export interface NamedValue {
  name: string;
  value: number;
  count: number;
}

/** Assignee with the highest awarded value in the selected currency
 * (currency-scoped, never blended — same rule as every other value measure). */
export function topAssigneeByAwardedValue(opps: Opportunity[], currency: Currency): NamedValue | null {
  const assignees = Array.from(new Set(opps.map((o) => o.assignee)));
  const ranked = assignees
    .map((assignee) => {
      const subset = opps.filter((o) => o.assignee === assignee);
      return { name: assignee, value: awardedValue(subset, currency), count: awardedProjects(subset) };
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  return ranked[0] ?? null;
}

/** Country with the highest average awarded value per project, in the
 * selected currency. */
export function topCountryByAverageValue(opps: Opportunity[], currency: Currency): NamedValue | null {
  const countries = Array.from(new Set(opps.map((o) => o.country)));
  const ranked = countries
    .map((country) => {
      const subset = opps.filter((o) => o.country === country);
      const avg = averageAwardValue(subset, currency);
      return { name: country, value: avg, count: awardedProjects(subset) };
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  return ranked[0] ?? null;
}

/** Single shared compact-number formatter — every KPI/chart/insight that
 * displays a large currency figure imports this instead of rolling its own
 * (a duplicated version without the Billion tier previously rendered ROWAD's
 * largest EGP awards as e.g. "29558.91M" instead of "29.56B"). */
export function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}

export function insightTopValueAssignee(opps: Opportunity[], currency: Currency): string {
  const top = topAssigneeByAwardedValue(opps, currency);
  if (!top) return "No awarded value recorded in the current filter/currency.";
  return `${top.name} is responsible for the highest awarded value — ${formatCompact(top.value)} ${currency} across ${top.count} awarded project(s).`;
}

export function insightTopAverageValueCountry(opps: Opportunity[], currency: Currency): string {
  const top = topCountryByAverageValue(opps, currency);
  if (!top) return "No awarded value recorded in the current filter/currency.";
  return `${top.name} has the highest average contract value — ${formatCompact(top.value)} ${currency} per awarded project.`;
}

export function insightConversion(opps: Opportunity[]): string {
  const m = milestoneCounts(opps);
  const rate = conversionRate(opps);
  return `Pipeline conversion from Qualification to Award is ${(rate * 100).toFixed(1)}% — ${m.award} project(s) awarded out of ${m.contractQualifications} qualified.`;
}

// ============================================================
// Geographic Analysis (Page 2) — country-level breakdowns.
// Same currency-safe pattern as statsByAssignee: currency: null means
// "All" — awardedValue/avgContractValue are 0 in that case, read
// `amounts` for the per-currency breakdown instead. Never blend.
// ============================================================
export interface CountryStatsExtended {
  country: string;
  totalOpportunities: number;
  awardedProjects: number;
  winRate: number;
  /** Award / Contract Qualifications, scoped to this country only. */
  conversionRate: number;
  /** 0 when currency is null ("All") — use `amounts` instead in that case. */
  awardedValue: number;
  /** 0 when currency is null ("All") — use `amounts` instead in that case. */
  avgContractValue: number;
  /** Always populated, per-currency, never blended. */
  amounts: Partial<Record<Currency, number>>;
  /** Average contract value per currency, always populated — the
   * average-value counterpart to `amounts`. Read this (via
   * formatAmountsBreakdown) instead of avgContractValue when currency is
   * null ("All"). */
  avgAmounts: Partial<Record<Currency, number>>;
  /** Share of this country's opportunities that reached Risk Assessment.
   * A stage-coverage rate, distinct from winRate and conversionRate. */
  riskRate: number;
  /** Share of this country's opportunities that reached Contract
   * Qualifications. */
  qualificationRate: number;
}

export function countryStatsExtended(opps: Opportunity[], currency: Currency | null): CountryStatsExtended[] {
  const countries = Array.from(new Set(opps.map((o) => o.country)));
  return countries
    .map((country) => {
      const subset = opps.filter((o) => o.country === country);
      const avgAmounts: Partial<Record<Currency, number>> = {};
      for (const c of CURRENCY_SORT_ORDER) {
        const avg = averageAwardValue(subset, c);
        if (avg > 0) avgAmounts[c] = avg;
      }
      const total = totalOpportunities(subset);
      const m = milestoneCounts(subset);
      return {
        country,
        totalOpportunities: total,
        awardedProjects: awardedProjects(subset),
        winRate: winRate(subset),
        conversionRate: conversionRate(subset),
        awardedValue: currency ? awardedValue(subset, currency) : 0,
        avgContractValue: currency ? averageAwardValue(subset, currency) : 0,
        amounts: awardedValueAllCurrencies(subset),
        avgAmounts,
        riskRate: total === 0 ? 0 : m.riskAssessment / total,
        qualificationRate: total === 0 ? 0 : m.contractQualifications / total,
      };
    })
    .sort((a, b) => b.totalOpportunities - a.totalOpportunities);
}

/** Per-country milestone breakdown for the "Pipeline Distribution by
 * Country" stacked bar — same independent-flags caveat as milestoneCounts
 * (NOT a funnel, non-monotonic on real data). Ordered same as
 * statsByCountry (by total opportunity count, descending). */
export function milestoneCountsByCountry(opps: Opportunity[]): ({ country: string } & MilestoneCounts)[] {
  const order = statsByCountry(opps).map((s) => s.country);
  return order.map((country) => ({ country, ...milestoneCounts(opps.filter((o) => o.country === country)) }));
}

/** "Best Performing Country" — ranked by awarded project count (ties broken
 * by win rate). Deliberately distinct from highestWinRateCountry: a country
 * can win a high % of a tiny pipeline without being the strongest overall
 * contributor. */
export function bestPerformingCountry(opps: Opportunity[]): CountryStats | null {
  const stats = statsByCountry(opps);
  if (stats.length === 0) return null;
  return [...stats].sort((a, b) => b.awardedProjects - a.awardedProjects || b.winRate - a.winRate)[0];
}

export function highestWinRateCountry(opps: Opportunity[]): CountryStats | null {
  const stats = statsByCountry(opps);
  if (stats.length === 0) return null;
  return [...stats].sort((a, b) => b.winRate - a.winRate)[0];
}

export function lowestWinRateCountry(opps: Opportunity[]): CountryStats | null {
  const stats = statsByCountry(opps);
  if (stats.length === 0) return null;
  return [...stats].sort((a, b) => a.winRate - b.winRate)[0];
}

/** Minimum opportunity count for a country to be eligible as the
 * headline "Highest/Lowest Win Rate" KPI. Without this, a country with a
 * single project at 100% or 0% win rate would dominate the headline
 * metric on a statistically meaningless sample — real risk on this
 * dataset (Benin has exactly 1 opportunity). Countries below the
 * threshold are surfaced separately as an explicit caveat insight
 * instead of silently hidden. */
export const MIN_SAMPLE_FOR_WINRATE_RANKING = 3;

export function highestWinRateCountryQualified(opps: Opportunity[], minSample = MIN_SAMPLE_FOR_WINRATE_RANKING): CountryStats | null {
  const stats = statsByCountry(opps).filter((s) => s.totalOpportunities >= minSample);
  if (stats.length === 0) return null;
  return [...stats].sort((a, b) => b.winRate - a.winRate)[0];
}

export function lowestWinRateCountryQualified(opps: Opportunity[], minSample = MIN_SAMPLE_FOR_WINRATE_RANKING): CountryStats | null {
  const stats = statsByCountry(opps).filter((s) => s.totalOpportunities >= minSample);
  if (stats.length === 0) return null;
  return [...stats].sort((a, b) => a.winRate - b.winRate)[0];
}

/** A country excluded from the qualified win-rate ranking (too small a
 * sample) whose raw win rate would otherwise have topped or bottomed the
 * list — worth calling out explicitly rather than silently dropping. */
export function smallSampleWinRateOutlier(opps: Opportunity[], minSample = MIN_SAMPLE_FOR_WINRATE_RANKING): CountryStats | null {
  const excluded = statsByCountry(opps).filter((s) => s.totalOpportunities > 0 && s.totalOpportunities < minSample);
  if (excluded.length === 0) return null;
  return [...excluded].sort((a, b) => b.winRate - a.winRate)[0];
}

/** Countries with recorded opportunities but zero awards — a pipeline-risk
 * signal distinct from a low (but nonzero) win rate. */
export function countriesWithZeroAwards(opps: Opportunity[]): CountryStats[] {
  return statsByCountry(opps).filter((s) => s.totalOpportunities > 0 && s.awardedProjects === 0);
}

export interface PipelineStageHotspot {
  country: string;
  stageLabel: string;
  count: number;
  total: number;
}

const PIPELINE_STAGE_LABELS: { key: keyof MilestoneCounts; label: string }[] = [
  { key: "contractQualifications", label: "Contract Qualifications" },
  { key: "riskAssessment", label: "Risk Assessment" },
  { key: "contractSummary", label: "Contract Summary" },
  { key: "negotiation", label: "Negotiation" },
];

/** "Strongest pipeline" hotspot — the country/stage combination with the
 * largest SHARE of that country's opportunities sitting in one non-Award
 * milestone (Award is an outcome, not an in-progress pipeline stage, so
 * it's excluded here). A real, derived-from-data signal for "where is
 * volume concentrated in the pipeline right now" — not a fabricated claim. */
export function strongestPipelineStage(opps: Opportunity[]): PipelineStageHotspot | null {
  const byCountry = milestoneCountsByCountry(opps);
  let best: PipelineStageHotspot | null = null;
  for (const row of byCountry) {
    const total = totalOpportunities(opps.filter((o) => o.country === row.country));
    if (total === 0) continue;
    for (const stage of PIPELINE_STAGE_LABELS) {
      const count = row[stage.key];
      const share = count / total;
      if (!best || share > best.count / best.total) {
        best = { country: row.country, stageLabel: stage.label, count, total };
      }
    }
  }
  return best;
}

export interface CountryConversion {
  country: string;
  conversionRate: number;
}

/** Lowest Award/Qualification conversion — a pipeline-risk signal, distinct
 * from win rate (which is Award/Total Opportunities). */
export function lowestConversionCountry(opps: Opportunity[]): CountryConversion | null {
  const countries = Array.from(new Set(opps.map((o) => o.country)));
  if (countries.length === 0) return null;
  return countries
    .map((country) => ({ country, conversionRate: conversionRate(opps.filter((o) => o.country === country)) }))
    .sort((a, b) => a.conversionRate - b.conversionRate)[0];
}

/** Country with the highest awarded value in the selected currency. Only
 * meaningful for a concrete currency — callers must handle currency=null
 * themselves (there is no blended cross-currency "highest" to report). */
export function highestAwardedValueCountry(opps: Opportunity[], currency: Currency): { country: string; value: number } | null {
  const ranked = awardedValueByCountry(opps, currency).filter((r) => r.value > 0);
  return ranked[0] ?? null;
}

export interface CountryAwardShare {
  country: string;
  count: number;
  /** This country's share of ALL awarded projects across every country —
   * a composition metric, NOT win rate (which is per-country award/total). */
  pctOfTotalAwarded: number;
}

export function awardedProjectsByCountry(opps: Opportunity[]): CountryAwardShare[] {
  const stats = statsByCountry(opps);
  const totalAwarded = awardedProjects(opps);
  return stats
    .map((s) => ({
      country: s.country,
      count: s.awardedProjects,
      pctOfTotalAwarded: totalAwarded === 0 ? 0 : s.awardedProjects / totalAwarded,
    }))
    .sort((a, b) => b.count - a.count);
}

export function avgOpportunitiesPerCountry(opps: Opportunity[]): number {
  const n = countriesCovered(opps);
  return n === 0 ? 0 : totalOpportunities(opps) / n;
}

// ============================================================
// Awards / Pipeline / Assignees / Agreements pages (3-6) — helpers.
// Appended only; nothing above this line is modified.
// ============================================================

/** Count of awarded projects with a recorded amount in 2 or more
 * currencies — a multi-currency-exposure signal, distinct from a blended
 * total (which this codebase never computes). */
export function multiCurrencyAwardCount(opps: Opportunity[]): number {
  return opps
    .filter(isAwarded)
    .filter((o) => Object.values(o.amounts).filter((v) => (v ?? 0) > 0).length >= 2).length;
}

/** Distinct country count where at least one project is awarded. */
export function countriesWithAwards(opps: Opportunity[]): number {
  return new Set(opps.filter(isAwarded).map((o) => o.country)).size;
}

/** Distinct assignee count where the assignee string is an individual
 * (does not contain "&"). Composite/joint entries are excluded — see
 * compositeAssigneeCount. */
export function individualAssigneeCount(opps: Opportunity[]): number {
  return new Set(opps.map((o) => o.assignee).filter((a) => !a.includes("&"))).size;
}

/** Distinct assignee count where the assignee string is a composite/joint
 * entry (contains "&", e.g. "Hana&Donia"). Per Data_Quality_Notes, these
 * are single buckets — never split into constituent people. */
export function compositeAssigneeCount(opps: Opportunity[]): number {
  return new Set(opps.map((o) => o.assignee).filter((a) => a.includes("&"))).size;
}

/** Awarded vs Open opportunity count per assignee, for the Assignees page
 * stacked bar. Composite entries (e.g. "Hana&Donia") are kept as a single
 * row, never split. Sorted by total (awarded + open) descending. */
export function awardedVsOpenByAssignee(
  opps: Opportunity[],
): { assignee: string; awarded: number; open: number }[] {
  const assignees = Array.from(new Set(opps.map((o) => o.assignee)));
  return assignees
    .map((assignee) => {
      const subset = opps.filter((o) => o.assignee === assignee);
      const awarded = awardedProjects(subset);
      return { assignee, awarded, open: subset.length - awarded };
    })
    .sort((a, b) => b.awarded + b.open - (a.awarded + a.open));
}

/** Status distribution — Won / Risk Assessment / In Negotiation. This is
 * the Status field (lifecycle), independent of the 5 milestone flags —
 * never conflate the two (see Data_Quality_Notes: Status and Stage Flags
 * are independent). Fixed 3-row order matching the workbook's known
 * statuses, so the shape never silently changes. */
export function statusDistribution(opps: Opportunity[]): { status: string; count: number; pct: number }[] {
  const total = opps.length;
  const order = ["Won", "Risk Assessment", "In Negotiation"];
  const counts = new Map<string, number>();
  for (const o of opps) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
  return order.map((status) => {
    const count = counts.get(status) ?? 0;
    return { status, count, pct: total === 0 ? 0 : count / total };
  });
}

/** Average awarded value per currency, always populated, never blended —
 * the average-value counterpart to awardedValueAllCurrencies. Read this
 * (via formatAmountsBreakdown) instead of averageAwardValue when the
 * Currency selector is "All". */
export function averageAwardValueAllCurrencies(opps: Opportunity[]): Partial<Record<Currency, number>> {
  const out: Partial<Record<Currency, number>> = {};
  for (const currency of CURRENCY_SORT_ORDER) {
    const v = averageAwardValue(opps, currency);
    if (v > 0) out[currency] = v;
  }
  return out;
}

/** Highest win-rate assignee on a qualifying opportunity count. Filters
 *  out assignees below MIN_SAMPLE_FOR_WINRATE_RANKING so a single 1-of-1
 *  win doesn't dominate the headline. Returns null if no assignee meets
 *  the threshold with at least one awarded project. This mirrors
 *  highestWinRateCountryQualified but at the assignee grain. */
export function highestWinRateAssigneeQualified(
  opps: Opportunity[],
  minSample = MIN_SAMPLE_FOR_WINRATE_RANKING,
): { assignee: string; winRate: number; awardedProjects: number; totalOpportunities: number } | null {
  const stats = statsByAssignee(opps, null)
    .filter((s) => s.totalOpportunities >= minSample)
    .filter((s) => s.awardedProjects > 0);
  if (stats.length === 0) return null;
  const top = [...stats].sort((a, b) => b.winRate - a.winRate || b.awardedProjects - a.awardedProjects)[0];
  return {
    assignee: top.assignee,
    winRate: top.winRate,
    awardedProjects: top.awardedProjects,
    totalOpportunities: top.totalOpportunities,
  };
}

/** Top partners by number of agreements they appear in — a raw
 *  counterparty-exposure count from Fact_Agreements.Parties. Each Parties
 *  string is split on `&`, `,`, newlines, and hyphens; every resulting
 *  token is trimmed and counted. "RME" is filtered out because it is
 *  ROWAD itself and appears in essentially every row (adding no
 *  information). Numbering prefixes like "(1)" / "(2)" are stripped. This
 *  is a factual aggregation — no scoring, no ranking judgment beyond
 *  "how many agreements list this name". */
export function topPartnersByAgreementCount(
  agreements: AgreementRecord[],
  limit = 6,
): { partner: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const agr of agreements) {
    const raw = (agr.parties || "").replace(/\r?\n/g, " ").replace(/\(\d+\)/g, " ");
    const tokens = raw
      .split(/[&,]|\s+-\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    // Deduplicate within one agreement so a party listed twice on the same
    // row is still one appearance.
    const seen = new Set<string>();
    for (const t of tokens) {
      const cleaned = t
        .replace(/^\s*-\s*/, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!cleaned) continue;
      if (/^RME$/i.test(cleaned)) continue;
      // Skip "JV" as a standalone token — it's a legal-form label, not a party.
      if (/^JV$/i.test(cleaned)) continue;
      const key = cleaned;
      if (seen.has(key.toLowerCase())) continue;
      seen.add(key.toLowerCase());
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([partner, count]) => ({ partner, count }))
    .sort((a, b) => b.count - a.count || a.partner.localeCompare(b.partner))
    .slice(0, limit);
}
