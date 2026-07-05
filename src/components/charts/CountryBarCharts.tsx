import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CountryAwardShare } from "../../services/calculations";
import { colors, countryColor } from "../../theme/tokens";

interface TopCountriesChartProps {
  data: { country: string; count: number; pct: number }[];
}

/** "Top Countries by Opportunities" — horizontal bars, descending, each
 * country's own color (matches the legend/donut on Page 1 and the map
 * markers here). Label = raw count + share of total opportunities. */
export function TopCountriesByOpportunitiesChart({ data }: TopCountriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 42, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.border} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="country"
          width={54}
          tick={{ fontSize: 11, fill: colors.textBody, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip formatter={(v, _n, item) => [`${v} (${(item.payload.pct * 100).toFixed(1)}%)`, "Opportunities"]} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22}>
          {data.map((d, i) => (
            <Cell key={d.country} fill={countryColor(d.country, i)} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content={(props: any) => {
              const row = data[props.index] as (typeof data)[number] | undefined;
              if (!row) return null;
              return (
                <text
                  x={props.x + props.width + 6}
                  y={props.y + props.height / 2}
                  dy={4}
                  style={{ fontSize: 10.5, fontWeight: 600, fill: colors.textPrimary }}
                >
                  {row.count} ({(row.pct * 100).toFixed(1)}%)
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface SimpleCountryValueChartProps {
  data: { country: string; value: number }[];
  labelFormatter: (value: number) => string;
  domainMax?: number;
}

/** Shared vertical-column shape for "Win Rate % by Country" and similar
 * single-metric-per-country charts — one bar per country, own color,
 * value label on top. */
export function CountryColumnChart({ data, labelFormatter, domainMax }: SimpleCountryValueChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
        <XAxis dataKey="country" tick={{ fontSize: 10.5, fill: colors.textBody }} axisLine={false} tickLine={false} />
        <YAxis hide domain={domainMax ? [0, domainMax] : undefined} />
        <Tooltip formatter={(v) => labelFormatter(Number(v ?? 0))} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
          {data.map((d, i) => (
            <Cell key={d.country} fill={countryColor(d.country, i)} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v) => labelFormatter(Number(v ?? 0))}
            style={{ fontSize: 10.5, fontWeight: 600, fill: colors.textPrimary }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** "Awarded Projects by Country" — bar label is count + this country's
 * SHARE OF ALL AWARDED PROJECTS (a composition metric), deliberately not
 * win rate (award/total for that country alone) — the two look similar
 * but answer different questions, don't conflate them. */
export function AwardedProjectsByCountryChart({ data }: { data: CountryAwardShare[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
        <XAxis dataKey="country" tick={{ fontSize: 10.5, fill: colors.textBody }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip formatter={(v, _n, item) => [`${v} (${(item.payload.pctOfTotalAwarded * 100).toFixed(1)}% of all awards)`, "Awarded Projects"]} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
          {data.map((d, i) => (
            <Cell key={d.country} fill={countryColor(d.country, i)} />
          ))}
          <LabelList
            dataKey="count"
            position="top"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content={(props: any) => {
              const row = data[props.index] as CountryAwardShare | undefined;
              if (!row) return null;
              return (
                <text x={props.x + props.width / 2} y={props.y - 6} textAnchor="middle" style={{ fontSize: 10.5, fontWeight: 600, fill: colors.textPrimary }}>
                  {row.count} ({(row.pctOfTotalAwarded * 100).toFixed(1)}%)
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
