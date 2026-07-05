import { AlertTriangle } from "lucide-react";

/** Shown when the parser emitted anomalies worth interrupting the user for
 *  (missing sheet, zero rows survived, etc.). The full list of Data Quality
 *  Notes is not surfaced here — those live on the About page — because they
 *  are routine design-decision footnotes, not blocking anomalies. This banner
 *  is compact by design so it does not push page content off the canvas. */
export function DiagnosticBanner({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    <div
      className="flex flex-col gap-1 no-print"
      style={{
        background: "var(--color-warning-soft)",
        border: "1px solid var(--color-warning)",
        borderRadius: 8,
        padding: "6px 12px",
        margin: "0 14px 6px",
      }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={13} color="var(--color-warning)" />
        <span className="font-bold" style={{ fontSize: 11.5, color: "var(--color-text-primary)" }}>
          {notes.length} data quality {notes.length === 1 ? "notice" : "notices"}
        </span>
      </div>
      {notes.slice(0, 3).map((n, i) => (
        <span key={i} style={{ fontSize: 10.5, color: "var(--color-text-body)", lineHeight: 1.35 }}>
          • {n}
        </span>
      ))}
      {notes.length > 3 && (
        <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
          +{notes.length - 3} more — see About This Report for the full list.
        </span>
      )}
    </div>
  );
}
