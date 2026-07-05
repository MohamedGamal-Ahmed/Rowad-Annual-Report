import { Folder, DollarSign, Globe2, PieChart, ShieldAlert, Trophy } from "lucide-react";
import { DashboardHeader } from "../components/header/DashboardHeader";
import { KPICard } from "../components/cards/KPICard";
import { SectionCard } from "../components/primitives/SectionCard";
import { DiagnosticBanner } from "../components/primitives/DiagnosticBanner";
import { IconBadge } from "../components/primitives/IconBadge";
import { TopCountriesByOpportunitiesChart } from "../components/charts/CountryBarCharts";
import { PipelineHeatMatrix } from "../components/geographic/PipelineHeatMatrix";
import { CountryComparisonTable } from "../components/CountryComparisonTable";
import { FileUpload } from "../components/FileUpload";
import { PrintReportFooter } from "../components/print/PrintReportFooter";
import { useDashboardStore } from "../store/useDashboardStore";
import { radius, shadow } from "../theme/tokens";
import {
  countriesCovered,
  countryStatsExtended,
  milestoneCountsByCountry,
  statsByCountry,
  totalOpportunities,
} from "../services/calculations";
import {
  bestPerformingCountryQualified,
  countriesWithoutAwardsCount,
  generateGeographicHighlights,
  geographicConcentration,
  totalAwardedValueGeographic,
} from "../services/geographicInsights";

/** ============================================================
 *  Geographic Analysis -- Executive Report
 *  ------------------------------------------------------------
 *  Print-safe, single-page layout answering ONE question:
 *    "Where is our Pre-Award pipeline geographically concentrated?"
 *
 *  Structure (top to bottom):
 *    1. KPI Strip       -- frame the footprint
 *    2. Top Opps Chart  -- primary visual (WHERE the pipeline lives)
 *                          + Country Comparison Table (evidence)
 *    3. Pipeline Status -- WHERE opportunities sit in the funnel
 *    4. Insights Row    -- 4 executive observations
 *
 *  Every KPI, chart, table and insight is derived from the same
 *  calculation primitives used across the app. No new business
 *  rules, no fabricated numbers, no cross-currency blending on
 *  any displayed figure.
 *  ============================================================ */
export function GeographicAnalysisPage() {
  const { isLoaded, filteredOpportunities, currency, warnings } = useDashboardStore();

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex flex-col">
        <div style={{ padding: "16px 20px 4px" }}>
          <h1 className="font-bold" style={{ fontSize: "var(--text-display)", color: "var(--color-text-primary)" }}>
            Pre-Award Snapshot Dashboard (H1 2026)
          </h1>
        </div>
        <div className="flex-1">
          <FileUpload />
        </div>
      </div>
    );
  }

  const opps = filteredOpportunities();
  const currencyLabel = currency ?? "All";

  const extStats = countryStatsExtended(opps, currency);
  const countryStats = statsByCountry(opps);
  const total = totalOpportunities(opps);
  const pipelineData = milestoneCountsByCountry(opps).map((m, i) => ({
    ...m,
    totalOpportunities: countryStats[i]?.totalOpportunities ?? 0,
  }));

  // Top Opps chart data -- country, count, and share of total. NOTHING
  // else. The chart deliberately omits win rate and awarded value so it
  // does not overlap with the comparison table beside it.
  const topOppsData = countryStats.map((s) => ({
    country: s.country,
    count: s.totalOpportunities,
    pct: total === 0 ? 0 : s.totalOpportunities / total,
  }));

  const conc = geographicConcentration(opps);
  const awardedValue = totalAwardedValueGeographic(opps, currency);
  const zeroAwardCountriesCount = countriesWithoutAwardsCount(opps);
  const bestPerf = bestPerformingCountryQualified(opps);
  const highlights = generateGeographicHighlights(opps);

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <DashboardHeader title="Pre-Award Snapshot Dashboard (H1 2026)" subtitle="Geographic Analysis" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        {/* KPI Strip -- 6 executive KPIs, sized/typed identical to Executive page. */}
        <div className="flex gap-2 shrink-0" style={{ height: 128 }}>
          <KPICard icon={Globe2} label="Countries Covered" value={countriesCovered(opps)} subtitle="Unique Markets" />
          <KPICard icon={Folder} label="Total Opportunities" value={total} subtitle="Across All Countries" />
          <KPICard
            icon={DollarSign}
            label={`Total Awarded Value (${currencyLabel})`}
            value={awardedValue.display}
            valueTone="primary"
            subtitle={awardedValue.hasValue ? "Sum of awarded projects" : "No awarded value recorded"}
          />
          <KPICard
            icon={PieChart}
            label="Geographic Concentration"
            value={conc.country ? `${(conc.share * 100).toFixed(0)}%` : "-"}
            valueTone="primary"
            subtitle={conc.country ? `Held by ${conc.country}` : undefined}
          />
          <KPICard
            icon={ShieldAlert}
            label="Countries Without Awards"
            value={zeroAwardCountriesCount}
            subtitle={zeroAwardCountriesCount > 0 ? "Countries with 0 awarded projects" : "All countries have at least one award"}
          />
          <KPICard
            icon={Trophy}
            label="Highest Win Rate"
            value={bestPerf?.country ?? "-"}
            valueTone="primary"
            subtitle={
              bestPerf
                ? `${(bestPerf.winRate * 100).toFixed(1)}% (${bestPerf.awardedProjects} of ${bestPerf.totalOpportunities})`
                : undefined
            }
          />
        </div>

        {/* Row 2 -- Top Opps chart (primary visual) + Country Comparison table (evidence).
            They complement each other: chart communicates concentration,
            table validates with the full metric readout. The chart shows
            ONLY count + share so it doesn't duplicate the table. */}
        <div className="pf-row flex gap-2 shrink-0" style={{ height: 180 }}>
          <SectionCard
            title="Top Opportunities by Country"
            subtitle="Share of Total Opportunities"
            className="flex-1 min-w-0"
            padding={10}
          >
            <TopCountriesByOpportunitiesChart data={topOppsData} />
          </SectionCard>
          <SectionCard
            title={`Country Comparison Summary (${currencyLabel})`}
            className="flex-[1.15] min-w-0"
            padding={8}
          >
            <CountryComparisonTable rows={extStats} currency={currency} />
          </SectionCard>
        </div>

        {/* Row 3 -- Pipeline Status by Country. Full width so the heat
            matrix reads at a glance without the eye competing with
            side-panels. Height sized so the four ROWAD countries + header
            + legend fit without scrolling on a standard viewport; the
            component itself carries a defensive overflow-auto in case a
            future filter surfaces more rows. */}
        <div className="pf-row flex gap-2 shrink-0" style={{ height: 210 }}>
          <SectionCard
            title="Pipeline Status by Country"
            info="Independent milestone flags -- not a sequential funnel. A country's segments can total more or less than its opportunity count."
            className="flex-1 min-w-0"
            padding={10}
          >
            <PipelineHeatMatrix data={pipelineData} />
          </SectionCard>
        </div>

        {/* Row 4 -- Executive Highlights. Four horizontal cards,
            each = icon + one bold headline + one short explanation. No
            paragraphs, no overlap, readable in under 10 seconds. Card
            frame reuses SectionCard's shadow/radius/border tokens so no
            new visual language is introduced. */}
        <div className="pf-row flex gap-2 flex-1 min-h-0">
          {highlights.length === 0 ? (
            <SectionCard title="Executive Highlights" className="flex-1 min-w-0" padding={10}>
              <div
                className="h-full flex items-center justify-center"
                style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}
              >
                No highlights in the current filter.
              </div>
            </SectionCard>
          ) : (
            highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-start bg-card"
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: radius.card,
                  boxShadow: shadow.card,
                  border: "1px solid var(--color-border)",
                  padding: "10px 12px",
                  gap: 10,
                }}
              >
                <IconBadge icon={h.icon} tone={h.tone} size={30} />
                <div className="flex flex-col min-w-0" style={{ gap: 3 }}>
                  <span
                    className="font-bold"
                    style={{
                      fontSize: "var(--text-insight-title)",
                      color: "var(--color-text-primary)",
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {h.title}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-insight-desc)",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {h.description}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <PrintReportFooter />
    </div>
  );
}
