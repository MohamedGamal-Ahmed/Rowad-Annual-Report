import { PageHeader } from "../PageHeader";
import { FilterBar } from "../filters/FilterBar";
import { HeaderMeta } from "./HeaderMeta";
import { PrintReportHeader } from "../print/PrintReportHeader";

/** Full header row shared by every page once data is loaded: title block,
 * filter bar, and the real-timestamp meta box. One component, six pages.
 *
 * The interactive row below is wrapped in `.no-print` (same convention as
 * Sidebar/FilterBar) so it disappears entirely when printing/exporting to
 * PDF. `PrintReportHeader` is its print-only replacement (see `.print-only`
 * in index.css) - on screen it renders nothing, in print it's the only
 * thing that shows. */
export function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <PrintReportHeader title={title} subtitle={subtitle} />
      <div className="no-print flex items-start justify-between shrink-0" style={{ padding: "14px 16px 10px", gap: 12 }}>
        <div className="shrink-0" style={{ minWidth: 0 }}>
          <PageHeader title={title} subtitle={subtitle} />
        </div>
        <div className="flex items-end gap-3 shrink-0" style={{ paddingTop: 2 }}>
          <FilterBar />
          <HeaderMeta />
        </div>
      </div>
    </>
  );
}
