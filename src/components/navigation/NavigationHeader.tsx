import { NavLink } from "react-router-dom";

const PAGES = [
  { path: "/executive-overview", label: "Executive Overview" },
  { path: "/geographic-analysis", label: "Geographic Analysis" },
  { path: "/assignee-performance", label: "Assignee Performance" },
  { path: "/award-analysis", label: "Award Analysis" },
  { path: "/agreements-analysis", label: "Agreements Analysis" },
  { path: "/project-register", label: "Project Register" },
];

/** Persistent header, identical on every page — the single shared
 * navigation surface (this is what a "master page" would be in Power BI;
 * here it's just one React component reused by every route). */
export function NavigationHeader() {
  return (
    <div
      className="no-print flex items-center justify-between px-5"
      style={{ height: 45, background: "var(--color-secondary)" }}
    >
      <span className="text-white font-semibold" style={{ fontSize: 14 }}>
        ROWAD Pre-Award Snapshot
      </span>
      <nav className="flex gap-4">
        {PAGES.map((p) => (
          <NavLink
            key={p.path}
            to={p.path}
            className={({ isActive }) =>
              [
                "text-xs pb-1 transition-colors",
                isActive ? "text-white border-b-2" : "text-white/70 hover:text-white",
              ].join(" ")
            }
            style={({ isActive }) => (isActive ? { borderColor: "var(--color-primary)" } : undefined)}
          >
            {p.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
