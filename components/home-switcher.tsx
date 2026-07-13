'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, House } from 'lucide-react'
import { switchHome } from '@/lib/actions/settings'
import { cn } from '@/lib/utils'

export function HomeSwitcher({ homes, currentId }: { homes: { id: string; name: string }[]; currentId: string }) {
  const [open, setOpen] = useState(false)
  const current = homes.find((h) => h.id === currentId) ?? homes[0]
  return <div className="relative mb-4">
    <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-2.5 rounded-2xl border border-border/70 bg-card px-3 py-2.5 text-left shadow-sm transition-colors hover:bg-accent/40">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground"><House className="size-4" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium leading-tight">{current?.name ?? 'Your home'}</span><span className="text-xs text-muted-foreground">{homes.length > 1 ? `${homes.length} homes` : 'Current home'}</span></span>
      <ChevronsUpDown className="size-4 text-muted-foreground" />
    </button>
    {open && homes.length > 1 && <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-40 rounded-2xl border border-border bg-popover p-1.5 shadow-lg">
      {homes.map((home) => <form key={home.id} action={switchHome.bind(null, home.id)}>
        <button type="submit" className={cn('flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-accent/60', home.id === currentId && 'bg-accent/40')}>
          <House className="size-4 text-muted-foreground" /><span className="min-w-0 flex-1 truncate">{home.name}</span>{home.id === currentId && <Check className="size-4 text-sage-foreground" />}
        </button>
      </form>)}
    </div>}
  </div>
}

