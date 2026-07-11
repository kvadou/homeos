'use client'

import { useState } from 'react'
import { Fan, Flame, Trees, Snowflake, Droplets, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Group = 'This Week' | 'This Month' | 'This Season'

const items: { icon: typeof Fan; title: string; due: string; group: Group }[] = [
  { icon: Fan, title: 'HVAC filter change', due: 'In 3 days', group: 'This Week' },
  { icon: Droplets, title: 'Flush water heater', due: 'In 5 days', group: 'This Week' },
  { icon: Flame, title: 'Furnace inspection', due: 'Oct 18', group: 'This Month' },
  { icon: Trees, title: 'Trim backyard hedges', due: 'Oct 24', group: 'This Month' },
  { icon: Snowflake, title: 'Winterize outdoor faucets', due: 'Nov 2', group: 'This Season' },
]

const groups: Group[] = ['This Week', 'This Month', 'This Season']

export function UpcomingMaintenance() {
  const [active, setActive] = useState<Group>('This Week')
  const filtered = items.filter((i) => i.group === active)

  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl tracking-tight">Upcoming Maintenance</h2>
        <button
          type="button"
          className="flex items-center gap-0.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          View all
          <ChevronRight className="size-4" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-4 flex gap-1 rounded-2xl bg-muted/70 p-1">
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setActive(g)}
            className={cn(
              'flex-1 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors',
              active === g
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <ul className="mt-2 flex flex-1 flex-col divide-y divide-border/70">
        {filtered.map(({ icon: Icon, title, due }) => (
          <li key={title} className="flex items-center gap-3.5 py-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <Icon className="size-5" strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">Recurring · Auto-scheduled</p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {due}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
