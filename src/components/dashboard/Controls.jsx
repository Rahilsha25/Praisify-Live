import { useState } from "react";
import { Monitor, Tablet, Smartphone, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { THEMES } from "@/lib/themes";

export const Section = ({ title, badge, children }) => (
  <section className="space-y-4 border-b border-slate-100 pb-6 last:border-0">
    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">{title}{badge}</h3>
    {children}
  </section>
);

export const Field = ({ label, children }) => (
  <div className="space-y-1.5"><p className="text-sm font-semibold text-slate-700">{label}</p>{children}</div>
);

export const Segmented = ({ value, options, onChange, testId }) => (
  <div className="inline-flex flex-wrap gap-0.5 rounded-xl border border-slate-100 bg-[#f7f6f3] p-1" data-testid={testId}>
    {options.map(({ value: v, label, icon: Icon }) => (
      <button key={v} type="button" onClick={() => onChange(v)} data-testid={`${testId}-${v}`}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${value === v ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70" : "text-slate-500 hover:text-slate-900"}`}>
        {Icon && <Icon className="h-3.5 w-3.5" />}{label}
      </button>
    ))}
  </div>
);

export const ThemePicker = ({ value, mode, onChange, testId }) => (
  <div className="grid grid-cols-5 gap-2" data-testid={testId}>
    {Object.entries(THEMES).map(([key, t]) => {
      const p = t[mode === "dark" ? "dark" : "light"];
      return (
        <button key={key} type="button" onClick={() => onChange(key)} data-testid={`${testId}-${key}`}
          className={`rounded-xl p-1 transition-shadow ${value === key ? "ring-2 ring-indigo-600 ring-offset-2" : "ring-1 ring-slate-200 hover:ring-slate-300"}`}>
          <div className="h-10 rounded-md p-1.5" style={{ background: p.bg }}>
            <div className="flex h-full items-end justify-end rounded border p-1" style={{ background: p.card, borderColor: p.border }}>
              <span className="h-2 w-2 rounded-full" style={{ background: t.accent }} />
            </div>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-600">{t.name}</p>
        </button>
      );
    })}
  </div>
);

const ACCENTS = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#111827"];

export const AccentPicker = ({ value, fallback, onChange, testId }) => (
  <div className="flex flex-wrap items-center gap-2" data-testid={testId}>
    {ACCENTS.map((c) => (
      <button key={c} type="button" onClick={() => onChange(c)} aria-label={c} data-testid={`${testId}-${c.slice(1)}`}
        className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${value === c ? "ring-2 ring-offset-2 ring-slate-900" : ""}`} style={{ background: c }} />
    ))}
    <input type="color" value={value || fallback} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-slate-200" data-testid={`${testId}-custom`} />
    {value && <button type="button" onClick={() => onChange(null)} className="text-xs text-slate-500 hover:text-slate-900" data-testid={`${testId}-reset`}>Use theme colour</button>}
  </div>
);

export const ToggleRow = ({ label, checked, onChange, testId }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
    <span className="text-sm text-slate-700">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} data-testid={testId} />
  </label>
);

export const SaveBar = ({ dirty, saving, onSave, onReset, testId, needsPro, onUpgrade }) => (
  <div className="sticky top-[82px] z-10 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.35)] backdrop-blur" data-testid={testId}>
    <span className={`text-sm ${dirty ? "text-amber-600" : "text-slate-400"}`}>{!dirty ? "All changes saved" : needsPro ? "Uses Pro features" : "Unsaved changes"}</span>
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" disabled={!dirty || saving} onClick={onReset} data-testid={`${testId}-reset`}>Discard</Button>
      <Button size="sm" disabled={!dirty || saving} onClick={needsPro ? onUpgrade : onSave} className="rounded-full bg-indigo-600 px-4 hover:bg-indigo-700" data-testid={`${testId}-save`}>
        {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}{needsPro ? "Upgrade to save" : "Save changes"}
      </Button>
    </div>
  </div>
);

const DEVICES = [
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "mobile", label: "Mobile", icon: Smartphone },
];
const WIDTHS = { desktop: "100%", tablet: "768px", mobile: "375px" };

// Live in-dashboard preview with device-width switcher; hostDark simulates a dark host website.
export const PreviewFrame = ({ children, testId, hostDark, toolbar }) => {
  const [device, setDevice] = useState("desktop");
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-45px_rgba(15,23,42,0.3)]" data-testid={testId}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-green-300" /></div>
          <span className="text-xs font-medium text-slate-500">Live preview</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">{toolbar}<Segmented value={device} options={DEVICES} onChange={setDevice} testId={`${testId}-device`} /></div>
      </div>
      <div className={`max-h-[760px] overflow-auto p-3 sm:p-6 ${hostDark ? "pf-checker-dark" : "pf-checker"}`}>
        <div className="mx-auto overflow-hidden rounded-lg transition-[max-width] duration-300" style={{ maxWidth: WIDTHS[device] }} data-testid={`${testId}-viewport`}>{children}</div>
      </div>
    </div>
  );
};
