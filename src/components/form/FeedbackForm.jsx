import { useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { inputCls, useThemeVars } from "@/lib/themes";
import { errMsg } from "@/lib/api";
import { QuestionField } from "./QuestionField";

const isEmpty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

const StarPicker = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} onMouseEnter={() => setHover(i)}
          className="p-1 transition-transform hover:scale-110" data-testid={`rating-star-${i}`} aria-label={`${i} stars`}>
          <Star className={`h-8 w-8 transition-colors ${i <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-[var(--pf-border)]"}`} />
        </button>
      ))}
    </div>
  );
};

const ThankYou = ({ f }) => (
  <div className="text-center py-8" data-testid="submit-success">
    <CheckCircle2 className="pop mx-auto h-14 w-14" style={{ color: "var(--pf-accent)" }} />
    <h1 className="mt-5 text-2xl font-semibold">{f.thank_you_title}</h1>
    {f.thank_you_message && <p className="mt-2 text-[var(--pf-muted)]">{f.thank_you_message}</p>}
  </div>
);

const Label = ({ htmlFor, children, optional }) => (
  <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium">
    {children}{optional && <span className="font-normal text-[var(--pf-muted)]"> (optional)</span>}
  </label>
);

// Themed, owner-customised feedback form. Used by the public page and the dashboard preview.
export const FeedbackForm = ({ settings: f, onSubmit, fullScreen = false, showThanks = false }) => {
  const { vars } = useThemeVars(f);
  const [form, setForm] = useState({ client_name: "", client_role: "", content: "", rating: 0 });
  const [answers, setAnswers] = useState({});
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (state !== "idle") return;
    if (!form.rating) return setError("Please choose a star rating.");
    const missing = f.questions.find((q) => q.required && isEmpty(answers[q.id]));
    if (missing) return setError(`Please answer: ${missing.label}`);
    setError("");
    setState("sending");
    try {
      await onSubmit({ ...form, answers });
      setState("done");
    } catch (err) {
      setError(errMsg(err, "Something went wrong. Please try again."));
      setState("idle");
    }
  };

  return (
    <div style={{ ...vars, fontFamily: "var(--pf-font)" }}
      className={`${fullScreen ? "min-h-screen" : "min-h-[640px]"} flex items-center justify-center bg-[var(--pf-bg)] px-4 py-10 text-[var(--pf-text)] transition-colors`}>
      <div className="w-full max-w-lg rounded-2xl border border-[var(--pf-border)] bg-[var(--pf-card)] p-6 shadow-sm sm:p-10 rise">
        {state === "done" || showThanks ? <ThankYou f={f} /> : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight" data-testid="form-title">{f.title}</h1>
            {f.subtitle && <p className="mt-1 text-sm text-[var(--pf-muted)]">{f.subtitle}</p>}
            <form onSubmit={submit} className="mt-8 space-y-6" data-testid="submit-form">
              <div><Label htmlFor="pf-name">Name *</Label>
                <input id="pf-name" required maxLength={100} value={form.client_name} onChange={set("client_name")} className={inputCls} data-testid="input-name" /></div>
              {f.show_role && <div><Label htmlFor="pf-role" optional>{f.role_label}</Label>
                <input id="pf-role" maxLength={120} value={form.client_role} onChange={set("client_role")} className={inputCls} data-testid="input-role" /></div>}
              <div><Label>Rating *</Label><StarPicker value={form.rating} onChange={(rating) => { setForm({ ...form, rating }); setError(""); }} /></div>
              <div><Label htmlFor="pf-content">{f.content_label} *</Label>
                <textarea id="pf-content" required rows={5} maxLength={2000} placeholder={f.content_placeholder} value={form.content} onChange={set("content")} className={inputCls} data-testid="input-content" /></div>
              {f.questions.map((q) => (
                <QuestionField key={q.id} q={q} value={answers[q.id]} onChange={(v) => { setAnswers({ ...answers, [q.id]: v }); setError(""); }} />
              ))}
              {error && <p className="text-sm text-red-500" data-testid="submit-error">{error}</p>}
              <button type="submit" disabled={state !== "idle"} data-testid="submit-testimonial-btn"
                className="flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--pf-accent)" }}>
                {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : f.button_text}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
