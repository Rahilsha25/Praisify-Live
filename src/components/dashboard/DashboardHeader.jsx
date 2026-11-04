import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";

const TierBadge = ({ tier }) => (
  <span
    data-testid="tier-badge"
    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tier === "pro" ? "bg-amber-100 text-amber-800" : "bg-indigo-50 text-indigo-700"}`}
  >
    {tier === "pro" ? "Pro" : "Free"}
  </span>
);

export const DashboardHeader = ({ profile, onUpgrade, onManage }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate("/", { replace: true });
    } catch {
      toast.error("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#fbfaf7]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-display text-xl font-extrabold text-white shadow-md shadow-indigo-600/20">p</span>
          <div>
            <h1 className="font-display text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl" data-testid="dashboard-title">
              Praisify<span className="text-amber-500">.</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Your studio</p>
            {profile && (
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 sm:ml-4 sm:mt-0 sm:border-l sm:border-slate-200 sm:pl-4 sm:text-sm">
                <span className="max-w-[150px] truncate sm:max-w-[200px]" data-testid="user-email">{profile.email}</span>
                <TierBadge tier={profile.tier} />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {profile?.tier === "free" && (
            <Button onClick={onUpgrade} className="h-10 rounded-full bg-indigo-600 px-4 shadow-md shadow-indigo-600/15 hover:bg-indigo-700" data-testid="upgrade-btn">
              <Sparkles className="mr-2 h-4 w-4" /> Upgrade to Pro
            </Button>
          )}
          {profile?.tier === "pro" && (
            <Button variant="outline" onClick={onManage} className="h-10 rounded-full border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50" data-testid="manage-plan-btn">
              <Crown className="mr-2 h-4 w-4 text-amber-500" /> Manage plan
            </Button>
          )}
          <Button variant="outline" onClick={signOut} disabled={signingOut} className="h-10 rounded-full border-slate-200 bg-white px-3 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 sm:px-4" data-testid="sign-out-btn">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    </header>
  );
};
