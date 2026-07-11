'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Sparkles,
  Check,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'analyzing' | 'done'

const extracted = [
  { label: 'Document type', value: 'Roof Warranty' },
  { label: 'Manufacturer', value: 'GAF Timberline HDZ' },
  { label: 'Install date', value: 'June 2024' },
  { label: 'Warranty length', value: '25 years' },
  { label: 'Expiration', value: 'June 2049' },
  { label: 'Contractor', value: 'Summit Roofing' },
  { label: 'Roof material', value: 'Architectural asphalt' },
  { label: 'Serial / lot', value: 'GAF-HDZ-2024-8841' },
  { label: 'Expected life', value: '25–30 years' },
]

export function UploadFlow() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [dragging, setDragging] = useState(false)
  const [revealed, setRevealed] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function start() {
    if (phase !== 'idle') return
    setPhase('analyzing')
    timers.current.push(
      setTimeout(() => {
        setPhase('done')
        extracted.forEach((_, i) => {
          timers.current.push(setTimeout(() => setRevealed(i + 1), i * 220))
        })
      }, 1600),
    )
  }

  function reset() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setRevealed(0)
    setPhase('idle')
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

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
        <h1 className="font-serif text-3xl tracking-tight text-balance sm:text-4xl">
          Add to your home
        </h1>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          Drop a document or photo. HomeOS reads it, understands it, and files it away — so you
          never have to type a thing.
        </p>
      </header>

      {phase === 'idle' && (
        <div
          role="button"
          tabIndex={0}
          onClick={start}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && start()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            start()
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-12 text-center transition-colors sm:p-16',
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-sage/50 hover:bg-accent/30',
          )}
        >
          <span className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <UploadCloud className="size-8" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-base font-medium">Drag & drop, or click to add</p>
            <p className="mt-1 text-sm text-muted-foreground">PDFs, photos, receipts, manuals</p>
          </div>
          <span className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-3.5 py-2 text-xs text-muted-foreground">
            <FileText className="size-4" strokeWidth={2} />
            Try it with a sample: Roof-Warranty.pdf
          </span>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-border/70 bg-card p-12 text-center shadow-sm sm:p-16">
          <span className="flex size-16 items-center justify-center rounded-3xl bg-navy/10 text-primary">
            <FileText className="size-8" strokeWidth={1.5} />
          </span>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Reading Roof-Warranty.pdf...
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            HomeOS is extracting the details that matter and connecting them to your roof.
          </p>
        </div>
      )}

      {phase === 'done' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-3xl border border-sage/30 bg-accent/40 p-5 sm:p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sage/20 text-sage-foreground">
              <Check className="size-6" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-sm font-medium">Roof-Warranty.pdf understood</p>
              <p className="text-xs text-muted-foreground">
                Filed under Warranties, Systems, and your Roof
              </p>
            </div>
          </div>

          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-4" strokeWidth={2} />
              <span className="text-sm font-medium">Extracted automatically</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              {extracted.map((f, i) => (
                <div
                  key={f.label}
                  className={cn(
                    'transition-all duration-500',
                    i < revealed ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
                  )}
                >
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 border-t border-border/60 pt-5 text-center font-serif text-lg tracking-tight text-muted-foreground">
              No typing. Ever.
            </p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/library/item/roof"
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
