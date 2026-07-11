import { AppShell } from '@/components/app-shell'
import { CommandCenter } from '@/components/dashboard/command-center'

export default function Page() {
  return (
    <AppShell>
      <CommandCenter />
    </AppShell>
  )
}
