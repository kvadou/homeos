'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, UploadCloud, FileText, Check, Loader2, ArrowRight, X, Camera, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { recordUpload } from '@/lib/actions/library'
import { fileTypeOptions } from '@/lib/library-data'
import { guessUploadType, hashUpload, safeStorageName } from '@/lib/upload-client'

type Phase = 'idle' | 'ready' | 'uploading' | 'analyzing' | 'done'
type ItemOption = { id: string; name: string }
type ScanCode = { value: string; format: string }
type ScanResult =
  | { kind: 'checking' }
  | { kind: 'review'; suggestionId: string; summary: string; catalogProvider: string | null; confidence: number | null }
  | { kind: 'identified'; itemName: string }
  | { kind: 'no_match' | 'failed' | 'delayed' | 'out_of_scope'; detail?: string }
type BarcodeDetectorInstance = {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>
}
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance

/** Best-effort native code read; vision extraction still handles unsupported browsers. */
async function detectScanCode(file: File): Promise<ScanCode | null> {
  if (!file.type.startsWith('image/')) return null
  const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
  if (!Detector) return null
  try {
    const bitmap = await createImageBitmap(file)
    const [code] = await new Detector().detect(bitmap)
    bitmap.close()
    return code?.rawValue ? { value: code.rawValue, format: code.format || 'unknown' } : null
  } catch {
    return null
  }
}

const fieldClass =
  'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground'

export function UploadFlow({ homeId, items, initialType = 'document' }: { homeId: string; items: ItemOption[]; initialType?: 'document' | 'photo' }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<string>(initialType)
  const [itemId, setItemId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [savedItemId, setSavedItemId] = useState<string | null>(null)
  const [savedFileId, setSavedFileId] = useState<string | null>(null)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [scanCode, setScanCode] = useState<ScanCode | null>(null)
  const [liveOpen, setLiveOpen] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanActionPending, setScanActionPending] = useState(false)
  const scanRunRef = useRef(0)

  useEffect(() => () => {
    scanRunRef.current += 1
  }, [])

  function choose(f: File | null | undefined) {
    if (!f) return
    if (f.size > 25 * 1024 * 1024) {
      setError('Choose a file smaller than 25 MB.')
      setPhase('idle')
      return
    }
    setFile(f)
    setName(f.name.replace(/\.[^.]+$/, ''))
    setType(guessUploadType(f))
    setError(null)
    setNotice(null)
    setPhase('ready')
    setScanCode(null)
    void detectScanCode(f).then(setScanCode)
  }

  function reset() {
    setFile(null)
    setName('')
    setType(initialType)
    setItemId('')
    setError(null)
    setNotice(null)
    setSavedItemId(null)
    setSavedFileId(null)
    setFeedbackSent(false)
    setScanCode(null)
    setScanResult(null)
    setScanActionPending(false)
    scanRunRef.current += 1
    setPhase('idle')
  }

  async function upload() {
    if (!file || !name.trim()) return
    setError(null)
    setNotice(null)
    setPhase('uploading')
    const supabase = createClient()
    const path = `${homeId}/${crypto.randomUUID()}-${safeStorageName(file.name)}`
    const contentHash = await hashUpload(file)
    const resolvedScanCode = scanCode ?? await detectScanCode(file)

    const { error: upErr } = await supabase.storage.from('home-files').upload(path, file)
    if (upErr) {
      setError(upErr.message)
      setPhase('ready')
      return
    }

    const res = await recordUpload({ name: name.trim(), type, storagePath: path, itemId: itemId || null, contentHash, scanCode: resolvedScanCode })
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
    setSavedFileId(res.fileId ?? null)
    if (type === 'photo' && res.fileId) {
      const run = ++scanRunRef.current
      setScanResult({ kind: 'checking' })
      setPhase('analyzing')
      void waitForScanOutcome(res.fileId, run)
    } else {
      setPhase('done')
    }
  }

  async function waitForScanOutcome(fileId: string, run: number) {
    const supabase = createClient()
    for (let attempt = 0; attempt < 18; attempt++) {
      await new Promise((resolve) => window.setTimeout(resolve, 2000))
      if (scanRunRef.current !== run) return

      const { data: fileState } = await supabase
        .from('files')
        .select('item_id,extraction_status,meta')
        .eq('id', fileId)
        .maybeSingle()
      if (!fileState || fileState.extraction_status === 'pending') continue
      if (fileState.extraction_status === 'failed') {
        setScanResult({ kind: 'failed' })
        setPhase('done')
        return
      }
      if (fileState.item_id) {
        const { data: item } = await supabase.from('items').select('id,name').eq('id', fileState.item_id).maybeSingle()
        setSavedItemId(item?.id ?? fileState.item_id)
        setScanResult({ kind: 'identified', itemName: item?.name ?? 'Saved item' })
        setPhase('done')
        return
      }

      const meta = fileState.meta && typeof fileState.meta === 'object' && !Array.isArray(fileState.meta)
        ? fileState.meta as Record<string, unknown>
        : {}
      if (meta.scope_status === 'out_of_scope') {
        setScanResult({ kind: 'out_of_scope', detail: typeof meta.scope_reason === 'string' ? meta.scope_reason : undefined })
        setPhase('done')
        return
      }
      const { data: suggestions } = await supabase
        .from('suggestions')
        .select('id,summary')
        .eq('target', 'items')
        .eq('status', 'pending')
        .eq('provenance->>file_id', fileId)
        .limit(1)
      const suggestion = suggestions?.[0]
      if (suggestion) {
        setScanResult({
          kind: 'review',
          suggestionId: suggestion.id,
          summary: suggestion.summary,
          catalogProvider: typeof meta.catalog_provider === 'string' ? meta.catalog_provider : null,
          confidence: typeof meta.catalog_confidence === 'number' ? meta.catalog_confidence : null,
        })
      } else {
        setScanResult({ kind: 'no_match' })
      }
      setPhase('done')
      return
    }
    if (scanRunRef.current === run) {
      setScanResult({ kind: 'delayed' })
      setPhase('done')
    }
  }

  async function resolveItemSuggestion(suggestionId: string, accept: boolean) {
    if (scanActionPending) return
    setScanActionPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/suggestions/${encodeURIComponent(suggestionId)}`, { method: accept ? 'POST' : 'DELETE' })
      const body = await response.json() as { error?: string; item?: { id: string; name: string } }
      if (!response.ok) throw new Error(body.error ?? 'Could not save that choice.')
      if (accept && body.item) {
        setSavedItemId(body.item.id)
        setScanResult({ kind: 'identified', itemName: body.item.name })
      } else {
        setScanResult({ kind: 'no_match' })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save that choice.')
    } finally {
      setScanActionPending(false)
    }
  }

  async function sendScanFeedback(outcome: 'correct' | 'incorrect' | 'no_match', reason?: string) {
    if (!savedFileId || feedbackSent) return
    const response = await fetch('/api/scan-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: savedFileId, outcome, reason, surface: 'web' }),
    })
    if (response.ok) setFeedbackSent(true)
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
        <h1 className="font-serif text-3xl tracking-tight text-balance sm:text-4xl">{initialType === 'photo' ? 'Add a photo' : 'Add a document'}</h1>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          {initialType === 'photo' ? 'Photograph an item, data plate, receipt, or part of your home and save it to the right record.' : 'Upload a manual, warranty, receipt, or other record and link it to the item it belongs to.'}
        </p>
      </header>

      {phase === 'idle' && (
        <div className="space-y-3">
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
            accept="image/*,.pdf,.doc,.docx,.txt,video/*"
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <span className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <UploadCloud className="size-8" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-base font-medium">Drag &amp; drop, or click to add</p>
            <p className="mt-1 text-sm text-muted-foreground">{initialType === 'photo' ? 'JPG, PNG, HEIC, or a live scan' : 'PDFs, receipts, warranties, and manuals'}</p>
          </div>
        </label>
        <button type="button" onClick={() => setLiveOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40 sm:hidden">
          <Camera className="size-4" strokeWidth={2} />
          Scan live
        </button>
        {liveOpen && <LiveWebScanner onClose={() => setLiveOpen(false)} onCapture={(captured, code) => { setLiveOpen(false); choose(captured); if (code) setScanCode(code) }} />}
        {error && <p className="text-center text-sm text-destructive" role="alert">{error}</p>}
        </div>
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
                  maxLength={160}
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

              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              {notice && (
                <p className="rounded-xl bg-accent/50 px-3.5 py-2.5 text-sm text-foreground">{notice}</p>
              )}
              {scanCode && (
                <p className="rounded-xl bg-accent/50 px-3.5 py-2.5 text-sm text-foreground">
                  {scanCode.format.toUpperCase()} code detected. GatheredOS will use it as identification evidence.
                </p>
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

      {phase === 'analyzing' && (
        <div className="rounded-3xl border border-sage/30 bg-accent/40 p-7 text-center" role="status" aria-live="polite">
          <Loader2 className="mx-auto size-7 animate-spin text-primary" strokeWidth={2} />
          <h2 className="mt-4 font-serif text-xl tracking-tight">Identifying this item</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Checking the label, barcode, and known product catalogs. Your photo is already saved.
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
              <p className="text-sm font-medium">Added to your Library</p>
              <p className="text-xs text-muted-foreground">
                {name} is filed{savedItemId ? ' and linked to your item' : ''}.
              </p>
            </div>
          </div>

          {scanResult?.kind === 'review' && (
            <div className="rounded-2xl border border-sage/30 bg-card p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
                  <Sparkles className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Item identified</p>
                  <p className="mt-1 text-sm text-muted-foreground">{scanResult.summary}</p>
                  {scanResult.catalogProvider && (
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      Exact catalog match · {scanResult.catalogProvider.replaceAll('_', ' ')}
                      {scanResult.confidence ? ` · ${Math.round(scanResult.confidence * 100)}%` : ''}
                    </p>
                  )}
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button type="button" disabled={scanActionPending} onClick={() => resolveItemSuggestion(scanResult.suggestionId, true)} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
                  {scanActionPending ? 'Saving…' : 'Add this item'}
                </button>
                <button type="button" disabled={scanActionPending} onClick={() => resolveItemSuggestion(scanResult.suggestionId, false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium disabled:opacity-60">
                  Not this item
                </button>
              </div>
            </div>
          )}

          {scanResult?.kind === 'identified' && (
            <p className="rounded-2xl border border-sage/30 bg-sage/[0.07] p-4 text-center text-sm">
              <span className="font-medium">{scanResult.itemName}</span> is now connected to this home record.
            </p>
          )}

          {scanResult && ['no_match', 'failed', 'delayed', 'out_of_scope'].includes(scanResult.kind) && (
            <p className="rounded-2xl border border-border/70 bg-card p-4 text-center text-sm text-muted-foreground">
              {scanResult.kind === 'failed' && 'The photo is saved, but it could not be analyzed. Try a closer photo of the model plate.'}
              {scanResult.kind === 'delayed' && 'The photo is saved and analysis is still running. Results will appear in your review queue.'}
              {scanResult.kind === 'no_match' && 'The photo is saved, but there was not enough evidence to identify a specific item.'}
              {scanResult.kind === 'out_of_scope' && (scanResult.detail ?? 'This appears to be a consumable rather than a durable household item.')}
            </p>
          )}

          {type === 'photo' && savedFileId && (
            <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
              {feedbackSent ? (
                <p className="text-sm text-muted-foreground">Thanks—this helps improve item identification.</p>
              ) : (
                <>
                  <p className="text-sm font-medium">How did the item scan go?</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => sendScanFeedback('correct')} className="rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent/40">Looks right</button>
                    <button type="button" onClick={() => sendScanFeedback('incorrect', 'wrong_item')} className="rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent/40">Wrong item</button>
                    <button type="button" onClick={() => sendScanFeedback('no_match', 'label_unreadable')} className="rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-accent/40">Couldn&apos;t identify it</button>
                  </div>
                </>
              )}
            </div>
          )}

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

function LiveWebScanner({ onClose, onCapture }: { onClose: () => void; onCapture: (file: File, code: ScanCode | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null)
  const [code, setCode] = useState<ScanCode | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
        const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
        if (Detector) detectorRef.current = new Detector()
      } catch { setError('Camera access is unavailable. You can still choose a photo.') }
    }
    void start()
    const timer = window.setInterval(async () => {
      const video = videoRef.current
      const detector = detectorRef.current
      if (!video || !detector || video.readyState < 2) return
      try { const [hit] = await detector.detect(video); if (hit?.rawValue) setCode({ value: hit.rawValue, format: hit.format || 'unknown' }) } catch { /* next frame retries */ }
    }, 500)
    return () => { cancelled = true; window.clearInterval(timer); streamRef.current?.getTracks().forEach((t) => t.stop()) }
  }, [])

  async function capture() {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (blob) onCapture(new File([blob], `item-scan-${Date.now()}.jpg`, { type: 'image/jpeg' }), code)
  }

  return <div className="fixed inset-0 z-50 bg-black">
    <video ref={videoRef} playsInline muted className="size-full object-cover" />
    <div className="pointer-events-none absolute inset-8 rounded-3xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 text-white">
      <button type="button" onClick={onClose} className="pointer-events-auto rounded-full bg-black/45 px-4 py-2 text-sm">Cancel</button>
      <span className="rounded-full bg-black/45 px-3 py-2 text-xs">{code ? `${code.format.toUpperCase()} detected` : 'Looking for label or code'}</span>
    </div>
    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-8 text-white">
      {error && <p className="rounded-xl bg-black/60 px-4 py-2 text-center text-sm">{error}</p>}
      {code && <p className="max-w-xs truncate rounded-xl bg-black/60 px-4 py-2 text-xs">{code.value}</p>}
      <button type="button" onClick={capture} disabled={Boolean(error)} aria-label="Capture item" className="size-20 rounded-full border-4 border-white bg-white/25 shadow-lg disabled:opacity-40" />
      <p className="text-xs drop-shadow">Hold the item or label steady, then capture</p>
    </div>
  </div>
}
