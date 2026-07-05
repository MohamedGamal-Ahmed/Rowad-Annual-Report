import { useDashboardStore } from "../../store/useDashboardStore";
import { SNAPSHOT_DATE_LABEL } from "../../config/snapshot";

/** Print-only static report header (see `.print-only` in index.css). Hidden
 * completely in the interactive app; rendered only when printing/exporting
 * to PDF. Replaces the live title row + FilterBar with a plain-text record
 * of the report identity and exactly which filters were active, so the
 * printed page is self-describing without the interactive app in front of
 * the reader.
 *
 * Every value here comes from an existing source, never fabricated:
 * - title / subtitle: the same strings each page already passes to
 *   DashboardHeader / PageHeader.
 * - Reporting Period + Data as of: SNAPSHOT_DATE_LABEL (config/snapshot.ts)
 *   — the report is a point-in-time snapshot, never derived from the clock.
 * - Country / Status / Currency / Assignee: the live Zustand filter state.
 *   `null` renders as "All", matching what the interactive FilterBar shows. */
export function PrintReportHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { country, assignee, status, currency } = useDashboardStore();

  const fields: { key: string; value: string }[] = [
    { key: "Reporting Period", value: SNAPSHOT_DATE_LABEL },
    { key: "Data as of", value: SNAPSHOT_DATE_LABEL },
    { key: "Country", value: country ?? "All" },
    { key: "Status", value: status ?? "All" },
    { key: "Currency", value: currency ?? "All" },
    { key: "Assignee", value: assignee ?? "All" },
  ];

  return (
    <div
      className="print-only"
      style={{
        width: "100%",
        justifyContent: "space-between",
        alignItems: "flex-end",
        borderBottom: "1px solid var(--color-border-strong)",
        padding: "0 16px 6px",
        marginBottom: 8,
        gap: 16,
      }}
    >
      <div className="flex flex-col" style={{ minWidth: 0 }}>
        <span className="font-bold" style={{ fontSize: "var(--text-display)", color: "var(--color-secondary)" }}>
          {title}
        </span>
        <span className="font-semibold" style={{ fontSize: "var(--text-section-title)", color: "var(--color-secondary)" }}>
          {subtitle}
        </span>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(2, auto)", columnGap: 24, rowGap: 2, flexShrink: 0 }}
      >
        {fields.map((f) => (
          <div key={f.key} className="flex flex-col" style={{ lineHeight: 1.3 }}>
            <span
              className="font-semibold uppercase"
              style={{ fontSize: "var(--text-filter-label)", color: "var(--color-text-body)", letterSpacing: 0.4 }}
            >
              {f.key}
            </span>
            <span className="font-bold" style={{ fontSize: "var(--text-filter-value)", color: "var(--color-text-primary)" }}>
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
