import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { SettingsPanel } from '@/components/settings/settings-panel'

export const metadata: Metadata = {
  title: 'Settings · HomeOS',
  description:
    'Tune your Home Intelligence, manage your homes and family, and control connected sources.',
}

export default function SettingsPage() {
  return (
    <AppShell showSearch={false}>
      <SettingsPanel />
    </AppShell>
  )
}
