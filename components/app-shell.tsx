import type { ReactNode } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { Topbar } from '@/components/dashboard/topbar'
import { requireUser } from '@/lib/supabase/home'

export async function AppShell({
  children,
  showSearch = true,
}: {
  children: ReactNode
  showSearch?: boolean
}) {
  const { supabase, user } = await requireUser()
  const [homeRes, profileRes] = await Promise.all([
    supabase
      .from('homes')
      .select('name')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from('profiles').select('name, email').eq('id', user.id).maybeSingle(),
  ])

  const homeName = homeRes.data?.name ?? 'Your home'
  const userName = profileRes.data?.name || profileRes.data?.email || 'You'
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'H'

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar homeName={homeName} userName={userName} userInitial={userInitial} />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <MobileNav homeName={homeName} userName={userName} userInitial={userInitial} />
        <div className="mx-auto max-w-5xl space-y-8 lg:space-y-10">
          <Topbar showSearch={showSearch} />
          {children}
        </div>
      </main>
    </div>
  )
}
