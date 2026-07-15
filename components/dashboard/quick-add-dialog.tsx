'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { CalendarDays, Check, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { addMaintenanceRecord, addTask } from '@/lib/actions/care'
import { createProject } from '@/lib/actions/projects'

export type QuickAddKind = 'task' | 'project' | 'maintenance'

const copy: Record<QuickAddKind, { title: string; description: string; submit: string }> = {
  task: {
    title: 'Add a task',
    description: 'Capture something your home needs and when you want to handle it.',
    submit: 'Add task',
  },
  project: {
    title: 'Start a project',
    description: 'Create a project workspace you can plan, budget, and update over time.',
    submit: 'Create project',
  },
  maintenance: {
    title: 'Record maintenance',
    description: 'Save work that was completed so your home history stays accurate.',
    submit: 'Save record',
  },
}

const fieldClass = 'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60'
const labelClass = 'mb-1.5 block text-sm font-medium text-foreground'

export function QuickAddDialog({ kind, onClose }: { kind: QuickAddKind | null; onClose: () => void }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const config = kind ? copy[kind] : null

  function close() {
    if (pending) return
    setError(null)
    setSaved(false)
    onClose()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!kind) return
    const form = new FormData(event.currentTarget)
    setError(null)
    startTransition(async () => {
      let result: { error?: string }
      if (kind === 'task') {
        result = await addTask({
          title: String(form.get('title') ?? ''),
          detail: String(form.get('detail') ?? ''),
          dueOn: String(form.get('dueOn') ?? '') || undefined,
          priority: String(form.get('priority') ?? '') || undefined,
        })
      } else if (kind === 'project') {
        const budgetValue = String(form.get('budget') ?? '')
        result = await createProject({
          name: String(form.get('title') ?? ''),
          kind: 'active',
          status: 'Planning',
          summary: String(form.get('detail') ?? ''),
          budget: budgetValue ? Number(budgetValue) : null,
          progress: 0,
        })
      } else {
        const costValue = String(form.get('cost') ?? '')
        result = await addMaintenanceRecord({
          title: String(form.get('title') ?? ''),
          occurredOn: String(form.get('occurredOn') ?? '') || undefined,
          cost: costValue ? Number(costValue) : null,
          note: String(form.get('detail') ?? ''),
        })
      }
      if (result.error) {
        setError(result.error)
        return
      }
      setSaved(true)
      router.refresh()
      window.setTimeout(close, 650)
    })
  }

  return (
    <Dialog.Root open={Boolean(kind)} onOpenChange={(open) => { if (!open) close() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/25 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card p-5 shadow-xl outline-none transition-[opacity,transform] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 sm:p-6">
          {config && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Dialog.Title className="font-serif text-2xl tracking-tight text-balance">{config.title}</Dialog.Title>
                  <Dialog.Description className="mt-1 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">{config.description}</Dialog.Description>
                </div>
                <Dialog.Close aria-label="Close" disabled={pending} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
                  <X className="size-5" />
                </Dialog.Close>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor={`quick-${kind}-title`} className={labelClass}>{kind === 'maintenance' ? 'What was completed?' : kind === 'project' ? 'Project name' : 'Task'}</label>
                  <input id={`quick-${kind}-title`} name="title" required maxLength={160} autoFocus disabled={pending || saved} placeholder={kind === 'maintenance' ? 'e.g. Furnace serviced' : kind === 'project' ? 'e.g. Replace the back deck' : 'e.g. Test smoke detectors'} className={fieldClass} />
                </div>

                {kind === 'task' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label htmlFor="quick-task-due" className={labelClass}>Due date <span className="font-normal text-muted-foreground">(optional)</span></label><input id="quick-task-due" name="dueOn" type="date" disabled={pending || saved} className={fieldClass} /></div>
                    <div><label htmlFor="quick-task-priority" className={labelClass}>Priority</label><select id="quick-task-priority" name="priority" defaultValue="normal" disabled={pending || saved} className={fieldClass}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></div>
                  </div>
                )}

                {kind === 'project' && <div><label htmlFor="quick-project-budget" className={labelClass}>Planned budget <span className="font-normal text-muted-foreground">(optional)</span></label><input id="quick-project-budget" name="budget" type="number" min="0" step="1" inputMode="decimal" disabled={pending || saved} placeholder="0" className={fieldClass} /></div>}

                {kind === 'maintenance' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label htmlFor="quick-maintenance-date" className={labelClass}>Completed on</label><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input id="quick-maintenance-date" name="occurredOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} disabled={pending || saved} className={`${fieldClass} pl-9`} /></div></div>
                    <div><label htmlFor="quick-maintenance-cost" className={labelClass}>Cost <span className="font-normal text-muted-foreground">(optional)</span></label><input id="quick-maintenance-cost" name="cost" type="number" min="0" step="0.01" inputMode="decimal" disabled={pending || saved} placeholder="0.00" className={fieldClass} /></div>
                  </div>
                )}

                <div><label htmlFor={`quick-${kind}-detail`} className={labelClass}>{kind === 'maintenance' ? 'Notes' : 'Details'} <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id={`quick-${kind}-detail`} name="detail" rows={3} maxLength={2000} disabled={pending || saved} placeholder="Add useful context for your household." className={`${fieldClass} resize-y`} /></div>

                <div aria-live="polite" className="min-h-5">
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {saved && <p className="flex items-center gap-2 text-sm font-medium text-sage-foreground"><Check className="size-4" />Saved to your home</p>}
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Dialog.Close disabled={pending} className="min-h-11 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">Cancel</Dialog.Close>
                  <button type="submit" disabled={pending || saved} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{pending && <Loader2 className="size-4 animate-spin" aria-hidden />}{saved ? 'Saved' : pending ? 'Saving…' : config.submit}</button>
                </div>
              </form>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
