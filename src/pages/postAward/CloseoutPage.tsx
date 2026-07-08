import { ClipboardCheck, ShieldCheck, Hourglass, AlertTriangle } from "lucide-react";
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
  closedOutCount,
  dlcStatusCounts,
  formatCompact,
  pendingCloseoutProjects,
  tocStatusCounts,
  tocSubmittedCount,
  toBarRows,
} from "../../services/postAwardCalculations";

export function CloseoutPage() {
  const { isLoaded, tocDlc, warnings } = usePostAwardStore();
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

  const rows = filterByAllowedProjects(tocDlc, allowed, (r) => r.projectName);
  const tocRows = toBarRows(tocStatusCounts(rows));
  const dlcRows = toBarRows(dlcStatusCounts(rows));
  const closed = closedOutCount(rows);
  const pending = pendingCloseoutProjects(rows);
  const notDue = rows.filter((r) => /not due/i.test(r.status)).length;

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <PostAwardHeader title="Post-Award Portfolio" subtitle="TOC / DLC Closeout Tracking" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        <div className="flex gap-2" style={{ height: 100 }}>
          <KPICard compact icon={ClipboardCheck} label="Projects Tracked" value={rows.length} subtitle="TOC/DLC Register" />
          <KPICard compact icon={ClipboardCheck} label="TOC Submitted" value={tocSubmittedCount(rows)} subtitle={`Out of ${rows.length} Projects`} />
          <KPICard compact icon={ShieldCheck} label="Closed Out" value={closed} valueTone="primary" subtitle="TOC Approved/Issued" />
          <KPICard compact icon={Hourglass} label="Not Yet Due" value={notDue} subtitle="Contractually Not Due" />
          <KPICard compact icon={AlertTriangle} label="Pending Action" value={pending.length} subtitle="Awaiting TOC/DLC Action" />
        </div>

        <div className="pf-row flex gap-2" style={{ height: 200 }}>
          <SectionCard title="TOC Status Distribution" className="flex-1" padding={10}>
            <HorizontalBarList rows={tocRows} labelWidth={100} rowColors={tocRows.map((_, i) => categoricalColor(i))} />
          </SectionCard>
          <SectionCard title="DLC Status Distribution" className="flex-1" padding={10}>
            <HorizontalBarList rows={dlcRows} labelWidth={100} rowColors={dlcRows.map((_, i) => categoricalColor(i))} />
          </SectionCard>
        </div>

        <SectionCard title={`Projects Pending TOC/DLC Action (${pending.length})`} className="flex-1 min-h-0" padding={10}>
          <DataTable
            rowKey={(r) => r.projectName}
            rows={pending}
            columns={[
              { key: "project", header: "Project Name", width: "24%", render: (r) => r.projectName },
              { key: "tocStatus", header: "TOC Status", width: "12%", render: (r) => r.status },
              {
                key: "tocSubmitted",
                header: "TOC Submitted",
                width: "18%",
                render: (r) =>
                  r.tocSubmittedDate
                    ? `${r.tocSubmittedDate.toLocaleDateString()}${r.tocSubmittedAmount ? ` (${formatCompact(r.tocSubmittedAmount)})` : ""}`
                    : "Not yet submitted",
              },
              { key: "dlcStatus", header: "DLC Status", width: "12%", render: (r) => r.dlcStatus },
              { key: "tocDate", header: "TOC Date", width: "12%", render: (r) => (r.tocDate ? r.tocDate.toLocaleDateString() : "—") },
              { key: "dlcDate", header: "DLC Date", width: "12%", render: (r) => (r.dlcDate ? r.dlcDate.toLocaleDateString() : "—") },
              { key: "currency", header: "Currency", width: "10%", render: (r) => r.currency ?? "—" },
            ]}
          />
        </SectionCard>
      </div>
      <PrintReportFooter />
    </div>
  );
}
