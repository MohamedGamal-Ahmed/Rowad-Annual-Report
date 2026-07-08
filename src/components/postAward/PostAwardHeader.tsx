import { PageHeader } from "../PageHeader";
import { PostAwardFilterBar } from "./PostAwardFilterBar";
import { PostAwardHeaderMeta } from "./PostAwardHeaderMeta";
import { PostAwardPrintHeader } from "./PostAwardPrintHeader";

/** Post-Award counterpart of DashboardHeader.tsx — identical composition
 * (title block + filter bar + snapshot meta, with a print-only replacement),
 * wired to the Post-Award store/filters. */
export function PostAwardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <PostAwardPrintHeader title={title} subtitle={subtitle} />
      <div className="no-print flex items-start justify-between shrink-0" style={{ padding: "14px 16px 10px", gap: 12 }}>
        <div className="shrink-0" style={{ minWidth: 0 }}>
          <PageHeader title={title} subtitle={subtitle} />
        </div>
        <div className="flex items-end gap-3 shrink-0" style={{ paddingTop: 2 }}>
          <PostAwardFilterBar />
          <PostAwardHeaderMeta />
        </div>
      </div>
    </>
  );
}
