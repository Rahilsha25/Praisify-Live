import { useState } from "react";
import { toast } from "sonner";
import { Crown, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuthedApi, errMsg } from "@/lib/api";
import { formatPrice, PRICING } from "@/lib/plans";

const fmtDate = (ts) => new Date(ts * 1000).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

const statusLine = (b) => {
  const now = Date.now() / 1000;
  if (b.cancel_at_period_end) return b.pro_until ? `Cancellation scheduled. Pro stays active until ${fmtDate(b.pro_until)}.` : "Cancellation scheduled.";
  if (b.status === "cancelled") return b.pro_until && b.pro_until > now ? `Cancelled. Pro stays active until ${fmtDate(b.pro_until)}.` : "Cancelled.";
  if (b.plan === "monthly" && b.start_at && b.start_at > now) return `Intro month active. ${formatPrice(PRICING.monthly.price)}/month billing starts ${fmtDate(b.start_at)}.`;
  if (b.current_end) return `Renews on ${fmtDate(b.current_end)}.`;
  return "Active.";
};

export const ManagePlanDialog = ({ open, onOpenChange, profile, onChanged }) => {
  const api = useAuthedApi();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const b = profile?.billing;
  const cancelled = b && (b.cancel_at_period_end || b.status === "cancelled" || b.status === "completed" || b.status === "expired");

  const cancel = async () => {
    setBusy(true);
    try {
      await api("post", "/billing/cancel");
      toast.success("Subscription cancelled, no further charges");
      setConfirm(false);
      onChanged();
    } catch (e) {
      toast.error(errMsg(e, "Could not cancel"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setConfirm(false); onOpenChange(o); }}>
      <DialogContent className="max-w-md" data-testid="manage-plan-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl"><Crown className="h-5 w-5 text-amber-500" />Praisify Pro</DialogTitle>
          <DialogDescription>{b ? `${PRICING[b.plan].label} plan` : "Pro plan"}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-slate-700" data-testid="plan-status">{b ? statusLine(b) : "Active."}</p>
        {b && !cancelled && (
          confirm ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">Cancel your subscription? It will not renew, and you keep Pro until the end of the period you paid for.</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setConfirm(false)} data-testid="cancel-keep-btn">Keep Pro</Button>
                <Button size="sm" disabled={busy} onClick={cancel} className="bg-red-600 hover:bg-red-700" data-testid="cancel-confirm-btn">
                  {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Yes, cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirm(true)} className="w-fit text-slate-600" data-testid="cancel-subscription-btn">Cancel subscription</Button>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};
