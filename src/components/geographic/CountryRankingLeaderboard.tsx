import type { CountryStatsExtended } from "../../services/calculations";
import { formatAmountsBreakdown, formatCompact } from "../../services/calculations";
import type { Currency } from "../../types/domain";
import { colors, countryColor } from "../../theme/tokens";

interface CountryRankingLeaderboardProps {
  rows: CountryStatsExtended[];
  currency: Currency | null;
}

export function CountryRankingLeaderboard({ rows, currency }: CountryRankingLeaderboardProps) {
  const total = rows.reduce((acc, r) => acc + r.totalOpportunities, 0);
  const maxCount = Math.max(1, ...rows.map((r) => r.totalOpportunities));

  return (
    <div className="h-full w-full flex flex-col" style={{ gap: 5 }}>
      <div className="flex items-center shrink-0" style={{ padding: "0 8px", gap: 10 }}>
        <div style={{ width: 96 }} />
        <span
          className="font-semibold uppercase"
          style={{ fontSize: 8.5, color: "var(--color-text-muted)", letterSpacing: 0.4, flex: 11 }}
        >
          Opportunities
        </span>
        <span
          className="font-semibold uppercase"
          style={{ fontSize: 8.5, color: "var(--color-text-muted)", letterSpacing: 0.4, flex: 9 }}
        >
          Win Rate
        </span>
        <span
          className="font-semibold uppercase text-right"
          style={{ fontSize: 8.5, color: "var(--color-text-muted)", letterSpacing: 0.4, flex: 10 }}
        >
          Awarded Value
        </span>
      </div>

      {rows.map((r, i) => {
        const share = total === 0 ? 0 : r.totalOpportunities / total;
        const barPct = (r.totalOpportunities / maxCount) * 100;
        const winPct = Math.max(0, Math.min(100, r.winRate * 100));
        const dotColor = countryColor(r.country, i);
        const valueDisplay = currency
          ? r.awardedValue > 0
            ? `${currency} ${formatCompact(r.awardedValue)}`
            : "-"
          : formatAmountsBreakdown(r.amounts);

        return (
          <div
            key={r.country}
            className="flex-1 min-h-0 flex items-center"
            style={{
              padding: "4px 8px",
              gap: 10,
              background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center shrink-0" style={{ gap: 8, width: 96 }}>
              <span
                className="font-bold text-center"
                style={{ fontSize: 10.5, color: "var(--color-text-muted)", width: 14 }}
              >
                #{i + 1}
              </span>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: dotColor,
                  flexShrink: 0,
                }}
              />
              <span
                className="font-bold truncate"
                style={{ fontSize: 12, color: "var(--color-text-primary)" }}
              >
                {r.country}
              </span>
            </div>

            <div className="flex items-center min-w-0" style={{ flex: 11, gap: 6 }}>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: colors.graySoft,
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${barPct}%`,
                    height: "100%",
                    background: dotColor,
                    borderRadius: 999,
                  }}
                />
              </div>
              <span
                className="font-bold shrink-0"
                style={{ fontSize: 11, color: "var(--color-text-primary)", minWidth: 62, textAlign: "right" }}
              >
                {r.totalOpportunities}{" "}
                <span style={{ color: "var(--color-text-muted)", fontWeight: 500, fontSize: 10 }}>
                  ({(share * 100).toFixed(0)}%)
                </span>
              </span>
            </div>

            <div className="flex items-center min-w-0" style={{ flex: 9, gap: 6 }}>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: colors.graySoft,
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${winPct}%`,
                    height: "100%",
                    background: colors.primary,
                    borderRadius: 999,
                  }}
                />
              </div>
              <span
                className="font-bold shrink-0"
                style={{ fontSize: 11, color: "var(--color-text-primary)", minWidth: 42, textAlign: "right" }}
              >
                {winPct.toFixed(1)}%
              </span>
            </div>

            <div
              className="min-w-0 text-right"
              style={{ flex: 10 }}
              title={!currency ? formatAmountsBreakdown(r.amounts) : undefined}
            >
              <span
                className="font-bold truncate block"
                style={{
                  fontSize: currency ? 11 : 10,
                  color: "var(--color-text-primary)",
                  lineHeight: 1.2,
                }}
              >
                {valueDisplay}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
