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
import { useRouter } from 'next/navigation'
import {
  clearOnboarding,
  emptyOnboarding,
  loadOnboarding,
  saveOnboarding,
  STEP_COUNT,
  type OnboardingDestination,
  type OnboardingData,
} from '@/lib/onboarding'
import { completeOnboarding, logOnboardingStep } from '@/lib/actions/onboarding'

type SaveState = 'idle' | 'saving' | 'saved'

type OnboardingContextValue = {
  data: OnboardingData
  step: number
  hydrated: boolean
  saveState: SaveState
  finishing: OnboardingDestination | null
  finishError: string | null
  update: (patch: Partial<OnboardingData>) => void
  updateHome: (patch: Partial<OnboardingData['home']>) => void
  next: () => void
  back: () => void
  goTo: (step: number) => void
  finish: (destination: OnboardingDestination) => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}

export function OnboardingProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const router = useRouter()
  const [data, setData] = useState<OnboardingData>(emptyOnboarding)
  const [step, setStep] = useState(1)
  const [hydrated, setHydrated] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [finishing, setFinishing] = useState<OnboardingDestination | null>(null)
  const [finishError, setFinishError] = useState<string | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const finishPending = useRef(false)

  // Restore any in-progress onboarding on mount.
  useEffect(() => {
    const restored = loadOnboarding(userId)
    if (restored) {
      setData(restored.data)
      setStep(restored.step)
    }
    setHydrated(true)
  }, [userId])

  // Autosave after every change, with a subtle "saved" indicator.
  useEffect(() => {
    if (!hydrated) return
    setSaveState('saving')
    saveOnboarding(data, step, userId)
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaveState('saved'), 400)
    return () => clearTimeout(savedTimer.current)
  }, [data, step, hydrated, userId])

  useEffect(() => {
    if (!hydrated) return
    void logOnboardingStep(step)
  }, [hydrated, step])

  const update = useCallback((patch: Partial<OnboardingData>) => {
    setFinishError(null)
    setData((d) => ({ ...d, ...patch }))
  }, [])

  const updateHome = useCallback((patch: Partial<OnboardingData['home']>) => {
    setFinishError(null)
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

  const finish = useCallback(async (destination: OnboardingDestination) => {
    if (finishPending.current) return
    finishPending.current = true
    setFinishing(destination)
    setFinishError(null)

    const result = await completeOnboarding(data, destination)
    if (result?.error) {
      setFinishError(result.error)
      setFinishing(null)
      finishPending.current = false
      return
    }

    const destinationHref: Record<OnboardingDestination, string> = {
      home: '/',
      inspection: '/library/upload?type=document&kind=inspection&source=onboarding',
      document: '/library/upload?type=document&source=onboarding',
      photo: '/library/upload?type=photo&source=onboarding',
      bulk: '/library/upload?mode=bulk&source=onboarding',
    }
    clearOnboarding(userId)
    router.push(destinationHref[destination])
  }, [data, router, userId])

  return (
    <OnboardingContext.Provider
      value={{
        data,
        step,
        hydrated,
        saveState,
        finishing,
        finishError,
        update,
        updateHome,
        next,
        back,
        goTo,
        finish,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}
