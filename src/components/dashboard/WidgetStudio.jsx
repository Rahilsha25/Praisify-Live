import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LayoutGrid, GalleryHorizontal, MoveHorizontal, Quote, List, Info, Lock } from "lucide-react";
import { ProBadge } from "@/components/billing/ProBadge";
import { PRO_LAYOUTS, widgetUsesPro } from "@/lib/plans";
import { Input } from "@/components/ui/input";
import { useAuthedApi, errMsg } from "@/lib/api";
import { THEMES, useResolvedMode } from "@/lib/themes";
import { applyWidgetRules, embedCode, summarize, SAMPLE_TESTIMONIALS } from "@/lib/widgetRules";
import { WidgetView } from "@/components/widget/WidgetView";
import { AccentPicker, Field, PreviewFrame, SaveBar, Section, Segmented, ThemePicker, ToggleRow } from "./Controls";
import { APPEARANCES, FONT_OPTIONS } from "./FormBuilder";
import { CopyButton } from "./QuickActions";

const LAYOUT_OPTIONS = [
  { value: "masonry", label: "Wall of love", icon: LayoutGrid },
  { value: "carousel", label: "Carousel", icon: GalleryHorizontal },
  { value: "marquee", label: "Marquee", icon: MoveHorizontal },
  { value: "spotlight", label: "Spotlight", icon: Quote },
  { value: "list", label: "List", icon: List },
];

const LayoutPicker = ({ value, onChange, free }) => (
  <div className="grid grid-cols-3 gap-2" data-testid="widget-layout">
    {LAYOUT_OPTIONS.map(({ value: v, label, icon: Icon }) => (
      <button key={v} type="button" onClick={() => onChange(v)} data-testid={`widget-layout-${v}`}
        className={`relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-semibold transition-colors ${value === v ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm" : "border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40"}`}>
        {free && PRO_LAYOUTS.includes(v) && <Lock className="absolute right-1.5 top-1.5 h-3 w-3 text-indigo-500" />}
        <Icon className="h-5 w-5" />{label}
      </button>
    ))}
  </div>
);

const Style = ({ d, set, free }) => {
  const mode = useResolvedMode(d.appearance);
  const pro = <ProBadge show={free} />;
  return (
    <Section title="Style">
      <Field label={<>Theme{pro}</>}><ThemePicker value={d.theme} mode={mode} onChange={set("theme")} testId="widget-theme" /></Field>
      <Field label={<>Mode{pro}</>}><Segmented value={d.appearance} options={APPEARANCES} onChange={set("appearance")} testId="widget-appearance" /></Field>
      <Field label={<>Accent colour{pro}</>}><AccentPicker value={d.accent} fallback={THEMES[d.theme].accent} onChange={set("accent")} testId="widget-accent" /></Field>
      <Field label="Card style">
        <Segmented value={d.card_style} onChange={set("card_style")} testId="widget-card-style"
          options={[{ value: "bordered", label: "Bordered" }, { value: "elevated", label: "Elevated" }, { value: "minimal", label: "Minimal" }]} />
      </Field>
      <Field label={<>Font{pro}</>}><Segmented value={d.font} options={FONT_OPTIONS} onChange={set("font")} testId="widget-font" /></Field>
      <ToggleRow label="Transparent background" checked={d.transparent_bg} onChange={set("transparent_bg")} testId="widget-transparent" />
    </Section>
  );
};

const Content = ({ d, set }) => (
  <Section title="Content">
    <Field label="Heading (optional)">
      <Input value={d.heading} maxLength={120} placeholder="e.g. Loved by 500+ clients" onChange={(e) => set("heading")(e.target.value)} data-testid="widget-heading-input" />
    </Field>
    <ToggleRow label="Rating summary bar" checked={d.show_summary} onChange={set("show_summary")} testId="widget-show-summary" />
    <ToggleRow label="Star ratings" checked={d.show_rating} onChange={set("show_rating")} testId="widget-show-rating" />
    <ToggleRow label="Avatars" checked={d.show_avatar} onChange={set("show_avatar")} testId="widget-show-avatar" />
    <ToggleRow label="Role / company" checked={d.show_role} onChange={set("show_role")} testId="widget-show-role" />
    <ToggleRow label="Date" checked={d.show_date} onChange={set("show_date")} testId="widget-show-date" />
  </Section>
);

const Filters = ({ d, set }) => (
  <Section title="Which reviews to show">
    <Field label="Minimum rating">
      <Segmented value={String(d.min_rating)} onChange={(v) => set("min_rating")(Number(v))} testId="widget-min-rating"
        options={[{ value: "1", label: "All" }, { value: "3", label: "3+" }, { value: "4", label: "4+" }, { value: "5", label: "5 only" }]} />
    </Field>
    <Field label="Order">
      <Segmented value={d.sort} onChange={set("sort")} testId="widget-sort" options={[{ value: "newest", label: "Newest" }, { value: "highest", label: "Highest rated" }]} />
    </Field>
    <Field label="Max reviews shown">
      <Input type="number" min={1} max={100} value={d.max_items} className="w-28" data-testid="widget-max-items"
        onChange={(e) => set("max_items")(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} />
    </Field>
  </Section>
);

export const WidgetStudio = ({ profile, items, onSaved, onUpgrade }) => {
  const api = useAuthedApi();
  const free = profile.tier !== "pro";
  const saved = profile.widget_settings;
  const [d, setD] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [hostDark, setHostDark] = useState(false);
  const set = (k) => (v) => setD((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);

  // Preview uses real approved reviews; falls back to sample ones until something is approved.
  const approved = useMemo(() => items.filter((t) => t.is_approved), [items]);
  const usingSample = approved.length === 0;
  const source = usingSample ? SAMPLE_TESTIMONIALS : approved;
  const shown = applyWidgetRules(source, d);
  const widgetUrl = `${window.location.origin}/widget/${profile.id}`;

  const save = async () => {
    setSaving(true);
    try {
      const p = await api("put", "/me/widget", d);
      onSaved(p);
      setD(p.widget_settings);
      toast.success("Widget saved, live on your site");
    } catch (e) {
      toast.error(errMsg(e, "Could not save widget"));
    } finally {
      setSaving(false);
    }
  };

  const toolbar = (
    <Segmented value={hostDark ? "dark" : "light"} onChange={(v) => setHostDark(v === "dark")} testId="widget-host-bg"
      options={[{ value: "light", label: "Light site" }, { value: "dark", label: "Dark site" }]} />
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]" data-testid="widget-studio">
      <div className="space-y-6">
        <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setD(saved)} testId="widget-savebar"
          needsPro={free && widgetUsesPro(d)} onUpgrade={onUpgrade} />
        <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.28)] sm:p-6">
          <Section title="Layout"><LayoutPicker value={d.layout} onChange={set("layout")} free={free} /></Section>
          <Style d={d} set={set} free={free} />
          <Content d={d} set={set} />
          <Filters d={d} set={set} />
        </div>
      </div>
      <div className="min-w-0 space-y-4 lg:sticky lg:top-[88px] lg:self-start">
        {usingSample && (
          <p className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-800" data-testid="widget-sample-note">
            <Info className="h-4 w-4 shrink-0" />Showing sample reviews. Approve a testimonial to see your own here.
          </p>
        )}
        <PreviewFrame testId="widget-preview" hostDark={hostDark} toolbar={toolbar}>
          <WidgetView settings={d} testimonials={shown} summary={summarize(source)} tier={profile.tier} />
        </PreviewFrame>
        <div className="flex items-start gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all font-mono-code text-xs text-slate-700" data-testid="studio-embed-code">{embedCode(widgetUrl, d.layout)}</pre>
          <CopyButton value={embedCode(widgetUrl, d.layout)} testId="studio-copy-embed-btn" />
        </div>
      </div>
    </div>
  );
};
