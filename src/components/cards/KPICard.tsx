import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { IconBadge } from "../primitives/IconBadge";
import { radius, shadow } from "../../theme/tokens";
import type { IconTone } from "../../theme/tokens";

interface KPICardProps {
  icon: LucideIcon;
  tone?: IconTone;
  label: string;
  /** Plain string/number renders as the usual single-line big value. Pass a
   * ReactNode (e.g. a multi-currency breakdown) when a single number would
   * be mathematically wrong to show — it renders smaller and can wrap. */
  value: ReactNode;
  valueTone?: "primary" | "secondary";
  subtitle?: string;
  /** Real, derived-from-current-data comparisons only (e.g. a share of
   * total). Never a fabricated "vs previous period" claim — no date
   * dimension exists in the source data to support one. */
  trend?: string;
  footnote?: string;
}

/** The single reusable KPI card used for every card in the KPI strip across
 * all six pages: icon badge, label, big value, subtitle, optional real
 * trend/footnote. No page defines its own bespoke card. */
export function KPICard({
  icon,
  tone = "rose",
  label,
  value,
  valueTone = "secondary",
  subtitle,
  trend,
  footnote,
}: KPICardProps) {
  return (
    <motion.div
      className="flex-1 flex flex-col bg-card overflow-hidden"
      style={{
        borderRadius: radius.card,
        boxShadow: shadow.card,
        border: "1px solid var(--color-border)",
        padding: "10px 12px",
        minWidth: 0,
        gap: 3,
      }}
      whileHover={{ boxShadow: shadow.cardHover, y: -2 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <IconBadge icon={icon} tone={tone} size={26} />
        <span
          className="font-bold min-w-0"
          style={{
            fontSize: "var(--text-kpi-label)",
            color: "var(--color-text-primary)",
            lineHeight: 1.15,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {label}
        </span>
      </div>
      {(() => {
        // Auto-shrink value font size for long text values (e.g. "Hana&Donia",
        // country names) so they fit the KPI card width without truncation.
        // Numbers and short strings keep the display font (25 px); longer
        // strings scale down progressively. ReactNodes (like the currency
        // breakdown) render at 12.5 px in the natural flow instead of the
        // huge display font. */
        const isText = typeof value === "string" || typeof value === "number";
        const asString = isText ? String(value) : "";
        let sz: string | number = "var(--text-kpi-value)";
        if (isText) {
          if (asString.length > 12) sz = 15;
          else if (asString.length > 9) sz = 17;
          else if (asString.length > 6) sz = 20;
        } else {
          sz = 12.5;
        }
        return (
          <span
            className={`font-bold ${isText ? "truncate" : ""}`}
            style={{
              fontSize: sz,
              color: valueTone === "primary" ? "var(--color-primary)" : "var(--color-text-primary)",
              lineHeight: isText ? 1.1 : 1.3,
              whiteSpace: isText ? "nowrap" : "normal",
            }}
          >
            {value}
          </span>
        );
      })()}
      {subtitle && (
        <span className="truncate" style={{ fontSize: "var(--text-kpi-subtitle)", color: "var(--color-text-muted)" }}>
          {subtitle}
        </span>
      )}
      {trend && (
        <span
          className="flex items-center gap-1 font-semibold truncate"
          style={{ fontSize: "var(--text-kpi-subtitle)", color: "var(--color-success)" }}
        >
          <ArrowUpRight size={11} className="shrink-0" />
          <span className="truncate">{trend}</span>
        </span>
      )}
      {footnote && (
        <span className="truncate" style={{ fontSize: "var(--text-kpi-subtitle)", color: "var(--color-text-muted)" }}>
          {footnote}
        </span>
      )}
    </motion.div>
  );
}
