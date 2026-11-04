// Plan definitions shared by pricing, upgrade dialog and Pro gating (mirrors backend rules).
export const FREE_REVIEW_LIMIT = 25;
export const PRO_LAYOUTS = ["carousel", "marquee", "spotlight"];

const MONTHLY = 499;
const INTRO = 249;
const ANNUAL = 4999;

export const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export const PRICING = {
  monthly: {
    label: "Monthly", price: MONTHLY, intro: INTRO,
    introOff: Math.round((1 - INTRO / MONTHLY) * 100),
    headline: formatPrice(INTRO), sub: `first month, then ${formatPrice(MONTHLY)}/month`,
  },
  annual: {
    label: "Annual", price: ANNUAL,
    perMonth: formatPrice(ANNUAL / 12),
    saved: MONTHLY * 12 - ANNUAL,
    savedPct: Math.round((1 - ANNUAL / (MONTHLY * 12)) * 100),
    headline: formatPrice(ANNUAL), sub: "per year, billed annually",
  },
};

export const FREE_FEATURES = [
  `Up to ${FREE_REVIEW_LIMIT} reviews`,
  "Wall of love & List widget layouts",
  "Standard review form",
  "\"Powered by Praisify\" badge",
];

export const PRO_FEATURES = [
  "Unlimited reviews",
  "Custom questions, multiple choice & more",
  "Themes, dark mode, colours & fonts",
  "Carousel, Marquee & Spotlight layouts",
  "No \"Powered by Praisify\" badge",
];

const usesProStyle = (s) => s.theme !== "clean" || s.appearance !== "light" || !!s.accent || s.font !== "sans";
export const formUsesPro = (f) => f.questions.length > 0 || usesProStyle(f);
export const widgetUsesPro = (w) => PRO_LAYOUTS.includes(w.layout) || usesProStyle(w);
