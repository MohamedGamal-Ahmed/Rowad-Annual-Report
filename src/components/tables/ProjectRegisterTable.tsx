import type { Opportunity } from "../../types/domain";
import type { Currency } from "../../types/domain";
import { CURRENCY_SORT_ORDER } from "../../types/domain";
import { formatAmountsBreakdown } from "../../services/calculations";

function formatValue(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Project-level evidence table shared by the Awards page ("Awarded
 * Projects") and the Pipeline page ("Pipeline Register") — same navy
 * sticky-header + zebra-row + scroll-safe pattern as AssigneeTable /
 * CountryComparisonTable on Pages 1-2. `showStatus` toggles the one column
 * that differs between the two callers (Pipeline shows lifecycle Status;
 * Awards omits it since every row is already awarded by definition).
 * `showFooter` adds the navy sticky Total row (Awards page only, per spec —
 * Pipeline Register is header + zebra rows, no footer).
 * `currency: null` ("All") shows a per-currency breakdown instead of a
 * single blended figure, same rule as every other value column in the app. */
export function ProjectRegisterTable({
  rows,
  currency,
  showStatus = false,
  showFooter = false,
}: {
  rows: Opportunity[];
  currency: Currency | null;
  showStatus?: boolean;
  showFooter?: boolean;
}) {
  const valueHeader = currency ? `Awarded Value (${currency})` : "Awarded Value (All)";
  const headers = showStatus
    ? ["Project Code", "Project Name", "Country", "Assignee", "Status", valueHeader]
    : ["Project Code", "Project Name", "Country", "Assignee", valueHeader];

  const cellPad = "5px 10px";
  const cellFont = 11.5;

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden" style={{ borderRadius: 8, scrollBehavior: "smooth" }}>
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "12%" }} />
          <col style={{ width: showStatus ? "26%" : "30%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "14%" }} />
          {showStatus && <col style={{ width: "14%" }} />}
          <col style={{ width: showStatus ? "22%" : "32%" }} />
        </colgroup>
        <thead>
          <tr>
            {headers.map((h) => (
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
                  padding: "7px 10px",
                  letterSpacing: 0.2,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((o, i) => (
            <tr key={o.projectCode}>
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
                {o.projectCode}
              </td>
              <td
                className="truncate"
                title={o.projectName}
                style={{
                  fontSize: cellFont,
                  padding: cellPad,
                  color: "var(--color-text-body)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {o.projectName}
              </td>
              <td
                className="truncate"
                style={{
                  fontSize: cellFont,
                  padding: cellPad,
                  color: "var(--color-text-body)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {o.country}
              </td>
              <td
                className="truncate"
                style={{
                  fontSize: cellFont,
                  padding: cellPad,
                  color: "var(--color-text-body)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {o.assignee}
              </td>
              {showStatus && (
                <td
                  className="truncate"
                  style={{
                    fontSize: cellFont,
                    padding: cellPad,
                    color: "var(--color-text-body)",
                    background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  {o.status}
                </td>
              )}
              <td
                className="truncate"
                title={currency ? undefined : formatAmountsBreakdown(o.amounts)}
                style={{
                  fontSize: currency ? cellFont : 11,
                  padding: cellPad,
                  color: "var(--color-text-body)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {currency ? formatValue(o.amounts[currency] ?? 0) : formatAmountsBreakdown(o.amounts)}
              </td>
            </tr>
          ))}
        </tbody>
        {showFooter && (
          <tfoot>
            <tr>
              <td
                className="font-bold text-white"
                colSpan={showStatus ? 5 : 4}
                style={{ position: "sticky", bottom: 0, background: "var(--color-secondary)", fontSize: cellFont, padding: "7px 10px" }}
              >
                Total ({rows.length} project{rows.length === 1 ? "" : "s"})
              </td>
              <td
                className="font-bold text-white truncate"
                style={{
                  position: "sticky",
                  bottom: 0,
                  background: "var(--color-secondary)",
                  fontSize: currency ? cellFont : 11,
                  padding: "7px 10px",
                }}
              >
                {currency
                  ? formatValue(rows.reduce((sum, o) => sum + (o.amounts[currency] ?? 0), 0))
                  : formatAmountsBreakdown(
                      CURRENCY_SORT_ORDER.reduce<Partial<Record<Currency, number>>>((acc, c) => {
                        const v = rows.reduce((sum, o) => sum + (o.amounts[c] ?? 0), 0);
                        if (v > 0) acc[c] = v;
                        return acc;
                      }, {}),
                    )}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
