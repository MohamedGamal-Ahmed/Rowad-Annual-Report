import { Building2, Folder, Activity, Landmark, Globe2, TrendingUp, CalendarClock, Scale } from "lucide-react";
import { PostAwardHeader } from "../../components/postAward/PostAwardHeader";
import { KPICard } from "../../components/cards/KPICard";
import { PostAwardCurrencyBreakdownValue } from "../../components/postAward/PostAwardCurrencyBreakdownValue";
import { SectionCard } from "../../components/primitives/SectionCard";
import { DiagnosticBanner } from "../../components/primitives/DiagnosticBanner";
import { HorizontalBarList } from "../../components/charts/HorizontalBarList";
import { DataTable } from "../../components/postAward/DataTable";
import { PostAwardFileUpload } from "../../components/postAward/PostAwardFileUpload";
import { PrintReportFooter } from "../../components/print/PrintReportFooter";
import { usePostAwardStore, filterByAllowedProjects } from "../../store/usePostAwardStore";
import { categoricalColor } from "../../theme/tokens";
import {
  contractValueOriginal,
  contractValueRevised,
  durationSlippageProjects,
  formatCompact,
  ongoingCount,
  projectStatusCounts,
  projectsByOwnerEntity,
  toBarRows,
  valueVarianceProjects,
} from "../../services/postAwardCalculations";

export function PortfolioOverviewPage() {
  const { isLoaded, projects, currency, warnings } = usePostAwardStore();
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

  const rows = filterByAllowedProjects(projects, allowed, (p) => p.projectName);
  const owners = toBarRows(projectsByOwnerEntity(rows));
  const statuses = toBarRows(projectStatusCounts(rows));
  const original = contractValueOriginal(rows);
  const revised = contractValueRevised(rows);
  const continents = new Set(rows.map((p) => p.continent).filter(Boolean)).size;
  const owningEntities = new Set(rows.map((p) => p.ownerEntity).filter(Boolean)).size;

  const slippage = durationSlippageProjects(rows);
  const totalSlippageMonths = slippage.reduce((s, r) => s + Math.max(r.deltaMonths, 0), 0);
  const slippageRows = slippage.slice(0, 8).map((r) => ({
    label: r.projectName,
    count: r.deltaMonths,
    pct: totalSlippageMonths === 0 ? 0 : Math.max(r.deltaMonths, 0) / totalSlippageMonths,
  }));

  const variance = valueVarianceProjects(rows);
  const varianceByProject = new Map(variance.map((v) => [v.projectName, v]));
  const revisedDurationByProject = new Map(slippage.map((s) => [s.projectName, s]));

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <PostAwardHeader title="Post-Award Portfolio" subtitle="Portfolio Overview" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        <div className="flex gap-2" style={{ height: 100 }}>
          <KPICard compact icon={Folder} label="Total Projects" value={rows.length} subtitle="Ongoing Portfolio" />
          <KPICard compact icon={Activity} label="Ongoing" value={ongoingCount(rows)} valueTone="primary" subtitle={`Out of ${rows.length} Projects`} />
          <KPICard compact
            icon={TrendingUp}
            label="Original Value"
            value={currency ? formatCompact(original[currency] ?? 0) : <PostAwardCurrencyBreakdownValue amounts={original} />}
            valueTone="primary"
          />
          <KPICard compact
            icon={Landmark}
            label="Revised Value"
            value={currency ? formatCompact(revised[currency] ?? 0) : <PostAwardCurrencyBreakdownValue amounts={revised} />}
            valueTone="primary"
          />
          <KPICard compact
            icon={CalendarClock}
            label="Schedule Slippage"
            value={slippage.length}
            subtitle={`Of ${rows.length} Projects (EOT impact)`}
          />
          <KPICard compact
            icon={Scale}
            label="Value Variance"
            value={variance.length}
            subtitle={`Of ${rows.length} Projects (Revised ≠ Original)`}
          />
          <KPICard compact icon={Building2} label="Owner Entities" value={owningEntities} subtitle="Private / Semi-Gov / Gov / Army" />
          <KPICard compact icon={Globe2} label="Continents" value={continents} subtitle="Geographic Footprint" />
        </div>

        <div className="pf-row flex gap-2" style={{ height: 200 }}>
          <SectionCard title="Projects by Owner Entity" className="flex-1" padding={10}>
            <HorizontalBarList rows={owners} labelWidth={110} rowColors={owners.map((_, i) => categoricalColor(i))} />
          </SectionCard>
          <SectionCard title="Projects by Status" className="flex-1" padding={10}>
            <HorizontalBarList rows={statuses} labelWidth={110} rowColors={statuses.map((_, i) => categoricalColor(i))} />
          </SectionCard>
          <SectionCard
            title="Schedule Slippage — Top Projects"
            info="Duration Revised (months) minus Duration Original, for projects where both are recorded and actually differ — the concrete EOT-impact signal."
            className="flex-1"
            padding={10}
          >
            {slippageRows.length > 0 ? (
              <HorizontalBarList rows={slippageRows} labelWidth={130} rowColors={slippageRows.map((_, i) => categoricalColor(i))} />
            ) : (
              <div className="h-full flex items-center justify-center" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                No duration slippage recorded
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title={`Project Register (${rows.length})`}
          info="Duration and Value columns compare Original vs Revised — '—' means no revised figure was recorded (not a schedule/value change to zero)."
          className="flex-1 min-h-0"
          padding={10}
        >
          <DataTable
            rowKey={(p) => p.projectName}
            rows={rows}
            columns={[
              { key: "name", header: "Project Name", width: "20%", render: (p) => p.projectName },
              { key: "status", header: "Status", width: "9%", render: (p) => p.status },
              { key: "owner", header: "Owner Entity", width: "13%", render: (p) => p.ownerEntity },
              { key: "client", header: "Client", width: "15%", render: (p) => p.clientName },
              {
                key: "duration",
                header: "Duration (Orig→Rev)",
                width: "15%",
                render: (p) => {
                  const s = revisedDurationByProject.get(p.projectName);
                  if (s) return `${s.originalMonths}mo → ${s.revisedMonths}mo (${s.deltaMonths > 0 ? "+" : ""}${s.deltaMonths})`;
                  return p.durationOriginalMonths !== null ? `${p.durationOriginalMonths}mo` : "—";
                },
              },
              {
                key: "original",
                header: "Original Value",
                width: "14%",
                align: "right",
                render: (p) => {
                  const c = p.currency;
                  if (!c) return "—";
                  const v = p.amountOriginal[c];
                  return v ? `${c} ${formatCompact(v)}` : "—";
                },
              },
              {
                key: "revised",
                header: "Revised Value",
                width: "14%",
                align: "right",
                render: (p) => {
                  const v = varianceByProject.get(p.projectName);
                  if (!v) return "—";
                  return `${v.currency} ${formatCompact(v.revised)} (${v.deltaPct > 0 ? "+" : ""}${(v.deltaPct * 100).toFixed(0)}%)`;
                },
              },
            ]}
          />
        </SectionCard>
      </div>
      <PrintReportFooter />
    </div>
  );
}
