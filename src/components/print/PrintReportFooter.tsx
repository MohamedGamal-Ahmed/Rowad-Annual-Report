import { useMemo } from "react";

function formatGeneratedTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Print-only static report footer (see `.print-only` in index.css). Hidden
 * in the interactive app; rendered only when printing/exporting to PDF.
 *
 * The "Generated" timestamp is the one value in this print pass that IS
 * allowed to come from `new Date()` — it describes the real-world moment
 * the PDF was produced, a genuine event, not a fabricated business date
 * (compare SNAPSHOT_DATE_LABEL in PrintReportHeader, which must never be
 * derived from the clock). Captured once via useMemo at mount/print time.
 *
 * Page numbering is handled entirely by the `@page { @bottom-center }`
 * margin box in index.css — not by this component. */
export function PrintReportFooter() {
  const generatedAt = useMemo(() => formatGeneratedTimestamp(new Date()), []);

  return (
    <div
      className="print-only"
      style={{
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: "1px solid var(--color-border-strong)",
        padding: "6px 16px 0",
        marginTop: 8,
      }}
    >
      <span
        className="font-semibold uppercase"
        style={{ fontSize: "var(--text-filter-label)", color: "var(--color-text-muted)", letterSpacing: 0.4 }}
      >
        CONFIDENTIAL — Internal Use Only
      </span>

      <span style={{ fontSize: "var(--text-filter-label)", color: "var(--color-text-muted)" }}>
        Generated: {generatedAt}
      </span>
    </div>
  );
}
