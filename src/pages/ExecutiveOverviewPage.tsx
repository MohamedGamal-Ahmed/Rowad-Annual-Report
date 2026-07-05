import { Folder, Trophy, TrendingUp, DollarSign, Globe2, Users, BarChart3 } from "lucide-react";
import { DashboardHeader } from "../components/header/DashboardHeader";
import { KPICard } from "../components/cards/KPICard";
import { CurrencyBreakdownValue } from "../components/cards/CurrencyBreakdownValue";
import { SectionCard } from "../components/primitives/SectionCard";
import { DiagnosticBanner } from "../components/primitives/DiagnosticBanner";
import { CountryDonut } from "../components/charts/CountryDonut";
import { AwardedValueByCountryChart } from "../components/charts/CurrencyChart";
import { CountryCurrencyMatrix } from "../components/charts/CountryCurrencyMatrix";
import { MilestoneStackedByCountry } from "../components/charts/MilestoneStackedByCountry";
import { ExecutiveHighlights } from "../components/ExecutiveHighlights";
import type { Insight } from "../components/ExecutiveHighlights";
import { FileUpload } from "../components/FileUpload";
import { PrintReportFooter } from "../components/print/PrintReportFooter";
import { useDashboardStore } from "../store/useDashboardStore";
import {
  assigneesCovered,
  awardedProjects,
  awardedValue,
  awardedValueAllCurrencies,
  awardedValueByCountry,
  awardedValueByCountryAllCurrencies,
  conversionRate,
  countriesCovered,
  formatCompact,
  milestoneCounts,
  milestoneCountsByCountry,
  statsByCountry,
  topAssigneeByAwardedValue,
  topCountryByAverageValue,
  totalOpportunities,
  winRate,
} from "../services/calculations";

export function ExecutiveOverviewPage() {
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
  const milestones = milestoneCounts(opps);
  const countryStats = statsByCountry(opps);
  // Pipeline Status by Country — 5 milestone flags per country as a
  // stacked-bar list. Country order matches statsByCountry (by total
  // opportunities desc). Bar segment = milestone hit count; sum of a
  // country's bar > its total opportunities because milestones are
  // independent (a project can be counted in multiple stages).
  const milestoneByCountry = milestoneCountsByCountry(opps);
  const stackedRows = countryStats.map((s) => {
    const m = milestoneByCountry.find((row) => row.country === s.country);
    return {
      country: s.country,
      totalOpportunities: s.totalOpportunities,
      milestones: {
        contractQualifications: m?.contractQualifications ?? 0,
        riskAssessment: m?.riskAssessment ?? 0,
        contractSummary: m?.contractSummary ?? 0,
        negotiation: m?.negotiation ?? 0,
        award: m?.award ?? 0,
      },
    };
  });
  const countries = Array.from(new Set(opps.map((o) => o.country))).sort();
  const countriesFootnote =
    countries.length > 3 ? `${countries.slice(0, 3).join(", ")} +${countries.length - 3} more` : countries.join(", ");

  const currencyLabel = currency ?? "All";
  const isAllCurrencies = currency === null;

  const topValueAssignee = currency ? topAssigneeByAwardedValue(opps, currency) : null;
  const topAvgCountry = currency ? topCountryByAverageValue(opps, currency) : null;
  const topCountry = countryStats[0];

  const insights: Insight[] = [
    {
      icon: Globe2,
      tone: "navy",
      title: topCountry
        ? `${topCountry.country} represents ${((topCountry.totalOpportunities / (totalOpportunities(opps) || 1)) * 100).toFixed(1)}% of total opportunities`
        : "No data in current filter.",
      description: topCountry
        ? `${topCountry.totalOpportunities} out of ${totalOpportunities(opps)} projects are in ${topCountry.country}.`
        : "",
    },
    {
      icon: Trophy,
      tone: "gold",
      title: `Current Win Rate is ${(winRate(opps) * 100).toFixed(1)}%`,
      description: `${awardedProjects(opps)} projects have been awarded out of ${totalOpportunities(opps)} total opportunities.`,
    },
    isAllCurrencies
      ? {
          icon: Users,
          tone: "rose",
          title: "Select a currency to see the top value contributor",
          description: "Awarded value can't be ranked across currencies without blending them — pick EGP/USD/SAR/EURO/CFA above.",
        }
      : {
          icon: Users,
          tone: "rose",
          title: topValueAssignee
            ? `${topValueAssignee.name} is responsible for the highest awarded value`
            : "No awarded value recorded in the current filter/currency.",
          description: topValueAssignee
            ? `${formatCompact(topValueAssignee.value)} ${currency} across ${topValueAssignee.count} awarded project(s).`
            : "",
        },
    isAllCurrencies
      ? {
          icon: DollarSign,
          tone: "teal",
          title: "Select a currency to see average contract value",
          description: "Same reason — averages can't blend currencies either.",
        }
      : {
          icon: DollarSign,
          tone: "teal",
          title: topAvgCountry
            ? `${topAvgCountry.name} has the highest average contract value`
            : "No awarded value recorded in the current filter/currency.",
          description: topAvgCountry
            ? `Average awarded value is ${formatCompact(topAvgCountry.value)} ${currency} per project.`
            : "",
        },
    {
      icon: BarChart3,
      tone: "rose",
      title: `Pipeline conversion from Qualification to Award is ${(conversionRate(opps) * 100).toFixed(1)}%`,
      description: `${milestones.award} project(s) awarded out of ${milestones.contractQualifications} qualified opportunities.`,
    },
  ];

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <DashboardHeader title="Pre-Award Snapshot Dashboard (H1 2026)" subtitle="Executive Overview" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        {/* KPI Strip */}
        <div className="flex gap-2" style={{ height: 128 }}>
          <KPICard icon={Folder} label="Total Opportunities" value={totalOpportunities(opps)} subtitle="All Projects" />
          <KPICard
            icon={Trophy}
            label="Awarded Projects"
            value={awardedProjects(opps)}
            valueTone="primary"
            subtitle={`Out of ${totalOpportunities(opps)} Opportunities`}
          />
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
            icon={Globe2}
            label="Countries"
            value={countriesCovered(opps)}
            subtitle="Countries Covered"
            footnote={countriesFootnote}
          />
          <KPICard icon={Users} label="Assignees" value={assigneesCovered(opps)} subtitle="People Involved" footnote="Across All Opportunities" />
        </div>

        {/* Row 2: Snapshot visuals — Projects by Country + Awarded Value Matrix.
            Milestone Overview moved to the Pipeline page; Top-10 Assignees
            moved to the Team Performance page — this page owns the snapshot
            question only ("state of Pre-Award in one glance"). */}
        <div className="pf-row flex gap-2" style={{ height: 200 }}>
          <SectionCard title="Projects by Country" className="flex-1" padding={10}>
            <CountryDonut stats={countryStats} />
          </SectionCard>
          <SectionCard
            title={currency ? `Awarded Value by Country (${currency})` : "Awarded Value by Country — All Currencies"}
            info={
              isAllCurrencies
                ? "EGP/CFA run into billions, SAR/USD/EURO into millions — one shared axis would misrepresent them, so each currency is read on its own terms in this table."
                : undefined
            }
            className="flex-1"
            padding={10}
          >
            {currency ? (
              <AwardedValueByCountryChart data={awardedValueByCountry(opps, currency)} currency={currency} />
            ) : (
              <CountryCurrencyMatrix data={awardedValueByCountryAllCurrencies(opps)} />
            )}
          </SectionCard>
        </div>

        {/* Row 3: Pipeline Status by Country as a 5-segment stacked bar
            per country. Same visual pattern as StackedBarList used on the
            Team page, extended to 5 milestone segments. See Geographic
            Analysis for the color-coded heat matrix with per-cell shading. */}
        <div className="pf-row flex gap-2 flex-1 min-h-0">
          <SectionCard
            title="Pipeline Status by Country"
            info="Independent milestone flags — a project can be counted in multiple stages. See Geographic Analysis for the color-coded heat matrix."
            className="flex-[1.4] min-w-0"
            padding={10}
          >
            <MilestoneStackedByCountry rows={stackedRows} labelWidth={80} />
          </SectionCard>
          <SectionCard title="Executive Highlights" className="flex-1 min-w-0" padding={10}>
            <ExecutiveHighlights insights={insights} />
          </SectionCard>
        </div>
      </div>
      <PrintReportFooter />
    </div>
  );
}
