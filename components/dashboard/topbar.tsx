'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Search,
  Bell,
  Plus,
  CheckSquare,
  Hammer,
  FileText,
  Lightbulb,
  Camera,
  Wrench,
  Sparkles,
} from 'lucide-react'

const quickAdd = [
  { icon: CheckSquare, label: 'Task' },
  { icon: Hammer, label: 'Project' },
  { icon: FileText, label: 'Document' },
  { icon: Lightbulb, label: 'Knowledge' },
  { icon: Camera, label: 'Photo' },
  { icon: Wrench, label: 'Maintenance Record' },
]

const suggestions = [
  'Where is my water shutoff?',
  'Can I wait another year to replace my water heater?',
  'How much have I spent on landscaping?',
  'What maintenance is due next month?',
]

export function Topbar({ showSearch = true }: { showSearch?: boolean }) {
  const [open, setOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchFocused(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header className="flex items-center gap-2.5">
      {showSearch ? (
        <div className="relative mr-auto w-full max-w-md" ref={searchRef}>
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search or ask about your home..."
            onFocus={() => setSearchFocused(true)}
            className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />

          {searchFocused && (
            <div className="absolute left-0 right-0 top-13 z-30 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-lg">
              <p className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="size-3.5 text-sage-foreground" strokeWidth={2} />
                Try asking
              </p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSearchFocused(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent/60"
                >
                  <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <button
        type="button"
        aria-label="Notifications"
        className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        <Bell className="size-5" strokeWidth={2} />
        <span className="absolute right-3 top-3 size-2 rounded-full bg-sage ring-2 ring-card" />
      </button>

      <div className="relative shrink-0" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Quick add"
          aria-expanded={open}
          className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>

        {open && (
          <div className="absolute right-0 top-13 z-30 w-56 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-lg">
            <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Add to your home
            </p>
            {quickAdd.map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent/60"
              >
                <Icon className="size-4.5 text-muted-foreground" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
