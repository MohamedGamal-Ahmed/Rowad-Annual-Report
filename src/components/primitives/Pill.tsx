import type { ReactNode } from "react";
import { radius } from "../../theme/tokens";

interface PillProps {
  tone?: "success" | "navy" | "rose";
  children: ReactNode;
  dot?: boolean;
}

const toneStyle: Record<NonNullable<PillProps["tone"]>, { bg: string; fg: string; dot: string }> = {
  success: { bg: "var(--color-success-soft)", fg: "var(--color-success)", dot: "var(--color-success)" },
  navy: { bg: "var(--color-secondary-soft)", fg: "var(--color-secondary)", dot: "var(--color-secondary)" },
  rose: { bg: "var(--color-primary-soft)", fg: "var(--color-primary)", dot: "var(--color-primary)" },
};

/** Small rounded status pill (e.g. the green "Snapshot Date" indicator). */
export function Pill({ tone = "success", children, dot = true }: PillProps) {
  const s = toneStyle[tone];
  return (
    <div
      className="flex items-center gap-1.5 font-semibold"
      style={{
        background: s.bg,
        color: s.fg,
        borderRadius: radius.pill,
        padding: "4px 10px",
        fontSize: 11,
        whiteSpace: "nowrap",
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />}
      {children}
    </div>
  );
}
