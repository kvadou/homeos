'use client'

import { useState } from 'react'
import {
  House,
  ChevronDown,
  ArrowUpRight,
  Thermometer,
  ShieldCheck,
  FileText,
  Wrench,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const categories = [
  {
    label: 'Systems',
    value: 94,
    icon: Thermometer,
    note: 'HVAC, water heater, and electrical are all running well.',
  },
  {
    label: 'Safety',
    value: 90,
    icon: ShieldCheck,
    note: 'Detectors tested recently. One extinguisher expires soon.',
  },
  {
    label: 'Documentation',
    value: 88,
    icon: FileText,
    note: 'Most warranties and manuals are on file.',
  },
  {
    label: 'Maintenance',
    value: 92,
    icon: Wrench,
    note: 'You\u2019re on track with seasonal upkeep.',
  },
  {
    label: 'Knowledge',
    value: 84,
    icon: Lightbulb,
    note: 'A few systems could use documented how-tos.',
  },
]

export function HomeHealth() {
  const [expanded, setExpanded] = useState(false)
  const score = 91

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      {/* Hero */}
      <div className="flex flex-col items-center gap-6 px-6 pt-10 pb-8 text-center sm:px-8">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
          <House className="size-7" strokeWidth={1.75} />
        </span>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Home Health</p>
          <div className="flex flex-col items-center gap-2">
            <h2 className="font-serif text-5xl leading-none tracking-tight sm:text-6xl">
              Excellent
            </h2>
            <span className="mt-1 font-serif text-4xl leading-none tracking-tight tabular-nums">
              {score}
            </span>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-sage/15 px-3 py-1.5 text-sm font-medium text-sage-foreground">
              <ArrowUpRight className="size-4" strokeWidth={2.5} />
              11 points since you moved in
            </span>
          </div>
        </div>

        <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          Because you&apos;ve completed <span className="font-medium text-foreground">82%</span>
          {' of your annual maintenance. Your home is healthier today than the day you bought it.'}
        </p>

        {/* Segmented health bar */}
        <div className="w-full max-w-sm">
          <div className="flex h-2.5 gap-1 overflow-hidden rounded-full">
            {categories.map((c) => (
              <span
                key={c.label}
                className="h-full flex-1 rounded-full bg-sage"
                style={{ opacity: 0.35 + (c.value / 100) * 0.65 }}
              />
            ))}
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">5 areas monitored continuously</p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          {expanded ? 'Hide breakdown' : 'See what makes up your score'}
          <ChevronDown
            className={cn('size-4 transition-transform', expanded && 'rotate-180')}
            strokeWidth={2.25}
          />
        </button>
      </div>

      {expanded && (
        <div className="grid gap-3 border-t border-border/70 bg-secondary/30 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
          {categories.map(({ label, value, icon: Icon, note }) => (
            <div key={label} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4 text-sage-foreground" strokeWidth={2} />
                  {label}
                </span>
                <span className="text-sm font-semibold tabular-nums">{value}</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-sage" style={{ width: `${value}%` }} />
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
