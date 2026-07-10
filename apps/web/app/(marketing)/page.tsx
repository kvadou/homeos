import Link from "next/link";
import Image from "next/image";
import {
  ScanLine,
  BrainCircuit,
  MessageSquare,
  Wrench,
  Camera,
  Search,
  Bot,
  ArrowRight,
  Check,
  Star,
  Shield,
  Zap,
  Home,
  ChevronRight,
  ChevronDown,
  Building2,
  Clock,
  DollarSign,
  FileText,
  Users,
  AlertTriangle,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/marketing/navbar";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { SchemaMarkup } from "@/components/marketing/schema-markup";

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-navy-900 pt-32 pb-20 sm:pt-40 sm:pb-32">
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[128px]" />
      <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[128px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-300">
            <Zap className="h-4 w-4" />
            AI-Powered Home Management
          </div>

          <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Know Every Item in Your Home.{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">
              Never Miss Another Maintenance Date.
            </span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-gray-400 sm:text-xl">
            Scan any appliance with your phone. Instantly access manuals,
            warranties, and AI-powered maintenance schedules. Your home, finally
            organized.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="xl"
              className="bg-teal-500 hover:bg-teal-600 text-white shadow-xl shadow-teal-500/25 w-full sm:w-auto"
              asChild
            >
              <Link href="/sign-up">
                Start Managing Your Home — Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 w-full sm:w-auto"
              asChild
            >
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 text-sm text-gray-500 sm:flex-row sm:gap-8">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-500" />
              Free forever for 1 home
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-500" />
              Set up in 2 minutes
            </div>
          </div>
        </div>

        {/* Hero Dashboard Mockup */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-navy-800/50 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-xs text-gray-500">
                homeos.app/dashboard
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-4 sm:p-6">
              <div className="hidden space-y-3 sm:col-span-1 sm:block">
                {["Dashboard", "Scan", "Items", "Chat", "Maintenance"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-400"
                    >
                      <div className="h-4 w-4 rounded bg-teal-500/30" />
                      {item}
                    </div>
                  )
                )}
              </div>
              <div className="sm:col-span-3 space-y-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[
                    { label: "Total Items", value: "47", color: "teal" },
                    { label: "Maintenance Due", value: "3", color: "amber" },
                    { label: "Active Warranties", value: "12", color: "blue" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-white/5 p-4">
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Samsung Refrigerator", room: "Kitchen", status: "Excellent" },
                    { name: "Bosch Dishwasher", room: "Kitchen", status: "Good" },
                    { name: "Dyson V15 Detect", room: "Living Room", status: "Excellent" },
                    { name: "Nest Thermostat", room: "Hallway", status: "Good" },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-3 rounded-lg bg-white/5 p-3"
                    >
                      <div className="h-10 w-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                        <Home className="h-5 w-5 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.room} &middot; {item.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full bg-teal-500/20 blur-[64px]" />
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof Bar ─────────────────────────────────────────────────────────

function SocialProofBar() {
  const stats = [
    { value: "2,000+", label: "Homes Managed" },
    { value: "50,000+", label: "Items Tracked" },
    { value: "4.9/5", label: "Average Rating" },
    { value: "$1.2M+", label: "Saved in Repairs" },
  ];

  return (
    <section className="border-y border-white/5 bg-navy-950 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-2xl font-bold text-teal-400 sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Problem Agitation ────────────────────────────────────────────────────────

function ProblemSection() {
  const problems = [
    {
      icon: AlertTriangle,
      title: "Expired Warranties You Don't Know About",
      description:
        "The average homeowner loses $500 per year in warranty claims they never file. That dishwasher that broke last month? It was still covered.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: DollarSign,
      title: "Missed Maintenance That Becomes Expensive",
      description:
        "A $20 air filter replaced on time saves a $2,000 HVAC repair. A $5 dryer vent cleaning prevents a $10,000 house fire. Small tasks, massive consequences.",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      icon: FileText,
      title: "Manuals You Can Never Find",
      description:
        "That weird noise your fridge is making at 10 PM? You need the manual. It's in a drawer somewhere. Or was it the garage? Hours wasted, every single time.",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <section className="bg-navy-900 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Your Home Is{" "}
            <span className="text-red-400">Costing You Money</span> Right Now
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Most homeowners don't realize what they're losing until it's too
            late.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-8"
            >
              <div className={`inline-flex rounded-xl ${problem.bg} p-3`}>
                <problem.icon className={`h-6 w-6 ${problem.color}`} />
              </div>
              <h3 className="mt-4 font-heading text-xl font-semibold text-white">
                {problem.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const steps = [
  {
    step: "01",
    icon: Camera,
    title: "Scan Any Item",
    description:
      "Point your phone camera at any appliance, device, or home system. AI identifies the make, model, and specs in seconds. No typing, no searching.",
  },
  {
    step: "02",
    icon: Bot,
    title: "Everything Organizes Itself",
    description:
      "Manuals, warranties, maintenance schedules, and specifications are automatically linked to your home inventory. Searchable and always available.",
  },
  {
    step: "03",
    icon: MessageSquare,
    title: "Stay Ahead of Problems",
    description:
      "Get reminders before things break. Ask your AI assistant anything in plain English. Connect with vetted service providers when you need professional help.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-navy-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Set Up Your Home in{" "}
            <span className="text-teal-400">Three Steps</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Average setup time: 60 seconds per item. Most homes are fully
            organized in an afternoon.
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-12 hidden h-px w-8 bg-gradient-to-r from-teal-500/50 to-transparent lg:block translate-x-full" />
              )}
              <div className="text-center">
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 blur-lg" />
                  <div className="relative rounded-2xl border border-teal-500/20 bg-navy-800 p-5">
                    <s.icon className="h-8 w-8 text-teal-400" />
                  </div>
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-wider text-teal-500">
                  Step {s.step}
                </div>
                <h3 className="mt-3 font-heading text-xl font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Benefits Section ─────────────────────────────────────────────────────────

const benefits = [
  {
    icon: ScanLine,
    title: "Point. Snap. Done.",
    description:
      "Your camera identifies any appliance instantly. Make, model, specs, and manual — pulled in automatically. No typing, no searching model numbers.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    icon: BrainCircuit,
    title: "Get Reminded Before the $500 Repair",
    description:
      "AI tracks every maintenance schedule and alerts you proactively. Change filters, schedule service, prevent breakdowns — before they happen.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: MessageSquare,
    title: "Ask Your Home Anything",
    description:
      "\"When was my furnace last serviced?\" \"Is my dishwasher still under warranty?\" Get answers in plain English from your AI home assistant.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Search,
    title: "Every Manual, Always Available",
    description:
      "Searchable, organized, never lost in a drawer again. Every guide, spec sheet, and troubleshooting document for every item you own.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Shield,
    title: "Never Lose a Warranty Claim",
    description:
      "Track every warranty in one place. Get alerts 30 days before expiration. When something breaks, your claim information is one tap away.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Wrench,
    title: "Trusted Pros, One Tap Away",
    description:
      "When DIY isn't enough, connect with vetted service providers who already know your equipment. No more explaining your setup from scratch.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
];

function BenefitsSection() {
  return (
    <section id="features" className="bg-navy-900 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Everything You Need to{" "}
            <span className="text-teal-400">Protect Your Investment</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Your home has dozens of systems and hundreds of parts. HomeOS
            keeps track so you don't have to.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div className={`inline-flex rounded-xl ${benefit.bg} p-3`}>
                <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
              </div>
              <h3 className="mt-4 font-heading text-xl font-semibold text-white">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {benefit.description}
              </p>
              <div className="absolute -bottom-1 -right-1 h-24 w-24 rounded-full bg-gradient-to-br from-teal-500/5 to-transparent blur-2xl transition-all duration-300 group-hover:from-teal-500/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Built For Section (Dual Audience) ────────────────────────────────────────

function BuiltForSection() {
  return (
    <section className="bg-navy-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Built for{" "}
            <span className="text-teal-400">How You Manage</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Whether you own one home or manage fifty, HomeOS adapts to your
            needs.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Homeowners */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 lg:p-10">
            <div className="inline-flex rounded-xl bg-teal-500/10 p-3">
              <Home className="h-7 w-7 text-teal-400" />
            </div>
            <h3 className="mt-4 font-heading text-2xl font-bold text-white">
              For Homeowners
            </h3>
            <p className="mt-2 text-gray-400">
              Your home is your biggest investment. Know everything about it.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Scan and catalog every appliance in minutes",
                "Get proactive maintenance reminders",
                "Access any manual instantly from your phone",
                "Track warranties and never miss a claim",
                "Chat with AI about any home question",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Property Managers */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 lg:p-10">
            <div className="inline-flex rounded-xl bg-cyan-500/10 p-3">
              <Building2 className="h-7 w-7 text-cyan-400" />
            </div>
            <h3 className="mt-4 font-heading text-2xl font-bold text-white">
              For Property Managers
            </h3>
            <p className="mt-2 text-gray-400">
              Twelve properties, hundreds of items, one dashboard.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Manage unlimited properties from a single view",
                "Track maintenance across your entire portfolio",
                "Give tenants read-only access to their unit's items",
                "Export home passports for property transitions",
                "Reduce maintenance costs with proactive scheduling",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Homeowner, Portland",
    quote:
      "I found three expired warranties I didn't know about and filed claims that saved me over $2,000. HomeOS paid for itself in the first week.",
    rating: 5,
    metric: "Saved $2,000+",
  },
  {
    name: "Marcus Williams",
    role: "Property Manager, Austin",
    quote:
      "Managing 12 rental properties used to mean spreadsheets and file cabinets. Now every appliance, manual, and maintenance record is in one place. I cut my maintenance response time by 60%.",
    rating: 5,
    metric: "60% faster response",
  },
  {
    name: "Emily & James Park",
    role: "New Homeowners, Denver",
    quote:
      "As first-time homeowners, we had no idea what needed maintenance or when. The AI chat alone has saved us dozens of calls to repair services and probably thousands in unnecessary service visits.",
    rating: 5,
    metric: "Dozens of calls saved",
  },
];

function TestimonialsSection() {
  return (
    <section className="bg-navy-900 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Real Results from{" "}
            <span className="text-teal-400">Real Homeowners</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Join thousands who stopped guessing and started knowing what their
            home needs.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-8"
            >
              <div className="mb-4 inline-flex rounded-lg bg-teal-500/10 px-3 py-1">
                <span className="text-sm font-semibold text-teal-400">{t.metric}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-300">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-400 font-heading text-sm font-bold text-white">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section id="pricing" className="bg-navy-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Simple, Transparent{" "}
            <span className="text-teal-400">Pricing</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Start free. Upgrade when you're ready. No surprises.
          </p>
        </div>
        <PricingCards />
      </div>
    </section>
  );
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

const faqItems = [
  {
    question: "Is my data secure?",
    answer:
      "Yes. We use enterprise-grade encryption for all data in transit and at rest. Your home data is never shared with third parties or used for advertising. You own your data, always.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. No long-term contracts, no cancellation fees. You can downgrade to the free plan or cancel entirely from your account settings at any time.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer:
      "You can export all your data before canceling. After cancellation, your data is retained for 90 days in case you change your mind, then permanently deleted.",
  },
  {
    question: "Does it work with all appliances?",
    answer:
      "HomeOS works with any appliance, device, or home system that has a model number or label. From refrigerators and HVAC systems to water heaters and smart home devices — if it's in your home, we can track it.",
  },
  {
    question: "Do I need to scan everything manually?",
    answer:
      "Scanning is the fastest way to add items (about 60 seconds each), but you can also add items manually or import from a spreadsheet. Most users scan their major appliances first and add smaller items over time.",
  },
  {
    question: "What if I need help setting up?",
    answer:
      "We offer in-app guided setup, video tutorials, and email support on all plans. Pro and Family members get priority support with faster response times.",
  },
  {
    question: "Is there really a free plan?",
    answer:
      "Yes — free forever, no credit card required. You get 1 home with up to 25 items, manual entry, and basic AI chat. Most users start free and upgrade to Pro when they want scanning and unlimited items.",
  },
  {
    question: "How is this different from a spreadsheet?",
    answer:
      "A spreadsheet can list your items, but it can't identify appliances from a photo, pull in manuals automatically, predict maintenance needs, answer questions about your home in plain English, or alert you before warranties expire. HomeOS does all of that.",
  },
];

function FAQSection() {
  return (
    <section id="faq" className="bg-navy-900 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Frequently Asked{" "}
            <span className="text-teal-400">Questions</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Everything you need to know before getting started.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-3xl">
          <FAQAccordion items={faqItems} />
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section className="bg-navy-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-600 px-8 py-16 text-center shadow-2xl sm:px-16">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative">
            <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              Every Day Without HomeOS Is Another Missed Warranty,
              <br className="hidden sm:block" /> Another Surprise Repair
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              Join thousands of homeowners who stopped guessing and started
              knowing what their home needs.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="xl"
                className="bg-white text-teal-700 hover:bg-gray-100 shadow-xl w-full sm:w-auto"
                asChild
              >
                <Link href="/sign-up">
                  Start Managing Your Home — Free
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/60">
              Free forever for 1 home. No credit card. Set up in 2 minutes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-navy-950 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="HomeOS"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="font-heading text-lg font-bold text-white">
                HomeOS <span className="text-teal-400">AI</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              AI-powered home management. Scan, identify, and manage everything
              in your home — all in one place.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Product
            </h3>
            <ul className="mt-4 space-y-2">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "FAQ", href: "#faq" },
                { label: "How It Works", href: "#how-it-works" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-gray-500 transition-colors hover:text-teal-400"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Company
            </h3>
            <ul className="mt-4 space-y-2">
              {["About", "Blog", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-gray-500 transition-colors hover:text-teal-400"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              {["Privacy Policy", "Terms of Service"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-gray-500 transition-colors hover:text-teal-400"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/5 pt-8 text-center">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} HomeOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main>
      <SchemaMarkup />
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <ProblemSection />
      <HowItWorksSection />
      <BenefitsSection />
      <BuiltForSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </main>
  );
}
