import type { ReactNode } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'

export function AppShell({
  children,
  showSearch = true,
}: {
  children: ReactNode
  showSearch?: boolean
}) {
  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />
      <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-5xl space-y-10">
          <Topbar showSearch={showSearch} />
          {children}
        </div>
      </main>
    </div>
  )
}
