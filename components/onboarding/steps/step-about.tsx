'use client'

import { useOnboarding } from '../onboarding-provider'
import { StepFrame } from '../step-frame'
import { SelectTile, SelectChip } from '../controls'
import { propertyTypes, homeFeatures, homeShortName } from '@/lib/onboarding'

export function StepAbout() {
  const { data, update } = useOnboarding()
  const shortName = homeShortName(data.home.street)

  function toggleFeature(key: string) {
    update({
      features: data.features.includes(key)
        ? data.features.filter((f) => f !== key)
        : [...data.features, key],
    })
  }

  return (
    <StepFrame
      title="Tell us a little about your home."
      description={
        shortName === 'your home'
          ? 'A few quick taps help us get to know your home. You can change these anytime.'
          : `A few quick taps help us get to know ${shortName}. You can change these anytime.`
      }
    >
      <div className="space-y-8">
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Property type</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {propertyTypes.map(({ key, label, icon }) => (
              <SelectTile
                key={key}
                icon={icon}
                label={label}
                selected={data.homeType === key}
                onToggle={() => update({ homeType: data.homeType === key ? '' : key })}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-1 text-sm font-medium text-muted-foreground">
            Which of these does your home have?
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Optional — select any that apply. It helps us know what to look after.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {homeFeatures.map(({ key, label, icon }) => (
              <SelectChip
                key={key}
                icon={icon}
                label={label}
                selected={data.features.includes(key)}
                onToggle={() => toggleFeature(key)}
              />
            ))}
          </div>
        </div>
      </div>
    </StepFrame>
  )
}
