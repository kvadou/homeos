'use client'

import { useRouter } from 'next/navigation'
import {
  House,
  Wind,
  FileText,
  Lightbulb,
  Users,
  Sparkles,
  ArrowRight,
  Filter,
  Droplet,
  MapPin,
  ShieldCheck,
  Plus,
  CloudSun,
  CalendarClock,
  FolderCog,
  BellRing,
  type LucideIcon,
} from 'lucide-react'
import { useOnboarding } from '../onboarding-provider'
import { clearOnboarding, homeShortName } from '@/lib/onboarding'

type Rec = { title: string; detail: string; icon: LucideIcon }

export function StepComplete() {
  const { data, goTo } = useOnboarding()
  const router = useRouter()

  const homeName = data.home.street || 'Your home'
  const shortName = homeShortName(data.home.street)
  const address =
    data.home.city && data.home.state
      ? `${data.home.city}, ${data.home.state}`
      : 'Your address on file'

  // Only surface what we actually captured — never emphasize zeros.
  const accomplishments = [
    { icon: Wind, label: 'home systems', value: data.systems.length },
    { icon: FileText, label: 'documents', value: data.uploads.length },
    { icon: Lightbulb, label: 'household tips', value: data.knowledge.length },
    { icon: Users, label: 'household members', value: data.members.length + 1 },
  ].filter((s) => s.value > 0)

  // What's left to remember, framed as an inviting next step.
  const nextUp = [
    { label: 'Warranties', has: data.uploads.length > 0 },
    { label: 'Appliance manuals', has: false },
    { label: 'Household tips', has: data.knowledge.length > 0 },
    { label: 'Paint colors', has: false },
  ].filter((n) => !n.has)

  // Personalized 90-day priorities derived from what we learned.
  const recs: Rec[] = []
  const hasIrrigation =
    data.features.includes('irrigation') || data.systems.some((s) => s.key === 'irrigation')
  const knowsShutoff = data.knowledge.some((k) => k.key === 'water-shutoff')

  recs.push({
    title: 'Replace your HVAC filter',
    detail: 'A fresh filter keeps air clean and your system efficient.',
    icon: Filter,
  })
  if (hasIrrigation) {
    recs.push({
      title: 'Schedule a sprinkler blowout',
      detail: 'Protect your irrigation lines before the first freeze.',
      icon: Droplet,
    })
  }
  if (!knowsShutoff) {
    recs.push({
      title: 'Document your main water shutoff',
      detail: 'A 30-second photo everyone in the home will thank you for.',
      icon: MapPin,
    })
  }
  recs.push({
    title: 'Add your roof or furnace warranty',
    detail: 'We\u2019ll track expiration dates so you never miss coverage.',
    icon: ShieldCheck,
  })
  const priorities = recs.slice(0, 3)

  // Personalized insight that reflects the specific facts the user just entered.
  const insightName = shortName === 'your home' ? 'your home' : shortName
  const yearBuilt = data.home.yearBuilt
  const insightParts: string[] = []
  if (yearBuilt) insightParts.push(`was built in ${yearBuilt}`)
  if (hasIrrigation) insightParts.push('has irrigation')
  const insightBasis =
    insightParts.length > 0
      ? `Because ${insightName} ${insightParts.join(' and ')}, `
      : `Based on ${insightName}’s profile, `

  function viewHome() {
    clearOnboarding()
    router.push('/')
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-20 pt-10 sm:px-8">
      {/* Aha header */}
      <div className="flex flex-col items-center text-center">
        <span className="ob-bloom flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-md">
          <House className="size-8" strokeWidth={1.75} />
        </span>
        <p className="ob-fade-in mt-5 text-sm font-medium text-sage-foreground">Welcome home</p>
        <h1 className="ob-fade-in mt-2 text-balance font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          Your home finally has a memory.
        </h1>
        <p className="ob-fade-in mt-3 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
          {shortName === 'your home'
            ? 'HomeOS will now remember the things you shouldn\u2019t have to.'
            : `HomeOS will now remember the things about ${shortName} you shouldn\u2019t have to.`}
        </p>
      </div>

      {/* Summary card */}
      <div className="ob-fade-in mt-8 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
            <House className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-medium">{homeName}</p>
            <p className="text-xs text-muted-foreground">{address}</p>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-sage-foreground">
            Your home already remembers
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {accomplishments.map(({ icon: Icon, label, value }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-2xl bg-accent/50 px-3 py-2 text-sm"
              >
                <Icon className="size-4 text-sage-foreground" strokeWidth={2} />
                <span className="font-medium tabular-nums">{value}</span>
                <span className="text-muted-foreground">{label}</span>
              </span>
            ))}
          </div>

          {nextUp.length > 0 && (
            <>
              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Next, help us remember
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {nextUp.map(({ label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
                  >
                    <Plus className="size-3.5" strokeWidth={2.5} />
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Insight */}
      <div className="ob-fade-in mt-5 rounded-3xl border border-sage/30 bg-accent/40 p-5 sm:p-6">
        <p className="flex items-center gap-2 text-sm font-medium text-sage-foreground">
          <Sparkles className="size-4" strokeWidth={2} />
          A HomeOS insight
        </p>
        <p className="mt-2 text-pretty text-sm leading-relaxed">
          {insightBasis}we&rsquo;d prioritize these three things over the next 90 days.
        </p>
      </div>

      {/* Priorities */}
      <div className="ob-stagger mt-4 space-y-3">
        {priorities.map(({ title, detail, icon: Icon }, i) => (
          <div
            key={title}
            className="flex items-start gap-3.5 rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</p>
            </div>
            <span className="font-serif text-lg text-muted-foreground tabular-nums">{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Anticipation — what HomeOS does from here, so there's a reason to return */}
      <div className="ob-fade-in mt-8 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm font-medium">Starting tomorrow morning, HomeOS will</p>
        <ul className="ob-stagger mt-4 space-y-3">
          {[
            { icon: CloudSun, label: 'Watch the weather and flag risks to your home' },
            { icon: CalendarClock, label: 'Track seasonal maintenance before it’s due' },
            { icon: FolderCog, label: 'Organize new documents automatically' },
            { icon: BellRing, label: 'Alert you before small issues become expensive' },
          ].map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground">
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <span className="leading-snug">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTAs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={viewHome}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          View My Home
          <ArrowRight className="size-4.5" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={() => goTo(5)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-base font-medium shadow-sm transition-colors hover:bg-accent/40"
        >
          Add More Information
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        HomeOS remembers, so you don&rsquo;t have to. It only gets smarter from here.
      </p>
    </div>
  )
}
