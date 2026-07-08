// ROWAD Design System — single source of truth for the visual language.
// Mirrors src/index.css @theme block. Kept in JS too because chart libraries
// (Recharts SVG fills) need literal hex strings, not CSS custom properties.
// Every page/component consumes THESE tokens — no page defines its own colors,
// spacing, radii, or type sizes inline.

export const colors = {
  // Brand
  primary: "#8B1E2D", // maroon — logo block, active nav, primary accents
  primaryDark: "#6B1622", // pressed/hover state for maroon surfaces
  primarySoft: "#FCE8EB", // pale rose — icon badges, highlighted bands
  secondary: "#1B2A4A", // deep navy — sidebar bg, headings, section titles
  secondarySoft: "#E8EEF7", // pale blue — icon badge alt tone

  // Category accents (country palette + insight icon tones)
  gold: "#C9A15A",
  goldSoft: "#F8EFDD",
  teal: "#2F8F86",
  tealSoft: "#E2F2F0",
  gray: "#9CA3AF",
  graySoft: "#F1F2F4",

  // Surfaces
  bg: "#F5F7FA",
  card: "#FFFFFF",
  border: "#E7E9EE",
  borderStrong: "#D8DCE3",

  // Status
  success: "#2E7D32",
  successSoft: "#E8F5E9",
  warning: "#ED6C02",
  warningSoft: "#FDF1E6",
  error: "#C62828",
  errorSoft: "#FBEAEA",

  // Text
  textPrimary: "#16213E",
  textBody: "#33414F",
  textMuted: "#6B7280",
  textOnDark: "#FFFFFF",
  textOnDarkMuted: "rgba(255,255,255,0.68)",
} as const;

export type IconTone = "rose" | "navy" | "gold" | "teal" | "gray" | "success";

export const iconToneMap: Record<IconTone, { bg: string; fg: string }> = {
  rose: { bg: colors.primarySoft, fg: colors.primary },
  navy: { bg: colors.secondarySoft, fg: colors.secondary },
  gold: { bg: colors.goldSoft, fg: colors.gold },
  teal: { bg: colors.tealSoft, fg: colors.teal },
  gray: { bg: colors.graySoft, fg: colors.gray },
  success: { bg: colors.successSoft, fg: colors.success },
};

export const countryPalette: Record<string, string> = {
  Egypt: colors.secondary,
  KSA: colors.primary,
  UAE: colors.gray,
  Benin: colors.gold,
};

export function countryColor(country: string, index: number): string {
  const fallback = [colors.secondary, colors.primary, colors.gray, colors.gold, colors.teal];
  return countryPalette[country] ?? fallback[index % fallback.length];
}

/** One fixed color per currency, used by the grouped/stacked "All
 * currencies" chart so each series stays visually distinct and consistent
 * across the app — matches CURRENCY_SORT_ORDER in types/domain. */
export const currencyPalette: Record<"EGP" | "USD" | "SAR" | "EURO" | "CFA", string> = {
  EGP: colors.secondary,
  USD: colors.primary,
  SAR: colors.teal,
  EURO: colors.gold,
  CFA: colors.gray,
};

/** General-purpose categorical palette for bar-list / donut breakdowns that
 * aren't tied to a specific country/currency (status distributions, claim
 * types, review outcomes, etc.) — cycles through 8 visually distinct brand
 * colors instead of every row rendering in the same default tone. */
export const categoricalPalette = [
  colors.secondary,
  colors.primary,
  colors.teal,
  colors.gold,
  colors.gray,
  colors.success,
  colors.warning,
  colors.primaryDark,
];

export function categoricalColor(index: number): string {
  return categoricalPalette[index % categoricalPalette.length];
}

export const REPORT_CANVAS_WIDTH = 1280;
export const REPORT_CANVAS_HEIGHT = 720;
export const SIDEBAR_WIDTH = 196;

export const type = {
  display: 19, // top-left report title
  pageSubtitle: 14, // colored page label under the title (e.g. "Executive Overview")
  sectionTitle: 12.5, // card/section headers
  kpiLabel: 11.5,
  kpiValue: 25,
  kpiSubtitle: 10,
  nav: 12.5,
  navBrand: 14,
  navSubtitle: 9,
  tableHeader: 10.5,
  tableCell: 11.5,
  insightTitle: 12,
  insightDesc: 10,
  filterLabel: 9.5,
  filterValue: 11.5,
} as const;

export const space = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  card: 14,
  badge: 999,
  input: 8,
  pill: 999,
} as const;

export const shadow = {
  card: "0 1px 3px rgba(16,33,62,0.07), 0 1px 2px rgba(16,33,62,0.04)",
  cardHover: "0 8px 20px rgba(16,33,62,0.12), 0 2px 6px rgba(16,33,62,0.06)",
  sidebar: "1px 0 0 rgba(16,33,62,0.06)",
} as const;
