import { useState } from "react";
import { toast } from "sonner";
import { Sun, Moon, SunMoon, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthedApi, errMsg } from "@/lib/api";
import { THEMES, useResolvedMode } from "@/lib/themes";
import { FeedbackForm } from "@/components/form/FeedbackForm";
import { ProBadge } from "@/components/billing/ProBadge";
import { formUsesPro } from "@/lib/plans";
import { QuestionEditor } from "./QuestionEditor";
import { AccentPicker, Field, PreviewFrame, SaveBar, Section, Segmented, ThemePicker, ToggleRow } from "./Controls";

export const APPEARANCES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "auto", label: "Auto", icon: SunMoon },
];
export const FONT_OPTIONS = [
  { value: "sans", label: "Modern" },
  { value: "serif", label: "Editorial" },
  { value: "display", label: "Rounded" },
];

const TextInput = ({ label, value, onChange, testId, max = 120, area }) => (
  <Field label={label}>
    {area
      ? <Textarea rows={2} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId} className="rounded-xl border-slate-200 bg-white focus-visible:ring-indigo-500" />
      : <Input maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId} className="h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-indigo-500" />}
  </Field>
);

const Appearance = ({ d, set, free }) => {
  const mode = useResolvedMode(d.appearance);
  return (
    <Section title="Appearance" badge={<ProBadge show={free} />}>
      <Field label="Theme"><ThemePicker value={d.theme} mode={mode} onChange={set("theme")} testId="form-theme" /></Field>
      <Field label="Mode"><Segmented value={d.appearance} options={APPEARANCES} onChange={set("appearance")} testId="form-appearance" /></Field>
      <Field label="Accent colour"><AccentPicker value={d.accent} fallback={THEMES[d.theme].accent} onChange={set("accent")} testId="form-accent" /></Field>
      <Field label="Font"><Segmented value={d.font} options={FONT_OPTIONS} onChange={set("font")} testId="form-font" /></Field>
    </Section>
  );
};

const Texts = ({ d, set }) => (
  <Section title="Text & fields">
    <TextInput label="Heading" value={d.title} onChange={set("title")} testId="form-title-input" />
    <TextInput label="Intro message" value={d.subtitle} onChange={set("subtitle")} testId="form-subtitle-input" max={300} area />
    <TextInput label="Review question" value={d.content_label} onChange={set("content_label")} testId="form-content-label-input" />
    <TextInput label="Review placeholder" value={d.content_placeholder} onChange={set("content_placeholder")} testId="form-placeholder-input" max={200} />
    <ToggleRow label="Ask for role / company" checked={d.show_role} onChange={set("show_role")} testId="form-show-role" />
    {d.show_role && <TextInput label="Role field label" value={d.role_label} onChange={set("role_label")} testId="form-role-label-input" max={80} />}
    <TextInput label="Button text" value={d.button_text} onChange={set("button_text")} testId="form-button-text-input" max={40} />
    <TextInput label="Thank-you heading" value={d.thank_you_title} onChange={set("thank_you_title")} testId="form-thanks-title-input" />
    <TextInput label="Thank-you message" value={d.thank_you_message} onChange={set("thank_you_message")} testId="form-thanks-message-input" max={300} area />
  </Section>
);

export const FormBuilder = ({ profile, onSaved, onUpgrade }) => {
  const api = useAuthedApi();
  const free = profile.tier !== "pro";
  const saved = profile.form_settings;
  const [d, setD] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const set = (k) => (v) => setD((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);

  const save = async () => {
    setSaving(true);
    try {
      const p = await api("put", "/me/form", d);
      onSaved(p);
      setD(p.form_settings);
      toast.success("Form saved, your link is updated");
    } catch (e) {
      toast.error(errMsg(e, "Could not save form"));
    } finally {
      setSaving(false);
    }
  };

  const toolbar = (
    <>
      <Segmented value={thanks ? "thanks" : "form"} onChange={(v) => setThanks(v === "thanks")} testId="form-preview-screen"
        options={[{ value: "form", label: "Form" }, { value: "thanks", label: "Thank-you" }]} />
      <button type="button" onClick={() => { setThanks(false); setPreviewKey((k) => k + 1); }} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Restart preview" data-testid="form-preview-restart"><RotateCcw className="h-3.5 w-3.5" /></button>
    </>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]" data-testid="form-builder">
      <div className="space-y-6">
        <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setD(saved)} testId="form-savebar"
          needsPro={free && formUsesPro(d)} onUpgrade={onUpgrade} />
        <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.28)] sm:p-6">
          <Appearance d={d} set={set} free={free} />
          <Section title="Custom questions" badge={<ProBadge show={free} />}><QuestionEditor questions={d.questions} onChange={set("questions")} /></Section>
          <Texts d={d} set={set} />
        </div>
      </div>
      <div className="lg:sticky lg:top-[88px] lg:self-start">
        <PreviewFrame testId="form-preview" toolbar={toolbar}>
          <FeedbackForm key={previewKey} settings={d} onSubmit={async () => {}} showThanks={thanks} />
        </PreviewFrame>
      </div>
    </div>
  );
};
