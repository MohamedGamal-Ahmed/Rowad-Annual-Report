export interface StackedBarListRow {
  label: string;
  a: number;
  b: number;
}

/** Generic two-segment stacked horizontal bar row — same track/bar sizing
 * as HorizontalBarList (16px height, gray-soft track, 4px radius), split
 * into two colored segments proportional to `a` and `b`. Used for
 * "Awarded vs Open by Assignee" (a=awarded maroon, b=open navy) and
 * "Signed vs Unsigned by Category" (a=signed green, b=unsigned orange).
 * Scrolls internally (overflow-y-auto) when the row count doesn't fit the
 * card's fixed height, instead of silently clipping rows. */
export function StackedBarList({
  rows,
  labelWidth = 150,
  colorA,
  colorB,
  legendA,
  legendB,
}: {
  rows: StackedBarListRow[];
  labelWidth?: number;
  colorA: string;
  colorB: string;
  legendA: string;
  legendB: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.a + r.b));
  return (
    <div className="h-full flex flex-col" style={{ gap: 6 }}>
      <div className="flex items-center gap-3 shrink-0" style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
        <span className="flex items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: 2, background: colorA, display: "inline-block" }} />
          {legendA}
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: 2, background: colorB, display: "inline-block" }} />
          {legendB}
        </span>
      </div>
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto" style={{ gap: 9 }}>
        {rows.map((r) => {
          const total = r.a + r.b;
          const totalPct = (total / max) * 100;
          const aShare = total === 0 ? 0 : (r.a / total) * 100;
          const bShare = total === 0 ? 0 : (r.b / total) * 100;
          return (
            <div key={r.label} className="flex items-center gap-2 shrink-0">
              <span
                className="shrink-0 font-semibold truncate"
                style={{ width: labelWidth, fontSize: 10.5, color: "var(--color-text-body)" }}
              >
                {r.label}
              </span>
              <div className="flex-1 relative" style={{ height: 16, background: "var(--color-gray-soft)", borderRadius: 4, overflow: "hidden" }}>
                <div className="flex" style={{ width: `${totalPct}%`, height: "100%" }}>
                  {r.a > 0 && (
                    <div
                      className="flex items-center justify-center"
                      style={{ width: `${aShare}%`, height: "100%", background: colorA }}
                    >
                      {aShare >= 18 && (
                        <span className="font-bold" style={{ fontSize: 9.5, color: "#fff" }}>
                          {r.a}
                        </span>
                      )}
                    </div>
                  )}
                  {r.b > 0 && (
                    <div
                      className="flex items-center justify-center"
                      style={{ width: `${bShare}%`, height: "100%", background: colorB }}
                    >
                      {bShare >= 18 && (
                        <span className="font-bold" style={{ fontSize: 9.5, color: "#fff" }}>
                          {r.b}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <span className="shrink-0 font-semibold text-right" style={{ width: 46, fontSize: 10.5, color: "var(--color-text-primary)" }}>
                {r.a}/{r.b}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
