import { Users, User, Handshake, Layers, Trophy, Award } from "lucide-react";
import { DashboardHeader } from "../components/header/DashboardHeader";
import { KPICard } from "../components/cards/KPICard";
import { SectionCard } from "../components/primitives/SectionCard";
import { DiagnosticBanner } from "../components/primitives/DiagnosticBanner";
import { ExecutiveHighlights } from "../components/ExecutiveHighlights";
import { HorizontalBarList } from "../components/charts/HorizontalBarList";
import { StackedBarList } from "../components/charts/StackedBarList";
import { AssigneeTable } from "../components/AssigneeTable";
import { FileUpload } from "../components/FileUpload";
import { PrintReportFooter } from "../components/print/PrintReportFooter";
import { useDashboardStore } from "../store/useDashboardStore";
import { colors } from "../theme/tokens";
import {
  assigneesCovered,
  awardedVsOpenByAssignee,
  compositeAssigneeCount,
  highestWinRateAssigneeQualified,
  individualAssigneeCount,
  statsByAssignee,
  totalOpportunities,
} from "../services/calculations";
import { generateAssigneeHighlights } from "../services/pageHighlights";

/** ============================================================
 *  Assignees — Executive Report (Page 5)
 *  ------------------------------------------------------------
 *  Print-safe, single-page layout answering ONE question:
 *    "Is the pre-award team balanced, and where is capacity risk?"
 *
 *  Structure (top to bottom):
 *    1. KPI Strip -- team size, composition, workload average, leaders
 *    2. Opportunities per Assignee + Awarded vs Open by Assignee
 *    3. Team Performance evidence table + Executive Highlights
 *
 *  Composite assignees (e.g. "Hana&Donia") are single buckets, never split
 *  into constituent people, per Data_Quality_Notes. Workload is measured
 *  ONLY by opportunity count -- no "effort"/"utilization" data exists.
 *  ============================================================ */
export function AssigneesPage() {
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
  const total = totalOpportunities(opps);
  const assigneeCount = assigneesCovered(opps);
  const avgPerAssignee = assigneeCount === 0 ? 0 : total / assigneeCount;

  const stats = statsByAssignee(opps, currency);
  const byTotal = [...stats].sort((a, b) => b.totalOpportunities - a.totalOpportunities);
  const topPortfolio = byTotal[0];
  // Second KPI: Highest Win Rate on a qualifying sample. Currency-agnostic
  // (win rate is a count ratio) — no blending concerns. Uses the same
  // MIN_SAMPLE guardrail as the country ranking so a 1-of-1 win doesn't
  // dominate the headline. This differentiates from Top Portfolio Owner
  // (biggest by count) so both KPIs don't return the same name.
  const topWinRateAssignee = highestWinRateAssigneeQualified(opps);

  const opportunitiesPerAssigneeRows = byTotal.map((s) => ({
    label: s.assignee,
    count: s.totalOpportunities,
    pct: total === 0 ? 0 : s.totalOpportunities / total,
  }));

  const awardedVsOpen = awardedVsOpenByAssignee(opps).map((r) => ({ label: r.assignee, a: r.awarded, b: r.open }));

  const highlights = generateAssigneeHighlights(opps);

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <DashboardHeader title="Pre-Award Snapshot Dashboard (H1 2026)" subtitle="Team Performance" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        {/* KPI Strip */}
        <div className="flex gap-2" style={{ height: 128 }}>
          <KPICard icon={Users} label="Total Assignees" value={assigneeCount} subtitle="People + Joint Pairs" />
          <KPICard icon={User} tone="navy" label="Individual Assignees" value={individualAssigneeCount(opps)} subtitle="Single-person" />
          <KPICard icon={Handshake} tone="gold" label="Composite Assignees" value={compositeAssigneeCount(opps)} subtitle="Joint pairs" />
          <KPICard
            icon={Layers}
            tone="teal"
            label="Avg Opportunities / Assignee"
            value={avgPerAssignee.toFixed(1)}
            subtitle="Total / Assignees"
          />
          <KPICard
            icon={Trophy}
            valueTone="primary"
            label="Top Portfolio Owner"
            value={topPortfolio?.assignee ?? "-"}
            subtitle={topPortfolio ? `${topPortfolio.totalOpportunities} opportunities` : undefined}
          />
          <KPICard
            icon={Award}
            valueTone="primary"
            label="Highest Win Rate"
            value={topWinRateAssignee ? topWinRateAssignee.assignee : "-"}
            subtitle={
              topWinRateAssignee
                ? `${(topWinRateAssignee.winRate * 100).toFixed(1)}% (${topWinRateAssignee.awardedProjects} of ${topWinRateAssignee.totalOpportunities})`
                : "No qualifying sample"
            }
          />
        </div>

        {/* Row 2: Opportunities per Assignee + Awarded vs Open by Assignee */}
        <div className="pf-row flex gap-2" style={{ height: 220 }}>
          <SectionCard title="Opportunities per Assignee" className="flex-1" padding={10}>
            <HorizontalBarList rows={opportunitiesPerAssigneeRows} labelWidth={90} barColor={colors.secondary} />
          </SectionCard>
          <SectionCard title="Awarded vs Open by Assignee" className="flex-1" padding={10}>
            <StackedBarList
              rows={awardedVsOpen}
              labelWidth={90}
              colorA={colors.primary}
              colorB={colors.secondary}
              legendA="Awarded"
              legendB="Open"
            />
          </SectionCard>
        </div>

        {/* Row 3: Team Performance evidence table + Executive Highlights */}
        <div className="pf-row flex gap-2 flex-1 min-h-0">
          <SectionCard title="Team Performance" className="flex-[1.6] min-w-0" padding={8}>
            <AssigneeTable rows={stats} currency={currency} />
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
