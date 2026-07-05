import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import type { CountryStatsExtended } from "../../services/calculations";
import { formatAmountsBreakdown } from "../../services/calculations";
import type { Currency } from "../../types/domain";
import { colors } from "../../theme/tokens";

type SortKey = "country" | "totalOpportunities" | "awardedProjects" | "winRate" | "value";
type SortDir = "asc" | "desc";

interface EnhancedCountryComparisonTableProps {
  rows: CountryStatsExtended[];
  currency: Currency | null;
}

/** Same Win Rate progress bar as AssigneeTable's WinRateCell — one
 * progress-bar primitive for the whole platform. Adds conditional
 * formatting: bars turn success-green above the strong-performer
 * threshold and error-red below the concern threshold, so the eye can
 * scan the column without reading every percentage. */
function WinRateCell({ rate }: { rate: number }) {
  const pct = Math.max(0, Math.min(100, rate * 100));
  const barColor = pct >= 50 ? colors.success : pct < 30 ? colors.error : colors.primary;
  const textColor = pct >= 50 ? colors.success : pct < 30 ? colors.error : colors.textPrimary;
  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: 56, height: 6, background: colors.graySoft, borderRadius: 999 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: barColor }} />
      </div>
      <span className="font-semibold" style={{ fontSize: "var(--text-table-cell)", color: textColor }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function formatValue(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Sort-agnostic value used ONLY for the sort comparator when Currency =
 * "All". Sums each country's per-currency amounts into ONE number for
 * ordering purposes only — never displayed, never labeled, never used as
 * a KPI. This is the only place in the app that combines currencies,
 * and it is deliberately scoped to sort tiebreaking so the underlying
 * "never blend a displayed value" rule is preserved. */
function sortValueFallback(row: CountryStatsExtended): number {
  return Object.values(row.amounts).reduce((a, v) => a + (v ?? 0), 0);
}

/** "Country Comparison Summary" — the evidence layer. Reuses the same
 * navy header / zebra-striped body / progress-bar cell language as the
 * Executive AssigneeTable, plus three affordances that Page 1 doesn't
 * need but this Evidence-level layer does:
 *
 * 1. Sortable columns (click header, arrow indicator).
 * 2. Search box (filters by country name, case-insensitive).
 * 3. Sticky first column (Country stays visible on horizontal scroll
 *    even though ROWAD's column set fits — the pattern is set up so it
 *    scales when more markets are added).
 *
 * `currency: null` ("All") still shows a per-currency breakdown for the
 * value column — never a blended figure — and the sort on that column
 * falls back to a per-row internal-only sum (see sortValueFallback). */
export function EnhancedCountryComparisonTable({ rows, currency }: EnhancedCountryComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalOpportunities");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");

  const valueHeader = currency ? `Awarded Value (${currency})` : "Awarded Value (All)";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q === "" ? rows : rows.filter((r) => r.country.toLowerCase().includes(q));
  }, [rows, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "country":
          cmp = a.country.localeCompare(b.country);
          break;
        case "totalOpportunities":
          cmp = a.totalOpportunities - b.totalOpportunities;
          break;
        case "awardedProjects":
          cmp = a.awardedProjects - b.awardedProjects;
          break;
        case "winRate":
          cmp = a.winRate - b.winRate;
          break;
        case "value": {
          const av = currency ? a.awardedValue : sortValueFallback(a);
          const bv = currency ? b.awardedValue : sortValueFallback(b);
          cmp = av - bv;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir, currency]);

  function handleSort(k: SortKey) {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "country" ? "asc" : "desc");
    }
  }

  const SortArrow = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown size={10} style={{ opacity: 0.55 }} />;
    return sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />;
  };

  return (
    <div className="h-full flex flex-col min-h-0" style={{ gap: 6 }}>
      {/* Search box — small, unobtrusive, reuses input radius token */}
      <div
        className="flex items-center shrink-0"
        style={{
          gap: 6,
          padding: "4px 8px",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          background: "#FFFFFF",
        }}
      >
        <Search size={12} color="var(--color-text-muted)" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search country..."
          className="flex-1 outline-none"
          style={{
            fontSize: 11.5,
            color: "var(--color-text-primary)",
            border: "none",
            background: "transparent",
            minWidth: 0,
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="font-semibold"
            style={{
              fontSize: 10,
              color: "var(--color-text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div
        className="flex-1 min-h-0 overflow-auto"
        style={{ borderRadius: 8, scrollBehavior: "smooth" }}
      >
        <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "28%" }} />
          </colgroup>
          <thead>
            <tr>
              {(
                [
                  { key: "country" as SortKey, label: "Country", align: "left" as const, sticky: true },
                  { key: "totalOpportunities" as SortKey, label: "Total Opps", align: "right" as const },
                  { key: "awardedProjects" as SortKey, label: "Awarded", align: "right" as const },
                  { key: "winRate" as SortKey, label: "Win Rate", align: "left" as const },
                  { key: "value" as SortKey, label: valueHeader, align: "right" as const },
                ]
              ).map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="font-semibold text-white truncate"
                  style={{
                    position: "sticky",
                    top: 0,
                    left: col.sticky ? 0 : undefined,
                    zIndex: col.sticky ? 3 : 2,
                    background: "var(--color-secondary)",
                    fontSize: "var(--text-table-header)",
                    textAlign: col.align,
                    padding: "8px 10px",
                    letterSpacing: 0.2,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <span className="inline-flex items-center" style={{ gap: 4 }}>
                    {col.label}
                    <SortArrow k={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const rowBg = i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)";
              return (
                <tr key={r.country}>
                  <td
                    className="font-bold truncate"
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      fontSize: 12.5,
                      padding: "7px 10px",
                      color: "var(--color-text-primary)",
                      background: rowBg,
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    {r.country}
                  </td>
                  <td
                    className="text-right"
                    style={{
                      fontSize: 12.5,
                      padding: "7px 10px",
                      color: "var(--color-text-body)",
                      background: rowBg,
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    {r.totalOpportunities}
                  </td>
                  <td
                    className="text-right"
                    style={{
                      fontSize: 12.5,
                      padding: "7px 10px",
                      color: "var(--color-text-body)",
                      background: rowBg,
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    {r.awardedProjects}
                  </td>
                  <td
                    style={{
                      padding: "7px 10px",
                      background: rowBg,
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <WinRateCell rate={r.winRate} />
                  </td>
                  <td
                    className="truncate text-right"
                    title={currency ? undefined : formatAmountsBreakdown(r.amounts)}
                    style={{
                      fontSize: currency ? 12.5 : 11,
                      padding: "7px 10px",
                      color: "var(--color-text-primary)",
                      fontWeight: 700,
                      background: rowBg,
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    {currency ? `${currency} ${formatValue(r.awardedValue)}` : formatAmountsBreakdown(r.amounts)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center"
                  style={{
                    fontSize: 11.5,
                    padding: 16,
                    color: "var(--color-text-muted)",
                    background: "#FFFFFF",
                  }}
                >
                  No countries match "{search}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
