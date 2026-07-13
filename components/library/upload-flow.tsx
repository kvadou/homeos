'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, UploadCloud, FileText, Check, Loader2, ArrowRight, X, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { recordUpload } from '@/lib/actions/library'
import { fileTypeOptions } from '@/lib/library-data'

type Phase = 'idle' | 'ready' | 'uploading' | 'done'
type ItemOption = { id: string; name: string }
type ScanCode = { value: string; format: string }
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
  const [scanCode, setScanCode] = useState<ScanCode | null>(null)
  const [liveOpen, setLiveOpen] = useState(false)

  function choose(f: File | null | undefined) {
    if (!f) return
    setFile(f)
    setName(f.name.replace(/\.[^.]+$/, ''))
    setType(guessType(f))
    setError(null)
    setNotice(null)
    setPhase('ready')
    setScanCode(null)
    void detectScanCode(f).then(setScanCode)
  }

  function reset() {
    setFile(null)
    setName('')
    setType('document')
    setItemId('')
    setError(null)
    setNotice(null)
    setSavedItemId(null)
    setScanCode(null)
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

    const res = await recordUpload({ name: name.trim(), type, storagePath: path, itemId: itemId || null, contentHash, scanCode })
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
            <p className="mt-1 text-sm text-muted-foreground">PDFs, photos, receipts, manuals</p>
          </div>
        </label>
        <button type="button" onClick={() => setLiveOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40 sm:hidden">
          <Camera className="size-4" strokeWidth={2} />
          Scan live
        </button>
        {liveOpen && <LiveWebScanner onClose={() => setLiveOpen(false)} onCapture={(captured, code) => { setLiveOpen(false); choose(captured); if (code) setScanCode(code) }} />}
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
              {scanCode && (
                <p className="rounded-xl bg-accent/50 px-3.5 py-2.5 text-sm text-foreground">
                  {scanCode.format.toUpperCase()} code detected. HomeOS will use it as identification evidence.
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
