import { Handshake, FileCheck2, PenTool, PauseCircle } from "lucide-react";
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
import { agreementStatusCounts, agreementTypeCounts, toBarRows } from "../../services/postAwardCalculations";

export function SpecialAgreementsPage() {
  const { isLoaded, specialAgreements, warnings } = usePostAwardStore();
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

  const rows = filterByAllowedProjects(specialAgreements, allowed, (r) => r.project);
  const statuses = toBarRows(agreementStatusCounts(rows));
  const types = toBarRows(agreementTypeCounts(rows));
  const signed = rows.filter((r) => /^signed$/i.test(r.status)).length;
  const underSignature = rows.filter((r) => /under signature/i.test(r.status)).length;
  const suspended = rows.filter((r) => /suspended/i.test(r.status)).length;

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <PostAwardHeader title="Post-Award Portfolio" subtitle="Special Agreements" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        <div className="flex gap-2" style={{ height: 100 }}>
          <KPICard compact icon={Handshake} label="Total Agreements" value={rows.length} subtitle="JV / Novation / Settlement / Consultancy" />
          <KPICard compact icon={FileCheck2} label="Signed" value={signed} valueTone="primary" subtitle={`Out of ${rows.length}`} />
          <KPICard compact icon={PenTool} label="Under Signature" value={underSignature} />
          <KPICard compact icon={PauseCircle} label="Suspended" value={suspended} />
        </div>

        <div className="pf-row flex gap-2" style={{ height: 200 }}>
          <SectionCard title="Agreements by Status" className="flex-1" padding={10}>
            <HorizontalBarList rows={statuses} labelWidth={110} rowColors={statuses.map((_, i) => categoricalColor(i))} />
          </SectionCard>
          <SectionCard title="Agreements by Contract Type" className="flex-1" padding={10}>
            <HorizontalBarList rows={types} labelWidth={110} rowColors={types.map((_, i) => categoricalColor(i))} />
          </SectionCard>
        </div>

        <SectionCard title={`Special Agreements Register (${rows.length})`} className="flex-1 min-h-0" padding={10}>
          <DataTable
            rowKey={(r, i) => `${r.project}-${r.agreement}-${i}`}
            rows={rows}
            columns={[
              { key: "project", header: "Project", width: "24%", render: (r) => r.project },
              { key: "agreement", header: "Agreement", width: "22%", render: (r) => r.agreement },
              { key: "type", header: "Contract Type", width: "16%", render: (r) => r.contractType },
              { key: "parties", header: "Parties", width: "26%", render: (r) => r.parties },
              { key: "status", header: "Status", width: "12%", render: (r) => r.status },
            ]}
          />
        </SectionCard>
      </div>
      <PrintReportFooter />
    </div>
  );
}
