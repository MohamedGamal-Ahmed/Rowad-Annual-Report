import type { PostAwardCurrency } from "../../types/postAward";
import { POST_AWARD_CURRENCY_ORDER } from "../../types/postAward";
import { currencyPalette } from "../../theme/tokens";
import { formatCompact } from "../../services/postAwardCalculations";

/** Post-Award counterpart of CurrencyBreakdownValue.tsx — same per-currency
 * KPI rendering, 4-currency set (no CFA). Reuses the Pre-Award color
 * palette for EGP/USD/SAR/EUR so both reports read consistently. */
export function PostAwardCurrencyBreakdownValue({ amounts }: { amounts: Partial<Record<PostAwardCurrency, number>> }) {
  const rows = POST_AWARD_CURRENCY_ORDER.filter((c) => (amounts[c] ?? 0) !== 0);
  if (rows.length === 0) {
    return (
      <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 500 }}>
        No value recorded
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
                background: currencyPalette[c === "EUR" ? "EURO" : c],
                flexShrink: 0,
              }}
            />
            <span className="font-semibold" style={{ fontSize: 9.5, color: "var(--color-text-muted)", letterSpacing: 0.3 }}>
              {c}
            </span>
          </div>
          <span className="font-bold" style={{ fontSize: 11.5, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
            {formatCompact(amounts[c] ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}
