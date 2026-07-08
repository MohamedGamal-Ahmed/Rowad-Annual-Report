import { CalendarDays } from "lucide-react";
import { usePostAwardStore } from "../../store/usePostAwardStore";
import { radius } from "../../theme/tokens";
import { POST_AWARD_SNAPSHOT_DATE_LABEL, POST_AWARD_REPORT_VERSION } from "../../config/snapshot";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

/** Post-Award counterpart of HeaderMeta.tsx. */
export function PostAwardHeaderMeta() {
  const loadedAt = usePostAwardStore((s) => s.loadedAt);

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className="flex items-center gap-1.5 bg-white"
        style={{ border: "1px solid var(--color-border-strong)", borderRadius: radius.input, padding: "4px 10px", whiteSpace: "nowrap" }}
      >
        <CalendarDays size={14} color="var(--color-secondary)" className="shrink-0" />
        <div className="flex flex-col leading-tight">
          <span style={{ fontSize: 9, color: "var(--color-text-muted)" }}>Snapshot · v{POST_AWARD_REPORT_VERSION}</span>
          <span className="font-bold" style={{ fontSize: 11, color: "var(--color-text-primary)" }}>
            {POST_AWARD_SNAPSHOT_DATE_LABEL}
          </span>
          {loadedAt && (
            <span style={{ fontSize: 8, color: "var(--color-text-muted)" }}>Uploaded {formatTime(loadedAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
