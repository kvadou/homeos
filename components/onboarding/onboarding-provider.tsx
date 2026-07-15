'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import {
  emptyOnboarding,
  loadOnboarding,
  saveOnboarding,
  STEP_COUNT,
  type OnboardingData,
} from '@/lib/onboarding'
import { logOnboardingStep } from '@/lib/actions/onboarding'

type SaveState = 'idle' | 'saving' | 'saved'

type OnboardingContextValue = {
  data: OnboardingData
  step: number
  hydrated: boolean
  saveState: SaveState
  update: (patch: Partial<OnboardingData>) => void
  updateHome: (patch: Partial<OnboardingData['home']>) => void
  next: () => void
  back: () => void
  goTo: (step: number) => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(emptyOnboarding)
  const [step, setStep] = useState(1)
  const [hydrated, setHydrated] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Restore any in-progress onboarding on mount.
  useEffect(() => {
    const restored = loadOnboarding()
    if (restored) {
      setData(restored.data)
      setStep(restored.step)
    }
    setHydrated(true)
  }, [])

  // Autosave after every change, with a subtle "saved" indicator.
  useEffect(() => {
    if (!hydrated) return
    setSaveState('saving')
    saveOnboarding(data, step)
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaveState('saved'), 400)
    return () => clearTimeout(savedTimer.current)
  }, [data, step, hydrated])

  useEffect(() => {
    if (!hydrated) return
    void logOnboardingStep(step)
  }, [hydrated, step])

  const update = useCallback((patch: Partial<OnboardingData>) => {
    setData((d) => ({ ...d, ...patch }))
  }, [])

  const updateHome = useCallback((patch: Partial<OnboardingData['home']>) => {
    setData((d) => ({ ...d, home: { ...d.home, ...patch } }))
  }, [])

  const next = useCallback(() => {
    setStep((s) => Math.min(STEP_COUNT, s + 1))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const back = useCallback(() => {
    setStep((s) => Math.max(1, s - 1))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const goTo = useCallback((s: number) => {
    setStep(Math.min(STEP_COUNT, Math.max(1, s)))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <OnboardingContext.Provider
      value={{ data, step, hydrated, saveState, update, updateHome, next, back, goTo }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}
