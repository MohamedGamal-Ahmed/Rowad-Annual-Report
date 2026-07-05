import { Trophy, TrendingUp, DollarSign, Coins, Layers, Globe2 } from "lucide-react";
import { DashboardHeader } from "../components/header/DashboardHeader";
import { KPICard } from "../components/cards/KPICard";
import { CurrencyBreakdownValue } from "../components/cards/CurrencyBreakdownValue";
import { SectionCard } from "../components/primitives/SectionCard";
import { DiagnosticBanner } from "../components/primitives/DiagnosticBanner";
import { ExecutiveHighlights } from "../components/ExecutiveHighlights";
import { AwardedProjectsByCountryChart } from "../components/charts/CountryBarCharts";
import { ProjectRegisterTable } from "../components/tables/ProjectRegisterTable";
import { FileUpload } from "../components/FileUpload";
import { PrintReportFooter } from "../components/print/PrintReportFooter";
import { useDashboardStore } from "../store/useDashboardStore";
import { currencyPalette } from "../theme/tokens";
import {
  averageAwardValue,
  averageAwardValueAllCurrencies,
  awardedProjects,
  awardedProjectsByCountry,
  awardedValue,
  awardedValueAllCurrencies,
  awardedValueByCurrency,
  countriesWithAwards,
  formatCompact,
  isAwarded,
  multiCurrencyAwardCount,
  winRate,
} from "../services/calculations";
import { generateAwardHighlights } from "../services/pageHighlights";

/** ============================================================
 *  Awards — Executive Report (Page 3)
 *  ------------------------------------------------------------
 *  Print-safe, single-page layout answering ONE question:
 *    "What did we win, and in what currency exposure?"
 *
 *  Structure (top to bottom):
 *    1. KPI Strip       -- awarded count, win rate, value, exposure
 *    2. Value by Currency (plain list, no chart) + Awarded by Country
 *    3. Awarded Projects evidence table + Executive Highlights
 *
 *  Never blends currencies. No date/timeline visuals. No single
 *  "average award value" blended number.
 *  ============================================================ */
export function AwardsPage() {
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
  const isAllCurrencies = currency === null;
  const awardedOpps = opps.filter(isAwarded);

  const currencyRows = awardedValueByCurrency(opps);
  const countryAwardShare = awardedProjectsByCountry(opps);
  const highlights = generateAwardHighlights(opps);

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <DashboardHeader title="Pre-Award Snapshot Dashboard (H1 2026)" subtitle="Awards Performance" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        {/* KPI Strip */}
        <div className="flex gap-2" style={{ height: 128 }}>
          <KPICard icon={Trophy} label="Awarded Projects" value={awardedProjects(opps)} valueTone="primary" subtitle="Won Projects" />
          <KPICard
            icon={TrendingUp}
            label="Win Rate %"
            value={`${(winRate(opps) * 100).toFixed(1)}%`}
            valueTone="primary"
            subtitle="Won / All Opportunities"
          />
          <KPICard
            icon={DollarSign}
            label={`Awarded Value (${currencyLabel})`}
            value={
              currency ? (
                formatCompact(awardedValue(opps, currency))
              ) : (
                <CurrencyBreakdownValue amounts={awardedValueAllCurrencies(opps)} />
              )
            }
            valueTone="primary"
          />
          <KPICard
            icon={Coins}
            label={`Avg Award Value (${currencyLabel})`}
            value={
              currency ? (
                formatCompact(averageAwardValue(opps, currency))
              ) : (
                <CurrencyBreakdownValue amounts={averageAwardValueAllCurrencies(opps)} />
              )
            }
            valueTone="primary"
          />
          <KPICard
            icon={Layers}
            tone="gold"
            label="Multi-Currency Awards"
            value={multiCurrencyAwardCount(opps)}
            subtitle="Awarded in ≥2 currencies"
          />
          <KPICard
            icon={Globe2}
            tone="teal"
            label="Countries With Awards"
            value={countriesWithAwards(opps)}
            subtitle="At least one award"
          />
        </div>

        {/* Row 2: Awarded Value by Currency (rich card grid) + Awarded Projects by Country */}
        <div className="pf-row flex gap-2" style={{ height: 220 }}>
          <SectionCard
            title="Awarded Value by Currency"
            info="Each currency is a separate portfolio — amounts are never summed across currencies."
            className="flex-1"
            padding={10}
          >
            <div className="h-full grid" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6 }}>
              {currencyRows.map((r) => {
                const projectsInCurrency = opps.filter(isAwarded).filter((o) => (o.amounts[r.currency] ?? 0) > 0).length;
                const color = currencyPalette[r.currency];
                const has = r.value > 0;
                return (
                  <div
                    key={r.currency}
                    className="flex flex-col justify-between"
                    style={{
                      border: `1px solid ${has ? color : "var(--color-border)"}`,
                      borderTop: `4px solid ${has ? color : "var(--color-border-strong)"}`,
                      borderRadius: 10,
                      padding: "8px 8px",
                      background: has ? "#fff" : "var(--color-bg)",
                      minWidth: 0,
                      opacity: has ? 1 : 0.6,
                    }}
                  >
                    <div className="flex items-center" style={{ gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flexShrink: 0 }} />
                      <span
                        className="font-bold uppercase"
                        style={{ fontSize: 10.5, color: has ? color : "var(--color-text-muted)", letterSpacing: 0.5 }}
                      >
                        {r.currency === "EURO" ? "EUR" : r.currency}
                      </span>
                    </div>
                    <div className="flex flex-col" style={{ gap: 1, marginTop: 6 }}>
                      <span
                        className="font-bold"
                        style={{
                          fontSize: has ? 18 : 14,
                          color: has ? "var(--color-text-primary)" : "var(--color-text-muted)",
                          lineHeight: 1.05,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {has ? formatCompact(r.value) : "—"}
                      </span>
                      <span style={{ fontSize: 9.5, color: "var(--color-text-muted)", lineHeight: 1.2 }}>
                        {has ? `${projectsInCurrency} project${projectsInCurrency === 1 ? "" : "s"}` : "No awards"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
          <SectionCard title="Awarded Projects by Country" className="flex-1" padding={10}>
            <AwardedProjectsByCountryChart data={countryAwardShare} />
          </SectionCard>
        </div>

        {/* Row 3: Awarded Projects evidence table + Executive Highlights */}
        <div className="pf-row flex gap-2 flex-1 min-h-0">
          <SectionCard
            title="Awarded Projects"
            info={isAllCurrencies ? "Each row shows a per-currency breakdown — never a blended total." : undefined}
            className="flex-[1.6] min-w-0"
            padding={8}
          >
            <ProjectRegisterTable rows={awardedOpps} currency={currency} showFooter />
          </SectionCard>
          <SectionCard title="Executive Highlights" className="flex-1 min-w-0" padding={8}>
            <ExecutiveHighlights insights={highlights} />
          </SectionCard>
        </div>
      </div>
      <PrintReportFooter />
    </div>
  );
}
