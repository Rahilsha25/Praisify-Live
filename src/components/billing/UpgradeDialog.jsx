import { useEffect, useState } from "react";
import axios from "axios";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API } from "@/lib/api";
import { formatPrice, PRICING, PRO_FEATURES } from "@/lib/plans";
import { useCheckout } from "@/hooks/useCheckout";

const PlanOption = ({ id, active, onSelect }) => {
  const p = PRICING[id];
  const tag = id === "monthly" ? `${p.introOff}% off 1st month` : `Save ${formatPrice(p.saved)} (${p.savedPct}%)`;
  return (
    <button type="button" onClick={() => onSelect(id)} data-testid={`plan-option-${id}`}
      className={`relative rounded-xl border p-4 text-left transition-colors ${active ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600" : "border-slate-200 hover:border-slate-300"}`}>
      <span className="absolute -top-2.5 right-3 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-900">{tag}</span>
      <p className="text-sm font-medium text-slate-500">{p.label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-slate-900">{p.headline}</p>
      <p className="text-xs text-slate-500">{p.sub}</p>
      {id === "annual" && <p className="mt-1 text-xs font-medium text-indigo-700">≈ {p.perMonth}/month</p>}
    </button>
  );
};

export const UpgradeDialog = ({ open, onOpenChange, email, onUpgraded }) => {
  const [plan, setPlan] = useState("monthly");
  const [enabled, setEnabled] = useState(null);
  const { start, busy } = useCheckout(() => { onOpenChange(false); onUpgraded(); });

  useEffect(() => {
    if (open && enabled === null) axios.get(`${API}/billing/config`).then((r) => setEnabled(r.data.enabled)).catch(() => setEnabled(false));
  }, [open, enabled]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="upgrade-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl"><Sparkles className="h-5 w-5 text-indigo-600" />Upgrade to Pro</DialogTitle>
          <DialogDescription>Unlock everything and make your reviews impossible to ignore.</DialogDescription>
        </DialogHeader>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <PlanOption id="monthly" active={plan === "monthly"} onSelect={setPlan} />
          <PlanOption id="annual" active={plan === "annual"} onSelect={setPlan} />
        </div>
        <ul className="mt-2 space-y-2">
          {PRO_FEATURES.map((f) => <li key={f} className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 text-indigo-600" />{f}</li>)}
        </ul>
        <Button disabled={!enabled || !!busy} onClick={() => start(plan, email)} className="mt-2 h-11 w-full rounded-full bg-indigo-600 hover:bg-indigo-700" data-testid="checkout-btn">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : enabled === false ? "Payments coming soon" : plan === "monthly" ? `Start Pro for ${formatPrice(PRICING.monthly.intro)}` : `Get Pro for ${formatPrice(PRICING.annual.price)}/year`}
        </Button>
        {enabled && <p className="text-center text-xs text-slate-400">Secure payment by Razorpay. Cancel anytime. Subscriptions run for up to 10 years.</p>}
      </DialogContent>
    </Dialog>
  );
};
