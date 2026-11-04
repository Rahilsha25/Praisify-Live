import { useThemeVars } from "@/lib/themes";
import { useElementWidth } from "@/hooks/useElementWidth";
import { Stars } from "@/components/Stars";
import { LAYOUTS } from "./layouts";
import { themedEmptyStar } from "./TestimonialCard";

const Summary = ({ s, summary }) => (
  <div className="mb-8 text-center pf-rise" data-testid="widget-summary">
    {s.heading && <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" data-testid="widget-heading">{s.heading}</h2>}
    <div className="mt-3 inline-flex items-center gap-3 rounded-full border border-[var(--pf-border)] bg-[var(--pf-card)] px-4 py-2">
      <span className="text-lg font-bold" data-testid="widget-average">{summary.average.toFixed(1)}</span>
      <Stars rating={Math.round(summary.average)} emptyClassName={themedEmptyStar} />
      <span className="text-sm text-[var(--pf-muted)]" data-testid="widget-count">from {summary.count} review{summary.count === 1 ? "" : "s"}</span>
    </div>
  </div>
);

const PoweredBy = () => (
  <div className="mt-6 flex justify-center">
    <a href={window.location.origin} target="_blank" rel="noopener noreferrer" data-testid="powered-by-badge"
      className="rounded-full border border-[var(--pf-border)] bg-[var(--pf-card)] px-3 py-1 text-xs font-medium text-[var(--pf-muted)] transition-opacity hover:opacity-80">
      Powered by <span className="font-semibold text-[var(--pf-text)]">Praisify</span>
    </a>
  </div>
);

// Renders the testimonial widget from saved (or draft) settings. Used by the iframe page and the dashboard preview.
export const WidgetView = ({ settings: s, testimonials, summary, tier }) => {
  const { vars } = useThemeVars(s);
  const [ref, width] = useElementWidth();
  const Layout = LAYOUTS[s.layout] || LAYOUTS.masonry;
  return (
    <div ref={ref} data-testid="widget-root" className="p-4 text-[var(--pf-text)] sm:p-6"
      style={{ ...vars, fontFamily: "var(--pf-font)", background: s.transparent_bg ? "transparent" : "var(--pf-bg)" }}>
      {s.show_summary && summary.count > 0 && <Summary s={s} summary={summary} />}
      {testimonials.length === 0
        ? <p className="py-10 text-center text-sm text-[var(--pf-muted)]" data-testid="widget-empty">No testimonials yet.</p>
        : width > 0 && <Layout key={s.layout} items={testimonials} s={s} width={width} />}
      {tier === "free" && <PoweredBy />}
    </div>
  );
};
