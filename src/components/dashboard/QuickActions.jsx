import { useState } from "react";
import { Check, Copy, Link2, Code2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { embedCode } from "@/lib/widgetRules";

export const CopyButton = ({ value, testId }) => {
  const [done, setDone] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setDone(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setDone(false), 1500);
  };
  return (
    <Button size="sm" variant="outline" onClick={copy} className="shrink-0 rounded-lg" data-testid={testId}>
      {done ? <Check className="mr-1.5 h-4 w-4 text-green-600" /> : <Copy className="mr-1.5 h-4 w-4" />}
      {done ? "Copied" : "Copy"}
    </Button>
  );
};

const ActionCard = ({ icon: Icon, title, hint, children }) => (
  <div className="group min-w-0 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_45px_-35px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5 sm:p-6">
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 transition-colors group-hover:bg-indigo-600 group-hover:text-white"><Icon className="h-4 w-4" /></span>
      <h2 className="font-display text-base font-bold text-slate-950 md:text-lg">{title}</h2>
    </div>
    <p className="mt-3 text-sm text-slate-500">{hint}</p>
    <div className="mt-4">{children}</div>
  </div>
);

export const QuickActions = ({ profile, sources = [] }) => {
  const origin = window.location.origin;
  const defaultSource = sources.find((source) => source.name === "General");
  const shareUrl = `${origin}/submit/${profile.id}${defaultSource ? `?source=${defaultSource.id}` : ""}`;
  const widgetUrl = `${origin}/widget/${profile.id}`;
  const embed = embedCode(widgetUrl, profile.widget_settings.layout);

  return (
    <section className="grid gap-4 rise md:grid-cols-2 sm:gap-5" aria-label="Quick actions">
      <ActionCard icon={Link2} title="Share Link" hint="Send this to clients to collect a review.">
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-[#fbfaf7] px-3 py-2.5 text-xs text-slate-700 sm:text-sm font-mono-code" data-testid="share-link-url">{shareUrl}</code>
          <CopyButton value={shareUrl} testId="copy-share-link-btn" />
        </div>
        <a href={shareUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800" data-testid="open-share-link">
          Open form <ExternalLink className="h-3 w-3" />
        </a>
      </ActionCard>
      <ActionCard icon={Code2} title="Embed Code" hint="Paste into your website's HTML.">
        <div className="flex items-start gap-2">
          <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all rounded-xl bg-slate-950 px-3 py-2.5 text-xs text-slate-100 font-mono-code" data-testid="embed-code-snippet">{embed}</pre>
          <CopyButton value={embed} testId="copy-embed-code-btn" />
        </div>
        <a href={widgetUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800" data-testid="open-widget-link">
          Preview widget <ExternalLink className="h-3 w-3" />
        </a>
      </ActionCard>
    </section>
  );
};
