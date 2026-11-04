import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Stars } from "@/components/Stars";

const fmt = (v) => (Array.isArray(v) ? v.join(", ") : v);

// Full testimonial plus answers to the owner's custom questions.
export const TestimonialDetail = ({ t }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button size="icon" variant="ghost" className="text-slate-400 hover:bg-slate-100 hover:text-slate-900" data-testid={`view-btn-${t.id}`}><Eye className="h-4 w-4" /></Button>
    </DialogTrigger>
    <DialogContent className="max-w-lg" data-testid="testimonial-detail">
      <DialogHeader><DialogTitle>{t.client_name}</DialogTitle></DialogHeader>
      {t.client_role && <p className="-mt-2 text-sm text-slate-500">{t.client_role}</p>}
      <div className="flex items-center gap-3"><Stars rating={t.rating} /><span className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString()}</span></div>
      <p className="whitespace-pre-line leading-relaxed text-slate-700">{t.content}</p>
      {t.answers?.length > 0 && (
        <dl className="space-y-3 border-t border-slate-100 pt-4" data-testid="testimonial-answers">
          {t.answers.map((a) => (
            <div key={a.question_id}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{a.label}</dt>
              <dd className="mt-0.5 text-sm text-slate-800">{fmt(a.value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </DialogContent>
  </Dialog>
);
