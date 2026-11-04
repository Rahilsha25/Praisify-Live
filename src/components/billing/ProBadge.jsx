import { Lock } from "lucide-react";

export const ProBadge = ({ show = true }) =>
  show ? (
    <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-indigo-700">
      <Lock className="h-2.5 w-2.5" />Pro
    </span>
  ) : null;
