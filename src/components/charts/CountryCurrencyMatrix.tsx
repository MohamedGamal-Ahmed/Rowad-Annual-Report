import { CURRENCY_SORT_ORDER } from "../../types/domain";
import type { Currency } from "../../types/domain";
import { currencyPalette } from "../../theme/tokens";
import { formatCompact } from "../../services/calculations";

interface CountryCurrencyMatrixProps {
  data: ({ country: string } & Partial<Record<Currency, number>>)[];
}

/** Display label per currency -- the data key stays "EURO" everywhere else
 * (types, store, calculations) since that's the workbook's own currency
 * code; only this column header is shortened to the conventional "EUR". */
const CURRENCY_LABEL: Record<Currency, string> = {
  EGP: "EGP",
  USD: "USD",
  SAR: "SAR",
  EURO: "EUR",
  CFA: "CFA",
};

// Fixed percentage widths (not px) so the table always exactly fills its
// SectionCard regardless of minor layout drift -- no horizontal scroll, ever.
const COUNTRY_COL_PCT = 14;
const CURRENCY_COL_PCT = (100 - COUNTRY_COL_PCT) / CURRENCY_SORT_ORDER.length; // 17.2%

/**
 * "Awarded Value by Country -- All Currencies", matrix form.
 *
 * Why not a chart: EGP/CFA awards here run into the billions while
 * SAR/USD/EUR run into the tens/hundreds of millions. Plotting all five on
 * one shared numeric axis (even as separate grouped bars) visually implies
 * they're comparable magnitudes when they're not. A plain matrix has no axis
 * to be misleading on -- every cell is read on its own terms, in its own
 * currency, exactly like the KPI card's breakdown.
 *
 * All five currency columns (EGP/USD/SAR/EUR/CFA) are ALWAYS rendered, never
 * conditionally hidden based on which currencies happen to have data in the
 * current filter -- a country with no award in a given currency shows a
 * plain "-", which reads unambiguously as "no award here", not "this
 * currency doesn't exist". Values use the shared formatCompact() formatter
 * with no CSS truncation/ellipsis -- columns are sized to fit the longest
 * realistic value ("169.98M") in full.
 */
export function CountryCurrencyMatrix({ data }: CountryCurrencyMatrixProps) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center px-4">
        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
          No awarded value recorded for any country/currency in the current filter.
        </span>
      </div>
    );
  }

  const totals: Record<Currency, number> = { EGP: 0, USD: 0, SAR: 0, EURO: 0, CFA: 0 };
  for (const c of CURRENCY_SORT_ORDER) totals[c] = data.reduce((sum, d) => sum + (d[c] ?? 0), 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <table className="w-full h-full" style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: `${COUNTRY_COL_PCT}%` }} />
          {CURRENCY_SORT_ORDER.map((c) => (
            <col key={c} style={{ width: `${CURRENCY_COL_PCT}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th
              className="font-semibold text-white"
              style={{
                background: "var(--color-secondary)",
                fontSize: 9.5,
                textAlign: "left",
                padding: "5px 3px",
                whiteSpace: "nowrap",
                borderBottom: "2px solid var(--color-border-strong)",
              }}
            >
              Country
            </th>
            {CURRENCY_SORT_ORDER.map((c) => (
              <th
                key={c}
                className="font-bold text-white"
                style={{
                  background: "var(--color-secondary)",
                  fontSize: 10,
                  textAlign: "right",
                  padding: "5px 6px",
                  whiteSpace: "nowrap",
                  borderBottom: "2px solid var(--color-border-strong)",
                  letterSpacing: 0.3,
                }}
              >
                {CURRENCY_LABEL[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.country} style={{ background: i % 2 === 0 ? "#FFFFFF" : "var(--color-bg)" }}>
              <td
                className="font-medium"
                style={{
                  fontSize: 10.5,
                  padding: "4px 3px",
                  color: "var(--color-text-primary)",
                  borderBottom: "1px solid var(--color-border)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {row.country}
              </td>
              {CURRENCY_SORT_ORDER.map((c) => {
                const v = row[c] ?? 0;
                return (
                  <td
                    key={c}
                    className="font-semibold"
                    style={{
                      fontSize: 10,
                      textAlign: "right",
                      padding: "4px 3px",
                      color: v > 0 ? currencyPalette[c] : "var(--color-text-muted)",
                      borderBottom: "1px solid var(--color-border)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {v > 0 ? formatCompact(v) : "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              className="font-bold text-white"
              style={{
                position: "sticky",
                bottom: 0,
                background: "var(--color-primary)",
                fontSize: 11,
                padding: "7px 3px",
                whiteSpace: "nowrap",
                borderTop: "2px solid rgba(255,255,255,0.35)",
              }}
            >
              Total
            </td>
            {CURRENCY_SORT_ORDER.map((c) => (
              <td
                key={c}
                className="font-bold text-white"
                style={{
                  position: "sticky",
                  bottom: 0,
                  background: "var(--color-primary)",
                  fontSize: 11,
                  textAlign: "right",
                  padding: "7px 3px",
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                  borderTop: "2px solid rgba(255,255,255,0.35)",
                }}
              >
                {totals[c] > 0 ? formatCompact(totals[c]) : "-"}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
