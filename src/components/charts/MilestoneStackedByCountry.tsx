import type { MilestoneCounts } from "../../services/calculations";
import { colors } from "../../theme/tokens";

interface MilestoneStackedRow {
  country: string;
  totalOpportunities: number;
  milestones: MilestoneCounts;
}

interface MilestoneStackedByCountryProps {
  rows: MilestoneStackedRow[];
  labelWidth?: number;
}

/** Country × 5-milestone stacked bar list. Same visual pattern as
 *  StackedBarList (used for Awarded vs Open by Assignee on Team page)
 *  but with 5 segments per bar instead of 2. Segment colors match
 *  MilestoneChart's navy-ramp so the palette is consistent across pages.
 *
 *  Important semantics: the 5 milestone flags are INDEPENDENT completion
 *  counts, not mutually exclusive statuses. A single opportunity can be
 *  counted in multiple segments (a project that reached Contract
 *  Qualifications AND Risk Assessment AND Award counts once in each).
 *  Bar length is therefore the SUM of milestone hits for that country
 *  (which is > total opportunities in most cases), and each segment
 *  reads as "how many opportunities have completed this milestone".
 *  The right-side numbers show the raw per-milestone counts, and the
 *  Total Opps column stays separate so the reader can compare.
 */
const STAGES: { key: keyof MilestoneCounts; color: string; label: string }[] = [
  { key: "contractQualifications", color: "#1B2A4A", label: "Contract Qualifications" },
  { key: "riskAssessment", color: "#33507F", label: "Risk Assessment" },
  { key: "contractSummary", color: "#4E76AC", label: "Contract Summary" },
  { key: "negotiation", color: "#7FA3D6", label: "Negotiation" },
  { key: "award", color: colors.primary, label: "Award" },
];

export function MilestoneStackedByCountry({ rows, labelWidth = 90 }: MilestoneStackedByCountryProps) {
  const maxSum = Math.max(
    1,
    ...rows.map((r) => STAGES.reduce((acc, s) => acc + r.milestones[s.key], 0)),
  );

  return (
    <div className="h-full flex flex-col" style={{ minHeight: 0, gap: 6 }}>
      {/* Legend row */}
      <div className="flex flex-wrap items-center shrink-0" style={{ gap: 10, marginBottom: 2 }}>
        {STAGES.map((s) => (
          <div key={s.key} className="flex items-center" style={{ gap: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span
              className="font-semibold"
              style={{ fontSize: 9.5, color: "var(--color-text-body)", letterSpacing: 0.2 }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Column headers */}
      <div className="flex items-center shrink-0" style={{ gap: 8, paddingRight: 6 }}>
        <span
          className="font-semibold uppercase"
          style={{ width: labelWidth, fontSize: 9, color: "var(--color-text-muted)", letterSpacing: 0.4 }}
        >
          Country
        </span>
        <span
          className="font-semibold uppercase text-right"
          style={{ width: 40, fontSize: 9, color: "var(--color-text-muted)", letterSpacing: 0.4 }}
        >
          Total
        </span>
        <div className="flex-1" />
        <span
          className="font-semibold uppercase"
          style={{ width: 110, fontSize: 9, color: "var(--color-text-muted)", letterSpacing: 0.4, textAlign: "right" }}
        >
          CQ / RA / CS / N / A
        </span>
      </div>

      {/* Rows */}
      <div className="flex-1 flex flex-col" style={{ gap: 6, minHeight: 0 }}>
        {rows.map((r) => {
          const sum = STAGES.reduce((acc, s) => acc + r.milestones[s.key], 0);
          const barWidthPct = (sum / maxSum) * 100;
          return (
            <div key={r.country} className="flex items-center" style={{ gap: 8 }}>
              <span
                className="font-bold shrink-0"
                style={{
                  width: labelWidth,
                  fontSize: 12,
                  color: "var(--color-text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.country}
              </span>
              <span
                className="font-semibold text-right shrink-0"
                style={{
                  width: 40,
                  fontSize: 12,
                  color: "var(--color-text-body)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {r.totalOpportunities}
              </span>
              {/* Stacked bar */}
              <div
                className="flex-1 relative"
                style={{
                  height: 18,
                  background: "var(--color-gray-soft)",
                  borderRadius: 4,
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <div className="flex h-full" style={{ width: `${barWidthPct}%` }}>
                  {STAGES.map((s) => {
                    const count = r.milestones[s.key];
                    const pct = sum === 0 ? 0 : (count / sum) * 100;
                    if (count === 0) return null;
                    return (
                      <div
                        key={s.key}
                        title={`${r.country} — ${s.label}: ${count} (${((count / (r.totalOpportunities || 1)) * 100).toFixed(0)}% of country's opportunities)`}
                        className="flex items-center justify-center"
                        style={{
                          width: `${pct}%`,
                          background: s.color,
                          minWidth: 0,
                          overflow: "hidden",
                        }}
                      >
                        {pct >= 10 && (
                          <span
                            className="font-bold"
                            style={{ fontSize: 10, color: "#fff", lineHeight: 1 }}
                          >
                            {count}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Right-side counts */}
              <span
                className="font-semibold shrink-0"
                style={{
                  width: 110,
                  fontSize: 10.5,
                  color: "var(--color-text-body)",
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "right",
                  letterSpacing: 0.2,
                }}
              >
                {STAGES.map((s) => r.milestones[s.key]).join(" / ")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
