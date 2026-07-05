import type { LucideIcon } from "lucide-react";
import { iconToneMap, radius } from "../../theme/tokens";
import type { IconTone } from "../../theme/tokens";

interface IconBadgeProps {
  icon: LucideIcon;
  tone?: IconTone;
  size?: number;
}

/** The one circular icon badge used everywhere an icon needs a soft-tint
 * background: KPI cards, Snapshot Insights rows. Never inline a bespoke
 * badge — add a tone to theme/tokens.ts iconToneMap instead. */
export function IconBadge({ icon: Icon, tone = "rose", size = 34 }: IconBadgeProps) {
  const { bg, fg } = iconToneMap[tone];
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size, borderRadius: radius.badge, background: bg }}
    >
      <Icon size={size * 0.5} color={fg} strokeWidth={2.25} />
    </div>
  );
}
