'use client'

import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Large icon tile for primary choices (property type, systems). */
export function SelectTile({
  icon: Icon,
  label,
  hint,
  selected,
  onToggle,
}: {
  icon: LucideIcon
  label: string
  hint?: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        'group relative flex flex-col items-start gap-3 rounded-3xl border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5',
        selected
          ? '-translate-y-0.5 border-sage shadow-md ring-2 ring-sage/25'
          : 'border-border/70 hover:border-sage/40',
      )}
    >
      <span
        className={cn(
          'flex size-11 items-center justify-center rounded-2xl transition-colors',
          selected ? 'bg-sage/20 text-sage-foreground' : 'bg-secondary text-muted-foreground',
        )}
      >
        <Icon className="size-5.5" strokeWidth={1.75} />
      </span>
      <span>
        <span className="block text-sm font-medium leading-snug">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </span>
      {selected && (
        <span className="ob-check-pop absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-sage text-background">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}

/* Compact chip for fast multi-select (features). */
export function SelectChip({
  icon: Icon,
  label,
  selected,
  onToggle,
}: {
  icon?: LucideIcon
  label: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        'inline-flex min-h-10 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors',
        selected
          ? 'border-sage bg-sage/15 text-sage-foreground'
          : 'border-border/70 bg-card text-foreground hover:border-sage/40 hover:bg-accent/40',
      )}
    >
      {Icon && <Icon className="size-4" strokeWidth={2} />}
      {label}
      {selected && <Check className="ob-check-pop size-3.5" strokeWidth={3} />}
    </button>
  )
}

/* Text input with tappable suggestion chips, so common values need no typing. */
export function SuggestField({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {suggestions.map((s) => {
          const active = value === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(active ? '' : s)}
              className={cn(
                'inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors pointer-coarse:min-h-10',
                active
                  ? 'border-sage bg-sage/15 text-sage-foreground'
                  : 'border-border/70 bg-card text-muted-foreground hover:border-sage/40 hover:bg-accent/40',
              )}
            >
              {active && <Check className="size-3" strokeWidth={3} />}
              {s}
            </button>
          )
        })}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Or type your own'}
        className="h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
      />
    </div>
  )
}

/* Labeled text input consistent with the design system. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  autoFocus,
  autoComplete,
  name,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
  autoFocus?: boolean
  autoComplete?: string
  name?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none'
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        name={name}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
      />
    </label>
  )
}
