import { HardHat, Gavel, PiggyBank, Timer, AlertOctagon, FileSignature } from "lucide-react";
import { PostAwardHeader } from "../../components/postAward/PostAwardHeader";
import { KPICard } from "../../components/cards/KPICard";
import { SectionCard } from "../../components/primitives/SectionCard";
import { DiagnosticBanner } from "../../components/primitives/DiagnosticBanner";
import { HorizontalBarList } from "../../components/charts/HorizontalBarList";
import { DataTable } from "../../components/postAward/DataTable";
import { PostAwardFileUpload } from "../../components/postAward/PostAwardFileUpload";
import { PrintReportFooter } from "../../components/print/PrintReportFooter";
import { usePostAwardStore, filterByAllowedProjects } from "../../store/usePostAwardStore";
import { categoricalColor } from "../../theme/tokens";
import {
  avgReviewDurationDays,
  formatCompact,
  overBudgetCount,
  overBudgetDataPopulated,
  overBudgetTotalValue,
  reviewAmountByDepartmentCurrency,
  reviewDurationBuckets,
  reviewOutcomeCounts,
  reviewsByDepartment,
  scClaimTotalAmount,
  scClaimTotalSaving,
  toBarRows,
} from "../../services/postAwardCalculations";

export function SubcontractorManagementPage() {
  const { isLoaded, scClaims, scDrafts, subcontractReviews, subcontractAgreements, warnings } = usePostAwardStore();
  const allowed = usePostAwardStore((s) => s.allowedProjectNames());

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex flex-col">
        <div style={{ padding: "16px 20px 4px" }}>
          <h1 className="font-bold" style={{ fontSize: "var(--text-display)", color: "var(--color-text-primary)" }}>
            Post-Award Portfolio
          </h1>
        </div>
        <div className="flex-1">
          <PostAwardFileUpload />
        </div>
      </div>
    );
  }

  const claims = filterByAllowedProjects(scClaims, allowed, (r) => r.projectName);
  const drafts = filterByAllowedProjects(scDrafts, allowed, (r) => r.projectName);
  const reviews = filterByAllowedProjects(subcontractReviews, allowed, (r) => r.projectName);
  const agreements = filterByAllowedProjects(subcontractAgreements, allowed, (r) => r.project);

  const outcomes = toBarRows(reviewOutcomeCounts(reviews));
  const departments = toBarRows(reviewsByDepartment(reviews));
  const durationBuckets = toBarRows(reviewDurationBuckets(reviews));
  const overBudgetPopulated = overBudgetDataPopulated(reviews);
  const deptCurrencyRows = reviewAmountByDepartmentCurrency(reviews);

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <PostAwardHeader title="Post-Award Portfolio" subtitle="Subcontractor Management" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 10 }}>
        <div className="flex gap-2" style={{ height: 100 }}>
          <KPICard compact icon={HardHat} label="SC Claims" value={claims.length} subtitle="Against ROWAD" />
          <KPICard compact icon={Gavel} label="SC Claim Amount" value={formatCompact(scClaimTotalAmount(claims))} valueTone="primary" />
          <KPICard compact icon={PiggyBank} label="SC Claim Savings" value={formatCompact(scClaimTotalSaving(claims))} valueTone="primary" />
          <KPICard compact icon={FileSignature} label="Subcontract Drafts" value={drafts.length} subtitle="Issued This Year" />
          <KPICard compact icon={Timer} label="Avg Review Duration" value={`${avgReviewDurationDays(reviews).toFixed(1)}d`} subtitle={`${reviews.length} Reviewed Packages`} />
          <KPICard compact
            icon={AlertOctagon}
            label="Over-Budget Reviews"
            value={overBudgetPopulated ? overBudgetCount(reviews) : "No data"}
            subtitle={overBudgetPopulated ? `Value ${formatCompact(overBudgetTotalValue(reviews))}` : "Column not recorded in workbook"}
          />
        </div>

        <div className="pf-row flex gap-2" style={{ height: 170 }}>
          <SectionCard title="Subcontract Review Outcome" className="flex-1" padding={10}>
            <HorizontalBarList rows={outcomes} labelWidth={150} rowColors={outcomes.map((_, i) => categoricalColor(i))} />
          </SectionCard>
          <SectionCard title="Reviews by Department" className="flex-1" padding={10}>
            <HorizontalBarList rows={departments} labelWidth={110} rowColors={departments.map((_, i) => categoricalColor(i))} />
          </SectionCard>
          <SectionCard title="Review Duration Distribution" className="flex-1" padding={10}>
            <HorizontalBarList rows={durationBuckets} labelWidth={60} rowColors={durationBuckets.map((_, i) => categoricalColor(i))} />
          </SectionCard>
        </div>

        <div className="shrink-0" style={{ height: 210 }}>
          <SectionCard
            title={`Subcontract Review Register (${reviews.length})`}
            info={agreements.length === 0 ? "Signed Subcontract Agreement register has no entries in this snapshot (template sheet)." : undefined}
            className="h-full"
            padding={10}
          >
            <DataTable
              rowKey={(r, i) => `${r.projectName}-${r.contractRef}-${i}`}
              rows={reviews}
              columns={[
                { key: "project", header: "Project", width: "16%", render: (r) => r.projectName },
                { key: "dept", header: "Department", width: "10%", render: (r) => r.departmentName },
                { key: "contractor", header: "Contractor", width: "16%", render: (r) => r.contractorName },
                { key: "scope", header: "Scope of Work", width: "22%", render: (r) => r.scopeOfWork },
                { key: "amount", header: "Amount", width: "12%", align: "right", render: (r) => formatCompact(r.amount) },
                { key: "duration", header: "Review Days", width: "10%", align: "right", render: (r) => (r.reviewDurationDays ?? "—").toString() },
                { key: "note", header: "Outcome", width: "14%", render: (r) => r.note },
              ]}
            />
          </SectionCard>
        </div>

        <div className="pf-row flex gap-2" style={{ height: 175 }}>
          <SectionCard
            title="Subcontract Review Amount by Department &amp; Currency"
            titleFontSize={10.5}
            info="Each currency column summed independently, never blended — mirrors last year's Department x Currency table. 'amount' is the sheet's base column; Dollars/Euros/SAR are its own supplementary per-currency columns."
            className="flex-1 min-h-0"
            padding={10}
          >
            <DataTable
              rowKey={(r) => r.department}
              rows={deptCurrencyRows}
              columns={[
                { key: "dept", header: "Dept.", width: "32%", render: (r) => r.department },
                { key: "egp", header: "EGP", width: "17%", align: "right", render: (r) => (r.EGP ? formatCompact(r.EGP) : "—") },
                { key: "usd", header: "USD", width: "17%", align: "right", render: (r) => (r.USD ? formatCompact(r.USD) : "—") },
                { key: "eur", header: "EUR", width: "17%", align: "right", render: (r) => (r.EUR ? formatCompact(r.EUR) : "—") },
                { key: "sar", header: "SAR", width: "17%", align: "right", render: (r) => (r.SAR ? formatCompact(r.SAR) : "—") },
              ]}
            />
          </SectionCard>
          <SectionCard title={`Subcontract Claims Register (${claims.length})`} className="flex-1 min-h-0" padding={10}>
            <DataTable
              rowKey={(r, i) => `${r.projectName}-${r.subcontractorName}-${i}`}
              rows={claims}
              columns={[
                { key: "project", header: "Project", width: "26%", render: (r) => r.projectName },
                { key: "sc", header: "Subcontractor", width: "26%", render: (r) => r.subcontractorName },
                { key: "type", header: "Claim Type", width: "20%", render: (r) => r.claimType },
                { key: "amount", header: "Amount", width: "14%", align: "right", render: (r) => formatCompact(r.amount) },
                { key: "granted", header: "Granted", width: "14%", render: (r) => r.granted || "—" },
              ]}
            />
          </SectionCard>
          <SectionCard title={`Subcontract Drafts Register (${drafts.length})`} className="flex-1 min-h-0" padding={10}>
            <DataTable
              rowKey={(r, i) => `${r.projectName}-${r.subcontractorName}-${i}`}
              rows={drafts}
              columns={[
                { key: "project", header: "Project", width: "32%", render: (r) => r.projectName },
                { key: "sc", header: "Subcontractor", width: "32%", render: (r) => r.subcontractorName },
                { key: "value", header: "Value", width: "20%", align: "right", render: (r) => formatCompact(r.contractValue) },
                { key: "status", header: "Status", width: "16%", render: (r) => r.status || "—" },
              ]}
            />
          </SectionCard>
        </div>
      </div>
      <PrintReportFooter />
    </div>
  );
}
