import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { usePostAwardStore } from "../../store/usePostAwardStore";
import { POST_AWARD_CURRENCY_ORDER } from "../../types/postAward";
import { radius } from "../../theme/tokens";

function FilterSelect({
  label,
  value,
  options,
  onChange,
  width = 110,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  width?: number;
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
          className="w-full bg-white appearance-none truncate"
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
          <option value="">All</option>
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

/** Project / Owner Entity / Currency — the Post-Award equivalent of
 * FilterBar. Currency stays a disconnected selector (scopes financial
 * figures only, never row counts), same rule as Pre-Award. */
export function PostAwardFilterBar() {
  const { projects, project, ownerEntity, currency, setProject, setOwnerEntity, setCurrency } = usePostAwardStore();

  const projectNames = useMemo(() => Array.from(new Set(projects.map((p) => p.projectName))).sort(), [projects]);
  const ownerEntities = useMemo(() => Array.from(new Set(projects.map((p) => p.ownerEntity).filter(Boolean))).sort(), [projects]);

  return (
    <div className="no-print flex gap-2 shrink-0">
      <FilterSelect label="Project" value={project ?? ""} options={projectNames} onChange={(v) => setProject(v || null)} width={140} />
      <FilterSelect label="Owner Entity" value={ownerEntity ?? ""} options={ownerEntities} onChange={(v) => setOwnerEntity(v || null)} width={120} />
      <FilterSelect
        label="Currency"
        value={currency ?? ""}
        options={POST_AWARD_CURRENCY_ORDER}
        onChange={(v) => setCurrency(v ? (v as (typeof POST_AWARD_CURRENCY_ORDER)[number]) : null)}
        width={78}
      />
    </div>
  );
}
