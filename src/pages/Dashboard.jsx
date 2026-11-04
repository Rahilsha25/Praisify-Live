import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthedApi } from "@/lib/api";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TestimonialsTable } from "@/components/dashboard/TestimonialsTable";
import { FormBuilder } from "@/components/dashboard/FormBuilder";
import { WidgetStudio } from "@/components/dashboard/WidgetStudio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, MessageSquareQuote, PenLine, LayoutTemplate, Sparkles } from "lucide-react";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import { ManagePlanDialog } from "@/components/billing/ManagePlanDialog";

const TABS = [
  { value: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { value: "form", label: "Form Builder", icon: PenLine },
  { value: "widget", label: "Widget Studio", icon: LayoutTemplate },
];

export default function Dashboard() {
  const api = useAuthedApi();
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load the owner's profile (created on first visit) and all their testimonials.
  const load = useCallback(async () => {
    try {
      const [me, list] = await Promise.all([api("get", "/me"), api("get", "/testimonials")]);
      setProfile(me);
      setItems(list);
    } catch {
      toast.error("Could not load your dashboard");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const openUpgrade = () => setUpgradeOpen(true);
  // Return from Razorpay redirect flows with ?upgrade=1 to reopen the dialog.
  useEffect(() => { if (new URLSearchParams(window.location.search).get("upgrade")) setUpgradeOpen(true); }, []);

  const toggleApproval = async (t) => {
    const updated = await api("patch", `/testimonials/${t.id}`, { is_approved: !t.is_approved });
    setItems((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
    toast.success(updated.is_approved ? "Approved, now visible in widget" : "Hidden from widget");
  };

  const remove = async (t) => {
    await api("delete", `/testimonials/${t.id}`);
    setItems((prev) => prev.filter((x) => x.id !== t.id));
    toast.success("Testimonial deleted");
  };

  const approvedCount = items.filter((item) => item.is_approved).length;
  const pendingCount = items.length - approvedCount;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#fbfaf7]" data-testid="dashboard-page">
      <div className="pointer-events-none absolute -left-40 top-48 h-80 w-80 rounded-full bg-violet-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-36 top-[30rem] h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />
      <DashboardHeader profile={profile} onUpgrade={openUpgrade} onManage={() => setManageOpen(true)} />
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} email={profile?.email} onUpgraded={load} />
      <ManagePlanDialog open={manageOpen} onOpenChange={setManageOpen} profile={profile} onChanged={load} />
      <main className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:space-y-10">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/80 p-6 shadow-[0_24px_70px_-45px_rgba(79,70,229,0.28)] sm:p-8" data-testid="dashboard-welcome">
          <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-indigo-100/70 blur-2xl" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700">
                <Sparkles className="h-3 w-3 text-amber-500" /> Your testimonial studio
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Your customer stories, ready to shine.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Collect kind words, choose what goes live, and put your best feedback where customers can see it.</p>
            </div>
            {profile && (
              <div className="flex flex-wrap gap-2" aria-label="Testimonial summary">
                <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collected</p>
                  <p className="mt-1 font-display text-2xl font-bold leading-none text-slate-950">{items.length}</p>
                </div>
                <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved</p>
                  <p className="mt-1 flex items-center gap-1 font-display text-2xl font-bold leading-none text-emerald-700"><Check className="h-4 w-4" />{approvedCount}</p>
                </div>
                <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To review</p>
                  <p className="mt-1 font-display text-2xl font-bold leading-none text-amber-700">{pendingCount}</p>
                </div>
              </div>
            )}
          </div>
        </section>
        {profile && <QuickActions profile={profile} />}
        <Tabs defaultValue="testimonials" className="space-y-6">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-sm sm:w-auto" data-testid="dashboard-tabs">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} data-testid={`tab-${value}`}
                className="flex-1 rounded-xl px-3 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-950 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-600/15 sm:flex-none sm:px-5 sm:text-sm">
                <Icon className="mr-2 h-4 w-4" />{label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="testimonials">
            <TestimonialsTable items={items} loading={loading} onToggle={toggleApproval} onDelete={remove} tier={profile?.tier} onUpgrade={openUpgrade} />
          </TabsContent>
          <TabsContent value="form">{profile && <FormBuilder profile={profile} onSaved={setProfile} onUpgrade={openUpgrade} />}</TabsContent>
          <TabsContent value="widget">{profile && <WidgetStudio profile={profile} items={items} onSaved={setProfile} onUpgrade={openUpgrade} />}</TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
