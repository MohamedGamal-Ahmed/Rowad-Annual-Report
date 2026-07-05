import type { AssigneeStats } from "../services/calculations";
import { formatAmountsBreakdown } from "../services/calculations";
import type { Currency } from "../types/domain";
import { CURRENCY_SORT_ORDER } from "../types/domain";
import { colors } from "../theme/tokens";

function WinRateCell({ rate }: { rate: number }) {
  const pct = Math.max(0, Math.min(100, rate * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: 56, height: 6, background: colors.graySoft, borderRadius: 999 }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: colors.primary,
          }}
        />
      </div>
      <span className="font-semibold" style={{ fontSize: "var(--text-table-cell)", color: "var(--color-text-primary)" }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function formatValue(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Enterprise-grade data table: navy header, no vertical rules, inline
 * progress-bar cell for Win Rate (Stripe/Notion-style), bold navy total
 * footer row. This is the one reusable table primitive for the app.
 * `currency: null` means "All" — the Awarded Value column and footer show a
 * per-currency breakdown instead of a single (mathematically wrong) blended
 * number. Caller is responsible for pre-sorting/limiting rows (e.g. top 10
 * by awarded value).
 *
 * This is the one component on Page 1 allowed to scroll: readability of a
 * fixed top-10 list outranks squeezing rows to zero-scroll. Vertical scroll
 * only (columns are fixed-width, never horizontal), sticky header AND
 * footer so the totals stay visible, smooth-scrolling. Every other
 * component on the page stays scroll-free. */
export function AssigneeTable({ rows, currency }: { rows: AssigneeStats[]; currency: Currency | null }) {
  const totals = rows.reduce(
    (acc, r) => ({
      totalOpportunities: acc.totalOpportunities + r.totalOpportunities,
      awardedProjects: acc.awardedProjects + r.awardedProjects,
      awardedValue: acc.awardedValue + r.awardedValue,
      amounts: CURRENCY_SORT_ORDER.reduce(
        (m, c) => ({ ...m, [c]: (acc.amounts[c] ?? 0) + (r.amounts[c] ?? 0) }),
        acc.amounts,
      ),
    }),
    { totalOpportunities: 0, awardedProjects: 0, awardedValue: 0, amounts: {} as Partial<Record<Currency, number>> },
  );
  const overallWinRate = totals.totalOpportunities === 0 ? 0 : totals.awardedProjects / totals.totalOpportunities;
  const valueHeader = currency ? `Awarded Value (${currency})` : "Awarded Value (All)";

  const cellPad = "7px 10px";
  const cellFont = 12.5;

  return (
    <div
      className="h-full overflow-y-auto overflow-x-hidden"
      style={{ borderRadius: 8, scrollBehavior: "smooth" }}
    >
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "32%" }} />
        </colgroup>
        <thead>
          <tr>
            {["Assignee", "Total Opportunities", "Awarded Projects", "Win Rate %", valueHeader].map((h) => (
              <th
                key={h}
                className="font-semibold text-white truncate"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  background: "var(--color-secondary)",
                  fontSize: "var(--text-table-header)",
                  textAlign: "left",
                  padding: "8px 10px",
                  letterSpacing: 0.2,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.assignee}>
              <td
                className="font-medium truncate"
                style={{
                  fontSize: cellFont,
                  padding: cellPad,
                  color: "var(--color-text-primary)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {r.assignee}
              </td>
              <td
                style={{
                  fontSize: cellFont,
                  padding: cellPad,
                  color: "var(--color-text-body)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {r.totalOpportunities}
              </td>
              <td
                style={{
                  fontSize: cellFont,
                  padding: cellPad,
                  color: "var(--color-text-body)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {r.awardedProjects}
              </td>
              <td
                style={{
                  padding: cellPad,
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <WinRateCell rate={r.winRate} />
              </td>
              <td
                className="truncate"
                title={currency ? undefined : formatAmountsBreakdown(r.amounts)}
                style={{
                  fontSize: currency ? cellFont : 11,
                  padding: cellPad,
                  color: "var(--color-text-body)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {currency ? formatValue(r.awardedValue) : formatAmountsBreakdown(r.amounts)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              className="font-bold text-white"
              style={{ position: "sticky", bottom: 0, background: "var(--color-secondary)", fontSize: cellFont, padding: "8px 10px" }}
            >
              Total
            </td>
            <td
              className="font-bold text-white"
              style={{ position: "sticky", bottom: 0, background: "var(--color-secondary)", fontSize: cellFont, padding: "8px 10px" }}
            >
              {totals.totalOpportunities}
            </td>
            <td
              className="font-bold text-white"
              style={{ position: "sticky", bottom: 0, background: "var(--color-secondary)", fontSize: cellFont, padding: "8px 10px" }}
            >
              {totals.awardedProjects}
            </td>
            <td
              className="font-bold text-white"
              style={{ position: "sticky", bottom: 0, background: "var(--color-secondary)", fontSize: cellFont, padding: "8px 10px" }}
            >
              {(overallWinRate * 100).toFixed(1)}%
            </td>
            <td
              className="font-bold text-white truncate"
              style={{
                position: "sticky",
                bottom: 0,
                background: "var(--color-secondary)",
                fontSize: currency ? cellFont : 11,
                padding: "8px 10px",
              }}
            >
              {currency ? formatValue(totals.awardedValue) : formatAmountsBreakdown(totals.amounts)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
