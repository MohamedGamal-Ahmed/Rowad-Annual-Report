import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { colors } from "../../theme/tokens";
import { formatCompact } from "../../services/calculations";

interface AwardedValueByCountryChartProps {
  data: { country: string; value: number }[];
  currency: string;
}

/** "Awarded Value by Country" — bars are a per-country split of ONE
 * currency (the active Currency filter), never a cross-currency sum. A
 * country with zero here genuinely has no awarded value in this currency
 * (e.g. its awards are booked in a different currency) — that's correct
 * output, not a rendering bug, so we label it explicitly instead of leaving
 * an unexplained flat bar.
 * (File kept as CurrencyChart.tsx for history; component renamed for clarity.) */
export function AwardedValueByCountryChart({ data, currency }: AwardedValueByCountryChartProps) {
  const allZero = data.length > 0 && data.every((d) => d.value === 0);

  if (allZero) {
    return (
      <div className="h-full flex items-center justify-center text-center px-4">
        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
          No awarded value recorded in {currency} for any country in the current filter — awards here are booked in
          other currencies. Switch the Currency filter to see them.
        </span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
        <XAxis dataKey="country" tick={{ fontSize: 10.5, fill: colors.textBody }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip formatter={(v) => `${Number(v ?? 0).toLocaleString()} ${currency}`} />
        <Bar dataKey="value" fill={colors.secondary} radius={[4, 4, 0, 0]} barSize={32}>
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v) => (Number(v ?? 0) > 0 ? formatCompact(Number(v)) : "0")}
            style={{ fontSize: 10.5, fontWeight: 600, fill: colors.textPrimary }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// NOTE: the "All Currencies" case deliberately does NOT get a chart variant
// here. A grouped bar chart puts every currency on one shared numeric axis
// (29.56B EGP next to 169.98M SAR) — mathematically separate series, but
// visually implies comparable magnitude, which is misleading. See
// components/charts/CountryCurrencyMatrix.tsx for the axis-free replacement
// used on the Executive Overview page instead.
