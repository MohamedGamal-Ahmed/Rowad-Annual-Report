import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Info } from "lucide-react";
import { radius, shadow } from "../../theme/tokens";

interface SectionCardProps {
  title?: string;
  /** Optional one-line description under the title — e.g. clarifying what
   * a percentage represents. Kept short and muted; not a substitute for
   * the `info` tooltip (which is for a longer caveat/methodology note). */
  subtitle?: string;
  info?: string;
  right?: ReactNode;
  children: ReactNode;
  padding?: number;
  className?: string;
}

/** The one card container used for every chart/table/insights panel on
 * every page. Title bar + optional info tooltip + optional right-aligned
 * slot, soft shadow, subtle hover elevation. Nothing renders its own
 * bespoke bg/shadow/border — everything wraps in this. */
export function SectionCard({ title, subtitle, info, right, children, padding = 12, className }: SectionCardProps) {
  return (
    <motion.div
      className={`flex flex-col bg-card overflow-hidden ${className ?? ""}`}
      style={{
        borderRadius: radius.card,
        boxShadow: shadow.card,
        border: "1px solid var(--color-border)",
        padding,
        minWidth: 0,
        minHeight: 0,
      }}
      whileHover={{ boxShadow: shadow.cardHover, y: -2 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {title && (
        <div className="flex flex-col shrink-0" style={{ marginBottom: subtitle ? 4 : 8 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className="font-semibold"
                style={{ fontSize: "var(--text-section-title)", color: "var(--color-secondary)" }}
              >
                {title}
              </span>
              {info && (
                <span title={info}>
                  <Info size={12} color="var(--color-text-muted)" />
                </span>
              )}
            </div>
            {right}
          </div>
          {subtitle && (
            <span style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 1 }}>{subtitle}</span>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </motion.div>
  );
}
