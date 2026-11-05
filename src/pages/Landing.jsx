import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Infinity,
  LayoutGrid,
  Link2,
  MessageSquareQuote,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FREE_REVIEW_LIMIT, formatPrice, PRICING } from "@/lib/plans";

const Nav = () => (
  <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#fbfaf7]/90 backdrop-blur-xl">
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8" aria-label="Main navigation">
      <Link to="/" className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-slate-950" data-testid="landing-logo">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white">p</span>
        Praisify<span className="-ml-2 text-amber-500">.</span>
      </Link>
      <div className="hidden items-center gap-8 md:flex">
        <a href="#how-it-works" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950">How it works</a>
        <a href="#features" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950">Features</a>
        <a href="#plans" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950">Pricing</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/sign-in" data-testid="nav-sign-in-link" className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">Sign in</Link>
        <Button asChild className="rounded-full bg-slate-950 px-5 text-white hover:bg-indigo-700" data-testid="nav-get-started-btn">
          <Link to="/sign-up">Get started <ArrowUpRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
      </div>
    </nav>
  </header>
);

const PreviewCard = ({ name, role, text, delay = "" }) => (
  <article className={`rounded-2xl border border-white/70 bg-white/95 p-4 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)] ${delay}`}>
    <div className="flex items-center justify-between">
      <div className="flex gap-0.5" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }, (_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
      </div>
      <span className="rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-600">Sample review</span>
    </div>
    <p className="mt-3 text-sm leading-relaxed text-slate-700">“{text}”</p>
    <div className="mt-4 flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-300 text-xs font-bold text-orange-900">{name[0]}</span>
      <div><p className="text-xs font-bold text-slate-900">{name}</p><p className="text-[10px] text-slate-500">{role}</p></div>
    </div>
  </article>
);

const HeroArtwork = () => (
  <div className="relative mx-auto w-full max-w-[560px] py-8 sm:py-12">
    <div className="absolute inset-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-200 via-violet-100 to-amber-100 blur-2xl" />
    <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-4 shadow-[0_35px_90px_-40px_rgba(49,46,129,0.45)] backdrop-blur sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"><MessageSquareQuote className="h-4 w-4" /></span>
          <div><p className="text-sm font-bold text-slate-900">Your Wall of Love</p><p className="text-[11px] text-slate-500">A home for your best customer stories</p></div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">LIVE PREVIEW</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <PreviewCard name="Alex Morgan" role="Customer" text="The whole process felt easy from the very first step." />
        <div className="hidden pt-7 sm:block">
          <PreviewCard name="Jamie Lee" role="Customer" text="Thoughtful, reliable, and genuinely great to work with." />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-white">
        <span className="flex items-center gap-2 text-xs font-medium"><Link2 className="h-3.5 w-3.5 text-amber-300" /> Ready to share anywhere</span>
        <span className="font-mono-code text-[10px] text-slate-400">&lt;embed /&gt;</span>
      </div>
    </div>
    <div className="absolute -left-2 top-1 rounded-2xl border border-white bg-white px-3 py-2.5 shadow-lg sm:-left-7 sm:top-5">
      <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><ShieldCheck className="h-4 w-4" /></span><span className="text-xs font-bold text-slate-800">You approve what goes live</span></div>
    </div>
    <div className="absolute -bottom-1 right-0 flex items-center gap-2 rounded-2xl border border-white bg-white px-3 py-2.5 shadow-lg sm:-right-5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><LayoutGrid className="h-4 w-4" /></span>
      <span className="text-xs font-bold text-slate-800">Made to match your site</span>
    </div>
  </div>
);

const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-violet-100/70 blur-3xl" />
    <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl" />
    <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
      <div className="relative z-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" /> Give customer love a place to shine
        </div>
        <h1 className="max-w-2xl font-display text-5xl font-extrabold leading-[0.99] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[4.5rem]">
          Your best reviews deserve the <span className="relative inline-block text-indigo-600">spotlight<span className="absolute -bottom-1 left-0 -z-10 h-3 w-full -rotate-2 rounded-full bg-amber-300/70" /></span>.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          Collect thoughtful testimonials, choose the ones to publish, and turn them into a beautiful widget for your website.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="h-12 rounded-full bg-indigo-600 px-6 text-base font-semibold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700" data-testid="hero-cta-btn">
            <Link to="/sign-up">Start collecting free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <a href="#how-it-works" className="inline-flex h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-white">
            See how it works <ArrowDown className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Start on Free</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Approve before publishing</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Embed on your site</span>
        </div>
      </div>
      <HeroArtwork />
    </div>
    <div className="border-y border-slate-200/80 bg-white/65">
      <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 text-center sm:grid-cols-3 sm:px-8">
        {[
          ["01", "Collect", "One simple link for customer feedback"],
          ["02", "Curate", "You choose what gets published"],
          ["03", "Showcase", "A widget that fits your website"],
        ].map(([number, title, body]) => (
          <div key={title} className="flex items-center justify-center gap-3 sm:justify-start sm:pl-8">
            <span className="font-mono-code text-xs font-medium text-indigo-500">{number}</span>
            <span className="text-sm font-bold text-slate-900">{title}</span>
            <span className="hidden text-xs text-slate-500 lg:inline">{body}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const HOW_IT_WORKS = [
  { number: "01", icon: Link2, title: "Share your link", body: "Send customers a simple form to leave a review. No complicated setup for them." },
  { number: "02", icon: ShieldCheck, title: "Choose what to show", body: "Testimonials land in your dashboard. Review and approve them before they appear publicly." },
  { number: "03", icon: LayoutGrid, title: "Put your proof to work", body: "Pick a widget layout, copy the embed code, and add your reviews to your website." },
];

const HowItWorks = () => (
  <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">From feedback to featured</p>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">A little love goes a long way.</h2>
      <p className="mt-4 text-base leading-7 text-slate-600">Everything you need to bring customer stories from inbox to homepage, without the busywork.</p>
    </div>
    <div className="mt-14 grid gap-4 md:grid-cols-3">
      {HOW_IT_WORKS.map(({ number, icon: Icon, title, body }) => (
        <article key={number} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/5 sm:p-8">
          <span className="absolute right-6 top-4 font-display text-6xl font-bold tracking-tighter text-slate-100 transition-colors group-hover:text-indigo-50">{number}</span>
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 transition-colors group-hover:bg-indigo-600 group-hover:text-white"><Icon className="h-5 w-5" /></span>
          <h3 className="relative mt-8 font-display text-xl font-bold text-slate-950">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
        </article>
      ))}
    </div>
  </section>
);

const FeatureShowcase = () => (
  <section id="features" className="scroll-mt-20 bg-slate-950 text-white">
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">More than a review link</p>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl">Make customer love part of your story.</h2>
        <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">Keep your best feedback in one tidy place, and give every review a chance to help the next person choose you.</p>
        <ul className="mt-8 space-y-4">
          {[
            ["A review form that feels like yours", "Set the tone with your own title, intro and thank-you message."],
            ["A human in the loop", "Nothing goes public until you approve it."],
            ["Proof in the right place", "Showcase reviews with an embeddable wall, list, carousel, marquee or spotlight."],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300"><Check className="h-3 w-3" /></span>
              <span><strong className="block text-sm font-semibold">{title}</strong><span className="mt-1 block text-sm leading-6 text-slate-400">{body}</span></span>
            </li>
          ))}
        </ul>
        <Button asChild variant="outline" className="mt-9 rounded-full border-slate-600 bg-transparent text-white hover:bg-white hover:text-slate-950">
          <Link to="/sign-up">Build your first collection <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
      <div className="relative">
        <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 to-amber-300/10 blur-2xl" />
        <div className="relative rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl sm:p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-xs font-semibold text-slate-200">Widget preview</span></div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-slate-300">Your website</span>
          </div>
          <div className="my-7 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-400/15 text-indigo-200"><Quote className="h-5 w-5" /></span>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200">Spotlight layout</p>
            <blockquote className="mx-auto mt-3 max-w-md font-display text-xl font-medium leading-relaxed text-white sm:text-2xl">“A good customer experience is worth sharing.”</blockquote>
            <p className="mt-4 text-xs text-slate-400">A sample of what your customer stories can look like</p>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
            {[["Wall of love", "Masonry"], ["Carousel", "Pro layout"], ["Spotlight", "Pro layout"]].map(([label, hint]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-center">
                <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-amber-300"><LayoutGrid className="h-3.5 w-3.5" /></span>
                <p className="mt-2 text-[10px] font-semibold text-white sm:text-xs">{label}</p>
                <p className="mt-0.5 text-[9px] text-slate-400">{hint}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-indigo-500/15 px-4 py-3">
            <span className="flex items-center gap-2 text-xs font-medium text-indigo-100"><Infinity className="h-4 w-4" /> Your reviews, beautifully displayed</span>
            <span className="text-[10px] text-indigo-200">Simple embed code</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const COMPARISON = [
  { feature: "Reviews you can collect", free: `Up to ${FREE_REVIEW_LIMIT}`, pro: "Unlimited", benefit: "Keep growing your collection without the Free plan cap." },
  { feature: "Review form", free: "Standard form", pro: "Custom questions", benefit: "Ask for the details and context that matter to your business." },
  { feature: "Form themes & styling", free: "Standard style", pro: "Themes, modes, colours & fonts", benefit: "Make the form feel like a natural extension of your brand." },
  { feature: "Widget layouts", free: "Wall of love & List", pro: "All Free layouts + Carousel, Marquee & Spotlight", benefit: "Choose a more dynamic way to put social proof in view." },
  { feature: "Widget themes & styling", free: "Standard style", pro: "Themes, modes, colours & fonts", benefit: "Give your reviews a polished, on-brand home on your site." },
  { feature: "Praisify branding", free: "“Powered by Praisify” badge", pro: "Badge removed", benefit: "Keep the focus on your brand and your customers." },
];

const ComparisonTable = () => (
  <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <table className="w-full table-fixed border-collapse text-left">
      <colgroup><col className="w-[34%]" /><col className="w-[26%]" /><col className="w-[40%]" /></colgroup>
      <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
        <tr>
          <th scope="col" className="px-3 py-4 sm:px-7">Compare plans</th>
          <th scope="col" className="px-2 py-4 sm:px-5">Free</th>
          <th scope="col" className="px-3 py-4 text-indigo-700 sm:px-7">Pro <span className="mt-1 block text-[9px] tracking-wide text-amber-700 sm:inline sm:ml-1 sm:rounded-full sm:bg-amber-100 sm:px-2 sm:py-0.5">MORE ROOM TO GROW</span></th>
        </tr>
      </thead>
      <tbody>
        {COMPARISON.map(({ feature, free, pro, benefit }, i) => (
          <tr key={feature} className={`border-t border-slate-100 align-top ${i % 2 ? "bg-white" : "bg-slate-50/40"}`}>
            <th scope="row" className="px-3 py-4 pr-2 text-[11px] font-semibold leading-4 text-slate-900 sm:px-7 sm:py-5 sm:text-sm sm:leading-5">{feature}</th>
            <td className="px-2 py-4 pr-1 text-[11px] leading-4 text-slate-600 sm:px-5 sm:py-5 sm:text-sm sm:leading-5">{free}</td>
            <td className="px-3 py-4 text-[11px] leading-4 text-slate-800 sm:px-7 sm:py-5 sm:text-sm sm:leading-5">
              <span className="flex items-start gap-1.5 font-medium"><Check className="mt-0.5 h-3 w-3 shrink-0 text-indigo-600 sm:h-4 sm:w-4" />{pro}</span>
              <span className="mt-2 block text-[10px] leading-4 text-indigo-700 sm:text-xs sm:leading-5">{benefit}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PlanCard = ({ pro = false }) => (
  <article className={`relative flex flex-col rounded-3xl border p-6 sm:p-8 ${pro ? "border-indigo-500 bg-slate-950 text-white shadow-[0_25px_70px_-30px_rgba(79,70,229,0.6)]" : "border-slate-200 bg-white text-slate-950"}`}>
    {pro && <span className="absolute -top-3 right-6 rounded-full bg-amber-300 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-950">Best for growing brands</span>}
    <p className={`text-sm font-bold ${pro ? "text-indigo-200" : "text-slate-500"}`}>{pro ? "Praisify Pro" : "Praisify Free"}</p>
    <div className="mt-3 flex items-baseline gap-1">
      <span className="font-display text-4xl font-extrabold tracking-tight">{pro ? PRICING.monthly.headline : formatPrice(0)}</span>
      <span className={`text-sm ${pro ? "text-slate-400" : "text-slate-500"}`}>{pro ? "for your first month" : "forever"}</span>
    </div>
    <p className={`mt-2 min-h-10 text-sm leading-5 ${pro ? "text-slate-300" : "text-slate-500"}`}>
      {pro ? `Then ${formatPrice(PRICING.monthly.price)}/month, or ${PRICING.annual.headline}/year (save ${formatPrice(PRICING.annual.saved)}).` : "A simple way to start collecting and sharing customer feedback."}
    </p>
    <Button asChild className={`mt-6 h-11 rounded-full ${pro ? "bg-indigo-500 text-white hover:bg-indigo-400" : "bg-slate-950 text-white hover:bg-slate-800"}`}>
      <Link to="/sign-up">{pro ? "Get more with Pro" : "Start collecting free"} <ArrowRight className="ml-2 h-4 w-4" /></Link>
    </Button>
    <ul className="mt-6 space-y-3">
      {(pro
        ? ["Unlimited reviews", "Custom questions & premium styling", "All five widget layouts", "Remove Praisify branding"]
        : [`Up to ${FREE_REVIEW_LIMIT} reviews`, "Wall of love & List layouts", "Approve reviews before publishing", "Standard form & widget"]
      ).map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm">
          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${pro ? "text-emerald-300" : "text-indigo-600"}`} />
          <span className={pro ? "text-slate-200" : "text-slate-700"}>{item}</span>
        </li>
      ))}
    </ul>
  </article>
);

const Pricing = () => (
  <section id="plans" className="scroll-mt-20 bg-[#f3f2ff]">
    <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Simple, honest pricing</p>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Start free. Go Pro when you’re ready.</h2>
        <p className="mt-4 text-base leading-7 text-slate-600">Get the essentials today. Upgrade for more room, more creative control, and a widget that’s unmistakably yours.</p>
      </div>
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        <PlanCard />
        <PlanCard pro />
      </div>
      <div className="mx-auto mt-16 max-w-5xl">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">The details</p><h3 className="mt-2 font-display text-2xl font-bold text-slate-950 sm:text-3xl">What changes when you go Pro?</h3></div>
          <p className="max-w-md text-sm leading-6 text-slate-600">Pro is designed to help you collect more, tailor the experience, and showcase your proof without Praisify branding.</p>
        </div>
        <ComparisonTable />
      </div>
    </div>
  </section>
);

const FAQ = () => (
  <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">A few quick answers</p>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Good questions.<br />Straight answers.</h2>
      <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">Need a hand? Start by creating an account and explore Praisify at your own pace.</p>
      <Link to="/sign-up" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900">Get started <ArrowRight className="h-4 w-4" /></Link>
    </div>
    <div className="divide-y divide-slate-200">
      {[
        ["What can I do on the Free plan?", `Collect up to ${FREE_REVIEW_LIMIT} reviews, approve them before publishing, and display them using the Wall of Love or List widget layouts.`],
        ["What does Pro add?", "Pro removes the review limit, unlocks custom questions and premium form/widget styling, adds Carousel, Marquee and Spotlight layouts, and removes the Powered by Praisify badge."],
        ["Do I have to publish every review?", "No. Reviews wait for your approval, so you stay in control of which testimonials are shown in your widget."],
        ["How do I add reviews to my website?", "Choose a widget layout in your dashboard and copy its embed code into your website."],
      ].map(([question, answer]) => (
        <details key={question} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-slate-900 marker:hidden sm:text-lg">
            {question}<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform group-open:rotate-45"><span className="text-xl font-normal leading-none">+</span></span>
          </summary>
          <p className="max-w-2xl pt-3 pr-10 text-sm leading-6 text-slate-600">{answer}</p>
        </details>
      ))}
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="px-5 pb-16 sm:px-8 sm:pb-20">
    <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-indigo-600 px-6 py-14 text-center text-white sm:px-12 sm:py-20">
      <div className="pointer-events-none absolute -left-20 -top-32 h-72 w-72 rounded-full border-[40px] border-white/5" />
      <div className="pointer-events-none absolute -bottom-48 -right-10 h-96 w-96 rounded-full border-[55px] border-amber-300/10" />
      <div className="relative mx-auto max-w-2xl">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-amber-200"><Sparkles className="h-5 w-5" /></span>
        <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-5xl">Your next great review starts with one link.</h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-indigo-100 sm:text-base">Make it easy for happy customers to share their story—and easy for everyone else to see it.</p>
        <Button asChild size="lg" className="mt-8 h-12 rounded-full bg-white px-6 font-bold text-indigo-700 shadow-lg hover:bg-amber-100" data-testid="bottom-cta-btn">
          <Link to="/sign-up">Start collecting free <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  </section>
);

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fbfaf7]" data-testid="landing-page">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <FeatureShowcase />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <Link to="/" className="font-display text-lg font-extrabold tracking-tight text-slate-900">Praisify<span className="text-amber-500">.</span></Link>
          <p>© {new Date().getFullYear()} Praisify. Make good things easy to share.</p>
          <Link to="/sign-in" className="font-medium text-slate-600 hover:text-indigo-700">Sign in <ArrowUpRight className="inline h-3.5 w-3.5" /></Link>
        </div>
      </footer>
    </div>
  );
}
