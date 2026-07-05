import type { Currency } from "../../types/domain";
import { CURRENCY_SORT_ORDER } from "../../types/domain";
import { currencyPalette } from "../../theme/tokens";
import { formatCompact } from "../../services/calculations";

/** Compact multi-currency value renderer for KPI cards when the currency
 *  filter is "All". Renders each currency on its own line with a small
 *  color chip, label, and the compact amount right-aligned. Preserves the
 *  never-blend rule: values are shown per currency, never summed.
 *
 *  Design vs the old comma-separated `formatAmountsBreakdown` string:
 *  - each currency reads independently at a glance instead of scanning a
 *    dense text line
 *  - visually consistent with the color language used everywhere else
 *    (currency palette dots)
 *  - fits the KPI card's tall vertical space (≈70 px) with no wrapping */
export function CurrencyBreakdownValue({ amounts }: { amounts: Partial<Record<Currency, number>> }) {
  const rows = CURRENCY_SORT_ORDER.filter((c) => (amounts[c] ?? 0) > 0);
  if (rows.length === 0) {
    return (
      <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500 }}>
        No awarded value recorded
      </span>
    );
  }
  return (
    <div className="flex flex-col" style={{ gap: 1, marginTop: -2 }}>
      {rows.map((c) => (
        <div key={c} className="flex items-center justify-between" style={{ gap: 6, lineHeight: 1.2 }}>
          <div className="flex items-center" style={{ gap: 4, minWidth: 0 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: currencyPalette[c],
                flexShrink: 0,
              }}
            />
            <span
              className="font-semibold"
              style={{ fontSize: 9.5, color: "var(--color-text-muted)", letterSpacing: 0.3 }}
            >
              {c === "EURO" ? "EUR" : c}
            </span>
          </div>
          <span
            className="font-bold"
            style={{ fontSize: 11.5, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}
          >
            {formatCompact(amounts[c] ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}
