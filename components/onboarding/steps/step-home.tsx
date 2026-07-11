'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Check, Loader2, Pencil, Search } from 'lucide-react'
import { useOnboarding } from '../onboarding-provider'
import { StepFrame } from '../step-frame'
import { TextField } from '../controls'
import { sampleProperty, homeShortName } from '@/lib/onboarding'
import { cn } from '@/lib/utils'

const lookupSteps = [
  'Looking up property records',
  'Built in 1998',
  'Climate zone identified',
  'Typical maintenance schedule created',
]

const suggestions = [
  { street: '42 Willow Lane', city: 'Boulder', state: 'CO', zip: '80302' },
  { street: '118 Maple Court', city: 'Boulder', state: 'CO', zip: '80304' },
  { street: '7 Birchwood Drive', city: 'Longmont', state: 'CO', zip: '80501' },
]

type Lookup = 'idle' | 'searching' | 'found' | 'manual'

export function StepHome() {
  const { data, updateHome } = useOnboarding()
  const { home } = data
  const [lookup, setLookup] = useState<Lookup>(home.confirmed ? 'found' : 'idle')
  const [showSuggest, setShowSuggest] = useState(false)
  const [editing, setEditing] = useState(false)
  const [revealed, setRevealed] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function choose(s: (typeof suggestions)[number]) {
    updateHome({ ...s })
    setShowSuggest(false)
    setLookup('searching')
    setRevealed(1)
    // Reveal each finding one at a time so the lookup feels intelligent.
    for (let i = 2; i <= lookupSteps.length; i++) {
      timers.current.push(setTimeout(() => setRevealed(i), (i - 1) * 700))
    }
    timers.current.push(
      setTimeout(() => {
        updateHome({ ...sampleProperty, confirmed: false })
        setLookup('found')
      }, lookupSteps.length * 700 + 300),
    )
  }

  const canContinue = lookup === 'found' || (lookup === 'manual' && home.street && home.zip)

  return (
    <StepFrame
      title="Where is your home?"
      description="We’ll use this to understand your climate, property records, and what your home may need."
      primaryDisabled={!canContinue}
      primaryLabel={lookup === 'found' ? 'Confirm & continue' : 'Continue'}
    >
      <div className="space-y-4">
        {/* Street with autocomplete */}
        <div className="relative">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Street address</span>
            <span className="relative block">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={home.street}
                autoFocus
                onChange={(e) => {
                  updateHome({ street: e.target.value })
                  setShowSuggest(e.target.value.length > 1)
                  if (lookup === 'found') setLookup('idle')
                }}
                onFocus={() => setShowSuggest(home.street.length > 1)}
                placeholder="Start typing your address..."
                className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </span>
          </label>

          {showSuggest && (
            <div className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-lg">
              {suggestions.map((s) => (
                <button
                  key={s.street}
                  type="button"
                  onClick={() => choose(s)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/60"
                >
                  <MapPin className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                  <span>
                    {s.street}
                    <span className="text-muted-foreground">
                      {' '}
                      · {s.city}, {s.state} {s.zip}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <TextField
            label="City"
            value={home.city}
            onChange={(v) => updateHome({ city: v })}
            className="col-span-2"
          />
          <TextField label="State" value={home.state} onChange={(v) => updateHome({ state: v })} />
          <TextField label="ZIP" value={home.zip} onChange={(v) => updateHome({ zip: v })} />
        </div>

        {lookup === 'idle' && home.street.length > 1 && !showSuggest && (
          <button
            type="button"
            onClick={() => setLookup('manual')}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Can’t find your address? Enter details manually
          </button>
        )}

        {lookup === 'searching' && (
          <div className="ob-fly-in rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
            <ul className="space-y-2.5">
              {lookupSteps.slice(0, revealed).map((line, idx) => {
                const isLatest = idx === revealed - 1
                return (
                  <li key={line} className="ob-fade-in flex items-center gap-2.5 text-sm">
                    {isLatest ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-primary" strokeWidth={2} />
                    ) : (
                      <Check className="size-4 shrink-0 text-sage-foreground" strokeWidth={2.5} />
                    )}
                    <span className={cn(isLatest ? 'text-foreground' : 'text-foreground')}>
                      {line}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Confirmation card */}
        {lookup === 'found' && (
          <div className="ob-fly-in ob-glow overflow-hidden rounded-3xl border border-sage/30 bg-accent/40 shadow-sm">
            <div className="flex items-center gap-3 border-b border-sage/20 px-5 py-4">
              <span className="flex size-9 items-center justify-center rounded-xl bg-sage/20 text-sage-foreground">
                <Check className="size-5" strokeWidth={2.5} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">We found {homeShortName(home.street)}.</p>
                <p className="text-xs text-muted-foreground">
                  {home.street}, {home.city}, {home.state} {home.zip}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-background"
              >
                <Pencil className="size-3.5" strokeWidth={2} />
                {editing ? 'Done' : 'Edit'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
              {(
                [
                  ['Year built', 'yearBuilt'],
                  ['Square footage', 'sqft'],
                  ['Bedrooms', 'beds'],
                  ['Bathrooms', 'baths'],
                ] as const
              ).map(([label, key]) => (
                <div key={key}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                  {editing ? (
                    <input
                      value={home[key]}
                      onChange={(e) => updateHome({ [key]: e.target.value })}
                      className="mt-1 h-9 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium">{home[key] || '—'}</p>
                  )}
                </div>
              ))}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Type</p>
                <p className="mt-1 text-sm font-medium capitalize">
                  {home.propertyType.replace('-', ' ') || 'Single family'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Manual entry path */}
        {lookup === 'manual' && (
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
            <p className="mb-4 text-sm font-medium">Tell us a little about your home</p>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Year built"
                value={home.yearBuilt}
                onChange={(v) => updateHome({ yearBuilt: v })}
                placeholder="e.g. 1998"
              />
              <TextField
                label="Square footage"
                value={home.sqft}
                onChange={(v) => updateHome({ sqft: v })}
                placeholder="e.g. 2,400"
              />
              <TextField
                label="Bedrooms"
                value={home.beds}
                onChange={(v) => updateHome({ beds: v })}
              />
              <TextField
                label="Bathrooms"
                value={home.baths}
                onChange={(v) => updateHome({ baths: v })}
              />
            </div>
          </div>
        )}

        <p
          className={cn(
            'text-xs leading-relaxed text-muted-foreground',
            lookup === 'found' && 'text-center',
          )}
        >
          Your address stays private. HomeOS uses it only to personalize your home&rsquo;s care.
        </p>
      </div>
    </StepFrame>
  )
}
