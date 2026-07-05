import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CountryStats } from "../../services/calculations";
import { countryColor } from "../../theme/tokens";

const RADIAN = Math.PI / 180;

function CustomLabel(props: {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  value: number;
  percent: number;
}) {
  const { cx, cy, midAngle, outerRadius, value, percent } = props;
  const r = outerRadius + 14;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{ fontSize: 10.5, fontWeight: 600, fill: "#33414F" }}
    >
      {value} ({(percent * 100).toFixed(1)}%)
    </text>
  );
}

export function CountryDonut({ stats }: { stats: CountryStats[] }) {
  const data = stats.map((s) => ({ name: s.country, value: s.totalOpportunities, awarded: s.awardedProjects, winRate: s.winRate }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="h-full flex items-center">
      <div className="relative flex-1" style={{ height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 12, right: 36, bottom: 12, left: 36 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="52%"
              outerRadius="72%"
              paddingAngle={2}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={CustomLabel as any}
              labelLine={{ stroke: "var(--color-border-strong)" }}
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={countryColor(entry.name, i)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(_value, _name, item) => {
                const p = item.payload as (typeof data)[number];
                return [`${p.value} opportunities · ${p.awarded} awarded · ${(p.winRate * 100).toFixed(1)}% win rate`, p.name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          className="absolute flex flex-col items-center justify-center pointer-events-none"
          style={{ inset: 0 }}
        >
          <span className="font-bold" style={{ fontSize: 22, color: "var(--color-text-primary)" }}>
            {total}
          </span>
          <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>Total</span>
        </div>
      </div>
      <div className="flex flex-col shrink-0" style={{ gap: 6, paddingLeft: 4 }}>
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: 999, background: countryColor(d.name, i) }} />
            <span style={{ fontSize: 10.5, color: "var(--color-text-body)" }}>{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
