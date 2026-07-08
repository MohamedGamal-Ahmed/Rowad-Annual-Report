import { Mail, Send, Inbox, ListChecks, Layers } from "lucide-react";
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
  topProjectsByLetterVolume,
  totalCorrespondenceIssued,
  totalMainContractLetters,
  totalSubcontractorLetters,
} from "../../services/postAwardCalculations";

export function CorrespondenceRegisterPage() {
  const { isLoaded, correspondence, projectRegister, warnings } = usePostAwardStore();
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

  const corr = filterByAllowedProjects(correspondence, allowed, (r) => r.projectName);
  const register = filterByAllowedProjects(projectRegister, allowed, (r) => r.projectName);
  const topLetters = topProjectsByLetterVolume(corr, 8);
  const topLettersTotal = topLetters.reduce((s, r) => s + r.total, 0);
  const topLetterRows = topLetters.map((r) => ({ label: r.project, count: r.total, pct: topLettersTotal === 0 ? 0 : r.total / topLettersTotal }));

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <PostAwardHeader title="Post-Award Portfolio" subtitle="Correspondence &amp; Project Register" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        <div className="flex gap-2" style={{ height: 100 }}>
          <KPICard compact icon={Mail} label="Projects with Correspondence" value={corr.length} subtitle="Tracked in Register" />
          <KPICard compact icon={Layers} label="Total Correspondence Issued" value={totalCorrespondenceIssued(corr)} valueTone="primary" subtitle="Main + Subcontractor Letters" />
          <KPICard compact icon={Send} label="Main Contract Letters" value={totalMainContractLetters(corr)} valueTone="primary" />
          <KPICard compact icon={Inbox} label="Subcontractor Letters" value={totalSubcontractorLetters(corr)} />
          <KPICard compact icon={ListChecks} label="Projects in Master Register" value={register.length} subtitle="Cross-Sheet Rollup (Drob List)" />
        </div>

        <div className="pf-row" style={{ height: 190 }}>
          <SectionCard title={`Top Projects by Letter Volume (${topLetters.length})`} className="h-full" padding={10}>
            <HorizontalBarList rows={topLetterRows} labelWidth={220} rowColors={topLetterRows.map((_, i) => categoricalColor(i))} />
          </SectionCard>
        </div>

        <SectionCard
          title={`Project Master Register (${register.length})`}
          info="Sourced from the workbook's own 'Drob List' rollup — cross-references status, TOC/DLC, SC drafts, claims action, and special agreements per project."
          className="flex-1 min-h-0"
          padding={10}
        >
          <DataTable
            rowKey={(r) => r.projectName}
            rows={register}
            columns={[
              { key: "project", header: "Project", width: "18%", render: (r) => r.projectName },
              { key: "status", header: "Status", width: "10%", render: (r) => r.status },
              { key: "scope", header: "Scope of Work", width: "16%", render: (r) => r.scopeOfWork },
              { key: "toc", header: "TOC", width: "9%", render: (r) => r.tocStatus },
              { key: "dlc", header: "DLC", width: "9%", render: (r) => r.dlcStatus },
              { key: "scDraft", header: "SC Draft", width: "10%", render: (r) => r.scDraftStatus },
              { key: "scClaim", header: "SC Claim Action", width: "12%", render: (r) => r.scClaimAction },
              { key: "specialAgr", header: "Special Agreement", width: "10%", render: (r) => r.specialAgreementStatus },
              { key: "dept", header: "Department", width: "10%", render: (r) => r.departmentName },
            ]}
          />
        </SectionCard>
      </div>
      <PrintReportFooter />
    </div>
  );
}
