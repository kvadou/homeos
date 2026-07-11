import Link from 'next/link'
import { Activity, ChevronRight, Sparkles, ShieldCheck, Eye, TriangleAlert } from 'lucide-react'
import { systems, healthLabel, type System, type Health } from '@/lib/care-data'
import { cn } from '@/lib/utils'

const OVERALL = 91

/* Collapse the four health grades into the three signal colors of a health
   dashboard — green (fine), amber (keep an eye on it), red (act now). */
type Signal = 'green' | 'amber' | 'red'
const signalOf = (h: Health): Signal =>
  h === 'excellent' || h === 'good' ? 'green' : h === 'watch' ? 'amber' : 'red'

const signalRing: Record<Signal, string> = {
  green: 'text-sage',
  amber: 'text-wood-foreground',
  red: 'text-destructive',
}
const signalDot: Record<Signal, string> = {
  green: 'bg-sage',
  amber: 'bg-wood-foreground',
  red: 'bg-destructive',
}
const signalSoft: Record<Signal, string> = {
  green: 'bg-sage/15 text-sage-foreground',
  amber: 'bg-wood/20 text-wood-foreground',
  red: 'bg-destructive/10 text-destructive',
}

/* The big overall ring — the "how healthy is my house?" answer. */
function HealthRing({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  return (
    <div className="relative flex size-36 shrink-0 items-center justify-center">
      <svg viewBox="0 0 120 120" className="size-36 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9" className="stroke-muted" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="stroke-sage"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-serif text-4xl leading-none tracking-tight tabular-nums">{score}</span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          of 100
        </span>
      </div>
    </div>
  )
}

export function SystemsOverview() {
  const counts = systems.reduce(
    (acc, s) => {
      acc[signalOf(s.health)] += 1
      return acc
    },
    { green: 0, amber: 0, red: 0 } as Record<Signal, number>,
  )

  // Attention items sort to the front, exactly like a health app surfaces flags.
  const ordered = [...systems].sort((a, b) => {
    const rank = { red: 0, amber: 1, green: 2 } as const
    return rank[signalOf(a.health)] - rank[signalOf(b.health)]
  })

  const summary = [
    { signal: 'green' as const, icon: ShieldCheck, label: 'Healthy', count: counts.green },
    { signal: 'amber' as const, icon: Eye, label: 'Keep an eye on', count: counts.amber },
    { signal: 'red' as const, icon: TriangleAlert, label: 'Needs action', count: counts.red },
  ]

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      {/* ---- Vitals band: the overall read, like opening the Health app ---- */}
      <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[auto_1fr] lg:gap-8">
        <div className="flex items-center gap-5">
          <HealthRing score={OVERALL} />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Care
            </p>
            <h1 className="mt-1 text-balance font-serif text-2xl leading-tight tracking-tight sm:text-3xl">
              Your home is taking good care of you.
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {counts.green} systems healthy · {counts.amber} to keep an eye on · nothing urgent
            </p>
          </div>
        </div>

        {/* Status legend — the green / amber / red split */}
        <div className="grid grid-cols-3 gap-2.5 self-center sm:gap-3">
          {summary.map(({ signal, icon: Icon, label, count }) => (
            <div
              key={signal}
              className="flex flex-col justify-between rounded-2xl border border-border/60 bg-secondary/30 p-4"
            >
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-xl',
                  signalSoft[signal],
                )}
              >
                <Icon className="size-4.5" strokeWidth={2} />
              </span>
              <div className="mt-3">
                <p className="font-serif text-2xl leading-none tracking-tight tabular-nums">
                  {count}
                </p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Signature Care insight ---- */}
      <div className="flex items-start gap-3 border-t border-border/60 bg-sage/[0.06] px-6 py-4 sm:px-7">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-sage-foreground" strokeWidth={2} />
        <p className="text-pretty text-sm leading-relaxed text-foreground">
          Your water heater is the one system trending down — 11 years old with about four left.
          Setting a little aside now turns a future emergency into a simple, planned swap.
        </p>
      </div>

      {/* ---- Systems list, flagged items first ---- */}
      <div className="border-t border-border/60 p-6 sm:p-7">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground">
            <Activity className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="font-serif text-xl tracking-tight">Systems</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Everything that keeps your home running
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {ordered.map((s) => (
            <SystemRow key={s.id} s={s} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* A compact, scannable health row — colored status rail, icon, headline metric,
   and a status chip. Reads top-to-bottom in seconds instead of as a big card. */
function SystemRow({ s }: { s: System }) {
  const signal = signalOf(s.health)
  return (
    <Link
      href={s.href}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-secondary/30 py-3.5 pl-5 pr-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-sage/50 hover:bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', signalDot[signal])} />
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-sage-foreground shadow-sm">
        <s.icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold">{s.name}</h3>
          <span className={cn('size-1.5 shrink-0 rounded-full', signalDot[signal])} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{s.metric}</span> · {s.metricSub}
        </p>
      </div>
      <span
        className={cn(
          'hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline-block',
          signalSoft[signal],
        )}
      >
        {healthLabel[s.health]}
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-sage-foreground"
        strokeWidth={2}
      />
    </Link>
  )
}
