'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { useOnboarding } from '../onboarding-provider'
import { StepFrame } from '../step-frame'
import { TextField } from '../controls'
import { cn } from '@/lib/utils'
import { propertyTypes, type OnboardingData } from '@/lib/onboarding'
import type { AddressSuggestion } from '@/app/api/address-search/route'
import type { PropertyPrefill } from '@/app/api/property-lookup/route'

type CommittedAddress = { street: string; city: string; state: string; zip: string }

export function StepHome() {
  const { data, updateHome } = useOnboarding()
  const { home } = data

  // Public-records prefill. 'pending' shows a status line; 'done' shows the
  // attribution line and means at least one field was actually filled.
  const [lookup, setLookup] = useState<'idle' | 'pending' | 'done'>('idle')
  const lastLookedUp = useRef('')
  const lookupAbort = useRef<AbortController>(undefined)

  // Always read the freshest home values when a lookup resolves, so we never
  // overwrite a field the user typed into while the request was in flight.
  const homeRef = useRef(home)
  homeRef.current = home

  useEffect(() => () => lookupAbort.current?.abort(), [])

  const runLookup = useCallback(
    (addr: CommittedAddress) => {
      const street = addr.street.trim()
      const zip = addr.zip.trim()
      if (!street || !zip) return
      const city = addr.city.trim()
      const state = addr.state.trim()
      // Once per distinct address value: skip if unchanged since last lookup.
      const key = `${street}|${city}|${state}|${zip}`.toLowerCase()
      if (key === lastLookedUp.current) return
      lastLookedUp.current = key

      lookupAbort.current?.abort()
      const ac = new AbortController()
      lookupAbort.current = ac
      setLookup('pending')

      const qs = new URLSearchParams({ street, city, state, zip })
      fetch(`/api/property-lookup?${qs}`, { signal: ac.signal })
        .then((res) => (res.ok ? (res.json() as Promise<{ property: PropertyPrefill | null }>) : null))
        .then((body) => {
          if (ac.signal.aborted) return
          const p = body?.property
          if (!p) {
            setLookup('idle')
            return
          }
          const cur = homeRef.current
          const patch: Partial<OnboardingData['home']> = {}
          if (!cur.yearBuilt.trim() && p.yearBuilt != null) patch.yearBuilt = String(p.yearBuilt)
          if (!cur.sqft.trim() && p.sqft != null) patch.sqft = p.sqft.toLocaleString('en-US')
          if (!cur.beds.trim() && p.beds != null) patch.beds = String(p.beds)
          if (!cur.baths.trim() && p.baths != null) patch.baths = String(p.baths)
          if (Object.keys(patch).length > 0) {
            updateHome(patch)
            setLookup('done')
          } else {
            setLookup('idle')
          }
        })
        .catch(() => {
          if (!ac.signal.aborted) setLookup('idle')
        })
    },
    [updateHome],
  )

  return (
    <StepFrame
      title="Start with your address"
      description="One address unlocks local weather, seasonal timing, and public property facts. Skip this if you just want to explore."
      primaryLabel={home.street.trim() ? 'Use this home' : 'Continue without an address'}
    >
      <div className="space-y-4">
        <AddressField onCommit={runLookup} />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <TextField
            label="City"
            value={home.city}
            onChange={(v) => updateHome({ city: v })}
            autoComplete="address-level2"
            className="col-span-2"
          />
          <TextField
            label="State"
            value={home.state}
            onChange={(v) => updateHome({ state: v })}
            autoComplete="address-level1"
          />
          <TextField
            label="ZIP"
            value={home.zip}
            onChange={(v) => updateHome({ zip: v })}
            autoComplete="postal-code"
            inputMode="numeric"
          />
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Home details</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Optional—and filled automatically when records are available.</p>
            </div>
            {lookup === 'pending' && (
              <span className="text-xs text-muted-foreground">Checking public records…</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium">Home type</span>
              <select
                value={home.propertyType}
                onChange={(event) => updateHome({ propertyType: event.target.value })}
                className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-base text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              >
                <option value="">Not sure yet</option>
                {propertyTypes.map((propertyType) => (
                  <option key={propertyType.key} value={propertyType.key}>{propertyType.label}</option>
                ))}
              </select>
            </label>
          </div>
          {lookup === 'done' && (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Prefilled from public records. Double-check anything that looks off.
            </p>
          )}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Your address stays private to your household and can be changed later.
        </p>
      </div>
    </StepFrame>
  )
}

/*
 * Street field with best-effort address autocomplete. It only AUGMENTS manual
 * typing: the input drives home.street on every keystroke, the dropdown never
 * overwrites what was typed (only an explicit tap/Enter on a suggestion fills
 * fields), and it is dismissible every way — Escape, outside pointerdown, blur,
 * and after a selection. Continue gating lives in StepHome and is untouched.
 */
function AddressField({ onCommit }: { onCommit: (addr: CommittedAddress) => void }) {
  const { data, updateHome } = useOnboarding()
  const street = data.home.street

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const blurRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const abortRef = useRef<AbortController>(undefined)

  // Cleanup timers / in-flight request on unmount.
  useEffect(
    () => () => {
      clearTimeout(debounceRef.current)
      clearTimeout(blurRef.current)
      abortRef.current?.abort()
    },
    [],
  )

  // Dismiss on outside pointerdown while the dropdown is open.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  async function runSearch(q: string) {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    try {
      const res = await fetch(`/api/address-search?q=${encodeURIComponent(q)}`, {
        signal: ac.signal,
      })
      if (!res.ok) {
        setSuggestions([])
        setOpen(false)
        return
      }
      const { suggestions } = (await res.json()) as { suggestions?: AddressSuggestion[] }
      const next = suggestions ?? []
      setSuggestions(next)
      setActiveIndex(-1)
      setOpen(next.length > 0)
    } catch {
      // Aborted (stale request) or network error — leave prior state, no error UI.
    } finally {
      if (abortRef.current === ac) setLoading(false)
    }
  }

  function onType(v: string) {
    updateHome({ street: v })
    clearTimeout(debounceRef.current)
    const q = v.trim()
    if (q.length < 3) {
      abortRef.current?.abort()
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => runSearch(q), 300)
  }

  function select(s: AddressSuggestion) {
    clearTimeout(debounceRef.current)
    clearTimeout(blurRef.current)
    abortRef.current?.abort()
    updateHome({ street: s.street, city: s.city, state: s.state, zip: s.zip })
    setOpen(false)
    setActiveIndex(-1)
    setLoading(false)
    onCommit({ street: s.street, city: s.city, state: s.state, zip: s.zip })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
        setActiveIndex(-1)
      }
      return
    }
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      select(suggestions[activeIndex])
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Street address</span>
        <span className="relative block">
          <input
            value={street}
            autoFocus
            role="combobox"
            aria-expanded={open}
            aria-controls="address-listbox"
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `address-option-${activeIndex}` : undefined}
            autoComplete="street-address"
            name="street-address"
            placeholder="123 Main St"
            onChange={(e) => onType(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true)
            }}
            onBlur={() => {
              // Delay so a row's onClick lands before we close.
              blurRef.current = setTimeout(() => setOpen(false), 150)
              // Prefill from public records once street + zip are both present.
              // The once-per-address guard in runLookup dedups repeat blurs.
              onCommit({
                street: data.home.street,
                city: data.home.city,
                state: data.home.state,
                zip: data.home.zip,
              })
            }}
            className="h-12 w-full rounded-2xl border border-border bg-card px-4 pr-10 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
          {loading && (
            <Loader2
              className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              strokeWidth={2}
            />
          )}
        </span>
      </label>

      {open && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg">
          <ul id="address-listbox" role="listbox" className="p-1.5">
            {suggestions.map((s, i) => (
              <li
                key={s.label}
                id={`address-option-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                // Keep input focused so blur doesn't close before the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                  i === activeIndex ? 'bg-accent/60' : 'hover:bg-accent/60',
                )}
              >
                <MapPin className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                <span className="truncate">{s.label}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border/60 px-3.5 py-1.5 text-[11px] text-muted-foreground">
            © OpenStreetMap
          </div>
        </div>
      )}
    </div>
  )
}
