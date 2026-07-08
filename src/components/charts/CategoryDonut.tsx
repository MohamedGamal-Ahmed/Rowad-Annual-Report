import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoricalColor } from "../../theme/tokens";

/** Generic count-based donut for any label/count category breakdown (e.g.
 * revision-cycle counts, status counts) — the non-currency counterpart of
 * CurrencyDonut. Uses the same categoricalColor palette as HorizontalBarList
 * so a metric reads consistently whether shown as bars or a donut elsewhere
 * in the report. Center shows the total record count. */
export function CategoryDonut({ rows, centerLabel }: { rows: { label: string; count: number }[]; centerLabel?: string }) {
  const data = rows.filter((r) => r.count > 0);
  const total = data.reduce((s, r) => s + r.count, 0);

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
        No data recorded
      </div>
    );
  }

  return (
    <div className="h-full flex items-center">
      <div className="relative flex-1" style={{ height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <Pie data={data} dataKey="count" nameKey="label" innerRadius="52%" outerRadius="72%" paddingAngle={2} stroke="none">
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={categoricalColor(i)} />
              ))}
            </Pie>
            <Tooltip formatter={(value, _name, item) => [`${value}`, item.payload.label]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{ inset: 0 }}>
          <span className="font-bold" style={{ fontSize: 18, color: "var(--color-text-primary)" }}>
            {total}
          </span>
          {centerLabel && <span style={{ fontSize: 8.5, color: "var(--color-text-muted)" }}>{centerLabel}</span>}
        </div>
      </div>
      <div className="flex flex-col shrink-0" style={{ gap: 4, paddingLeft: 4, maxWidth: 140 }}>
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-1.5 min-w-0">
            <span className="shrink-0" style={{ width: 7, height: 7, borderRadius: 999, background: categoricalColor(i) }} />
            <span className="truncate" style={{ fontSize: 9.5, color: "var(--color-text-body)" }}>
              {d.label} <strong style={{ color: "var(--color-text-primary)" }}>{d.count}</strong>{" "}
              <span style={{ color: "var(--color-text-muted)" }}>({total === 0 ? 0 : ((d.count / total) * 100).toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
