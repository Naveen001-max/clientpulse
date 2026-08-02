/**
 * Design tokens — single source of truth.
 * Every color, spacing, radius, shadow, and typography decision
 * flows from here. No magic strings anywhere else in the codebase.
 */

export const COLOR = {
  // Brand
  brand50:  "#eef2ff",
  brand100: "#e0e7ff",
  brand200: "#c7d2fe",
  brand400: "#818cf8",
  brand500: "#6366f1",
  brand600: "#4f46e5",
  brand700: "#4338ca",

  // Semantic
  success50:  "#f0fdf4",
  success100: "#dcfce7",
  success500: "#22c55e",
  success600: "#16a34a",

  warning50:  "#fffbeb",
  warning100: "#fef3c7",
  warning500: "#f59e0b",
  warning600: "#d97706",

  danger50:  "#fef2f2",
  danger100: "#fee2e2",
  danger500: "#ef4444",
  danger600: "#dc2626",

  purple500: "#a855f7",
  purple600: "#9333ea",
  cyan500:   "#06b6d4",

  // Neutral (slate)
  white:    "#ffffff",
  slate50:  "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  slate900: "#0f172a",
  black:    "#000000",
};

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
};

export const SHADOW = {
  xs:  "0 1px 2px rgba(0,0,0,.05)",
  sm:  "0 1px 4px rgba(0,0,0,.08)",
  md:  "0 4px 12px rgba(0,0,0,.10)",
  lg:  "0 8px 24px rgba(0,0,0,.12)",
  xl:  "0 20px 60px rgba(0,0,0,.18)",
  brand: `0 4px 14px rgba(99,102,241,.35)`,
};

export const FONT = {
  family: "'Inter', system-ui, -apple-system, sans-serif",
  mono:   "'JetBrains Mono', 'Fira Code', monospace",

  size: {
    xs:   10,
    sm:   11,
    base: 13,
    md:   14,
    lg:   16,
    xl:   20,
    xxl:  26,
    hero: 32,
  },

  weight: {
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
  },

  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const SPACE = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
};

export const TRANSITION = {
  fast:   "all 0.1s ease",
  base:   "all 0.18s ease",
  slow:   "all 0.3s ease",
  bounce: "all 0.2s cubic-bezier(.34,1.56,.64,1)",
};

export const BREAKPOINT = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const ZINDEX = {
  dropdown: 100,
  modal:    200,
  panel:    300,
  toast:    400,
};
