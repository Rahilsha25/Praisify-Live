import { Check } from "lucide-react";
import { inputCls } from "@/lib/themes";

const activeStyle = { borderColor: "var(--pf-accent)", background: "color-mix(in srgb, var(--pf-accent) 10%, var(--pf-input))" };
const idleStyle = { borderColor: "var(--pf-border)", background: "var(--pf-input)" };

const Choice = ({ active, onClick, children, testId, square }) => (
  <button type="button" onClick={onClick} data-testid={testId} style={active ? activeStyle : idleStyle}
    className="flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors">
    <span className={`flex h-4 w-4 shrink-0 items-center justify-center border ${square ? "rounded" : "rounded-full"}`}
      style={{ borderColor: active ? "var(--pf-accent)" : "var(--pf-muted)", background: active ? "var(--pf-accent)" : "transparent" }}>
      {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    </span>
    {children}
  </button>
);

const tid = (q, i) => `question-${q.id}-option-${i}`;

const SingleChoice = ({ q, value, onChange }) => (
  <div className="space-y-2">
    {q.options.map((o, i) => (
      <Choice key={o} active={value === o} onClick={() => onChange(value === o ? "" : o)} testId={tid(q, i)}>{o}</Choice>
    ))}
  </div>
);

const MultiChoice = ({ q, value = [], onChange }) => (
  <div className="space-y-2">
    {q.options.map((o, i) => (
      <Choice key={o} square active={value.includes(o)} testId={tid(q, i)}
        onClick={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])}>{o}</Choice>
    ))}
  </div>
);

const YesNo = ({ q, value, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    {["Yes", "No"].map((o, i) => (
      <Choice key={o} active={value === o} onClick={() => onChange(value === o ? "" : o)} testId={tid(q, i)}>{o}</Choice>
    ))}
  </div>
);

const Scale = ({ q, value, onChange }) => (
  <div>
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: 11 }, (_, n) => (
        <button key={n} type="button" onClick={() => onChange(value === n ? undefined : n)} data-testid={tid(q, n)}
          style={value === n ? { ...activeStyle, background: "var(--pf-accent)", color: "#fff" } : idleStyle}
          className="h-10 w-10 rounded-lg border text-sm font-medium transition-colors">{n}</button>
      ))}
    </div>
    <div className="mt-1.5 flex justify-between text-xs text-[var(--pf-muted)]"><span>Not likely</span><span>Very likely</span></div>
  </div>
);

const ShortText = ({ q, value = "", onChange }) => (
  <input className={inputCls} value={value} maxLength={500} onChange={(e) => onChange(e.target.value)} data-testid={`question-${q.id}-input`} />
);

const LongText = ({ q, value = "", onChange }) => (
  <textarea className={inputCls} rows={3} value={value} maxLength={2000} onChange={(e) => onChange(e.target.value)} data-testid={`question-${q.id}-input`} />
);

const FIELDS = { short_text: ShortText, long_text: LongText, single_choice: SingleChoice, multi_choice: MultiChoice, yes_no: YesNo, scale: Scale };

export const QuestionField = ({ q, value, onChange }) => {
  const Field = FIELDS[q.type];
  return (
    <div data-testid={`question-${q.id}`}>
      <p className="mb-2 text-sm font-medium">
        {q.label}{q.required ? " *" : <span className="font-normal text-[var(--pf-muted)]"> (optional)</span>}
      </p>
      <Field q={q} value={value} onChange={onChange} />
    </div>
  );
};
