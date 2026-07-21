'use client'

import { useOnboarding } from '../onboarding-provider'
import { StepFrame } from '../step-frame'
import { SelectTile } from '../controls'
import { goals } from '@/lib/onboarding'

export function StepGoals() {
  const { data, update } = useOnboarding()

  function toggle(key: string) {
    if (!data.goals.includes(key) && data.goals.length >= 3) return
    update({
      goals: data.goals.includes(key)
        ? data.goals.filter((g) => g !== key)
        : [...data.goals, key],
    })
  }

  return (
    <StepFrame
      title="What brings you here today?"
      description="Choose up to three. This changes what GatheredOS prioritizes—not what you can access."
      primaryLabel="Continue"
    >
      <div>
        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground">{data.goals.length} of 3 selected.</span>{' '}
          {data.goals.length === 3 ? 'You can replace a choice by deselecting one.' : 'You can also skip this step.'}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goals.map(({ key, label, icon }) => {
            const selected = data.goals.includes(key)
            return (
              <SelectTile
                key={key}
                icon={icon}
                label={label}
                selected={selected}
                disabled={!selected && data.goals.length >= 3}
                onToggle={() => toggle(key)}
              />
            )
          })}
        </div>
      </div>
    </StepFrame>
  )
}
