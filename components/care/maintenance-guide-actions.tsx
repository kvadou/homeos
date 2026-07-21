'use client'

import { useEffect, useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  ShieldCheck,
  UserRoundSearch,
} from 'lucide-react'
import { completeTask } from '@/lib/actions/care'
import type { ServiceSafetyFlag } from '@/lib/service-coordination/safety'

const safetyOptions: Array<{ key: ServiceSafetyFlag; label: string }> = [
  { key: 'gasSmell', label: 'Gas or fuel smell' },
  { key: 'smokeOrSparks', label: 'Smoke, sparks, or burning odor' },
  { key: 'electricShock', label: 'Shock or tingling from the appliance' },
  { key: 'activeFloodingNearPower', label: 'Active water leak near power' },
  { key: 'carbonMonoxideAlarm', label: 'Carbon monoxide alarm' },
  { key: 'severeOverheating', label: 'Severe heat, melting, or scorching' },
]

type ServiceCaseSummary = {
  id: string
  status?: string
}

function readableStatus(status: string | undefined): string {
  if (!status) return 'Request recorded'
  return status.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

export function MaintenanceCompletion({ taskId, initialStatus }: { taskId: string; initialStatus: string }) {
  const [complete, setComplete] = useState(initialStatus === 'done')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function finishTask() {
    if (complete || pending) return
    setError(null)
    startTransition(async () => {
      const result = await completeTask(taskId)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      setComplete(true)
      router.refresh()
    })
  }

  return (
    <div>
      <button
        type="button"
        disabled={complete || pending}
        onClick={finishTask}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70 sm:w-auto"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : complete ? <CheckCircle2 className="size-4" aria-hidden /> : <Check className="size-4" aria-hidden />}
        {complete ? 'Completed' : pending ? 'Saving…' : 'Mark this maintenance complete'}
      </button>
      {complete && <p className="mt-2 text-sm text-sage-foreground">Saved to your home’s maintenance history.</p>}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">Could not save completion: {error}</p>}
    </div>
  )
}

export function ProfessionalHelp({
  itemId,
  itemName,
  taskTitle,
  summary,
}: {
  itemId: string | null
  itemName: string | null
  taskTitle: string
  summary: string
}) {
  const [open, setOpen] = useState(false)
  const [loadingCase, setLoadingCase] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [existingCase, setExistingCase] = useState<ServiceCaseSummary | null>(null)
  const [createdCase, setCreatedCase] = useState<ServiceCaseSummary | null>(null)
  const [guidance, setGuidance] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [symptom, setSymptom] = useState(`Routine maintenance help: ${taskTitle.toLowerCase()}.`)
  const [urgency, setUrgency] = useState<'routine' | 'soon'>('routine')
  const [shareApproved, setShareApproved] = useState(false)
  const [safety, setSafety] = useState<Partial<Record<ServiceSafetyFlag, boolean>>>({})

  const hasSafetyConcern = Object.values(safety).some(Boolean)

  useEffect(() => {
    if (!open || !itemId || existingCase || createdCase) return
    let active = true
    setLoadingCase(true)
    fetch(`/api/service-cases?itemId=${encodeURIComponent(itemId)}`)
      .then(async (response) => response.ok ? response.json() as Promise<{ case?: ServiceCaseSummary | null }> : null)
      .then((body) => { if (active && body?.case) setExistingCase(body.case) })
      .catch(() => undefined)
      .finally(() => { if (active) setLoadingCase(false) })
    return () => { active = false }
  }, [createdCase, existingCase, itemId, open])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!itemId) return
    if (!hasSafetyConcern && !shareApproved) {
      setError('Review and approve the information GatheredOS may share.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/service-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          symptom,
          urgency,
          safety,
          shareApproved: hasSafetyConcern ? false : shareApproved,
          surface: 'web',
        }),
      })
      const body = await response.json() as {
        error?: string
        case?: ServiceCaseSummary
        safety?: { stopped?: boolean; guidance?: string }
      }
      if (!response.ok || !body.case) throw new Error(body.error || 'We could not save the service request.')
      setCreatedCase(body.case)
      setGuidance(body.safety?.guidance ?? null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not save the service request.')
    } finally {
      setSubmitting(false)
    }
  }

  const activeCase = createdCase ?? existingCase

  return (
    <section id="professional-help" className="rounded-2xl border border-border/70 bg-card p-5 sm:p-7">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="professional-help-panel"
        className="flex min-h-11 w-full items-center gap-3 text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-wood/15 text-wood-foreground">
          <UserRoundSearch className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold">Find a local service professional</span>
          <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div id="professional-help-panel" className="mt-5 rounded-2xl bg-secondary/35 p-5 sm:p-6">
          {!itemId ? (
            <div>
              <h3 className="font-semibold">Connect this task to an appliance first</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                GatheredOS needs the appliance record so it can give a professional the correct manufacturer, model, and service context.
              </p>
              <Link href="/library" className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent">
                Open your appliance library
              </Link>
            </div>
          ) : loadingCase ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden />Checking existing service requests…</p>
          ) : activeCase ? (
            <div className="flex items-start gap-3">
              {hasSafetyConcern && createdCase ? <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-sage-foreground" aria-hidden />}
              <div>
                <h3 className="font-semibold">{hasSafetyConcern && createdCase ? 'Safety concern recorded' : 'Your service request is open'}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {guidance || (createdCase
                    ? 'GatheredOS will review qualified local appliance professionals and show you availability, fees, and terms before anything is booked.'
                    : `Status: ${readableStatus(activeCase.status)}. GatheredOS will keep this request connected to ${itemName || 'the appliance record'}.`)}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">Request reference: {activeCase.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <h3 className="font-semibold">Tell GatheredOS what help you need</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  No provider is contacted or booked until you review the scope and sharing details.
                </p>
              </div>

              <label className="block text-sm font-medium">
                Service need
                <textarea
                  value={symptom}
                  onChange={(event) => setSymptom(event.target.value)}
                  required
                  minLength={3}
                  className="mt-2 min-h-24 w-full rounded-xl border border-border bg-card px-3.5 py-3 text-base font-normal outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 sm:text-sm"
                />
              </label>

              <fieldset>
                <legend className="text-sm font-semibold">Check any condition happening now</legend>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">A checked safety condition stops normal provider coordination and shows immediate guidance.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {safetyOptions.map((option) => (
                    <label key={option.key} className="flex min-h-11 items-center gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={safety[option.key] === true}
                        onChange={(event) => setSafety((current) => ({ ...current, [option.key]: event.target.checked }))}
                        className="size-4 rounded border-border accent-primary"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {!hasSafetyConcern && (
                <>
                  <label className="block text-sm font-medium">
                    Timing
                    <select value={urgency} onChange={(event) => setUrgency(event.target.value as 'routine' | 'soon')} className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3.5 text-base font-normal outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 sm:text-sm">
                      <option value="routine">Routine — flexible timing</option>
                      <option value="soon">Soon — within the next few days</option>
                    </select>
                  </label>

                  <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 text-sm leading-relaxed">
                    <input type="checkbox" checked={shareApproved} onChange={(event) => setShareApproved(event.target.checked)} className="mt-0.5 size-4 rounded border-border accent-primary" />
                    <span>
                      <span className="font-medium">I approve this service search.</span>
                      <span className="mt-1 block text-muted-foreground">GatheredOS may share the appliance name, manufacturer/model, service need, and ZIP code with reviewed providers. Your street address is not included in initial outreach.</span>
                    </span>
                  </label>
                </>
              )}

              {hasSafetyConcern && (
                <div className="flex items-start gap-3 rounded-xl bg-destructive/10 p-4 text-sm">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
                  <p><span className="font-semibold">Do not continue this maintenance.</span> Submit the safety screen to record the concern and receive the appropriate stop guidance.</p>
                </div>
              )}

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

              <button type="submit" disabled={submitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto">
                {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : hasSafetyConcern ? <ShieldCheck className="size-4" aria-hidden /> : <UserRoundSearch className="size-4" aria-hidden />}
                {submitting ? 'Saving…' : hasSafetyConcern ? 'Record safety concern' : 'Ask GatheredOS to find options'}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  )
}
