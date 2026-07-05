import { NavLink } from "react-router-dom";
import { Home, Globe2, Activity, Users, Trophy, Handshake, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { SIDEBAR_WIDTH } from "../../theme/tokens";
import { ExportPdfButton } from "./ExportPdfButton";

const PAGES: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "/executive-overview", label: "Executive", icon: Home },
  { path: "/geographic-analysis", label: "Geographic", icon: Globe2 },
  { path: "/pipeline-analysis", label: "Pipeline", icon: Activity },
  { path: "/assignee-performance", label: "Assignees", icon: Users },
  { path: "/award-analysis", label: "Awards", icon: Trophy },
  { path: "/agreements-analysis", label: "Agreements", icon: Handshake },
];

/** Persistent left sidebar — the single shared navigation surface for every
 * route. Lives INSIDE the fixed report canvas (see ReportCanvas), so every
 * printed/exported page carries the same chrome, matching the approved
 * mockup's app-shell composition rather than a floating top bar. */
export function Sidebar() {
  return (
    <div
      className="no-print flex flex-col shrink-0 h-full"
      style={{ width: SIDEBAR_WIDTH, background: "var(--color-secondary)" }}
    >
      {/* Logo block */}
      <div className="flex items-center gap-2.5" style={{ background: "var(--color-primary)", padding: "18px 16px" }}>
        <Home size={26} color="#fff" strokeWidth={2} />
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-white" style={{ fontSize: "var(--text-nav-brand)", letterSpacing: 0.3 }}>
            ROWAD
          </span>
          <span
            className="font-semibold"
            style={{ fontSize: "var(--text-nav-subtitle)", color: "rgba(255,255,255,0.85)", letterSpacing: 0.5 }}
          >
            PRE-AWARD MANAGEMENT
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1" style={{ padding: "14px 10px" }}>
        {PAGES.map((p) => (
          <NavLink key={p.path} to={p.path} style={{ textDecoration: "none" }}>
            {({ isActive }) => (
              <motion.div
                className="flex items-center gap-2.5"
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: isActive ? "var(--color-primary)" : "transparent",
                  color: isActive ? "#fff" : "var(--color-text-on-dark-muted, rgba(255,255,255,0.68))",
                }}
                whileHover={isActive ? {} : { background: "rgba(255,255,255,0.06)" }}
                transition={{ duration: 0.15 }}
              >
                <p.icon size={16} strokeWidth={2} color={isActive ? "#fff" : "rgba(255,255,255,0.7)"} />
                <span className="font-medium" style={{ fontSize: "var(--text-nav)" }}>
                  {p.label}
                </span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3" style={{ padding: "14px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <ExportPdfButton />
        <NavLink to="/about" style={{ textDecoration: "none" }}>
          {({ isActive }) => (
            <div className="flex items-center gap-2" style={{
              padding: "6px 8px",
              borderRadius: 8,
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              color: "rgba(255,255,255,0.7)",
            }}>
              <Info size={14} />
              <span style={{ fontSize: 11 }}>About This Report</span>
            </div>
          )}
        </NavLink>
      </div>
    </div>
  );
}
