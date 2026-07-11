import { AppShell } from '@/components/app-shell'
import { LibraryHome } from '@/components/library/library-home'

export default function LibraryPage() {
  return (
    <AppShell showSearch={false}>
      <LibraryHome />
    </AppShell>
  )
}
