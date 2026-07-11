'use client'

import { useEffect, useState, useTransition, type ReactNode } from 'react'
import { Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { ItemForm, type RoomOption } from '@/components/library/item-form'
import { deleteItem } from '@/lib/actions/library'

export type EditValues = {
  name: string
  category: string
  room_id: string | null
  manufacturer: string | null
  model: string | null
  installed_on: string | null
  summary: string | null
}

export function ItemActions({ id, name, values, rooms }: { id: string; name: string; values: EditValues; rooms: RoomOption[] }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onDelete() {
    setError(null)
    start(async () => {
      const res = await deleteItem(id)
      // On success the action redirects; we only get here on failure.
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40"
      >
        <Pencil className="size-4" strokeWidth={2} />
        <span className="hidden sm:inline">Edit</span>
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="size-4" strokeWidth={2} />
        <span className="hidden sm:inline">Delete</span>
      </button>

      {editing && (
        <Modal title={`Edit ${name}`} onClose={() => setEditing(false)}>
          <ItemForm mode="edit" id={id} rooms={rooms} initial={values} onCancel={() => setEditing(false)} />
        </Modal>
      )}

      {confirming && (
        <Modal title="Delete item" onClose={() => (pending ? null : setConfirming(false))}>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Delete <span className="font-medium text-foreground">{name}</span> and everything linked to it from your
            Library? This can&apos;t be undone.
          </p>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending && <Loader2 className="size-4 animate-spin" strokeWidth={2} />}
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/** Custom centered modal (no native dialog), matching the app's overlay style. */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="ob-fade-in absolute inset-0 bg-foreground/30 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
          <p className="font-serif text-lg tracking-tight">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4.5" strokeWidth={2} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
