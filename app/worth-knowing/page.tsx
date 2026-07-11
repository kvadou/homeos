import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { WorthKnowing } from '@/components/worth-knowing/worth-knowing'

export const metadata: Metadata = {
  title: 'Worth Knowing · HomeOS',
  description: 'The quietly interesting things HomeOS has learned about your home.',
}

export default function WorthKnowingPage() {
  return (
    <AppShell showSearch={false}>
      <WorthKnowing />
    </AppShell>
  )
}
