import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CountryStatsExtended } from "../../services/calculations";
import { formatAmountsBreakdown, formatCompact } from "../../services/calculations";
import { countryColor } from "../../theme/tokens";
import type { Currency } from "../../types/domain";

interface WorldMapChartProps {
  stats: CountryStatsExtended[];
  currency: Currency | null;
}

/** Marker positions (viewBox 0 0 980 500). Egypt/KSA/UAE are geographically
 * close together in reality — at true equirectangular coordinates their
 * circles and labels collided. These four points are schematically spread
 * a bit further apart than strict lon/lat would place them, while
 * preserving relative position (Egypt west of KSA west of UAE; Benin
 * separate, further west/south) — a deliberate legibility trade-off for a
 * small, fixed set of business countries on a decorative report map, not
 * a GIS product. */
const COUNTRY_COORDS: Record<string, { x: number; y: number }> = {
  Egypt: { x: 555, y: 165 },
  KSA: { x: 620, y: 195 },
  UAE: { x: 685, y: 220 },
  Benin: { x: 480, y: 235 },
};

// Simplified, decorative continent silhouettes — NOT precise cartographic
// borders. This is a fixed 1280x720 printable report background, not a
// GIS product: a stylized world outline that reads as "world map" at a
// glance is the right level of fidelity here, same spirit as the
// reference mockup's own low-fidelity map art.
const CONTINENTS = [
  // North America
  "M100,70 C140,50 200,45 250,60 C290,75 320,90 330,120 C340,150 320,170 300,190 C310,205 290,220 270,225 C230,235 190,225 170,210 C140,220 110,200 95,175 C75,150 70,120 80,95 C85,80 90,72 100,70 Z",
  // South America
  "M300,215 C330,205 360,215 380,235 C395,255 400,280 395,310 C405,330 400,355 385,375 C370,395 345,405 325,395 C305,385 295,360 290,335 C270,320 265,290 275,265 C280,245 290,225 300,215 Z",
  // Europe
  "M480,70 C510,60 540,65 560,80 C575,90 578,105 565,115 C575,125 565,140 545,145 C520,150 495,145 480,130 C465,120 460,100 465,85 C468,78 472,73 480,70 Z",
  // Africa
  "M440,155 C500,140 560,145 585,175 C605,200 600,230 590,255 C598,280 590,310 575,330 C560,350 535,358 510,352 C485,362 455,350 445,325 C420,310 415,280 425,255 C415,230 420,200 435,175 C437,168 438,161 440,155 Z",
  // Middle East / Asia
  "M600,110 C680,90 780,95 850,120 C890,140 900,170 880,195 C895,215 885,240 860,255 C830,275 790,280 755,265 C720,278 685,270 660,250 C630,255 605,235 600,205 C590,180 590,150 595,130 C596,123 598,116 600,110 Z",
  // Australia
  "M810,290 C850,275 890,280 905,300 C915,315 910,335 895,345 C900,360 885,372 865,370 C840,375 815,365 805,345 C795,325 798,305 810,290 Z",
];

/** "Opportunities by Country (Map)" — the visual hero of Geographic
 * Analysis: countries plotted as sized/colored markers over a stylized
 * world silhouette (no mapping library: the only React-19-compatible
 * option, react-simple-maps, still pins peer deps to React 16-18 and is
 * unmaintained — not worth the risk for four fixed markers on a static
 * report canvas). Marker color matches countryPalette (same colors as the
 * legend, the donut on Page 1, everywhere else); marker RADIUS scales with
 * opportunity count so the leading country reads as dominant at a glance.
 * Always-on labels (not hover-only) so the geography reads in under a
 * second; hover adds the full stat breakdown on top. */
export function WorldMapChart({ stats, currency }: WorldMapChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const maxCount = Math.max(1, ...stats.map((s) => s.totalOpportunities));
  const hoveredStat = stats.find((s) => s.country === hovered) ?? null;
  const hoveredCoord = hovered ? COUNTRY_COORDS[hovered] : null;

  return (
    <div className="h-full w-full relative">
      <svg viewBox="0 0 980 500" preserveAspectRatio="none" className="w-full h-full" style={{ display: "block" }}>
        {CONTINENTS.map((d, i) => (
          <path key={i} d={d} fill="var(--color-gray-soft)" stroke="var(--color-gray)" strokeWidth={1.75} />
        ))}
        {stats.map((s, i) => {
          const coord = COUNTRY_COORDS[s.country];
          if (!coord) return null;
          // Size range (12 -> 30) so the leading country reads as dominant,
          // tuned down slightly from an earlier pass to reduce collision
          // risk between the closely-clustered Egypt/KSA/UAE markers.
          const r = 12 + 18 * Math.sqrt(s.totalOpportunities / maxCount);
          const isDimmed = hovered !== null && hovered !== s.country;
          return (
            <g key={s.country}>
              {/* Soft halo behind the marker for extra weight/separation from the grey landmass */}
              <circle cx={coord.x} cy={coord.y} r={r + 5} fill={countryColor(s.country, i)} fillOpacity={isDimmed ? 0.06 : 0.16} />
              <circle
                cx={coord.x}
                cy={coord.y}
                r={r}
                fill={countryColor(s.country, i)}
                fillOpacity={isDimmed ? 0.4 : 1}
                stroke="#FFFFFF"
                strokeWidth={2.5}
                style={{ cursor: "pointer", transition: "fill-opacity 0.15s ease" }}
                onMouseEnter={() => setHovered(s.country)}
                onMouseLeave={() => setHovered(null)}
              />
              {/* Always-on label -- geography should read without hovering.
                  Extra vertical clearance (r + 9) and a slightly smaller,
                  cleaner white-halo outline keeps neighboring labels from
                  colliding now that markers sit closer to their true
                  relative positions. */}
              <text
                x={coord.x}
                y={coord.y - r - 9}
                textAnchor="middle"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fill: "var(--color-text-primary)",
                  paintOrder: "stroke",
                  stroke: "#FFFFFF",
                  strokeWidth: 3.5,
                  strokeLinejoin: "round",
                  pointerEvents: "none",
                }}
              >
                {s.country}
              </text>
              <text
                x={coord.x}
                y={coord.y + 4}
                textAnchor="middle"
                style={{ fontSize: 11, fontWeight: 700, fill: "#FFFFFF", pointerEvents: "none" }}
              >
                {s.totalOpportunities}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend removed — the Country Ranking leaderboard beside the map
          now carries "which country has how many" (rank order + share),
          so an in-map legend would duplicate that information. Hover
          still surfaces the full breakdown per marker via the tooltip. */}

      <AnimatePresence>
        {hoveredStat && hoveredCoord && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute bg-card pointer-events-none"
            style={{
              left: `${(hoveredCoord.x / 980) * 100}%`,
              top: `${(hoveredCoord.y / 500) * 100}%`,
              transform: "translate(-50%, -130%)",
              padding: "9px 11px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              boxShadow: "0 8px 20px rgba(16,33,62,0.2)",
              minWidth: 150,
              zIndex: 5,
            }}
          >
            <div className="font-bold" style={{ fontSize: 12, color: "var(--color-text-primary)" }}>
              {hoveredStat.country}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--color-text-body)", lineHeight: 1.55 }}>
              Total Opportunities: <b>{hoveredStat.totalOpportunities}</b>
              <br />
              Awarded Projects: <b>{hoveredStat.awardedProjects}</b>
              <br />
              Win Rate: <b>{(hoveredStat.winRate * 100).toFixed(1)}%</b>
              <br />
              Awarded Value:{" "}
              <b>{currency ? `${formatCompact(hoveredStat.awardedValue)} ${currency}` : formatAmountsBreakdown(hoveredStat.amounts)}</b>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
