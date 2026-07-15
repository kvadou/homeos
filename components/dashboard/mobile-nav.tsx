'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
import { Settings, LogOut, Menu, X } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import { navItems, isNavActive } from '@/components/dashboard/nav-items'
import { HomeSwitcher } from '@/components/home-switcher'

// Mobile-only top bar + slide-in nav drawer. The desktop sidebar is hidden
// below lg; this replaces it so every destination stays reachable on a phone.
export function MobileNav({
  homeName,
  userName,
  userInitial,
  homes,
  currentHomeId,
}: {
  homeName: string
  userName: string
  userInitial: string
  homes: { id: string; name: string }[]
  currentHomeId: string
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the drawer whenever the route changes (link taps navigate).
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <header className="sticky top-0 z-30 -mx-5 mb-2 flex items-center gap-2 border-b border-border/60 bg-background/85 px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md sm:-mx-8 sm:px-8 lg:hidden">
        <Dialog.Trigger
          className="-ml-1.5 flex size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-accent/50 active:bg-accent"
          aria-label="Open menu"
        >
          <Menu className="size-5.5" strokeWidth={2} />
        </Dialog.Trigger>
        <Link href="/" className="-my-1 flex items-center gap-2 py-1">
          <BrandLogo compact />
        </Link>
      </header>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 lg:hidden" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[85vw] flex-col gap-1 border-r border-border/70 bg-sidebar px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl transition-transform duration-250 ease-out data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full lg:hidden">
          <div className="mb-5 flex items-center justify-between px-1">
            <BrandLogo />
            <Dialog.Close
              className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="size-5" strokeWidth={2} />
            </Dialog.Close>
          </div>

          <HomeSwitcher homes={homes} currentId={currentHomeId} />

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {navItems.map(({ icon: Icon, label, hint, href }) => {
              const active = isNavActive(href, pathname)
              return (
                <Link
                  key={label}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors',
                    active
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
                'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors',
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
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-wood/25 text-sm font-semibold text-wood-foreground">
                  {userInitial}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium leading-tight">{userName}</span>
                  <span className="truncate text-xs leading-tight text-muted-foreground">
                    {homeName}
                  </span>
                </div>
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <LogOut className="size-4.5" strokeWidth={2} />
                </button>
              </form>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
