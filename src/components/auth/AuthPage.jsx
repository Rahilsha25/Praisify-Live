import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, LayoutGrid, Loader2, MessageSquareQuote, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API, errMsg } from "@/lib/api";
import { useAuth } from "./AuthProvider";

const GOOGLE_ERRORS = {
  google_not_configured: "Google sign-in is not configured yet. Please use email and password.",
  google_cancelled: "Google sign-in was cancelled.",
  google_invalid_state: "This Google sign-in link has expired. Please try again.",
  google_failed: "Google sign-in could not be completed. Please try again.",
};

const GoogleMark = () => (
  <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
    <path fill="#4285F4" d="M48 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h13.5c-.6 2.96-2.27 5.48-4.7 7.18l7.19 5.58c4.2-3.87 6.63-9.57 6.63-17.23Z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.2-5.58c-2 1.35-4.56 2.15-8.7 2.15-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.2C6.51 42.62 14.62 48 24 48Z" />
    <path fill="#FBBC05" d="M10.54 28.71c-.45-1.35-.71-2.8-.71-4.31s.26-2.96.71-4.31l-7.98-6.2A23.9 23.9 0 0 0 0 24.4c0 3.78.9 7.36 2.56 10.51l7.98-6.2Z" />
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.72 17.74 9.5 24 9.5Z" />
  </svg>
);

const Brand = () => (
  <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-slate-950">
    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white">p</span>
    Praisify<span className="-ml-2 text-amber-500">.</span>
  </Link>
);

const AuthAside = ({ isSignUp }) => (
  <aside className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden rounded-[2rem] bg-slate-950 p-10 text-white lg:flex">
    <div className="pointer-events-none absolute -right-32 -top-20 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-36 -left-28 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl" />
    <div className="relative">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-indigo-100">
        <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Your customer stories, together
      </div>
      <h2 className="mt-8 max-w-lg font-display text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
        {isSignUp ? <>Make your next great review <span className="text-amber-300">count.</span></> : <>Good to see you <span className="text-amber-300">again.</span></>}
      </h2>
      <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
        {isSignUp
          ? "Start collecting feedback, curate your favourites, and give customer love a place to shine."
          : "Your best customer stories are right where you left them. Pick up where you left off."}
      </p>
    </div>

    <div className="relative my-12 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200"><MessageSquareQuote className="h-4 w-4" /></span>
          <div><p className="text-sm font-bold">Your Wall of Love</p><p className="text-[11px] text-slate-400">A little preview of what’s possible</p></div>
        </div>
        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300">Ready to share</span>
      </div>
      <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/80 p-4">
        <div className="flex gap-0.5 text-amber-300" aria-label="Five stars">
          {Array.from({ length: 5 }, (_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
        </div>
        <p className="mt-3 font-display text-lg font-medium leading-relaxed text-white">“Every great customer story deserves a place to shine.”</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">A sample testimonial</span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> You approve what goes live</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-indigo-500/10 px-3 py-2.5 text-xs font-medium text-indigo-100">
        <LayoutGrid className="h-4 w-4 text-indigo-300" /> Collect, curate, and showcase—all in one place
      </div>
    </div>

    <div className="relative flex items-center gap-2 text-xs text-slate-400">
      <Check className="h-4 w-4 text-emerald-300" /> Start for free. Upgrade only when you’re ready.
    </div>
  </aside>
);

export default function AuthPage({ mode }) {
  const isSignUp = mode === "sign-up";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const authError = GOOGLE_ERRORS[searchParams.get("auth_error")];

  const submit = async (event) => {
    event.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const credentials = { email, password };
      if (isSignUp) await register(credentials);
      else await login(credentials);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(errMsg(requestError, isSignUp ? "Could not create your account." : "Could not sign in."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fbfaf7] px-4 py-6 sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -left-36 top-24 h-80 w-80 rounded-full bg-violet-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl" />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between">
        <Brand />
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-700">
          <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back to home</span><span className="sm:hidden">Home</span>
        </Link>
      </header>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-12">
        <AuthAside isSignUp={isSignUp} />
        <section className="mx-auto w-full max-w-md rounded-[1.75rem] border border-white bg-white/90 p-6 shadow-[0_30px_90px_-45px_rgba(30,41,59,0.3)] backdrop-blur sm:p-9" aria-labelledby="auth-title">
          <div className="mb-7 lg:hidden">
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><Sparkles className="h-5 w-5" /></div>
            <p className="font-display text-2xl font-bold tracking-tight text-slate-950">{isSignUp ? "Give customer love a place to shine." : "Welcome back to Praisify."}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{isSignUp ? "Start collecting and showcasing your best reviews." : "Sign in to manage your testimonials."}</p>
          </div>
          <div className="mb-7 hidden lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{isSignUp ? "Your story starts here" : "Welcome back"}</p>
            <h1 id="auth-title" className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">
              {isSignUp ? "Create your account" : "Sign in to Praisify"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {isSignUp ? "Start collecting testimonials with Praisify." : "Your testimonials are waiting for you."}
            </p>
          </div>
          <div className="mb-7 lg:hidden">
            <h1 id="auth-title" className="font-display text-2xl font-bold tracking-tight text-slate-950">
              {isSignUp ? "Create your account" : "Sign in to Praisify"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{isSignUp ? "It only takes a moment to get started." : "Your testimonials are waiting for you."}</p>
          </div>

          <a
            href={`${API}/auth/google`}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            data-testid="google-auth-btn"
          >
            <GoogleMark /> Continue with Google
          </a>
          <div className="my-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-widest text-slate-400">
            <span className="h-px flex-1 bg-slate-100" />or continue with email<span className="h-px flex-1 bg-slate-100" />
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="auth-email" className="text-sm font-semibold text-slate-700">Email address</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@yourbusiness.com"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                data-testid="auth-email"
                className="h-12 rounded-xl border-slate-200 bg-white px-4 placeholder:text-slate-400 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="auth-password" className="text-sm font-semibold text-slate-700">Password</Label>
                {isSignUp && <span className="text-[11px] text-slate-400">At least 8 characters</span>}
              </div>
              <Input
                id="auth-password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                data-testid="auth-password"
                className="h-12 rounded-xl border-slate-200 bg-white px-4 placeholder:text-slate-400 focus-visible:ring-indigo-500"
              />
            </div>
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="auth-confirm-password" className="text-sm font-semibold text-slate-700">Confirm password</Label>
                <Input
                  id="auth-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  required
                  minLength={8}
                  maxLength={72}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  data-testid="auth-confirm-password"
                  className="h-12 rounded-xl border-slate-200 bg-white px-4 placeholder:text-slate-400 focus-visible:ring-indigo-500"
                />
              </div>
            )}
            {(error || authError) && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" data-testid="auth-error">{error || authError}</p>}
            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-full bg-indigo-600 text-sm font-bold shadow-lg shadow-indigo-600/15 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
              data-testid="auth-submit"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSignUp ? "Create your free account" : "Sign in"} {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-widest text-slate-400"><ShieldCheck className="h-3.5 w-3.5" /> Secure account access</p>
          <p className="text-center text-sm text-slate-600">
            {isSignUp ? "Already have an account? " : "New to Praisify? "}
            <Link
              to={isSignUp ? "/sign-in" : "/sign-up"}
              className="font-bold text-indigo-600 transition-colors hover:text-indigo-800"
              data-testid={isSignUp ? "auth-sign-in-link" : "auth-sign-up-link"}
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>
      </div>

      <footer className="relative mx-auto flex max-w-7xl items-center justify-center gap-2 pb-2 text-xs text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" /> Your account details are securely protected.
      </footer>
    </main>
  );
}
