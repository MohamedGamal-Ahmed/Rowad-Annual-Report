import { CalendarDays } from "lucide-react";
import { useDashboardStore } from "../../store/useDashboardStore";
import { radius } from "../../theme/tokens";
import { SNAPSHOT_DATE_LABEL, REPORT_VERSION } from "../../config/snapshot";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

/** Single snapshot indicator — never derived from new Date() or the system
 * clock, since this is a point-in-time report, not a live view. Displays the
 * fixed snapshot date + report version + (if available) the real moment the
 * user uploaded the current workbook (the one genuinely real-time value
 * here — a legitimate session event, not a fabricated business date). */
export function HeaderMeta() {
  const loadedAt = useDashboardStore((s) => s.loadedAt);

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className="flex items-center gap-1.5 bg-white"
        style={{ border: "1px solid var(--color-border-strong)", borderRadius: radius.input, padding: "4px 10px", whiteSpace: "nowrap" }}
      >
        <CalendarDays size={14} color="var(--color-secondary)" className="shrink-0" />
        <div className="flex flex-col leading-tight">
          <span style={{ fontSize: 9, color: "var(--color-text-muted)" }}>Snapshot · v{REPORT_VERSION}</span>
          <span className="font-bold" style={{ fontSize: 11, color: "var(--color-text-primary)" }}>
            {SNAPSHOT_DATE_LABEL}
          </span>
          {loadedAt && (
            <span style={{ fontSize: 8, color: "var(--color-text-muted)" }}>Uploaded {formatTime(loadedAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
