import { AppShell } from '@/components/app-shell'
import { AskExperience } from '@/components/ask/ask-experience'

export default function AskPage() {
  return (
    <AppShell showSearch={false}>
      <AskExperience />
    </AppShell>
  )
}
