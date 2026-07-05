import { Folder, Trophy, Compass, ClipboardList, BarChart3, Globe2 } from "lucide-react";
import { DashboardHeader } from "../components/header/DashboardHeader";
import { KPICard } from "../components/cards/KPICard";
import { SectionCard } from "../components/primitives/SectionCard";
import { DiagnosticBanner } from "../components/primitives/DiagnosticBanner";
import { MilestoneChart } from "../components/charts/MilestoneChart";
import { HorizontalBarList } from "../components/charts/HorizontalBarList";
import { ProjectRegisterTable } from "../components/tables/ProjectRegisterTable";
import { FileUpload } from "../components/FileUpload";
import { PrintReportFooter } from "../components/print/PrintReportFooter";
import { useDashboardStore } from "../store/useDashboardStore";
import { colors } from "../theme/tokens";
import {
  awardedProjects,
  conversionRate,
  countriesCovered,
  milestoneCounts,
  openOpportunities,
  statusDistribution,
  totalOpportunities,
} from "../services/calculations";

/** ============================================================
 *  Pipeline — Executive Report (Page 4)
 *  ------------------------------------------------------------
 *  Print-safe, single-page layout answering ONE question:
 *    "Is the pipeline actually moving toward award?"
 *
 *  Structure (top to bottom):
 *    1. KPI Strip           -- frame the pipeline
 *    2. Milestones (as-is, larger) + Opportunities by Status
 *    3. Pipeline Register   -- all opportunities, evidence table, fills
 *       all remaining vertical space (no Executive Highlights panel here
 *       — evidence-only page by request)
 *
 *  The 5 milestone flags are NOT a funnel (fixed order, non-monotonic on
 *  real data) — reuses MilestoneChart unmodified. Status (Won / Risk
 *  Assessment / In Negotiation) is a SEPARATE, independent dimension from
 *  the milestone flags — never conflated here.
 *  ============================================================ */
export function PipelinePage() {
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
  const statusRows = statusDistribution(opps).map((s) => ({ label: s.status, count: s.count, pct: s.pct }));

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <DashboardHeader title="Pre-Award Snapshot Dashboard (H1 2026)" subtitle="Pipeline Analysis" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        {/* KPI Strip */}
        <div className="flex gap-2" style={{ height: 128 }}>
          <KPICard icon={Folder} label="Total Opportunities" value={totalOpportunities(opps)} subtitle="All Projects" />
          <KPICard icon={Trophy} label="Awarded" value={awardedProjects(opps)} valueTone="primary" subtitle="Status = Won" />
          <KPICard icon={Compass} tone="gold" label="Open Opportunities" value={openOpportunities(opps)} subtitle="Not yet awarded" />
          <KPICard
            icon={ClipboardList}
            tone="teal"
            label="Qualified"
            value={milestones.contractQualifications}
            subtitle="Contract Qualifications"
          />
          <KPICard
            icon={BarChart3}
            label="Pipeline Conversion"
            value={`${(conversionRate(opps) * 100).toFixed(1)}%`}
            valueTone="primary"
            subtitle="Award / Qualification"
          />
          <KPICard icon={Globe2} tone="navy" label="Countries in Pipeline" value={countriesCovered(opps)} subtitle="Unique Markets" />
        </div>

        {/* Row 2: Milestones (as-is, larger) + Opportunities by Status */}
        <div className="pf-row flex gap-2" style={{ height: 260 }}>
          <SectionCard
            title="Pre-Award Milestones"
            info="Independent flags — not a sequential funnel."
            className="flex-1"
            padding={10}
          >
            <MilestoneChart counts={milestones} totalOpportunities={totalOpportunities(opps)} />
          </SectionCard>
          <SectionCard
            title="Opportunities by Status"
            info="Status is independent of the 5 milestone flags above."
            className="flex-1"
            padding={10}
          >
            <HorizontalBarList
              rows={statusRows}
              labelWidth={130}
              rowColors={[colors.secondary, colors.primary, colors.gold]}
            />
          </SectionCard>
        </div>

        {/* Row 3: Pipeline Register — all opportunities, full remaining height */}
        <div className="pf-row flex-1 min-h-0">
          <SectionCard title="Pipeline Register" className="h-full" padding={8}>
            <ProjectRegisterTable rows={opps} currency={currency} showStatus />
          </SectionCard>
        </div>
      </div>
      <PrintReportFooter />
    </div>
  );
}
