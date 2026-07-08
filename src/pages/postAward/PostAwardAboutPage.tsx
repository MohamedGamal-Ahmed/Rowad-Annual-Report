import { FileText, Calendar, Tag, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PostAwardHeader } from "../../components/postAward/PostAwardHeader";
import { SectionCard } from "../../components/primitives/SectionCard";
import { IconBadge } from "../../components/primitives/IconBadge";
import { PostAwardFileUpload } from "../../components/postAward/PostAwardFileUpload";
import { PrintReportFooter } from "../../components/print/PrintReportFooter";
import { usePostAwardStore } from "../../store/usePostAwardStore";
import { POST_AWARD_SNAPSHOT_DATE_LABEL, POST_AWARD_REPORT_PERIOD_LABEL, POST_AWARD_REPORT_VERSION } from "../../config/snapshot";

/** Post-Award counterpart of AboutPage.tsx — same audit-trail surface,
 * sourced from the Post-Award store's own parser-generated notes (this
 * workbook ships no curated Data_Quality_Notes sheet of its own, unlike
 * Pre-Award, so every note here is either a parser observation or a fixed
 * business rule, never a fabricated caveat). */
export function PostAwardAboutPage() {
  const { isLoaded, fileName, loadedAt, dataQualityNotes } = usePostAwardStore();

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex flex-col">
        <div style={{ padding: "16px 20px 4px" }}>
          <h1 className="font-bold" style={{ fontSize: "var(--text-display)", color: "var(--color-text-primary)" }}>
            About This Report
          </h1>
        </div>
        <div className="flex-1">
          <PostAwardFileUpload />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <PostAwardHeader title="Post-Award Portfolio" subtitle="About This Report" />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        <div className="flex gap-2" style={{ height: 90 }}>
          <MetaCard icon={Calendar} tone="navy" label="Reporting Period" value={POST_AWARD_REPORT_PERIOD_LABEL} />
          <MetaCard icon={Calendar} tone="rose" label="Snapshot Date" value={POST_AWARD_SNAPSHOT_DATE_LABEL} />
          <MetaCard icon={Tag} tone="gold" label="Report Version" value={POST_AWARD_REPORT_VERSION} />
          <MetaCard
            icon={FileText}
            tone="teal"
            label="Source Workbook"
            value={fileName ?? "-"}
            subtitle={loadedAt ? `Uploaded ${loadedAt.toLocaleString()}` : undefined}
          />
        </div>

        <div className="flex gap-2 flex-1 min-h-0">
          <SectionCard title="Definitions &amp; Business Rules" className="flex-1 min-w-0" padding={12}>
            <div className="h-full overflow-auto" style={{ fontSize: 11.5, color: "var(--color-text-body)", lineHeight: 1.5 }}>
              <p><strong style={{ color: "var(--color-text-primary)" }}>Scope:</strong> This report covers Post-Award / execution-phase data — Project Information, Client Claims, Variation Orders, Invoices, TOC/DLC closeout, Subcontractor Claims &amp; Drafts, Correspondence, and Special Agreements. It is a separate, independently-uploaded workbook from the Pre-Award report.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Currency:</strong> Amounts are always per currency (EGP/USD/SAR/EUR) and are never summed across currencies, same rule as Pre-Award.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Pending Claim Amount:</strong> The workbook's own "Pending Amount" column on Client Claim — not re-derived from Submitted minus Approved.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Closed Out (TOC/DLC):</strong> Status recorded as "Approved" or "Issued" on the HO TOC sheet. "Not Due" means the contractual milestone hasn't been reached yet — it is not a completed or overdue state.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Project Master Register:</strong> Sourced from the workbook's own "Drob List" sheet — a per-project rollup the workbook owner already maintains across every other sheet. Shown as-is, never recomputed.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Approval Rate (Claims/VO):</strong> Approved+Settled claims (or approved VO count) divided by the total — a resolved-outcome share, not a processing-time measure.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Cycle Time:</strong> Average calendar days from Submitted Date to Approved Date, computed only over records where BOTH dates are recorded — most claims are still Pending with no approved date, so this is a partial-sample average (sample size always shown alongside it).</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Schedule Slippage / Value Variance:</strong> A project counts only when its Revised figure is recorded AND actually differs from Original — a populated-but-identical revised cell is not counted as a change.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Over-Budget (Subcontract Review):</strong> This column is entirely unpopulated in the current workbook — the KPI explicitly reads "No data" rather than a misleading 0.</p>
              <p style={{ marginTop: 8 }}><strong style={{ color: "var(--color-text-primary)" }}>Project / Owner Entity filters:</strong> Apply across every page by matching Project Name; Currency is a disconnected selector that scopes financial figures only, never row counts.</p>
            </div>
          </SectionCard>
          <SectionCard title={`Data Quality Notes (${dataQualityNotes.length})`} className="flex-1 min-w-0" padding={12}>
            <div className="h-full overflow-auto flex flex-col" style={{ gap: 8 }}>
              {dataQualityNotes.length === 0 ? (
                <div className="h-full flex items-center justify-center" style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>
                  No data quality notes recorded for the current workbook.
                </div>
              ) : (
                dataQualityNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2" style={{ paddingBottom: 6, borderBottom: i < dataQualityNotes.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <IconBadge icon={AlertCircle} tone="rose" size={22} />
                    <span style={{ fontSize: 10.5, color: "var(--color-text-body)", lineHeight: 1.35 }}>{note}</span>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="flex gap-2 shrink-0" style={{ height: 74 }}>
          <SectionCard title="Classification" className="flex-1" padding={10}>
            <div style={{ fontSize: 11, color: "var(--color-text-body)", lineHeight: 1.4 }}>
              <strong style={{ color: "var(--color-primary)" }}>CONFIDENTIAL — Internal Use Only.</strong> This report contains project, client, subcontractor, and financial information. Distribution is restricted to ROWAD leadership and the Post-Award / Contracts team.
            </div>
          </SectionCard>
        </div>
      </div>
      <PrintReportFooter />
    </div>
  );
}

interface MetaCardProps {
  icon: LucideIcon;
  tone: "navy" | "rose" | "gold" | "teal";
  label: string;
  value: string;
  subtitle?: string;
}

function MetaCard({ icon: Icon, tone, label, value, subtitle }: MetaCardProps) {
  return (
    <div className="flex-1 flex flex-col justify-center bg-card" style={{ border: "1px solid var(--color-border)", borderRadius: 14, padding: "10px 14px", minWidth: 0 }}>
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
