import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set up GatheredOS — Build your home’s memory',
  description:
    'Let’s build your home’s memory. GatheredOS helps you remember what matters, stay ahead of maintenance, and make smarter decisions about your home.',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-background">{children}</div>
}
