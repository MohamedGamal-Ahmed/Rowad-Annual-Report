import { colors } from "../../theme/tokens";

export interface HorizontalBarListRow {
  label: string;
  count: number;
  pct: number;
}

/** Generic horizontal bar-list row — the same visual language as
 * MilestoneChart on Page 1 (fixed-width label + proportional bar +
 * right-aligned count(pct)), just parameterized for a variable number of
 * rows and a single caller-supplied color instead of the 5-stage milestone
 * palette. No new visual pattern is introduced — same bar height (16px),
 * track color, radius, and font sizes as MilestoneChart. Scrolls internally
 * (overflow-y-auto) when the row count doesn't fit the card's fixed height,
 * instead of silently clipping rows. */
export function HorizontalBarList({
  rows,
  labelWidth = 150,
  barColor = colors.primary,
  rowColors,
}: {
  rows: HorizontalBarListRow[];
  labelWidth?: number;
  barColor?: string;
  rowColors?: string[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="h-full flex flex-col overflow-y-auto" style={{ gap: 9 }}>
      {rows.map((r, i) => {
        const barPct = (r.count / max) * 100;
        return (
          <div key={r.label} className="flex items-center gap-2 shrink-0">
            <span
              className="shrink-0 font-semibold truncate"
              style={{ width: labelWidth, fontSize: 10.5, color: "var(--color-text-body)" }}
            >
              {r.label}
            </span>
            <div className="flex-1 relative" style={{ height: 16, background: "var(--color-gray-soft)", borderRadius: 4 }}>
              <div
                style={{
                  width: `${barPct}%`,
                  height: "100%",
                  borderRadius: 4,
                  background: rowColors?.[i] ?? barColor,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <span className="shrink-0 font-semibold text-right" style={{ width: 78, fontSize: 10.5, color: "var(--color-text-primary)" }}>
              {r.count} ({(r.pct * 100).toFixed(1)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}
