import type { AgreementRecord } from "../../types/domain";
import { Pill } from "../primitives/Pill";
import { radius } from "../../theme/tokens";

/** "Agreements Register" evidence table — same navy sticky-header +
 * zebra-row pattern as the other evidence tables, but with no footer
 * (agreements have no numeric total to sum — no value data exists in the
 * source). Status is a colored pill: green "Signed" reuses the existing
 * Pill primitive as-is (tone="success"); "Unsigned" has no matching Pill
 * tone today, so it's rendered inline using the same recipe (rounded pill,
 * dot, tone color) with the existing --color-warning tokens — no new color
 * is introduced, and Pill.tsx itself is left unmodified. */
export function AgreementsTable({ rows }: { rows: AgreementRecord[] }) {
  const cellPad = "5px 10px";
  const cellFont = 11.5;
  const headers = ["SR", "Project", "Category", "Type", "Parties", "Status"];

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden" style={{ borderRadius: 8, scrollBehavior: "smooth" }}>
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "6%" }} />
          <col style={{ width: "26%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "14%" }} />
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
          {rows.map((a, i) => (
            <tr key={a.sr}>
              <td
                style={{
                  fontSize: cellFont,
                  padding: cellPad,
                  color: "var(--color-text-body)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {a.sr}
              </td>
              <td
                className="font-medium truncate"
                title={a.projectName}
                style={{
                  fontSize: cellFont,
                  padding: cellPad,
                  color: "var(--color-text-primary)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {a.projectName}
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
                {a.agreementCategory}
              </td>
              <td
                className="truncate"
                title={a.agreementType}
                style={{
                  fontSize: cellFont,
                  padding: cellPad,
                  color: "var(--color-text-body)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {a.agreementType}
              </td>
              <td
                className="truncate"
                title={a.parties}
                style={{
                  fontSize: cellFont,
                  padding: cellPad,
                  color: "var(--color-text-body)",
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {a.parties}
              </td>
              <td
                style={{
                  padding: cellPad,
                  background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {a.status === "Signed" ? (
                  <Pill tone="success">Signed</Pill>
                ) : (
                  <div
                    className="flex items-center gap-1.5 font-semibold"
                    style={{
                      background: "var(--color-warning-soft)",
                      color: "var(--color-warning)",
                      borderRadius: radius.pill,
                      padding: "4px 10px",
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      width: "fit-content",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--color-warning)" }} />
                    {a.status || "Unsigned"}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
