'use client'

import { useState } from 'react'
import { useOnboarding } from '../onboarding-provider'
import { StepFrame } from '../step-frame'
import { SelectTile, SuggestField } from '../controls'
import {
  majorSystems,
  manufacturerSuggestions,
  defaultManufacturers,
  type SystemDetail,
} from '@/lib/onboarding'
import { ImagePlus, Check, ChevronDown, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StepSystems() {
  const { data, update } = useOnboarding()
  const selected = data.systems
  // Which system's details are currently expanded (one at a time).
  const [openKey, setOpenKey] = useState<string | null>(null)

  function toggle(key: string) {
    const exists = selected.find((s) => s.key === key)
    if (exists) {
      update({ systems: selected.filter((s) => s.key !== key) })
      if (openKey === key) setOpenKey(null)
    } else {
      update({ systems: [...selected, { key }] })
    }
  }

  function patch(key: string, p: Partial<SystemDetail>) {
    update({ systems: selected.map((s) => (s.key === key ? { ...s, ...p } : s)) })
  }

  const labelFor = (key: string) => majorSystems.find((m) => m.key === key)?.label ?? key
  const iconFor = (key: string) => majorSystems.find((m) => m.key === key)?.icon

  function summaryFor(sys: SystemDetail) {
    if (sys.unsure) return 'Marked "not sure"'
    const bits = [sys.year, sys.manufacturer].filter(Boolean)
    return bits.length ? bits.join(' · ') : 'Add details'
  }

  return (
    <StepFrame
      title="Which of these does your home have?"
      description="Just tap the ones you have. Even rough estimates are enough — we’ll figure out the rest together, and you can always come back later."
    >
      <div className="space-y-8">
        <div className="ob-stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
          {majorSystems.map(({ key, label, icon }) => (
            <SelectTile
              key={key}
              icon={icon}
              label={label}
              selected={!!selected.find((s) => s.key === key)}
              onToggle={() => toggle(key)}
            />
          ))}
        </div>

        {selected.length > 0 && (
          <div className="ob-fade-in space-y-2.5">
            <h2 className="text-sm font-medium text-muted-foreground">
              Add details {selected.length > 1 ? 'one at a time' : ''} (optional)
            </h2>
            {selected.map((sys) => {
              const Icon = iconFor(sys.key)
              const open = openKey === sys.key
              const hasDetail = !!(sys.year || sys.manufacturer || sys.unsure)
              return (
                <div
                  key={sys.key}
                  className={cn(
                    'overflow-hidden rounded-3xl border bg-card shadow-sm transition-colors',
                    open ? 'border-sage/40' : hasDetail ? 'border-sage/30' : 'border-border/70',
                    hasDetail && !open && 'ob-glow',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenKey(open ? null : sys.key)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left"
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors',
                        sys.year || sys.manufacturer || sys.unsure
                          ? 'bg-sage/20 text-sage-foreground'
                          : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {Icon && <Icon className="size-5" strokeWidth={1.75} />}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{labelFor(sys.key)}</p>
                      <p className="text-xs text-muted-foreground">{summaryFor(sys)}</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      {!open && (sys.year || sys.manufacturer) && (
                        <Pencil className="size-3.5" strokeWidth={2} />
                      )}
                      <ChevronDown
                        className={cn('size-4 transition-transform', open && 'rotate-180')}
                        strokeWidth={2}
                      />
                    </span>
                  </button>

                  {open && (
                    <div className="ob-fade-in border-t border-border/60 px-5 pb-5 pt-4">
                      <button
                        type="button"
                        onClick={() => patch(sys.key, { unsure: !sys.unsure })}
                        className={cn(
                          'mb-4 inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors',
                          sys.unsure
                            ? 'border-sage bg-sage/15 text-sage-foreground'
                            : 'border-border bg-card text-muted-foreground hover:bg-secondary',
                        )}
                      >
                        {sys.unsure && <Check className="size-3.5" strokeWidth={3} />}
                        I&rsquo;m not sure — that&rsquo;s okay
                      </button>

                      {!sys.unsure && (
                        <div className="space-y-4">
                          <SuggestField
                            label="Manufacturer"
                            value={sys.manufacturer ?? ''}
                            onChange={(v) => patch(sys.key, { manufacturer: v })}
                            suggestions={manufacturerSuggestions[sys.key] ?? defaultManufacturers}
                          />
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                Age or install year
                              </span>
                              <input
                                value={sys.year ?? ''}
                                onChange={(e) => patch(sys.key, { year: e.target.value })}
                                placeholder="e.g. 2015"
                                className="h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                Next service
                              </span>
                              <input
                                value={sys.nextService ?? ''}
                                onChange={(e) => patch(sys.key, { nextService: e.target.value })}
                                placeholder="Optional"
                                className="h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                              />
                            </label>
                          </div>
                          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                            <ImagePlus className="size-4" strokeWidth={2} />
                            You can add a photo from the Library after setup.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </StepFrame>
  )
}
