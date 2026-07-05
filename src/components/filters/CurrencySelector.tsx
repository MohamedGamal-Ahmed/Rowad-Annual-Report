import { useDashboardStore } from "../../store/useDashboardStore";
import { CURRENCY_SORT_ORDER } from "../../types/domain";
import { awardedValue } from "../../services/calculations";

/** Disconnected currency selector + its paired KPI card, grouped as one
 * visual unit. This selector affects ONLY this card — it must never be
 * wired to Country/Assignee/Status filtering, and the value shown is
 * never a cross-currency sum (BR: never blend currencies). */
export function CurrencySelector() {
  const { currency, setCurrency, filteredOpportunities } = useDashboardStore();
  const opps = filteredOpportunities();
  // This orphaned component predates the "All" currency option (currency
  // can now be null) — fall back to EGP for this local, unused-in-the-app
  // preview so it still type-checks; it is not wired into any page.
  const resolvedCurrency = currency ?? "EGP";
  const value = awardedValue(opps, resolvedCurrency);

  return (
    <div
      className="rounded-xl bg-card p-3 flex flex-col gap-2"
      style={{ borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold" style={{ fontSize: "var(--text-card-label)", color: "var(--color-secondary)" }}>
          Awarded Value ({resolvedCurrency})
        </span>
        <select
          className="text-xs rounded border px-1.5 py-0.5"
          style={{ borderColor: "var(--color-border)" }}
          value={resolvedCurrency}
          onChange={(e) => setCurrency(e.target.value as typeof resolvedCurrency)}
        >
          {CURRENCY_SORT_ORDER.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <span className="font-semibold" style={{ fontSize: "var(--text-kpi-value)", color: "var(--color-primary)" }}>
        {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}
