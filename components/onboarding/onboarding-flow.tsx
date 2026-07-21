'use client'

import { useOnboarding } from './onboarding-provider'
import { OnboardingChrome } from './onboarding-chrome'
import { StepWelcome } from './steps/step-welcome'
import { StepHome } from './steps/step-home'
import { StepGoals } from './steps/step-goals'
import { StepComplete } from './steps/step-complete'

const steps: Record<number, () => React.JSX.Element> = {
  1: StepWelcome,
  2: StepHome,
  3: StepGoals,
  4: StepComplete,
}

export function OnboardingFlow() {
  const { step, hydrated } = useOnboarding()

  // Avoid a flash of step 1 before restoring saved progress.
  if (!hydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    )
  }

  const Step = steps[step] ?? StepWelcome

  return (
    <>
      <OnboardingChrome />
      <Step />
    </>
  )
}
