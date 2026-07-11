'use client'

import { useState, useTransition, type SubmitEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { createIdea } from '@/lib/actions/projects'
import { Button } from '@/components/ui/button'

const inputClasses =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/* The "Add an idea" affordance. Opens a custom modal (never a native dialog)
   with a small form that saves through the createIdea server action. */
export function AddIdeaButton() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function close() {
    setError(null)
    setOpen(false)
  }

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createIdea(form)
      if (res?.error) {
        setError(res.error)
        return
      }
      close()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[7rem] items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-transparent p-4 text-sm font-medium text-muted-foreground transition-colors hover:border-wood/50 hover:bg-wood/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="size-4" strokeWidth={2.25} />
        Add an idea
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add an idea"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={(e) => {
            if (e.key === 'Escape') close()
          }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden />
          <form
            onSubmit={onSubmit}
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg tracking-tight">Add an idea</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input name="title" required autoFocus placeholder="Idea title" className={inputClasses} />
              <input name="category" placeholder="Category (optional)" className={inputClasses} />
              <input name="roughCost" placeholder="Rough cost, e.g. $1,500 (optional)" className={inputClasses} />
              <textarea name="note" rows={3} placeholder="Note (optional)" className={inputClasses} />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Saving…' : 'Save idea'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
