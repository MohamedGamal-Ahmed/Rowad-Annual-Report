import { FileText, CheckCircle2, ShieldAlert, Percent, Layers } from "lucide-react";
import { DashboardHeader } from "../components/header/DashboardHeader";
import { KPICard } from "../components/cards/KPICard";
import { SectionCard } from "../components/primitives/SectionCard";
import { DiagnosticBanner } from "../components/primitives/DiagnosticBanner";
import { ExecutiveHighlights } from "../components/ExecutiveHighlights";
import { HorizontalBarList } from "../components/charts/HorizontalBarList";
import { StackedBarList } from "../components/charts/StackedBarList";
import { AgreementsTable } from "../components/tables/AgreementsTable";
import { FileUpload } from "../components/FileUpload";
import { PrintReportFooter } from "../components/print/PrintReportFooter";
import { useDashboardStore } from "../store/useDashboardStore";
import { colors } from "../theme/tokens";
import { agreementsByCategory, totalAgreements, topPartnersByAgreementCount } from "../services/calculations";
import { generateAgreementHighlights } from "../services/pageHighlights";
import type { AgreementCategory } from "../types/domain";

const CATEGORY_ORDER: AgreementCategory[] = ["JV", "Consortium", "Cooperation", "Subcontract", "NDA", "MOU", "Other"];
const CATEGORY_COLORS: Record<AgreementCategory, string> = {
  JV: colors.primary,
  Consortium: colors.secondary,
  Cooperation: colors.teal,
  Subcontract: colors.gold,
  NDA: colors.gray,
  MOU: colors.gray,
  Other: colors.gray,
};

/** ============================================================
 *  Agreements — Executive Report (Page 6)
 *  ------------------------------------------------------------
 *  Print-safe, single-page layout answering ONE question:
 *    "Are the partnerships we need to bid actually locked in?"
 *
 *  Fact_Agreements is standalone: NEVER filtered by Country/Assignee/
 *  Status, NEVER joined to Fact_Opportunities (0/14 name matches per
 *  Data_Quality_Notes). No country attribution, no value totals, no
 *  dates -- none of that data exists in this sheet.
 *  ============================================================ */
export function AgreementsPage() {
  const { isLoaded, agreements, warnings } = useDashboardStore();

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

  const total = totalAgreements(agreements);
  const signed = agreements.filter((a) => a.status === "Signed").length;
  const unsigned = total - signed;
  const signedRate = total === 0 ? 0 : signed / total;
  const byCategory = agreementsByCategory(agreements);
  const activeCategories = CATEGORY_ORDER.filter((c) => byCategory[c] > 0);

  const categoryRows = activeCategories.map((c) => ({
    label: c,
    count: byCategory[c],
    pct: total === 0 ? 0 : byCategory[c] / total,
  }));

  const signedByCategory = new Map<AgreementCategory, number>();
  const unsignedByCategory = new Map<AgreementCategory, number>();
  for (const a of agreements) {
    const map = a.status === "Signed" ? signedByCategory : unsignedByCategory;
    map.set(a.agreementCategory, (map.get(a.agreementCategory) ?? 0) + 1);
  }
  const signedVsUnsignedRows = activeCategories.map((c) => ({
    label: c,
    a: signedByCategory.get(c) ?? 0,
    b: unsignedByCategory.get(c) ?? 0,
  }));

  const partners = topPartnersByAgreementCount(agreements, 6);
  const partnerRows = partners.map((p) => ({
    label: p.partner,
    count: p.count,
    pct: total === 0 ? 0 : p.count / total,
  }));

  const highlights = generateAgreementHighlights(agreements);

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <DashboardHeader title="Pre-Award Snapshot Dashboard (H1 2026)" subtitle="Agreements Register" />
      <DiagnosticBanner notes={warnings} />

      <div className="page-scroll flex-1 flex flex-col min-h-0" style={{ padding: "0 14px 12px", gap: 8 }}>
        {/* KPI Strip — 5 cards, not 6 */}
        <div className="flex gap-2" style={{ height: 128 }}>
          <KPICard icon={FileText} label="Total Agreements" value={total} subtitle="All Categories" />
          <KPICard icon={CheckCircle2} tone="success" label="Signed" value={signed} valueTone="primary" subtitle="Status = Signed" />
          <KPICard icon={ShieldAlert} tone="gold" label="Unsigned" value={unsigned} subtitle="Status = Unsigned" />
          <KPICard
            icon={Percent}
            label="Signed Rate %"
            value={`${(signedRate * 100).toFixed(1)}%`}
            valueTone="primary"
            subtitle="Signed / Total"
          />
          <KPICard icon={Layers} tone="teal" label="Categories in Use" value={activeCategories.length} subtitle="Distinct categories" />
        </div>

        {/* Row 2: Agreements by Category + Signed vs Unsigned by Category */}
        <div className="pf-row flex gap-2" style={{ height: 200 }}>
          <SectionCard title="Agreements by Category" className="flex-1" padding={10}>
            <HorizontalBarList
              rows={categoryRows}
              labelWidth={100}
              rowColors={activeCategories.map((c) => CATEGORY_COLORS[c])}
            />
          </SectionCard>
          <SectionCard title="Signed vs Unsigned by Category" className="flex-1" padding={10}>
            <StackedBarList
              rows={signedVsUnsignedRows}
              labelWidth={100}
              colorA={colors.success}
              colorB={colors.warning}
              legendA="Signed"
              legendB="Unsigned"
            />
          </SectionCard>
        </div>

        {/* Row 3: Register + Top Partners + Highlights.
            Top Partners is widened (flex-1 instead of 0.7) so partner bars
            have room to breathe and each label reads clearly at a glance. */}
        <div className="pf-row flex gap-2 flex-1 min-h-0">
          <SectionCard title="Agreements Register" className="flex-[1.5] min-w-0" padding={8}>
            <AgreementsTable rows={agreements} />
          </SectionCard>
          <SectionCard
            title="Top Partners"
            subtitle="Agreement count per external party (RME excluded)"
            className="flex-1 min-w-0"
            padding={10}
          >
            <HorizontalBarList rows={partnerRows} labelWidth={130} barColor={colors.secondary} />
          </SectionCard>
          <SectionCard title="Executive Highlights" className="flex-1 min-w-0" padding={8}>
            <ExecutiveHighlights insights={highlights} />
          </SectionCard>
        </div>
      </div>
      <PrintReportFooter />
    </div>
  );
}
