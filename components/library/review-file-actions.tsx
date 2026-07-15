'use client'

import { useActionState } from 'react'
import { fileLibraryRecord } from '@/lib/actions/library'

export function ReviewFileActions({ fileId, items }: { fileId: string; items: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(
    async (_previous: { error?: string }, formData: FormData) => fileLibraryRecord(formData),
    {},
  )
  return (
    <div className="mt-3 space-y-2 border-t border-border/60 pt-3" onClick={(event) => event.preventDefault()}>
      <form action={action} className="flex gap-2">
        <input type="hidden" name="file_id" value={fileId} />
        <select name="item_id" required aria-label="Item" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-2 text-xs">
          <option value="">Attach to item…</option>
          {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <button disabled={pending} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">Attach</button>
      </form>
      <form action={action}>
        <input type="hidden" name="file_id" value={fileId} />
        <input type="hidden" name="destination" value="home" />
        <button disabled={pending} className="text-xs font-medium text-primary disabled:opacity-50">Keep as Home Document</button>
      </form>
      {state?.error && <p role="alert" className="text-xs text-destructive">{state.error}</p>}
    </div>
  )
}
