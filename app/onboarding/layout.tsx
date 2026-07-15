import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set up GatherRoot — Build your home’s memory',
  description:
    'Let’s build your home’s memory. GatherRoot helps you remember what matters, stay ahead of maintenance, and make smarter decisions about your home.',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-background">{children}</div>
}
