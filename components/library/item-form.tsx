'use client'

import { useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { categoryOptions } from '@/lib/library-data'
import { createItem, updateItem } from '@/lib/actions/library'

export type RoomOption = { id: string; name: string }

type Initial = {
  name?: string
  category?: string
  room_id?: string | null
  manufacturer?: string | null
  model?: string | null
  installed_on?: string | null
  summary?: string | null
}

const fieldClass =
  'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground'

export function ItemForm({
  mode,
  id,
  rooms,
  initial,
  defaultCategory,
  onCancel,
  cancelHref,
}: {
  mode: 'create' | 'edit'
  id?: string
  rooms: RoomOption[]
  initial?: Initial
  defaultCategory?: string
  onCancel?: () => void
  cancelHref?: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    start(async () => {
      const res = mode === 'edit' && id ? await updateItem(id, fd) : await createItem(fd)
      // On success the action redirects; we only get here on failure.
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input id="name" name="name" required defaultValue={initial?.name ?? ''} placeholder="e.g. Water Heater" className={fieldClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className={labelClass}>
            Category
          </label>
          <select id="category" name="category" defaultValue={initial?.category ?? defaultCategory ?? categoryOptions[0]?.value} className={fieldClass}>
            {categoryOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="room_id" className={labelClass}>
            Room
          </label>
          <select id="room_id" name="room_id" defaultValue={initial?.room_id ?? ''} className={fieldClass}>
            <option value="">No room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="manufacturer" className={labelClass}>
            Manufacturer
          </label>
          <input id="manufacturer" name="manufacturer" defaultValue={initial?.manufacturer ?? ''} placeholder="e.g. AO Smith" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="model" className={labelClass}>
            Model
          </label>
          <input id="model" name="model" defaultValue={initial?.model ?? ''} placeholder="e.g. ProLine XE" className={fieldClass} />
        </div>
      </div>

      <div>
        <label htmlFor="installed_on" className={labelClass}>
          Installed date
        </label>
        <input id="installed_on" name="installed_on" type="date" defaultValue={initial?.installed_on ?? ''} className={fieldClass} />
      </div>

      <div>
        <label htmlFor="summary" className={labelClass}>
          Notes
        </label>
        <textarea id="summary" name="summary" rows={3} defaultValue={initial?.summary ?? ''} placeholder="Anything worth remembering about this item." className={`${fieldClass} resize-none`} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-3 pt-1">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40">
            Cancel
          </button>
        ) : cancelHref ? (
          <Link href={cancelHref} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40">
            Cancel
          </Link>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" strokeWidth={2} />}
          {mode === 'edit' ? 'Save changes' : 'Add item'}
        </button>
      </div>
    </form>
  )
}
