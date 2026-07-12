'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, Settings, ChevronsUpDown, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import { navItems as nav, isNavActive } from '@/components/dashboard/nav-items'

export function Sidebar({
  homeName,
  userName,
  userInitial,
}: {
  homeName: string
  userName: string
  userInitial: string
}) {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 hidden h-svh w-60 flex-col gap-1 border-r border-border/70 bg-sidebar px-4 py-6 lg:flex">
      <div className="mb-5 flex items-center gap-2.5 px-2">
        <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <House className="size-4.5" strokeWidth={2.25} />
        </div>
        <span className="font-serif text-xl tracking-tight">HomeOS</span>
      </div>

      {/* Home switcher — the household concept */}
      <button
        type="button"
        className="mb-4 flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card px-3 py-2.5 text-left shadow-sm transition-colors hover:bg-accent/40"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground">
          <House className="size-4" strokeWidth={2} />
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium leading-tight">{homeName}</span>
          <span className="text-xs leading-tight text-muted-foreground">Primary home</span>
        </div>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map(({ icon: Icon, label, hint, href }) => {
          const isActive = isNavActive(href, pathname)
          return (
            <Link
              key={label}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              <Icon className="size-5.5 shrink-0" strokeWidth={2} />
              <span className="flex flex-col">
                <span className="text-sm font-medium leading-tight">{label}</span>
                <span className="text-xs leading-tight text-muted-foreground">{hint}</span>
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border/70 pt-3">
        <Link
          href="/settings"
          aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          )}
        >
          <Settings className="size-5 shrink-0" strokeWidth={2} />
          <span className="text-sm font-medium">Settings</span>
        </Link>

        <div className="mt-2 flex items-center gap-1">
          <Link
            href="/settings"
            className="flex flex-1 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-accent/50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-wood/25 text-sm font-semibold text-wood-foreground">
              {userInitial}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium leading-tight">{userName}</span>
              <span className="truncate text-xs leading-tight text-muted-foreground">{homeName}</span>
            </div>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            >
              <LogOut className="size-4.5" strokeWidth={2} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
