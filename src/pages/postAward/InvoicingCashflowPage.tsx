import { Receipt, CheckSquare, Wallet, AlertOctagon, FileClock, ShieldQuestion, CalendarClock } from "lucide-react";
import { PostAwardHeader } from "../../components/postAward/PostAwardHeader";
import { KPICard } from "../../components/cards/KPICard";
import { PostAwardCurrencyBreakdownValue } from "../../components/postAward/PostAwardCurrencyBreakdownValue";
import { SectionCard } from "../../components/primitives/SectionCard";
import { DiagnosticBanner } from "../../components/primitives/DiagnosticBanner";
import { DataTable } from "../../components/postAward/DataTable";
import { HorizontalBarList } from "../../components/charts/HorizontalBarList";
import { PostAwardFileUpload } from "../../components/postAward/PostAwardFileUpload";
import { PrintReportFooter } from "../../components/print/PrintReportFooter";
import { usePostAwardStore, filterByAllowedProjects } from "../../store/usePostAwardStore";
import { categoricalColor } from "../../theme/tokens";
import {
  avgPaymentContractualDurationDays,
  formatCompact,
  invoiceDelayedByCurrency,
  invoiceGrossCertifiedByCurrency,
  invoiceGrossSubmittedByCurrency,
  invoiceNetCertifiedByCurrency,
  invoicePaidByCurrency,
  invoicesWithDelayCount,
  invoicesWithPaymentDateCount,
  topDelayedProjects,
} from "../../services/postAwardCalculations";

export function InvoicingCashflowPage() {
  const { isLoaded, invoices, currency, warnings } = usePostAwardStore();
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

  const rows = filterByAllowedProjects(invoices, allowed, (i) => i.projectName);
  const submitted = invoiceGrossSubmittedByCurrency(rows);
  const certified = invoiceGrossCertifiedByCurrency(rows);
  const netCertified = invoiceNetCertifiedByCurrency(rows);
  const paid = invoicePaidByCurrency(rows);
  const delayed = invoiceDelayedByCurrency(rows);
  const delayedCount = invoicesWithDelayCount(rows);
  const topDelayed = topDelayedProjects(rows, 8);
  const paymentSla = avgPaymentContractualDurationDays(rows);
  const withPaymentDate = invoicesWithPaymentDateCount(rows);
  const topDelayedGrandTotal = topDelayed.reduce((s, r) => s + r.total, 0);
  const topDelayedRows = topDelayed.map((r) => ({
    label: r.project,
    count: r.total,
    pct: topDelayedGrandTotal === 0 ? 0 : r.total / topDelayedGrandTotal,
    // Bar length uses `total` (sum across currencies), but every project in
    // this workbook's Invoice sheet is single-currency (verified against the
    // real data — 0 of 39 projects span more than one), so this is never an
    // actual cross-currency blend; it just equals that project's one amount.
    // The printed text is always the real per-currency breakdown, not the
    // blended number.
    valueText:
      Object.entries(r.amounts)
        .filter(([, v]) => (v ?? 0) > 0)
        .map(([c, v]) => `${c} ${formatCompact(v as number)}`)
        .join(", ") || "—",
  }));

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <PostAwardHeader title="Post-Award Portfolio" subtitle="Invoicing &amp; Cashflow" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        <div className="flex gap-2" style={{ height: 100 }}>
          <KPICard compact icon={Receipt} label="Invoices Recorded" value={rows.length} subtitle="All IPCs" />
          <KPICard compact
            icon={FileClock}
            label="Gross Submitted"
            value={currency ? formatCompact(submitted[currency] ?? 0) : <PostAwardCurrencyBreakdownValue amounts={submitted} />}
          />
          <KPICard compact
            icon={CheckSquare}
            label="Gross Certified"
            value={currency ? formatCompact(certified[currency] ?? 0) : <PostAwardCurrencyBreakdownValue amounts={certified} />}
            valueTone="primary"
          />
          <KPICard compact
            icon={CheckSquare}
            label="Net Certified"
            value={currency ? formatCompact(netCertified[currency] ?? 0) : <PostAwardCurrencyBreakdownValue amounts={netCertified} />}
            valueTone="primary"
          />
          <KPICard compact
            icon={Wallet}
            label="Payment Received"
            value={currency ? formatCompact(paid[currency] ?? 0) : <PostAwardCurrencyBreakdownValue amounts={paid} />}
            valueTone="primary"
          />
          <KPICard compact
            icon={AlertOctagon}
            label="Delayed Payments"
            value={currency ? formatCompact(delayed[currency] ?? 0) : <PostAwardCurrencyBreakdownValue amounts={delayed} />}
          />
          <KPICard compact icon={AlertOctagon} label="Invoices Delayed" value={delayedCount} subtitle={`Out of ${rows.length} Invoices`} />
        </div>

        <div className="shrink-0" style={{ height: 84 }}>
          <SectionCard
            title="Payment SLA &amp; Aging Coverage"
            info="Payment Date is recorded on a minority of invoices in this workbook — treat the figures below as a partial sample, not full-register aging."
            className="h-full"
            padding={10}
          >
            <div className="h-full flex flex-col justify-center gap-1.5">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CalendarClock size={16} color="var(--color-secondary)" />
                  <span style={{ fontSize: 11, color: "var(--color-text-body)" }}>
                    Avg Contractual Duration: <strong>{paymentSla.sampleSize > 0 ? `${paymentSla.avgDays.toFixed(0)}d` : "—"}</strong>{" "}
                    <span style={{ color: "var(--color-text-muted)" }}>({paymentSla.sampleSize} of {rows.length} invoices)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldQuestion size={16} color="var(--color-secondary)" />
                  <span style={{ fontSize: 11, color: "var(--color-text-body)" }}>
                    Payment Date Recorded: <strong>{withPaymentDate} of {rows.length}</strong>{" "}
                    <span style={{ color: "var(--color-text-muted)" }}>({rows.length > 0 ? ((withPaymentDate / rows.length) * 100).toFixed(0) : 0}% coverage)</span>
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 10.5, color: "var(--color-text-muted)", fontStyle: "italic", lineHeight: 1.3 }}>
                Note: Gross vs Net Certified is not a reliable retention ratio in this sheet (rows differ by 10-30x, likely cumulative vs per-IPC figures) — shown as separate raw KPIs only, no deduction figure is derived.
              </span>
            </div>
          </SectionCard>
        </div>

        <div className="pf-row" style={{ height: 175 }}>
          <SectionCard
            title={`Top Projects by Delayed Payment Amount (${topDelayed.length})`}
            info="Delayed = certified amount not yet received within the contractual payment window. Bar length is each project's own amount — every project here is single-currency, so nothing is blended across currencies."
            className="h-full"
            padding={10}
          >
            <HorizontalBarList rows={topDelayedRows} labelWidth={220} valueWidth={110} rowColors={topDelayedRows.map((_, i) => categoricalColor(i))} />
          </SectionCard>
        </div>

        <SectionCard title={`Invoice Register (${rows.length})`} className="flex-1 min-h-0" padding={10}>
          <DataTable
            rowKey={(r, i) => `${r.projectName}-${r.invoiceNo}-${i}`}
            rows={rows}
            columns={[
              { key: "project", header: "Project", width: "22%", render: (r) => r.projectName },
              { key: "no", header: "Invoice No.", width: "10%", render: (r) => r.invoiceNo },
              { key: "currency", header: "Currency", width: "10%", render: (r) => r.currency ?? "—" },
              { key: "submitted", header: "Gross Submitted", width: "16%", align: "right", render: (r) => formatCompact(r.grossSubmitted) },
              { key: "certified", header: "Gross Certified", width: "16%", align: "right", render: (r) => formatCompact(r.grossCertified) },
              { key: "paid", header: "Payment", width: "13%", align: "right", render: (r) => formatCompact(r.paymentAmount) },
              { key: "delayed", header: "Delayed", width: "13%", align: "right", render: (r) => formatCompact(r.totalDelayedPayments) },
            ]}
          />
        </SectionCard>
      </div>
      <PrintReportFooter />
    </div>
  );
}
