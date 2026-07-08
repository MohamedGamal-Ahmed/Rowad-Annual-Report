import { FileWarning, CheckCircle2, FileStack, Hourglass, Percent, Timer, Scale, CalendarClock } from "lucide-react";
import { PostAwardHeader } from "../../components/postAward/PostAwardHeader";
import { KPICard } from "../../components/cards/KPICard";
import { PostAwardCurrencyBreakdownValue } from "../../components/postAward/PostAwardCurrencyBreakdownValue";
import { CurrencyDonut } from "../../components/postAward/CurrencyDonut";
import { SectionCard } from "../../components/primitives/SectionCard";
import { DiagnosticBanner } from "../../components/primitives/DiagnosticBanner";
import { HorizontalBarList } from "../../components/charts/HorizontalBarList";
import { DataTable } from "../../components/postAward/DataTable";
import { PostAwardFileUpload } from "../../components/postAward/PostAwardFileUpload";

import { PrintReportFooter } from "../../components/print/PrintReportFooter";
import { usePostAwardStore, filterByAllowedProjects } from "../../store/usePostAwardStore";
import { categoricalColor } from "../../theme/tokens";
import {
  claimsApprovalRate,
  claimsByStatus,
  claimsByType,
  claimsByTypeCurrencyBreakdown,
  claimsCycleTimeAvgDays,
  formatCompact,
  pendingClaimAmountByCurrency,
  topProjectsByPendingClaim,
  toBarRows,
  totalApprovedEotDays,
  totalSubmittedEotDays,
  voApprovalRate,
  voApprovedByCurrency,
  voApprovedCountTotal,
  voCancelledCountTotal,
  voOmissionByCurrency,
  voPendingByCurrency,
  voPendingCountByCurrency,
  voPendingCountTotal,
  voSubmittedByCurrency,
  voSubmittedCountTotal,
} from "../../services/postAwardCalculations";

export function ClaimsVoPage() {
  const { isLoaded, clientClaims, variationOrders, currency, warnings } = usePostAwardStore();
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

  const claims = filterByAllowedProjects(clientClaims, allowed, (c) => c.projectName);
  const vos = filterByAllowedProjects(variationOrders, allowed, (v) => v.projectName);
  const statuses = toBarRows(claimsByStatus(claims));
  const types = toBarRows(claimsByType(claims));
  const pending = pendingClaimAmountByCurrency(claims);
  const topPending = topProjectsByPendingClaim(claims, 6);
  const approvalRate = claimsApprovalRate(claims);
  const cycleTime = claimsCycleTimeAvgDays(claims);
  const submittedEot = totalSubmittedEotDays(claims);
  const approvedEot = totalApprovedEotDays(claims);
  const typeCurrencyBreakdown = claimsByTypeCurrencyBreakdown(claims);

  const voSubmitted = voSubmittedByCurrency(vos);
  const voApproved = voApprovedByCurrency(vos);
  const voPending = voPendingByCurrency(vos);
  const voPendingCounts = voPendingCountByCurrency(vos);
  const voOmission = voOmissionByCurrency(vos);
  const voApprovalPct = voApprovalRate(vos);
  const voSubmittedCount = voSubmittedCountTotal(vos);
  const voApprovedCount = voApprovedCountTotal(vos);
  const voPendingCount = voPendingCountTotal(vos);
  const voCancelledCount = voCancelledCountTotal(vos);
  const voCountRows = [
    { label: "Submitted", count: voSubmittedCount, pct: 0 },
    { label: "Approved", count: voApprovedCount, pct: 0 },
    { label: "Pending", count: voPendingCount, pct: 0 },
    { label: "Cancelled/Rejected", count: voCancelledCount, pct: 0 },
  ].map((r) => ({ ...r, pct: voSubmittedCount === 0 ? 0 : r.count / voSubmittedCount }));

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <PostAwardHeader title="Post-Award Portfolio" subtitle="Claims &amp; Variation Orders" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        <div className="flex gap-2" style={{ height: 100 }}>
          <KPICard compact icon={FileWarning} label="Client Claims" value={claims.length} subtitle="All Claim Records" />
          <KPICard compact
            icon={Percent}
            label="Claims Approval Rate"
            value={`${(approvalRate * 100).toFixed(0)}%`}
            valueTone="primary"
            subtitle="Approved + Settled / Total"
          />
          <KPICard compact
            icon={Timer}
            label="Avg Claim Cycle Time"
            value={cycleTime.sampleSize > 0 ? `${cycleTime.avgDays.toFixed(0)}d` : "—"}
            subtitle={`Submitted→Approved (n=${cycleTime.sampleSize})`}
          />
          <KPICard compact
            icon={Hourglass}
            label="Pending Claim Amount"
            value={currency ? formatCompact(pending[currency] ?? 0) : <PostAwardCurrencyBreakdownValue amounts={pending} />}
            valueTone="primary"
          />
          <KPICard compact
            icon={Scale}
            label="VO Approval Rate"
            value={`${(voApprovalPct * 100).toFixed(0)}%`}
            valueTone="primary"
            subtitle={`${voApprovedCount} of ${voSubmittedCount} Submitted`}
          />
          <KPICard compact
            icon={FileStack}
            label="VO Submitted"
            value={currency ? formatCompact(voSubmitted[currency] ?? 0) : <PostAwardCurrencyBreakdownValue amounts={voSubmitted} />}
          />
          <KPICard compact
            icon={CheckCircle2}
            label="VO Approved"
            value={currency ? formatCompact(voApproved[currency] ?? 0) : <PostAwardCurrencyBreakdownValue amounts={voApproved} />}
            valueTone="primary"
          />
          <KPICard compact
            icon={FileStack}
            label="Total Omission"
            value={currency ? formatCompact(voOmission[currency] ?? 0) : <PostAwardCurrencyBreakdownValue amounts={voOmission} />}
          />
        </div>

        <div className="flex gap-2 shrink-0" style={{ height: 44 }}>
          <SectionCard title="EOT Claimed vs Approved (Days)" className="flex-1" padding={10}>
            <div className="h-full flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} color="var(--color-secondary)" />
                <span style={{ fontSize: 11, color: "var(--color-text-body)" }}>
                  Total Submitted: <strong>{submittedEot.sampleSize > 0 ? submittedEot.totalDays.toLocaleString() : "—"}d</strong>{" "}
                  <span style={{ color: "var(--color-text-muted)" }}>(n={submittedEot.sampleSize})</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock size={16} color="var(--color-secondary)" />
                <span style={{ fontSize: 11, color: "var(--color-text-body)" }}>
                  Total Approved: <strong>{approvedEot.sampleSize > 0 ? approvedEot.totalDays.toLocaleString() : "—"}d</strong>{" "}
                  <span style={{ color: "var(--color-text-muted)" }}>(n={approvedEot.sampleSize})</span>
                </span>
              </div>
              <span style={{ fontSize: 10.5, color: "var(--color-text-muted)", fontStyle: "italic" }}>
                Rows recorded as "settled" or "-" instead of a day count are excluded from both totals, not counted as 0.
              </span>
            </div>
          </SectionCard>
        </div>

        <div className="pf-row flex gap-2" style={{ height: 190 }}>
          <SectionCard title="Claims by Status" className="flex-1" padding={10}>
            <HorizontalBarList rows={statuses} labelWidth={100} rowColors={statuses.map((_, i) => categoricalColor(i))} />
          </SectionCard>
          <SectionCard title="Claims by Type" className="flex-1" padding={10}>
            <HorizontalBarList rows={types} labelWidth={100} rowColors={types.map((_, i) => categoricalColor(i))} />
          </SectionCard>
          <SectionCard
            title="VO Counts by Stage"
            info="These are the sheet's own 'No.' columns — a count of VOs per project/stage, not identifiers."
            className="flex-1"
            padding={10}
          >
            <HorizontalBarList rows={voCountRows} labelWidth={110} rowColors={voCountRows.map((_, i) => categoricalColor(i))} />
          </SectionCard>
          <SectionCard
            title="VO Pending — by Currency"
            info="Donut is sized by number of pending VOs per currency (never by blended amount — EGP/USD/SAR/EUR figures aren't comparable magnitudes). Actual pending amount per currency is shown in the legend."
            className="flex-1"
            padding={10}
          >
            <CurrencyDonut amounts={voPending} counts={voPendingCounts} />
          </SectionCard>
        </div>

        <div className="pf-row flex gap-2" style={{ height: 260 }}>
          <SectionCard
            title={`Claims by Type — Amount by Currency (${typeCurrencyBreakdown.length})`}
            info="Submitted / Approved / Pending amount per claim type, per currency — never blended across currencies. EOT rows show 0 here since EOT is measured in days (see Days KPIs above), not currency."
            className="flex-1"
            padding={10}
          >
            <DataTable
              rowKey={(r) => `${r.claimType}-${r.currency}`}
              rows={typeCurrencyBreakdown}
              columns={[
                { key: "type", header: "Claim Type", width: "26%", render: (r) => r.claimType },
                { key: "currency", header: "Currency", width: "14%", render: (r) => r.currency },
                { key: "submitted", header: "Submitted", width: "20%", align: "right", render: (r) => formatCompact(r.submitted) },
                { key: "approved", header: "Approved", width: "20%", align: "right", render: (r) => formatCompact(r.approved) },
                { key: "pending", header: "Pending", width: "20%", align: "right", render: (r) => formatCompact(r.pending) },
              ]}
            />
          </SectionCard>
          <SectionCard title={`Top Projects by Pending Claim Amount (${topPending.length})`} className="flex-1" padding={10}>
            <DataTable
              rowKey={(r) => r.project}
              rows={topPending}
              columns={[
                { key: "project", header: "Project Name", width: "45%", render: (r) => r.project },
                { key: "amounts", header: "Pending Amount by Currency", width: "55%", render: (r) => formatBreakdown(r.amounts) },
              ]}
            />
          </SectionCard>
        </div>
      </div>
      <PrintReportFooter />
    </div>
  );
}

function formatBreakdown(amounts: Partial<Record<string, number>>): string {
  const entries = Object.entries(amounts).filter(([, v]) => (v ?? 0) > 0);
  if (entries.length === 0) return "—";
  return entries.map(([c, v]) => `${c} ${formatCompact(v as number)}`).join(", ");
}
