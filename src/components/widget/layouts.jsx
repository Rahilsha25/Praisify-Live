import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Stars } from "@/components/Stars";
import { Author, TestimonialCard, themedEmptyStar } from "./TestimonialCard";

const cols = (w) => (w < 640 ? 1 : w < 1024 ? 2 : 3);

function useAutoplay(count, ms) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || count < 2) return undefined;
    const id = setInterval(() => setI((x) => (x + 1) % count), ms);
    return () => clearInterval(id);
  }, [paused, count, ms]);
  return { i: Math.min(i, Math.max(count - 1, 0)), setI, hover: { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) } };
}

const Nav = ({ i, count, setI }) => (
  <div className="mt-5 flex items-center justify-center gap-3">
    <button type="button" onClick={() => setI((i - 1 + count) % count)} data-testid="widget-prev" aria-label="Previous"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pf-border)] bg-[var(--pf-card)] transition-transform hover:scale-105"><ChevronLeft className="h-4 w-4" /></button>
    <div className="flex gap-1.5">
      {Array.from({ length: count }, (_, n) => (
        <button key={n} type="button" onClick={() => setI(n)} data-testid={`widget-dot-${n}`} aria-label={`Go to ${n + 1}`}
          className="h-2 rounded-full transition-[width,background-color] duration-300"
          style={{ width: n === i ? 20 : 8, background: n === i ? "var(--pf-accent)" : "var(--pf-border)" }} />
      ))}
    </div>
    <button type="button" onClick={() => setI((i + 1) % count)} data-testid="widget-next" aria-label="Next"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pf-border)] bg-[var(--pf-card)] transition-transform hover:scale-105"><ChevronRight className="h-4 w-4" /></button>
  </div>
);

const Masonry = ({ items, s, width }) => (
  <div data-testid="widget-grid" data-layout="masonry" style={{ columnCount: cols(width), columnGap: 16 }}>
    {items.map((t, n) => (
      <div key={t.id} className="mb-4 break-inside-avoid pf-rise" style={{ animationDelay: `${Math.min(n, 12) * 60}ms` }}><TestimonialCard t={t} s={s} /></div>
    ))}
  </div>
);

const List = ({ items, s }) => (
  <div data-testid="widget-grid" data-layout="list" className="mx-auto max-w-2xl space-y-4">
    {items.map((t, n) => <div key={t.id} className="pf-rise" style={{ animationDelay: `${Math.min(n, 12) * 60}ms` }}><TestimonialCard t={t} s={s} /></div>)}
  </div>
);

const fill = (row) => { let r = [...row]; while (r.length < 6) r = [...r, ...row]; return r; };

const Marquee = ({ items, s }) => {
  const rows = items.length >= 6 ? [items.filter((_, n) => n % 2 === 0), items.filter((_, n) => n % 2 === 1)] : [items];
  return (
    <div data-testid="widget-grid" data-layout="marquee" className="space-y-4">
      {rows.map((row, r) => {
        const loop = fill(row);
        return (
          <div key={r} className="pf-marquee overflow-hidden">
            <div className="pf-track flex w-max items-start" style={{ animationDuration: `${loop.length * 7}s`, animationDirection: r % 2 ? "reverse" : "normal" }}>
              {[...loop, ...loop].map((t, n) => (
                <div key={`${t.id}-${n}`} className="w-[290px] shrink-0 pr-4 sm:w-[340px]" aria-hidden={n >= loop.length}><TestimonialCard t={t} s={s} /></div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Carousel = ({ items, s, width }) => {
  const per = cols(width);
  const pages = Math.ceil(items.length / per);
  const { i, setI, hover } = useAutoplay(pages, 5000);
  return (
    <div data-testid="widget-grid" data-layout="carousel" {...hover}>
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)]" style={{ transform: `translateX(-${i * 100}%)` }}>
          {items.map((t) => (
            <div key={t.id} className="shrink-0 px-2" style={{ flexBasis: `${100 / per}%` }}><TestimonialCard t={t} s={s} className="h-full" /></div>
          ))}
        </div>
      </div>
      {pages > 1 && <Nav i={i} count={pages} setI={setI} />}
    </div>
  );
};

const Spotlight = ({ items, s }) => {
  const { i, setI, hover } = useAutoplay(items.length, 6000);
  const t = items[i];
  return (
    <div data-testid="widget-grid" data-layout="spotlight" className="mx-auto max-w-3xl text-center" {...hover}>
      <div key={t.id} className="pf-fade px-2 py-6" data-testid={`widget-card-${t.id}`}>
        <Quote className="mx-auto h-9 w-9" style={{ color: "var(--pf-accent)" }} />
        {s.show_rating && <div className="mt-4 flex justify-center"><Stars rating={t.rating} size={18} emptyClassName={themedEmptyStar} /></div>}
        <blockquote className="mt-5 text-xl font-medium leading-snug sm:text-2xl">“{t.content}”</blockquote>
        <div className="mt-6"><Author t={t} s={s} center /></div>
      </div>
      {items.length > 1 && <Nav i={i} count={items.length} setI={setI} />}
    </div>
  );
};

export const LAYOUTS = { masonry: Masonry, list: List, marquee: Marquee, carousel: Carousel, spotlight: Spotlight };
