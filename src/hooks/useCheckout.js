import { useState } from "react";
import { toast } from "sonner";
import { useAuthedApi, errMsg } from "@/lib/api";
import { formatPrice, PRICING } from "@/lib/plans";

let scriptPromise;
const loadRazorpay = () => {
  scriptPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => { scriptPromise = null; reject(new Error("Could not load checkout")); };
    document.body.appendChild(s);
  });
  return scriptPromise;
};

// Creates a Razorpay subscription on the backend, opens Checkout, then verifies the signature server-side.
export function useCheckout(onDone) {
  const api = useAuthedApi();
  const [busy, setBusy] = useState(null);

  const start = async (plan, email) => {
    setBusy(plan);
    try {
      await loadRazorpay();
      const { subscription_id, key_id } = await api("post", "/billing/subscribe", { plan });
      const p = PRICING[plan];
      const rzp = new window.Razorpay({
        key: key_id,
        subscription_id,
        name: "Praisify",
        description: plan === "monthly"
          ? `Pro Monthly: ${formatPrice(p.intro)} first month, then ${formatPrice(p.price)}/mo`
          : `Pro Annual: ${formatPrice(p.price)}/year`,
        prefill: { email },
        theme: { color: "#4F46E5" },
        handler: async (res) => {
          try {
            await api("post", "/billing/verify", res);
            toast.success("Welcome to Praisify Pro!");
            onDone();
          } catch (e) {
            toast.error(errMsg(e, "We couldn't confirm the payment. Contact support if you were charged."));
          } finally {
            setBusy(null);
          }
        },
        modal: { ondismiss: () => setBusy(null) },
      });
      rzp.on("payment.failed", (r) => toast.error(r.error?.description || "Payment failed"));
      rzp.open();
    } catch (e) {
      toast.error(errMsg(e, "Could not start checkout"));
      setBusy(null);
    }
  };

  return { start, busy };
}
