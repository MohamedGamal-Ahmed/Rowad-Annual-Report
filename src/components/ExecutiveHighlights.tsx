import type { LucideIcon } from "lucide-react";
import { IconBadge } from "./primitives/IconBadge";
import type { IconTone } from "../theme/tokens";

export interface Insight {
  icon: LucideIcon;
  tone: IconTone;
  title: string;
  description: string;
}

interface ExecutiveHighlightsProps {
  insights: Insight[];
  /** Layout mode:
   *  - "list" (default): vertical stack with border separators. Best for
   *    narrow side-panel columns (e.g. next to a large evidence table).
   *  - "grid": auto-flow 2-column grid, each highlight in its own soft
   *    tile. Best for wide/tall areas (e.g. Executive Overview's full-
   *    width Highlights row) where a long vertical stack wastes horizontal
   *    space and creates reading fatigue. */
  layout?: "list" | "grid";
}

/** Executive Highlights — factual observations only, derived from live
 *  metrics in services/calculations. No inference, no vs-previous-period
 *  claims, no risk classifications (the source workbook has no date
 *  dimension and no risk field). */
export function ExecutiveHighlights({ insights, layout = "list" }: ExecutiveHighlightsProps) {
  if (layout === "grid") {
    return (
      <div
        className="h-full overflow-hidden"
        style={{
          background: "var(--color-primary-soft)",
          borderRadius: 10,
          padding: "10px 12px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gridAutoRows: "1fr",
          gap: 8,
        }}
      >
        {insights.map((item, i) => (
          <div
            key={i}
            className="flex items-start bg-card"
            style={{
              borderRadius: 8,
              border: "1px solid rgba(139,30,45,0.10)",
              padding: "8px 10px",
              gap: 8,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <IconBadge icon={item.icon} tone={item.tone} size={26} />
            <div className="flex flex-col min-w-0 flex-1" style={{ gap: 2 }}>
              <span
                className="font-bold"
                style={{
                  fontSize: "var(--text-insight-title)",
                  color: "var(--color-text-primary)",
                  lineHeight: 1.25,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.title}
              </span>
              <span
                style={{
                  fontSize: "var(--text-insight-desc)",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.3,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "var(--color-primary-soft)", borderRadius: 10, padding: "8px 12px", gap: 4 }}
    >
      {insights.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-2.5 flex-1 min-h-0"
          style={{
            paddingBottom: i < insights.length - 1 ? 4 : 0,
            borderBottom: i < insights.length - 1 ? "1px solid rgba(139,30,45,0.12)" : "none",
          }}
        >
          <IconBadge icon={item.icon} tone={item.tone} size={26} />
          <div className="flex flex-col min-w-0 flex-1">
            <span
              className="font-bold"
              style={{
                fontSize: "var(--text-insight-title)",
                color: "var(--color-text-primary)",
                lineHeight: 1.25,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.title}
            </span>
            <span
              style={{
                fontSize: "var(--text-insight-desc)",
                color: "var(--color-text-muted)",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
