'use client'

import { useState } from 'react'
import Link from 'next/link'
import { healthLabel, systemIconFor, type Health, type System } from '@/lib/care-data'
import { cn } from '@/lib/utils'

/* A scannable cross-section of the home. Each system sits where you'd expect
   to find it in a real house — roof up top, HVAC and water heater in the
   basement, foundation underneath — with a status dot you can read instantly.
   Built with layered blocks (no hand-drawn SVG paths) so it stays crisp. */

type Signal = 'green' | 'amber' | 'red'
const signalOf = (h: Health): Signal =>
  h === 'excellent' || h === 'good' ? 'green' : h === 'watch' ? 'amber' : 'red'

const dotColor: Record<Signal, string> = {
  green: 'bg-sage',
  amber: 'bg-wood-foreground',
  red: 'bg-destructive',
}
const ringColor: Record<Signal, string> = {
  green: 'ring-sage/30',
  amber: 'ring-wood-foreground/30',
  red: 'ring-destructive/30',
}

/* Where each system lives in the cutaway, top to bottom. Zones are matched to
   real systems by slug; a home missing a system simply leaves that spot empty. */
const zones: { id: string; floor: string }[] = [
  { id: 'roof', floor: 'roof' },
  { id: 'exterior', floor: 'upper' },
  { id: 'electrical', floor: 'upper' },
  { id: 'plumbing', floor: 'main' },
  { id: 'hvac', floor: 'basement' },
  { id: 'furnace', floor: 'basement' },
  { id: 'water-heater', floor: 'basement' },
  { id: 'foundation', floor: 'foundation' },
]

function Marker({
  system,
  active,
  onHover,
}: {
  system: System
  active: boolean
  onHover: (slug: string | null) => void
}) {
  const signal = signalOf(system.health)
  const Icon = systemIconFor(system.slug)
  return (
    <Link
      href={system.href}
      onMouseEnter={() => onHover(system.slug)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(system.slug)}
      onBlur={() => onHover(null)}
      className={cn(
        'group/marker flex items-center gap-2 rounded-full border border-border/60 bg-card/90 py-1 pl-1 pr-2.5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active && 'ring-2',
        active && ringColor[signal],
      )}
    >
      <span className="relative flex size-6 items-center justify-center rounded-full bg-secondary text-foreground">
        <Icon className="size-3.5" strokeWidth={2} />
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-card',
            dotColor[signal],
          )}
        />
      </span>
      <span className="text-xs font-medium">{system.name}</span>
    </Link>
  )
}

export function HouseDiagram({ systems }: { systems: System[] }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const bySlug = new Map(systems.map((s) => [s.slug, s] as const))
  const floorMarkers = (floor: string): System[] =>
    zones
      .filter((z) => z.floor === floor)
      .map((z) => bySlug.get(z.id))
      .filter((s): s is System => Boolean(s))

  const active = hovered ? (bySlug.get(hovered) ?? null) : null

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      {/* The house */}
      <div className="mx-auto w-full max-w-sm">
        <div className="relative">
          {/* Roof */}
          <div className="mx-auto h-0 w-0 border-x-[9.5rem] border-b-[5rem] border-x-transparent border-b-wood/40" />
          <div className="relative -mt-1 flex justify-center">
            {floorMarkers('roof').map((s) => (
              <div key={s.slug} className="absolute -top-12">
                <Marker system={s} active={hovered === s.slug} onHover={setHovered} />
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="overflow-hidden rounded-b-xl rounded-t-sm border border-border/70 bg-secondary/30">
            {/* Upper floor */}
            <div className="flex items-center justify-around gap-2 border-b border-dashed border-border/60 px-4 py-6">
              {floorMarkers('upper').map((s) => (
                <Marker key={s.slug} system={s} active={hovered === s.slug} onHover={setHovered} />
              ))}
            </div>
            {/* Main floor */}
            <div className="flex items-center justify-around gap-2 border-b border-dashed border-border/60 px-4 py-6">
              {floorMarkers('main').map((s) => (
                <Marker key={s.slug} system={s} active={hovered === s.slug} onHover={setHovered} />
              ))}
            </div>
            {/* Basement */}
            <div className="flex items-center justify-around gap-2 bg-secondary/50 px-4 py-6">
              {floorMarkers('basement').map((s) => (
                <Marker key={s.slug} system={s} active={hovered === s.slug} onHover={setHovered} />
              ))}
            </div>
          </div>

          {/* Foundation */}
          <div className="mx-2 flex items-center justify-center rounded-b-lg border border-t-0 border-border/70 bg-muted py-2.5">
            {floorMarkers('foundation').map((s) => (
              <Marker key={s.slug} system={s} active={hovered === s.slug} onHover={setHovered} />
            ))}
          </div>
        </div>
      </div>

      {/* Read-out — updates as you hover the house */}
      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-5">
        {active ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className={cn('size-2.5 rounded-full', dotColor[signalOf(active.health)])}
                aria-hidden
              />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {healthLabel[active.health]}
              </p>
            </div>
            <h3 className="mt-2 font-serif text-2xl tracking-tight">{active.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{active.summary}</p>
            <Link
              href={active.href}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80"
            >
              View {active.name}
            </Link>
          </>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your home at a glance
            </p>
            <h3 className="mt-2 text-balance font-serif text-2xl leading-snug tracking-tight">
              Every system, right where it lives.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Hover any part of the house to see how that system is doing. Green is healthy, amber
              means keep an eye on it.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-sage" /> Healthy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-wood-foreground" /> Keep an eye on
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-destructive" /> Needs action
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
