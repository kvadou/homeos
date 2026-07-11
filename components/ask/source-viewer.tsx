'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowUpRight } from 'lucide-react'
import type { Source } from '@/lib/ask-data'
import { cn } from '@/lib/utils'

const tint: Record<string, string> = {
  sage: 'bg-sage/15 text-sage-foreground',
  navy: 'bg-primary/10 text-primary',
  wood: 'bg-wood/20 text-wood-foreground',
}

const docKindLabel: Record<string, string> = {
  pdf: 'Document',
  receipt: 'Receipt',
  warranty: 'Warranty',
  photo: 'Photo',
  video: 'Video',
  note: 'Note',
  record: 'Record',
}

export function SourceViewer({ source, onClose }: { source: Source | null; onClose: () => void }) {
  useEffect(() => {
    if (!source) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [source, onClose])

  if (!source) return null

  const Icon = source.icon
  const preview = source.preview
  const kind = source.docType ? docKindLabel[source.docType] : 'Record'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close document"
        onClick={onClose}
        className="ob-fade-in absolute inset-0 bg-foreground/30 backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${source.label} — ${kind}`}
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
        style={{ animation: 'ob-slide-in-right 0.32s cubic-bezier(0.22, 1, 0.36, 1) both' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-2xl',
              tint[source.tint],
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{source.label}</p>
            <p className="truncate text-xs text-muted-foreground">{source.kind}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {kind}
          </span>

          {preview?.src && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.src || '/placeholder.svg'}
                alt={source.label}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          )}

          {preview?.summary && (
            <p className="mt-4 text-pretty text-sm leading-relaxed text-foreground">
              {preview.summary}
            </p>
          )}

          {preview?.fields && preview.fields.length > 0 && (
            <dl className="mt-4 overflow-hidden rounded-2xl border border-border/60">
              {preview.fields.map((f, i) => (
                <div
                  key={f.label}
                  className={cn(
                    'flex items-center justify-between gap-4 px-4 py-3',
                    i % 2 === 0 ? 'bg-secondary/30' : 'bg-card',
                  )}
                >
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="text-right text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {preview?.body && preview.body.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {preview.body.map((line) => (
                <li
                  key={line}
                  className="rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm leading-relaxed text-foreground"
                >
                  {line}
                </li>
              ))}
            </ul>
          )}

          {!preview && (
            <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground">
              This answer drew on your {source.kind.toLowerCase()}. Open it in your Library to see
              the full record.
            </p>
          )}

          {preview?.meta && <p className="mt-4 text-xs text-muted-foreground">{preview.meta}</p>}
        </div>

        {/* Footer */}
        {source.href && (
          <div className="border-t border-border/60 px-5 py-4">
            <Link
              href={source.href}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Open in Library
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
