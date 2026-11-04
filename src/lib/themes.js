import { useEffect, useState } from "react";

// Shared palettes for the feedback form and the widget; each theme has a light and dark variant.
export const THEMES = {
  clean: {
    name: "Clean", accent: "#4F46E5",
    light: { bg: "#F8FAFC", card: "#FFFFFF", border: "#E5E7EB", text: "#0F172A", muted: "#64748B", input: "#FFFFFF" },
    dark: { bg: "#0B1120", card: "#111827", border: "#1F2937", text: "#F8FAFC", muted: "#94A3B8", input: "#0F172A" },
  },
  paper: {
    name: "Paper", accent: "#B45309",
    light: { bg: "#F6F1E9", card: "#FFFDF8", border: "#E7DFD2", text: "#2B2118", muted: "#7C6F60", input: "#FFFDF8" },
    dark: { bg: "#1A1612", card: "#231E18", border: "#3A3128", text: "#F5EEE3", muted: "#B3A797", input: "#1A1612" },
  },
  ocean: {
    name: "Ocean", accent: "#0284C7",
    light: { bg: "#EFF8FC", card: "#FFFFFF", border: "#D3E8F2", text: "#0B2533", muted: "#557385", input: "#FFFFFF" },
    dark: { bg: "#06141D", card: "#0C2130", border: "#16364A", text: "#E6F4FA", muted: "#8DB2C6", input: "#06141D" },
  },
  forest: {
    name: "Forest", accent: "#15803D",
    light: { bg: "#F1F5EE", card: "#FFFFFF", border: "#DCE5D6", text: "#14231A", muted: "#5E7264", input: "#FFFFFF" },
    dark: { bg: "#0B140E", card: "#122019", border: "#1F3427", text: "#E8F2EA", muted: "#94AE9C", input: "#0B140E" },
  },
  rose: {
    name: "Rose", accent: "#E11D48",
    light: { bg: "#FFF5F6", card: "#FFFFFF", border: "#F7D9DF", text: "#2A0F16", muted: "#8A5A66", input: "#FFFFFF" },
    dark: { bg: "#170A0E", card: "#221016", border: "#3A1C25", text: "#FCE9ED", muted: "#C08A97", input: "#170A0E" },
  },
};

export const FONTS = {
  sans: "'Inter', sans-serif",
  serif: "'Fraunces', Georgia, serif",
  display: "'Outfit', sans-serif",
};

export const inputCls =
  "w-full rounded-lg border border-[var(--pf-border)] bg-[var(--pf-input)] px-3.5 py-2.5 text-[15px] text-[var(--pf-text)] placeholder:text-[var(--pf-muted)] outline-none transition-[border-color,box-shadow] focus:border-[var(--pf-accent)] focus:ring-1 focus:ring-[var(--pf-accent)]";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function useResolvedMode(appearance) {
  const [sysDark, setSysDark] = useState(() => window.matchMedia(DARK_QUERY).matches);
  useEffect(() => {
    const m = window.matchMedia(DARK_QUERY);
    const h = (e) => setSysDark(e.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  return appearance === "auto" ? (sysDark ? "dark" : "light") : appearance;
}

// Turns saved settings into CSS variables consumed via Tailwind arbitrary values.
export function useThemeVars({ theme, appearance, accent, font }) {
  const mode = useResolvedMode(appearance);
  const t = THEMES[theme] || THEMES.clean;
  const p = t[mode];
  return {
    mode,
    vars: {
      "--pf-bg": p.bg, "--pf-card": p.card, "--pf-border": p.border, "--pf-text": p.text,
      "--pf-muted": p.muted, "--pf-input": p.input, "--pf-accent": accent || t.accent,
      "--pf-font": FONTS[font] || FONTS.sans,
    },
  };
}
