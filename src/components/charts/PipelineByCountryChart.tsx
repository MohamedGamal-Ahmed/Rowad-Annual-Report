import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MilestoneCounts } from "../../services/calculations";
import { colors } from "../../theme/tokens";

interface PipelineByCountryChartProps {
  data: ({ country: string; totalOpportunities: number } & MilestoneCounts)[];
}

// Exactly the same five stage colors as Page 1's MilestoneChart -- one
// palette for milestone stages across the whole platform, never a
// page-local variant.
const STAGE_COLORS = ["#1B2A4A", "#33507F", "#4E76AC", "#7FA3D6", colors.primary];
const STAGES: { key: keyof MilestoneCounts; label: string }[] = [
  { key: "contractQualifications", label: "Contract Qualifications" },
  { key: "riskAssessment", label: "Risk Assessment" },
  { key: "contractSummary", label: "Contract Summary" },
  { key: "negotiation", label: "Negotiation" },
  { key: "award", label: "Award" },
];

/** "Pipeline Distribution by Country" -- answers "where is every country's
 * pipeline?" in one glance. Stacked per country by the same five
 * INDEPENDENT milestone flags as Page 1's MilestoneChart (not a funnel;
 * verified non-monotonic on real data). Segment lengths are raw flag
 * counts, not shares of total opportunities -- a project can carry more
 * than one flag, so segments for a country will not necessarily sum to
 * that country's opportunity count. The axis is deliberately left as plain
 * counts (not forced to a 0-100% scale) so it never implies these are
 * mutually-exclusive stage buckets, which the data doesn't support. */
export function PipelineByCountryChart({ data }: PipelineByCountryChartProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center shrink-0" style={{ gap: 12, marginBottom: 8 }}>
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span style={{ width: 9, height: 9, borderRadius: 2, background: STAGE_COLORS[i], flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-body)", whiteSpace: "nowrap" }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.map((d) => ({
              ...d,
              label: `${d.country} (${d.totalOpportunities})`,
              pipelineTotal: d.contractQualifications + d.riskAssessment + d.contractSummary + d.negotiation + d.award,
            }))}
            layout="vertical"
            margin={{ top: 4, right: 30, left: 0, bottom: 0 }}
            barCategoryGap="32%"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.border} />
            <XAxis type="number" tick={{ fontSize: 10.5, fill: colors.textMuted }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={92}
              tick={{ fontSize: 11.5, fill: colors.textPrimary, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name) => [value, STAGES.find((s) => s.key === name)?.label ?? name]}
              labelFormatter={(label) => label}
            />
            {STAGES.map((s, i) => {
              const isLast = i === STAGES.length - 1;
              return (
                <Bar key={s.key} dataKey={s.key} stackId="pipeline" fill={STAGE_COLORS[i]} barSize={22} radius={isLast ? [0, 4, 4, 0] : undefined}>
                  {isLast && (
                    <LabelList
                      dataKey="pipelineTotal"
                      position="right"
                      style={{ fontSize: 10.5, fontWeight: 700, fill: colors.textPrimary }}
                    />
                  )}
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
