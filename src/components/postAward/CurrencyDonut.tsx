import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PostAwardCurrency } from "../../types/postAward";
import { POST_AWARD_CURRENCY_ORDER } from "../../types/postAward";
import { currencyPalette } from "../../theme/tokens";
import { formatCompact } from "../../services/postAwardCalculations";

const RADIAN = Math.PI / 180;

function CustomLabel(props: { cx: number; cy: number; midAngle: number; outerRadius: number; value: number }) {
  const { cx, cy, midAngle, outerRadius, value } = props;
  const r = outerRadius + 14;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" style={{ fontSize: 10.5, fontWeight: 600, fill: "#33414F" }}>
      {value}
    </text>
  );
}

/** Currency-composition donut sized by RECORD COUNT per currency (never by
 * blended monetary value — summing raw amounts across EGP/USD/SAR/EUR into
 * one pie would visually misrepresent exposure, since 1 EGP and 1 USD are
 * not comparable magnitudes; that's exactly the blending this app's business
 * rules forbid everywhere else). The actual per-currency amount is shown as
 * plain text in the legend instead, same non-blended rule as
 * PostAwardCurrencyBreakdownValue — just paired with a shape here instead of
 * a bare list, matching the count-based CountryDonut pattern. */
export function CurrencyDonut({ amounts, counts }: { amounts: Partial<Record<PostAwardCurrency, number>>; counts: Partial<Record<PostAwardCurrency, number>> }) {
  const data = POST_AWARD_CURRENCY_ORDER.filter((c) => (counts[c] ?? 0) > 0).map((c) => ({
    name: c,
    value: counts[c] ?? 0,
    amount: amounts[c] ?? 0,
  }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
        No pending VOs recorded
      </div>
    );
  }

  return (
    <div className="h-full flex items-center">
      <div className="relative flex-1" style={{ height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 12, right: 30, bottom: 12, left: 30 }}>
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
              {data.map((entry) => (
                <Cell key={entry.name} fill={currencyPalette[entry.name === "EUR" ? "EURO" : entry.name]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(_value, _name, item) => {
                const p = item.payload as (typeof data)[number];
                return [`${p.value} VO(s) · ${formatCompact(p.amount)} ${p.name}`, p.name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{ inset: 0 }}>
          <span className="font-bold" style={{ fontSize: 20, color: "var(--color-text-primary)" }}>
            {total}
          </span>
          <span style={{ fontSize: 9, color: "var(--color-text-muted)" }}>Pending VOs</span>
        </div>
      </div>
      <div className="flex flex-col shrink-0" style={{ gap: 6, paddingLeft: 4 }}>
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: 999, background: currencyPalette[d.name === "EUR" ? "EURO" : d.name] }} />
            <span style={{ fontSize: 10.5, color: "var(--color-text-body)" }}>
              {d.name} <strong>{formatCompact(d.amount)}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
