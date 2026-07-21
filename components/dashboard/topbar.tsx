'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { HomeSearchResult } from '@/app/api/search/route'
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
import { QuickAddDialog, type QuickAddKind } from './quick-add-dialog'

const quickAdd: Array<
  | { icon: typeof CheckSquare; label: string; kind: QuickAddKind; href?: never }
  | { icon: typeof CheckSquare; label: string; href: string; kind?: never }
> = [
  { icon: CheckSquare, label: 'Task', kind: 'task' as const },
  { icon: Hammer, label: 'Project', kind: 'project' as const },
  { icon: FileText, label: 'Document', href: '/library/upload?type=document' },
  { icon: Lightbulb, label: 'Knowledge', href: '/ask?prompt=Remember%20this%20about%20my%20home%3A%20' },
  { icon: Camera, label: 'Photo', href: '/library/upload?type=photo' },
  { icon: Wrench, label: 'Maintenance record', kind: 'maintenance' as const },
]

const suggestions = [
  'Where is my water shutoff?',
  'Can I wait another year to replace my water heater?',
  'How much have I spent on landscaping?',
  'What maintenance is due next month?',
]

export function Topbar({ showSearch = true }: { showSearch?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [quickAddKind, setQuickAddKind] = useState<QuickAddKind | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<HomeSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchFocused(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    function shortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus() }
    }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setSearching(false); return }
    const controller = new AbortController()
    setSearching(true)
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        const body = await res.json() as { results?: HomeSearchResult[] }
        setResults(body.results ?? [])
      } catch { if (!controller.signal.aborted) setResults([]) }
      finally { if (!controller.signal.aborted) setSearching(false) }
    }, 220)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query])

  return (
    <header className="flex min-w-0 items-center gap-2.5">
      {showSearch ? (
        <div className="relative mr-auto min-w-0 flex-1 sm:max-w-md" ref={searchRef}>
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) router.push(results[0].href) }}
            placeholder="Search…"
            aria-label="Search your home"
            onFocus={() => setSearchFocused(true)}
            className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-4 text-base text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15 sm:text-sm"
          />

          {searchFocused && (
            <div className="absolute left-0 right-0 top-13 z-30 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-lg">
              <p className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="size-3.5 text-sage-foreground" strokeWidth={2} />
                {query.trim().length >= 2 ? searching ? 'Searching your home…' : `${results.length} result${results.length === 1 ? '' : 's'}` : 'Search your home'}
              </p>
              {query.trim().length < 2 && suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setQuery(s); inputRef.current?.focus() }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent/60"
                >
                  <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                  {s}
                </button>
              ))}
              {query.trim().length >= 2 && !searching && results.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">Nothing in your home matched that search.</p>}
              {results.map((result) => (
                <Link key={`${result.type}-${result.id}`} href={result.href} onClick={() => setSearchFocused(false)} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/60">
                  <Search className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{result.title}</span>{result.detail && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{result.detail}</span>}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{result.type}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <Link
        href="/settings#notifications"
        aria-label="Notification settings"
        title="Notification settings"
        className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        <Bell className="size-5" strokeWidth={2} />
      </Link>

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
            {quickAdd.map(({ icon: Icon, label, ...action }) => {
              const content = <><Icon className="size-4.5 text-muted-foreground" strokeWidth={2} />{label}</>
              const className = 'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              if (action.href) return <Link key={label} href={action.href} onClick={() => setOpen(false)} className={className}>{content}</Link>
              return <button key={label} type="button" onClick={() => { setOpen(false); setQuickAddKind(action.kind ?? null) }} className={className}>{content}</button>
            })}
          </div>
        )}
      </div>
      <QuickAddDialog kind={quickAddKind} onClose={() => setQuickAddKind(null)} />
    </header>
  )
}
