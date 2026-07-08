import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Globe2,
  Activity,
  Users,
  Trophy,
  Handshake,
  Info,
  FileWarning,
  Receipt,
  ClipboardCheck,
  HardHat,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { SIDEBAR_WIDTH } from "../../theme/tokens";
import { ExportPdfButton } from "./ExportPdfButton";

const PRE_AWARD_PAGES: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "/executive-overview", label: "Executive", icon: Home },
  { path: "/geographic-analysis", label: "Geographic", icon: Globe2 },
  { path: "/pipeline-analysis", label: "Pipeline", icon: Activity },
  { path: "/assignee-performance", label: "Assignees", icon: Users },
  { path: "/award-analysis", label: "Awards", icon: Trophy },
  { path: "/agreements-analysis", label: "Agreements", icon: Handshake },
];

const POST_AWARD_PAGES: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "/post-award/overview", label: "Overview", icon: Home },
  { path: "/post-award/claims-vo", label: "Claims & VO", icon: FileWarning },
  { path: "/post-award/invoicing", label: "Invoicing", icon: Receipt },
  { path: "/post-award/closeout", label: "TOC/DLC", icon: ClipboardCheck },
  { path: "/post-award/subcontractors", label: "Subcontractors", icon: HardHat },
  { path: "/post-award/agreements", label: "Agreements", icon: Handshake },
  { path: "/post-award/correspondence", label: "Correspondence", icon: Mail },
];

/** Persistent left sidebar — the single shared navigation surface for every
 * route. Lives INSIDE the fixed report canvas (see ReportCanvas), so every
 * printed/exported page carries the same chrome, matching the approved
 * mockup's app-shell composition rather than a floating top bar.
 *
 * Two independent report "tabs" — Pre-Award and Post-Award — share this one
 * shell but never share data: each has its own upload, store, route tree,
 * and nav list. The segmented switch below the logo block swaps between
 * them; the About link at the bottom follows the active tab. */
export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPostAward = location.pathname.startsWith("/post-award");
  const pages = isPostAward ? POST_AWARD_PAGES : PRE_AWARD_PAGES;

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
            {isPostAward ? "POST-AWARD MANAGEMENT" : "PRE-AWARD MANAGEMENT"}
          </span>
        </div>
      </div>

      {/* Pre/Post segmented switch */}
      <div className="flex shrink-0" style={{ padding: "10px 10px 4px", gap: 4 }}>
        {(["pre", "post"] as const).map((tab) => {
          const active = tab === "post" ? isPostAward : !isPostAward;
          return (
            <button
              key={tab}
              onClick={() => navigate(tab === "post" ? "/post-award/overview" : "/executive-overview")}
              className="flex-1 font-semibold"
              style={{
                padding: "6px 0",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 10.5,
                letterSpacing: 0.3,
                background: active ? "var(--color-primary)" : "rgba(255,255,255,0.06)",
                color: active ? "#fff" : "rgba(255,255,255,0.6)",
              }}
            >
              {tab === "pre" ? "PRE-AWARD" : "POST-AWARD"}
            </button>
          );
        })}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1" style={{ padding: "10px 10px 14px" }}>
        {pages.map((p) => (
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
        <NavLink to={isPostAward ? "/post-award/about" : "/about"} style={{ textDecoration: "none" }}>
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
