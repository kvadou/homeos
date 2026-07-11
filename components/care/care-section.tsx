'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/* A shared shell for every Care section. Unifies the serif header + icon badge
   pattern and adds optional progressive disclosure so the page doesn't feel
   like eight dashboards stacked on top of each other. */
export function CareSection({
  icon,
  title,
  subtitle,
  iconTint = 'sage',
  accessory,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  iconTint?: 'sage' | 'wood'
  accessory?: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  const badge = (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-xl',
        iconTint === 'wood' ? 'bg-wood/20 text-wood-foreground' : 'bg-sage/15 text-sage-foreground',
      )}
    >
      {icon}
    </span>
  )

  const heading = (
    <div className="text-left">
      <h2 className="font-serif text-xl tracking-tight">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )

  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="group flex flex-1 items-center gap-2.5 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            {badge}
            {heading}
            <ChevronDown
              className={cn(
                'ml-1 size-5 text-muted-foreground transition-transform duration-200',
                open && 'rotate-180',
              )}
              strokeWidth={2}
            />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            {badge}
            {heading}
          </div>
        )}
        {accessory && <div className="shrink-0">{accessory}</div>}
      </div>

      {open && <div className="mt-5">{children}</div>}
    </section>
  )
}
