'use client'

import { useState, useTransition } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Trash2, X } from 'lucide-react'
import { deleteFile } from '@/lib/actions/library'
import { cn } from '@/lib/utils'

export function FileDeleteButton({ id, name, compact = false }: { id: string; name: string; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function remove() {
    setError(null)
    startTransition(async () => {
      const result = await deleteFile(id)
      if (result.error) setError(result.error)
      else setOpen(false)
    })
  }

  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger
      aria-label={`Delete ${name}`}
      className={cn('flex shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive', compact ? 'size-9 rounded-xl' : 'absolute right-2 top-2 z-10 size-9 rounded-full bg-card/95 shadow-sm')}
    ><Trash2 className="size-4" /></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35" />
      <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="font-serif text-xl">Delete this file?</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">“{name}” and its stored image will be permanently removed. Any item record it helped create will remain.</Dialog.Description></div><Dialog.Close aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-accent"><X className="size-4" /></Dialog.Close></div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex justify-end gap-2"><Dialog.Close className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium">Cancel</Dialog.Close><button type="button" onClick={remove} disabled={pending} className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground disabled:opacity-60">{pending ? 'Deleting…' : 'Delete file'}</button></div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
}
