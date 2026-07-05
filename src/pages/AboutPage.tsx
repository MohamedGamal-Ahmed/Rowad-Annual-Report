import { FileText, Calendar, Tag, AlertCircle } from "lucide-react";
import { DashboardHeader } from "../components/header/DashboardHeader";
import { SectionCard } from "../components/primitives/SectionCard";
import { IconBadge } from "../components/primitives/IconBadge";
import { FileUpload } from "../components/FileUpload";
import { PrintReportFooter } from "../components/print/PrintReportFooter";
import { useDashboardStore } from "../store/useDashboardStore";
import { SNAPSHOT_DATE_LABEL, REPORT_PERIOD_LABEL, REPORT_VERSION } from "../config/snapshot";

/** About This Report — the report's own audit trail surface. Renders the
 *  snapshot date, report version, workbook-approved Data Quality Notes,
 *  and the definitions of the ratios that appear elsewhere in the report.
 *  Every string here is either a constant or comes directly from the
 *  uploaded workbook's Data_Quality_Notes sheet — no interpretation. */
export function AboutPage() {
  const { isLoaded, fileName, loadedAt, dataQualityNotes } = useDashboardStore();

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex flex-col">
        <div style={{ padding: "16px 20px 4px" }}>
          <h1 className="font-bold" style={{ fontSize: "var(--text-display)", color: "var(--color-text-primary)" }}>
            About This Report
          </h1>
        </div>
        <div className="flex-1">
          <FileUpload />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <DashboardHeader title="Pre-Award Snapshot Dashboard (H1 2026)" subtitle="About This Report" />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        {/* Row 1: Meta strip (period, snapshot date, version, workbook) */}
        <div className="flex gap-2" style={{ height: 90 }}>
          <MetaCard icon={Calendar} tone="navy" label="Reporting Period" value={REPORT_PERIOD_LABEL} />
          <MetaCard icon={Calendar} tone="rose" label="Snapshot Date" value={SNAPSHOT_DATE_LABEL} />
          <MetaCard icon={Tag} tone="gold" label="Report Version" value={REPORT_VERSION} />
          <MetaCard
            icon={FileText}
            tone="teal"
            label="Source Workbook"
            value={fileName ?? "-"}
            subtitle={loadedAt ? `Uploaded ${loadedAt.toLocaleString()}` : undefined}
          />
        </div>

        {/* Row 2: Definitions + Data Quality Notes */}
        <div className="flex gap-2 flex-1 min-h-0">
          <SectionCard title="Definitions" className="flex-1 min-w-0" padding={12}>
            <div className="h-full overflow-auto" style={{ fontSize: 11.5, color: "var(--color-text-body)", lineHeight: 1.5 }}>
              <p><strong style={{ color: "var(--color-text-primary)" }}>Awarded / Won:</strong> A project is Awarded (Status = Won, Flag_Award = 1) if and only if it has an Amount &gt; 0 in any currency. This is the source-of-truth definition — no other rule qualifies a project as Won.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Win Rate:</strong> Awarded projects ÷ Total opportunities.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Pipeline Conversion:</strong> Awarded projects ÷ Projects that reached the Contract Qualifications milestone.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Status:</strong> Won / Risk Assessment / In Negotiation. Derived: Amount &gt; 0 → Won. Else if Negotiation column filled → In Negotiation. Else → Risk Assessment.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Milestones:</strong> Contract Qualifications, Risk Assessment, Contract Summary, Negotiation, Award. These are <em>independent</em> flags — not a sequential funnel. Non-monotonic on real data.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Currency:</strong> Amounts are always per currency. The report never sums across currencies. Choose a currency from the filter, or view per-currency breakdowns.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Composite Assignee:</strong> Joint-ownership pairs (e.g. Hana&Donia) are single buckets, never split into individual attribution.</p>
            </div>
          </SectionCard>
          <SectionCard title={`Data Quality Notes (${dataQualityNotes.length})`} className="flex-1 min-w-0" padding={12}>
            <div className="h-full overflow-auto flex flex-col" style={{ gap: 8 }}>
              {dataQualityNotes.length === 0 ? (
                <div className="h-full flex items-center justify-center" style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>
                  No data quality notes recorded in the current workbook.
                </div>
              ) : (
                dataQualityNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2" style={{ paddingBottom: 6, borderBottom: i < dataQualityNotes.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <IconBadge icon={AlertCircle} tone="rose" size={22} />
                    <span style={{ fontSize: 10.5, color: "var(--color-text-body)", lineHeight: 1.35 }}>
                      {note}
                    </span>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        {/* Row 3: Classification + Distribution note */}
        <div className="flex gap-2 shrink-0" style={{ height: 74 }}>
          <SectionCard title="Classification" className="flex-1" padding={10}>
            <div style={{ fontSize: 11, color: "var(--color-text-body)", lineHeight: 1.4 }}>
              <strong style={{ color: "var(--color-primary)" }}>CONFIDENTIAL — Internal Use Only.</strong> This report contains project, client, counterparty, staff and financial information. Distribution is restricted to ROWAD leadership and the Pre-Award team.
            </div>
          </SectionCard>
        </div>
      </div>
      <PrintReportFooter />
    </div>
  );
}

interface MetaCardProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  tone: "navy" | "rose" | "gold" | "teal";
  label: string;
  value: string;
  subtitle?: string;
}

function MetaCard({ icon: Icon, tone, label, value, subtitle }: MetaCardProps) {
  return (
    <div className="flex-1 flex flex-col justify-center bg-card" style={{
      border: "1px solid var(--color-border)",
      borderRadius: 14,
      padding: "10px 14px",
      minWidth: 0,
    }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
        <IconBadge icon={Icon} tone={tone} size={22} />
        <span className="font-semibold uppercase" style={{ fontSize: 9.5, color: "var(--color-text-muted)", letterSpacing: 0.4 }}>
          {label}
        </span>
      </div>
      <span className="font-bold truncate" style={{ fontSize: 15, color: "var(--color-text-primary)" }}>
        {value}
      </span>
      {subtitle && (
        <span className="truncate" style={{ fontSize: 9.5, color: "var(--color-text-muted)", marginTop: 2 }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
