'use client'

import { useOnboarding } from '../onboarding-provider'
import { StepFrame } from '../step-frame'
import { TextField } from '../controls'

export function StepHome() {
  const { data, updateHome } = useOnboarding()
  const { home } = data

  const canContinue = Boolean(home.street.trim() && home.zip.trim())

  return (
    <StepFrame
      title="Where is your home?"
      description="We’ll use this to understand your climate, property records, and what your home may need."
      primaryDisabled={!canContinue}
      primaryLabel="Continue"
    >
      <div className="space-y-4">
        <TextField
          label="Street address"
          value={home.street}
          onChange={(v) => updateHome({ street: v })}
          placeholder="123 Main St"
          autoComplete="street-address"
          name="street-address"
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <TextField
            label="City"
            value={home.city}
            onChange={(v) => updateHome({ city: v })}
            autoComplete="address-level2"
            className="col-span-2"
          />
          <TextField
            label="State"
            value={home.state}
            onChange={(v) => updateHome({ state: v })}
            autoComplete="address-level1"
          />
          <TextField
            label="ZIP"
            value={home.zip}
            onChange={(v) => updateHome({ zip: v })}
            autoComplete="postal-code"
            inputMode="numeric"
          />
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-medium">Tell us a little about your home</p>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Year built"
              value={home.yearBuilt}
              onChange={(v) => updateHome({ yearBuilt: v })}
              placeholder="e.g. 1998"
            />
            <TextField
              label="Square footage"
              value={home.sqft}
              onChange={(v) => updateHome({ sqft: v })}
              placeholder="e.g. 2,400"
            />
            <TextField
              label="Bedrooms"
              value={home.beds}
              onChange={(v) => updateHome({ beds: v })}
            />
            <TextField
              label="Bathrooms"
              value={home.baths}
              onChange={(v) => updateHome({ baths: v })}
            />
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Your address stays private. HomeOS uses it only to personalize your home&rsquo;s care.
        </p>
      </div>
    </StepFrame>
  )
}
