import { Stars } from "@/components/Stars";

const CARD_STYLES = {
  bordered: "border border-[var(--pf-border)] bg-[var(--pf-card)] shadow-sm hover:shadow-md",
  elevated: "bg-[var(--pf-card)] shadow-[0_12px_32px_-14px_rgba(0,0,0,0.28)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-14px_rgba(0,0,0,0.32)]",
  minimal: "bg-transparent",
};

export const themedEmptyStar = "fill-[var(--pf-border)] text-[var(--pf-border)]";

export const Avatar = ({ name, size = 36 }) => (
  <div className="flex shrink-0 items-center justify-center rounded-full text-sm font-semibold"
    style={{ width: size, height: size, color: "var(--pf-accent)", background: "color-mix(in srgb, var(--pf-accent) 14%, transparent)" }}>
    {name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
  </div>
);

export const Author = ({ t, s, center }) => (
  <div className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}>
    {s.show_avatar && <Avatar name={t.client_name} />}
    <div className={`min-w-0 ${center ? "text-left" : ""}`}>
      <p className="truncate text-sm font-semibold">{t.client_name}</p>
      {s.show_role && t.client_role && <p className="truncate text-xs text-[var(--pf-muted)]">{t.client_role}</p>}
    </div>
  </div>
);

export const TestimonialCard = ({ t, s, className = "" }) => (
  <article className={`rounded-xl p-5 transition-[box-shadow,transform] duration-300 ${CARD_STYLES[s.card_style]} ${className}`} data-testid={`widget-card-${t.id}`}>
    <div className="flex items-center justify-between gap-2">
      {s.show_rating && <Stars rating={t.rating} testId={`widget-stars-${t.id}`} emptyClassName={themedEmptyStar} />}
      {s.show_date && <time className="text-xs text-[var(--pf-muted)]">{new Date(t.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>}
    </div>
    <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{t.content}</p>
    <div className="mt-5"><Author t={t} s={s} /></div>
  </article>
);
