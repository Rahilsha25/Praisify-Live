import { ArrowDown, ArrowUp, Trash2, Plus, X, Type, AlignLeft, CircleDot, ListChecks, ToggleLeft, Gauge, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const TYPE_META = {
  short_text: { label: "Short answer", icon: Type },
  long_text: { label: "Paragraph", icon: AlignLeft },
  single_choice: { label: "Multiple choice", icon: CircleDot },
  multi_choice: { label: "Checkboxes", icon: ListChecks },
  yes_no: { label: "Yes / No", icon: ToggleLeft },
  scale: { label: "0–10 scale", icon: Gauge },
};
const CHOICE = ["single_choice", "multi_choice"];

const SUGGESTED = [
  { type: "single_choice", label: "How did you hear about us?", options: ["Google", "Social media", "A friend", "Other"] },
  { type: "scale", label: "How likely are you to recommend us to a friend?" },
  { type: "yes_no", label: "Can we feature your review on our website?" },
  { type: "long_text", label: "What could we do better?" },
];

const newQuestion = (type, label = "Untitled question", options) => ({
  id: `q_${Math.random().toString(36).slice(2, 9)}`, type, label, required: false,
  options: CHOICE.includes(type) ? options || ["Option 1", "Option 2"] : [],
});

const OptionsEditor = ({ q, i, update }) => (
  <div className="mt-3 space-y-2">
    {q.options.map((o, n) => (
      <div key={n} className="flex items-center gap-2">
        <span className={`h-3.5 w-3.5 shrink-0 border border-slate-300 ${q.type === "multi_choice" ? "rounded" : "rounded-full"}`} />
        <Input value={o} maxLength={100} className="h-9" data-testid={`builder-q${i}-option-${n}`}
          onChange={(e) => update({ options: q.options.map((x, k) => (k === n ? e.target.value : x)) })} />
        <Button size="icon" variant="ghost" disabled={q.options.length <= 2} className="h-8 w-8 shrink-0 text-slate-400"
          onClick={() => update({ options: q.options.filter((_, k) => k !== n) })} data-testid={`builder-q${i}-remove-option-${n}`}><X className="h-4 w-4" /></Button>
      </div>
    ))}
    {q.options.length < 12 && (
      <button type="button" onClick={() => update({ options: [...q.options, `Option ${q.options.length + 1}`] })}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-800" data-testid={`builder-q${i}-add-option`}>+ Add option</button>
    )}
  </div>
);

const QuestionItem = ({ q, i, total, update, move, remove }) => {
  const changeType = (type) => update({ type, options: CHOICE.includes(type) ? (q.options.length >= 2 ? q.options : ["Option 1", "Option 2"]) : [] });
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4" data-testid={`builder-question-${i}`}>
      <div className="flex items-center gap-2">
        <Select value={q.type} onValueChange={changeType}>
          <SelectTrigger className="h-8 w-[170px] text-xs" data-testid={`builder-q${i}-type`}><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(TYPE_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
        </Select>
        <div className="ml-auto flex">
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={i === 0} onClick={() => move(-1)} data-testid={`builder-q${i}-up`}><ArrowUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={i === total - 1} onClick={() => move(1)} data-testid={`builder-q${i}-down`}><ArrowDown className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={remove} data-testid={`builder-q${i}-delete`}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      <Input value={q.label} maxLength={200} placeholder="Question" className="mt-3" onChange={(e) => update({ label: e.target.value })} data-testid={`builder-q${i}-label`} />
      {CHOICE.includes(q.type) && <OptionsEditor q={q} i={i} update={update} />}
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <Switch checked={q.required} onCheckedChange={(required) => update({ required })} data-testid={`builder-q${i}-required`} /> Required
      </label>
    </div>
  );
};

const AddMenu = ({ onAdd }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm" className="rounded-lg" data-testid="builder-add-question-btn"><Plus className="mr-1.5 h-4 w-4" />Add question</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      {Object.entries(TYPE_META).map(([k, { label, icon: Icon }]) => (
        <DropdownMenuItem key={k} onClick={() => onAdd(newQuestion(k))} data-testid={`builder-add-${k}`}><Icon className="mr-2 h-4 w-4" />{label}</DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export const QuestionEditor = ({ questions, onChange }) => {
  const update = (i) => (patch) => onChange(questions.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  const move = (i) => (d) => { const next = [...questions]; [next[i], next[i + d]] = [next[i + d], next[i]]; onChange(next); };
  const add = (q) => questions.length < 15 && onChange([...questions, q]);
  const unused = SUGGESTED.filter((s) => !questions.some((q) => q.label === s.label));
  return (
    <div className="space-y-3">
      {questions.length === 0 && <p className="text-sm text-slate-500">Name, rating and review are always asked. Add your own questions below.</p>}
      {questions.map((q, i) => (
        <QuestionItem key={q.id} q={q} i={i} total={questions.length} update={update(i)} move={move(i)} remove={() => onChange(questions.filter((_, k) => k !== i))} />
      ))}
      {questions.length < 15 && <AddMenu onAdd={add} />}
      {unused.length > 0 && questions.length < 15 && (
        <div className="pt-1">
          <p className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-400"><Sparkles className="h-3 w-3" />Quick add</p>
          <div className="flex flex-wrap gap-2">
            {unused.map((s, n) => (
              <button key={s.label} type="button" onClick={() => add(newQuestion(s.type, s.label, s.options))} data-testid={`builder-suggest-${n}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-700">{s.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
