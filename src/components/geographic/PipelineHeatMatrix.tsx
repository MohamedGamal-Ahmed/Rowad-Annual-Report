import type { MilestoneCounts } from "../../services/calculations";
import { colors } from "../../theme/tokens";

interface PipelineHeatMatrixProps {
  data: ({ country: string; totalOpportunities: number } & MilestoneCounts)[];
}

/** Same canonical stage list as MilestoneChart on Page 1. */
const STAGES: { key: keyof MilestoneCounts; label: string; short: string }[] = [
  { key: "contractQualifications", label: "Contract Qualifications", short: "Contract Qualifications" },
  { key: "riskAssessment", label: "Risk Assessment", short: "Risk Assessment" },
  { key: "contractSummary", label: "Contract Summary", short: "Contract Summary" },
  { key: "negotiation", label: "Negotiation", short: "Negotiation" },
  { key: "award", label: "Award", short: "Award" },
];

/** Same navy/maroon ramp as PipelineByCountryChart / MilestoneChart on
 * Page 1 -- no new color language. Award (a positive outcome) uses the
 * maroon primary; in-progress stages use the navy scale. */
function cellBackground(share: number, isAwardStage: boolean): string {
  if (share <= 0) return colors.card;
  if (isAwardStage) {
    if (share >= 0.6) return colors.primary;
    if (share >= 0.35) return "rgba(139,30,45,0.55)";
    if (share >= 0.15) return "rgba(139,30,45,0.28)";
    return "rgba(139,30,45,0.12)";
  }
  if (share >= 0.6) return colors.secondary;
  if (share >= 0.35) return "rgba(27,42,74,0.55)";
  if (share >= 0.15) return "rgba(27,42,74,0.28)";
  return "rgba(27,42,74,0.12)";
}

function cellTextColor(share: number): string {
  if (share >= 0.35) return "#FFFFFF";
  return colors.textPrimary;
}

/** "Pipeline Status by Country" -- rows are countries, columns are the
 * five milestone stages. Cell shade = that stage's SHARE of the country's
 * own opportunities, so a bottleneck reads as a dominant dark column.
 * Print-safe: NO internal scrolling. Rows use table row height auto so
 * every country in the current filter fits naturally in the section-card
 * height. ROWAD's fixed 4-country footprint is small enough that this
 * always fits without overflow. */
export function PipelineHeatMatrix({ data }: PipelineHeatMatrixProps) {
  return (
    <div className="h-full w-full flex flex-col" style={{ minHeight: 0, gap: 4 }}>
      {/* Table lives inside a flex-1 wrapper with overflow-y auto so the
          matrix fits its container naturally when the country set is
          small (ROWAD's fixed 4-country footprint), but degrades to a
          scroll rather than clipping if the row count ever grows. */}
      <div className="flex-1 min-h-0" style={{ overflowY: "auto", borderRadius: 8 }}>
      <table
        className="w-full"
        style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: "13%" }} />
          <col style={{ width: "9%" }} />
          {STAGES.map((s) => (
            <col key={s.key} style={{ width: "15.6%" }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th
              className="font-semibold text-white truncate"
              style={{
                background: "var(--color-secondary)",
                fontSize: "var(--text-table-header)",
                textAlign: "left",
                padding: "8px 10px",
                letterSpacing: 0.2,
              }}
            >
              Country
            </th>
            <th
              className="font-semibold text-white truncate"
              style={{
                background: "var(--color-secondary)",
                fontSize: "var(--text-table-header)",
                textAlign: "right",
                padding: "8px 10px",
                letterSpacing: 0.2,
              }}
            >
              Total Opps
            </th>
            {STAGES.map((s) => (
              <th
                key={s.key}
                className="font-semibold text-white"
                title={s.label}
                style={{
                  background: "var(--color-secondary)",
                  fontSize: "var(--text-table-header)",
                  textAlign: "center",
                  padding: "8px 6px",
                  letterSpacing: 0.2,
                  lineHeight: 1.2,
                }}
              >
                {s.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.country}>
              <td
                className="font-bold truncate"
                style={{
                  fontSize: 12,
                  padding: "2px 10px",
                  color: "var(--color-text-primary)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {row.country}
              </td>
              <td
                className="text-right font-semibold"
                style={{
                  fontSize: 12,
                  padding: "2px 10px",
                  color: "var(--color-text-body)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {row.totalOpportunities}
              </td>
              {STAGES.map((s) => {
                const count = row[s.key];
                const share = row.totalOpportunities === 0 ? 0 : count / row.totalOpportunities;
                const bg = cellBackground(share, s.key === "award");
                const fg = cellTextColor(share);
                return (
                  <td
                    key={s.key}
                    title={`${row.country} - ${s.label}: ${count} of ${row.totalOpportunities} (${(share * 100).toFixed(0)}%)`}
                    style={{
                      padding: 2,
                      borderBottom: "1px solid var(--color-border)",
                      background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                    }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        background: bg,
                        color: fg,
                        borderRadius: 5,
                        padding: "3px 6px",
                        gap: 5,
                        minHeight: 22,
                      }}
                    >
                      <span className="font-bold" style={{ fontSize: 13, lineHeight: 1 }}>
                        {count}
                      </span>
                      {count > 0 && (
                        <span
                          className="font-semibold"
                          style={{ fontSize: 10, opacity: share >= 0.35 ? 0.85 : 0.65 }}
                        >
                          ({(share * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="flex items-center shrink-0" style={{ gap: 10, flexWrap: "wrap" }}>
        <span
          className="font-semibold uppercase"
          style={{ fontSize: 9, color: "var(--color-text-muted)", letterSpacing: 0.4 }}
        >
          Share of Country
        </span>
        <div className="flex items-center" style={{ gap: 4 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: "transparent",
              border: "1px solid var(--color-border)",
            }}
          />
          <span style={{ fontSize: 9.5, color: "var(--color-text-body)", fontWeight: 600 }}>0%</span>
        </div>
        <div className="flex items-center" style={{ gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(27,42,74,0.12)" }} />
          <span style={{ fontSize: 9.5, color: "var(--color-text-body)", fontWeight: 600 }}>&lt;15%</span>
        </div>
        <div className="flex items-center" style={{ gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(27,42,74,0.28)" }} />
          <span style={{ fontSize: 9.5, color: "var(--color-text-body)", fontWeight: 600 }}>15-35%</span>
        </div>
        <div className="flex items-center" style={{ gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(27,42,74,0.55)" }} />
          <span style={{ fontSize: 9.5, color: "var(--color-text-body)", fontWeight: 600 }}>35-60%</span>
        </div>
        <div className="flex items-center" style={{ gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: colors.secondary }} />
          <span style={{ fontSize: 9.5, color: "var(--color-text-body)", fontWeight: 600 }}>&gt;60% (bottleneck)</span>
        </div>
      </div>
    </div>
  );
}
