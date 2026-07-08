import { usePostAwardStore } from "../../store/usePostAwardStore";
import { POST_AWARD_SNAPSHOT_DATE_LABEL } from "../../config/snapshot";

/** Post-Award counterpart of PrintReportHeader.tsx — same print-only
 * pattern, driven by the Post-Award filter state (Project/Owner Entity/
 * Currency) instead of Country/Assignee/Status. */
export function PostAwardPrintHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { project, ownerEntity, currency } = usePostAwardStore();

  const fields: { key: string; value: string }[] = [
    { key: "Data as of", value: POST_AWARD_SNAPSHOT_DATE_LABEL },
    { key: "Project", value: project ?? "All" },
    { key: "Owner Entity", value: ownerEntity ?? "All" },
    { key: "Currency", value: currency ?? "All" },
  ];

  return (
    <div
      className="print-only"
      style={{
        width: "100%",
        justifyContent: "space-between",
        alignItems: "flex-end",
        borderBottom: "1px solid var(--color-border-strong)",
        padding: "0 16px 6px",
        marginBottom: 8,
        gap: 16,
      }}
    >
      <div className="flex flex-col" style={{ minWidth: 0 }}>
        <span className="font-bold" style={{ fontSize: "var(--text-display)", color: "var(--color-secondary)" }}>
          {title}
        </span>
        <span className="font-semibold" style={{ fontSize: "var(--text-section-title)", color: "var(--color-secondary)" }}>
          {subtitle}
        </span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(2, auto)", columnGap: 24, rowGap: 2, flexShrink: 0 }}>
        {fields.map((f) => (
          <div key={f.key} className="flex flex-col" style={{ lineHeight: 1.3 }}>
            <span
              className="font-semibold uppercase"
              style={{ fontSize: "var(--text-filter-label)", color: "var(--color-text-body)", letterSpacing: 0.4 }}
            >
              {f.key}
            </span>
            <span className="font-bold" style={{ fontSize: "var(--text-filter-value)", color: "var(--color-text-primary)" }}>
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
