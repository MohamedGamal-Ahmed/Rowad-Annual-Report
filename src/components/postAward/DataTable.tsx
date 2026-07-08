import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: string; // flexible col width e.g. "20%"
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

/** Generic sticky-header, zebra-row register table — the Post-Award
 * equivalent of ProjectRegisterTable, parameterized for any row shape since
 * almost every Post-Award sheet is fundamentally a register. Same visual
 * language as every other table in the app (navy sticky header, 11.5px
 * cells, alternating row background). */
export function DataTable<T>({ columns, rows, rowKey }: { columns: DataTableColumn<T>[]; rows: T[]; rowKey: (row: T, i: number) => string | number }) {
  if (rows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>
        No records in the current filter.
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden" style={{ borderRadius: 8, scrollBehavior: "smooth" }}>
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}>
        <colgroup>
          {columns.map((c) => (
            <col key={c.key} style={{ width: c.width ?? `${Math.floor(100 / columns.length)}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="font-semibold text-white truncate"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  background: "var(--color-secondary)",
                  fontSize: "var(--text-table-header)",
                  textAlign: c.align === "right" ? "right" : "left",
                  padding: "7px 10px",
                  letterSpacing: 0.2,
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row, i)}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className="truncate"
                  style={{
                    fontSize: "var(--text-table-cell)",
                    padding: "5px 10px",
                    color: "var(--color-text-body)",
                    textAlign: c.align === "right" ? "right" : "left",
                    background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
