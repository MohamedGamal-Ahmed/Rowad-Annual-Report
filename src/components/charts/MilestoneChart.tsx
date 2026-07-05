import type { MilestoneCounts } from "../../services/calculations";
import { colors } from "../../theme/tokens";

interface MilestoneChartProps {
  counts: MilestoneCounts;
  totalOpportunities: number;
}

const STAGE_COLORS = ["#1B2A4A", "#33507F", "#4E76AC", "#7FA3D6", colors.primary];

/**
 * "Pre-Award Pipeline Overview" — NOT a funnel. These are five independent
 * milestone flags, verified non-monotonic on real data (Negotiation can
 * exceed Contract Summary). A hand-built horizontal bar list (not a chart
 * library funnel) with a FIXED category order — never sorted by value —
 * so the non-monotonic reality is visible rather than hidden.
 */
export function MilestoneChart({ counts, totalOpportunities }: MilestoneChartProps) {
  const stages = [
    { label: "Contract Qualifications", count: counts.contractQualifications },
    { label: "Risk Assessment", count: counts.riskAssessment },
    { label: "Contract Summary", count: counts.contractSummary },
    { label: "Negotiation", count: counts.negotiation },
    { label: "Award", count: counts.award },
  ];
  const max = Math.max(1, ...stages.map((s) => s.count));
  const conversion = counts.contractQualifications === 0 ? 0 : counts.award / counts.contractQualifications;

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex flex-col" style={{ gap: 9 }}>
        {stages.map((s, i) => {
          const pct = totalOpportunities === 0 ? 0 : (s.count / totalOpportunities) * 100;
          const barPct = (s.count / max) * 100;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <span
                className="shrink-0 font-semibold"
                style={{ width: 128, fontSize: 10.5, color: "var(--color-text-body)" }}
              >
                {i + 1}. {s.label}
              </span>
              <div className="flex-1 relative" style={{ height: 16, background: "var(--color-gray-soft)", borderRadius: 4 }}>
                <div
                  style={{
                    width: `${barPct}%`,
                    height: "100%",
                    borderRadius: 4,
                    background: STAGE_COLORS[i],
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span
                className="shrink-0 font-semibold text-right"
                style={{ width: 68, fontSize: 10.5, color: "var(--color-text-primary)" }}
              >
                {s.count} ({pct.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between shrink-0"
        style={{
          marginTop: 10,
          padding: "8px 12px",
          background: "var(--color-primary-soft)",
          border: "1px dashed var(--color-primary)",
          borderRadius: 8,
        }}
      >
        <span className="font-semibold" style={{ fontSize: 11, color: "var(--color-text-primary)" }}>
          Overall Conversion Rate (Award / Qualification)
        </span>
        <span className="font-bold" style={{ fontSize: 16, color: "var(--color-primary)" }}>
          {(conversion * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
