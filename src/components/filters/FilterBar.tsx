import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useDashboardStore } from "../../store/useDashboardStore";
import { CURRENCY_SORT_ORDER } from "../../types/domain";
import { radius } from "../../theme/tokens";

function FilterSelect({
  label,
  value,
  options,
  onChange,
  width = 92,
  allowAll = true,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  width?: number;
  allowAll?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1" style={{ width }}>
      <span
        className="font-semibold uppercase"
        style={{ fontSize: "var(--text-filter-label)", color: "var(--color-text-muted)", letterSpacing: 0.4 }}
      >
        {label}
      </span>
      <div className="relative">
        <select
          aria-label={label}
          className="w-full bg-white appearance-none"
          style={{
            fontSize: "var(--text-filter-value)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: radius.input,
            padding: "5px 20px 5px 8px",
            fontWeight: 600,
          }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {allowAll && <option value="">All</option>}
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          color="var(--color-text-muted)"
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}

/** Country / Assignee / Status apply to every widget on the page. Currency
 * is intentionally a disconnected selector (see services/calculations) — it
 * scopes financial figures only, never filters counts. All four live in one
 * bar to match the approved layout. */
export function FilterBar() {
  const { opportunities, country, assignee, status, currency, setCountry, setAssignee, setStatus, setCurrency } =
    useDashboardStore();

  const countries = useMemo(() => Array.from(new Set(opportunities.map((o) => o.country))).sort(), [opportunities]);
  const assignees = useMemo(() => Array.from(new Set(opportunities.map((o) => o.assignee))).sort(), [opportunities]);
  const statuses = useMemo(() => Array.from(new Set(opportunities.map((o) => o.status))).sort(), [opportunities]);

  return (
    <div className="no-print flex gap-2 shrink-0">
      <FilterSelect label="Country" value={country ?? ""} options={countries} onChange={(v) => setCountry(v || null)} />
      <FilterSelect
        label="Assignee"
        value={assignee ?? ""}
        options={assignees}
        onChange={(v) => setAssignee(v || null)}
      />
      <FilterSelect label="Status" value={status ?? ""} options={statuses} onChange={(v) => setStatus(v || null)} />
      <FilterSelect
        label="Currency"
        value={currency ?? ""}
        options={CURRENCY_SORT_ORDER}
        onChange={(v) => setCurrency(v ? (v as (typeof CURRENCY_SORT_ORDER)[number]) : null)}
        width={78}
      />
    </div>
  );
}
