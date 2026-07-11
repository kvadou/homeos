'use client'

import { useOnboarding } from '../onboarding-provider'
import { StepFrame } from '../step-frame'
import { SelectTile } from '../controls'
import { goals } from '@/lib/onboarding'

export function StepGoals() {
  const { data, update } = useOnboarding()

  function toggle(key: string) {
    update({
      goals: data.goals.includes(key)
        ? data.goals.filter((g) => g !== key)
        : [...data.goals, key],
    })
  }

  return (
    <StepFrame
      title="What would you like HomeOS to help with?"
      description="Choose as many as you like. We’ll shape your first dashboard around what matters most to you."
      primaryLabel="Finish setup"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map(({ key, label, icon }) => (
          <SelectTile
            key={key}
            icon={icon}
            label={label}
            selected={data.goals.includes(key)}
            onToggle={() => toggle(key)}
          />
        ))}
      </div>
    </StepFrame>
  )
}
