'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Check, Loader2, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { completeProject, deleteProject, updateProject } from '@/lib/actions/projects'
import type { ActiveProject } from '@/lib/projects-data'

const fieldClass = 'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/15 disabled:opacity-60'
const labelClass = 'mb-1.5 block text-sm font-medium'

function amount(value: string): string {
  const parsed = value.replace(/[^0-9.-]/g, '')
  return parsed && Number.isFinite(Number(parsed)) ? parsed : ''
}

export function ProjectWorkspaceDialog({ project, open, onClose }: { project: ActiveProject; open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function close() {
    if (pending) return
    setError(null)
    setSaved(false)
    setConfirmingDelete(false)
    onClose()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await updateProject(project.id, {
        name: String(data.get('name') ?? '').trim(),
        status: String(data.get('status') ?? 'Planning'),
        progress: Number(data.get('progress') ?? 0),
        spent: Number(data.get('spent') || 0),
        budget: Number(data.get('budget') || 0),
        summary: String(data.get('summary') ?? '').trim(),
      })
      if (result.error) return setError(result.error)
      setSaved(true)
      router.refresh()
    })
  }

  function finish() {
    setError(null)
    startTransition(async () => {
      const result = await completeProject(project.id)
      if (result.error) return setError(result.error)
      router.refresh()
      close()
    })
  }

  function remove() {
    setError(null)
    startTransition(async () => {
      const result = await deleteProject(project.id)
      if (result.error) return setError(result.error)
      router.refresh()
      close()
    })
  }

  return <Dialog.Root open={open} onOpenChange={(next) => { if (!next) close() }}>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/25 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card p-5 shadow-xl outline-none sm:p-6">
        <div className="flex items-start justify-between gap-4"><div className="min-w-0"><Dialog.Title className="truncate font-serif text-2xl tracking-tight">{project.name}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Update the plan, spending, and progress for this project.</Dialog.Description></div><Dialog.Close aria-label="Close" disabled={pending} className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-5" /></Dialog.Close></div>

        {confirmingDelete ? <div className="mt-6 rounded-xl bg-destructive/10 p-4"><p className="font-medium">Delete this project?</p><p className="mt-1 text-sm text-muted-foreground">This permanently removes the project. Maintenance and files outside the project remain.</p><div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={pending} onClick={() => setConfirmingDelete(false)} className="min-h-11 rounded-xl border border-border px-4 py-2.5 text-sm font-medium">Keep project</button><button type="button" disabled={pending} onClick={remove} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{pending && <Loader2 className="size-4 animate-spin" />}Delete project</button></div></div> : <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label htmlFor={`project-name-${project.id}`} className={labelClass}>Project name</label><input id={`project-name-${project.id}`} name="name" required maxLength={160} defaultValue={project.name} disabled={pending} className={fieldClass} /></div>
          <div><label htmlFor={`project-summary-${project.id}`} className={labelClass}>Summary</label><textarea id={`project-summary-${project.id}`} name="summary" rows={3} maxLength={2000} defaultValue={project.summary} disabled={pending} className={`${fieldClass} resize-y`} /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor={`project-status-${project.id}`} className={labelClass}>Status</label><select id={`project-status-${project.id}`} name="status" defaultValue={project.status} disabled={pending} className={fieldClass}><option>Planning</option><option>In progress</option><option>On hold</option></select></div><div><label htmlFor={`project-progress-${project.id}`} className={labelClass}>Progress (%)</label><input id={`project-progress-${project.id}`} name="progress" type="number" min="0" max="100" defaultValue={project.progress} disabled={pending} className={fieldClass} /></div></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label htmlFor={`project-spent-${project.id}`} className={labelClass}>Spent</label><input id={`project-spent-${project.id}`} name="spent" type="number" min="0" step="0.01" defaultValue={amount(project.spent)} disabled={pending} className={fieldClass} /></div><div><label htmlFor={`project-budget-${project.id}`} className={labelClass}>Budget</label><input id={`project-budget-${project.id}`} name="budget" type="number" min="0" step="0.01" defaultValue={amount(project.budget)} disabled={pending} className={fieldClass} /></div></div>
          <div aria-live="polite" className="min-h-5">{error && <p className="text-sm text-destructive">{error}</p>}{saved && <p className="flex items-center gap-2 text-sm font-medium text-sage-foreground"><Check className="size-4" />Changes saved</p>}</div>
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center"><button type="button" onClick={() => setConfirmingDelete(true)} disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-destructive hover:bg-destructive/10 sm:mr-auto"><Trash2 className="size-4" />Delete</button><button type="button" onClick={finish} disabled={pending} className="min-h-11 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent">Mark complete</button><button type="submit" disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending && <Loader2 className="size-4 animate-spin" />}{pending ? 'Saving…' : 'Save changes'}</button></div>
        </form>}
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
}
