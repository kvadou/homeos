'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, UploadCloud, FileText, Check, Loader2, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { recordUpload } from '@/lib/actions/library'
import { fileTypeOptions } from '@/lib/library-data'

type Phase = 'idle' | 'ready' | 'uploading' | 'done'
type ItemOption = { id: string; name: string }

/** Guess a file type from the browser File before the user confirms it. */
function guessType(file: File): string {
  if (file.type.startsWith('image/')) return 'photo'
  if (file.type.startsWith('video/')) return 'video'
  return 'document'
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]+/g, '-').replace(/^-+|-+$/g, '') || 'file'
}

/** SHA-256 of the file bytes — byte-level dedupe before the pipeline ever runs. */
async function hashFile(file: File): Promise<string | null> {
  try {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return null // hash is an optimization; upload proceeds without dedupe
  }
}

const fieldClass =
  'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground'

export function UploadFlow({ homeId, items }: { homeId: string; items: ItemOption[] }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState('document')
  const [itemId, setItemId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [savedItemId, setSavedItemId] = useState<string | null>(null)

  function choose(f: File | null | undefined) {
    if (!f) return
    setFile(f)
    setName(f.name.replace(/\.[^.]+$/, ''))
    setType(guessType(f))
    setError(null)
    setNotice(null)
    setPhase('ready')
  }

  function reset() {
    setFile(null)
    setName('')
    setType('document')
    setItemId('')
    setError(null)
    setNotice(null)
    setSavedItemId(null)
    setPhase('idle')
  }

  async function upload() {
    if (!file || !name.trim()) return
    setError(null)
    setNotice(null)
    setPhase('uploading')
    const supabase = createClient()
    const path = `${homeId}/${crypto.randomUUID()}-${safeName(file.name)}`
    const contentHash = await hashFile(file)

    const { error: upErr } = await supabase.storage.from('home-files').upload(path, file)
    if (upErr) {
      setError(upErr.message)
      setPhase('ready')
      return
    }

    const res = await recordUpload({ name: name.trim(), type, storagePath: path, itemId: itemId || null, contentHash })
    if (res.duplicate) {
      void supabase.storage.from('home-files').remove([path]) // drop the orphaned copy
      setNotice('This file is already in your library — nothing to add.')
      setPhase('ready')
      return
    }
    if (res.error) {
      setError(res.error)
      setPhase('ready')
      return
    }

    setSavedItemId(itemId || null)
    setPhase('done')
  }

  return (
    <div className="space-y-6">
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Library
      </Link>

      <header className="text-center">
        <h1 className="font-serif text-3xl tracking-tight text-balance sm:text-4xl">Add to your home</h1>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          Add a document, photo, or receipt to your home&apos;s memory. Link it to an item so it&apos;s always where
          you expect it.
        </p>
      </header>

      {phase === 'idle' && (
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            choose(e.dataTransfer.files?.[0])
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-12 text-center transition-colors sm:p-16',
            dragging ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-sage/50 hover:bg-accent/30',
          )}
        >
          <input
            type="file"
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <span className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <UploadCloud className="size-8" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-base font-medium">Drag &amp; drop, or click to add</p>
            <p className="mt-1 text-sm text-muted-foreground">PDFs, photos, receipts, manuals</p>
          </div>
        </label>
      )}

      {(phase === 'ready' || phase === 'uploading') && file && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="size-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            {phase === 'ready' && (
              <button
                type="button"
                onClick={reset}
                aria-label="Remove file"
                className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
            <div className="space-y-4">
              <div>
                <label htmlFor="file-name" className={labelClass}>
                  Name
                </label>
                <input
                  id="file-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                  placeholder="What is this?"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="file-type" className={labelClass}>
                    Type
                  </label>
                  <select id="file-type" value={type} onChange={(e) => setType(e.target.value)} className={fieldClass}>
                    {fileTypeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="file-item" className={labelClass}>
                    Link to item
                  </label>
                  <select id="file-item" value={itemId} onChange={(e) => setItemId(e.target.value)} className={fieldClass}>
                    <option value="">None</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {notice && (
                <p className="rounded-xl bg-accent/50 px-3.5 py-2.5 text-sm text-foreground">{notice}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={reset}
                  disabled={phase === 'uploading'}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={upload}
                  disabled={phase === 'uploading' || !name.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {phase === 'uploading' && <Loader2 className="size-4 animate-spin" strokeWidth={2} />}
                  {phase === 'uploading' ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-3xl border border-sage/30 bg-accent/40 p-5 sm:p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sage/20 text-sage-foreground">
              <Check className="size-6" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-sm font-medium">Added to your Library</p>
              <p className="text-xs text-muted-foreground">
                {name} is filed{savedItemId ? ' and linked to your item' : ''}.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={savedItemId ? `/library/item/${savedItemId}` : '/library'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              View in your home
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </Link>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40"
            >
              Add another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
