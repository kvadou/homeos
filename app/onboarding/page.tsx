import { redirect } from 'next/navigation'
import { getCurrentHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export default async function OnboardingPage() {
  // Already set up? Onboarding is done — go home.
  if (await getCurrentHome()) redirect('/')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <OnboardingProvider userId={user.id}>
      <OnboardingFlow />
    </OnboardingProvider>
  )
}
