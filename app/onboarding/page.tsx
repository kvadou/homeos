import { redirect } from 'next/navigation'
import { getCurrentHome } from '@/lib/supabase/home'
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export default async function OnboardingPage() {
  // Already set up? Onboarding is done — go home.
  if (await getCurrentHome()) redirect('/')

  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  )
}
