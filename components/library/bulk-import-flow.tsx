'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileSearch,
  FileText,
  FolderOpen,
  FolderUp,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { recordUpload } from '@/lib/actions/library'
import { cn } from '@/lib/utils'
import { guessUploadType, hashUpload, safeStorageName } from '@/lib/upload-client'

type QueueStatus = 'ready' | 'preparing' | 'uploading' | 'reading' | 'done' | 'duplicate' | 'failed'

type QueueEntry = {
  id: string
  file: File
  status: QueueStatus
  fileId?: string
  detail?: string
}

type Discovery = {
  id: string
  title: string
  detail: string
}

type ImportedEntry = {
  entryId: string
  fileId: string
}

const MAX_FILES = 50
const MAX_FILE_SIZE = 25 * 1024 * 1024
const ACCEPTED_FILES = 'image/*,.pdf,.doc,.docx,.txt,.rtf,.csv,video/*'

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function displayName(file: File): string {
  return file.webkitRelativePath || file.name
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function humanize(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function BulkImportFlow({ homeId }: { homeId: string }) {
  const [entries, setEntries] = useState<QueueEntry[]>([])
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [dragging, setDragging] = useState(false)
  const [running, setRunning] = useState(false)
  const [monitoring, setMonitoring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const monitorRun = useRef(0)

  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '')
    return () => {
      monitorRun.current += 1
    }
  }, [])

  function updateEntry(id: string, patch: Partial<QueueEntry>) {
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry))
  }

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    if (!incoming.length) return

    setError(null)
    setEntries((current) => {
      const known = new Set(current.map((entry) => fileKey(entry.file)))
      const room = Math.max(0, MAX_FILES - current.length)
      const next = incoming
        .filter((file) => !known.has(fileKey(file)))
        .slice(0, room)
        .map<QueueEntry>((file) => ({
          id: crypto.randomUUID(),
          file,
          status: file.size > MAX_FILE_SIZE ? 'failed' : 'ready',
          detail: file.size > MAX_FILE_SIZE ? 'Larger than the 25 MB limit' : undefined,
        }))

      if (incoming.length > room) {
        setError(`Add up to ${MAX_FILES} files at a time. The first ${room} new files were added.`)
      }
      return [...current, ...next]
    })
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id))
  }

  async function importEntry(entry: QueueEntry): Promise<ImportedEntry | null> {
    const supabase = createClient()
    updateEntry(entry.id, { status: 'preparing', detail: 'Checking for duplicates' })
    const contentHash = await hashUpload(entry.file)
    const path = `${homeId}/${crypto.randomUUID()}-${safeStorageName(entry.file.name)}`

    updateEntry(entry.id, { status: 'uploading', detail: 'Saving the original file' })
    const { error: storageError } = await supabase.storage.from('home-files').upload(path, entry.file)
    if (storageError) {
      updateEntry(entry.id, { status: 'failed', detail: storageError.message })
      return null
    }

    const type = guessUploadType(entry.file)
    const result = await recordUpload({
      name: entry.file.name.replace(/\.[^.]+$/, '') || entry.file.name,
      type,
      storagePath: path,
      contentHash,
    })

    if (result.duplicate) {
      void supabase.storage.from('home-files').remove([path])
      updateEntry(entry.id, { status: 'duplicate', detail: 'Already in your Library' })
      return null
    }
    if (result.error || !result.fileId) {
      void supabase.storage.from('home-files').remove([path])
      updateEntry(entry.id, { status: 'failed', detail: result.error ?? 'Could not create the Library record' })
      return null
    }

    const extractable = type !== 'video'
    updateEntry(entry.id, {
      fileId: result.fileId,
      status: extractable ? 'reading' : 'done',
      detail: extractable ? 'Reading and organizing' : 'Saved to your Library',
    })
    return extractable ? { entryId: entry.id, fileId: result.fileId } : null
  }

  async function startImport() {
    const readyEntries = entries.filter((entry) => entry.status === 'ready')
    if (!readyEntries.length || running) return

    setRunning(true)
    setError(null)
    setDiscoveries([])
    const importedEntries: ImportedEntry[] = []
    let cursor = 0

    async function worker() {
      while (cursor < readyEntries.length) {
        const entry = readyEntries[cursor]
        cursor += 1
        const importedEntry = await importEntry(entry)
        if (importedEntry) importedEntries.push(importedEntry)
      }
    }

    await Promise.all(Array.from({ length: Math.min(3, readyEntries.length) }, () => worker()))
    setRunning(false)

    if (importedEntries.length > 0) {
      const run = monitorRun.current + 1
      monitorRun.current = run
      setMonitoring(true)
      void monitorDiscoveries(importedEntries, run)
    }
  }

  async function monitorDiscoveries(importedEntries: ImportedEntry[], run: number) {
    const supabase = createClient()
    const fileIds = importedEntries.map((entry) => entry.fileId)
    const entryIdByFileId = new Map(importedEntries.map((entry) => [entry.fileId, entry.entryId]))

    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (monitorRun.current !== run) return

      const { data: fileRows } = await supabase
        .from('files')
        .select('id,item_id,extraction_status,name')
        .eq('home_id', homeId)
        .in('id', fileIds)

      const itemIds = [...new Set((fileRows ?? []).map((file) => file.item_id).filter((id): id is string => Boolean(id)))]
      const { data: items } = itemIds.length
        ? await supabase.from('items').select('id,name').eq('home_id', homeId).in('id', itemIds)
        : { data: [] }
      const itemName = new Map((items ?? []).map((item) => [item.id, item.name]))

      for (const row of fileRows ?? []) {
        const queueEntryId = entryIdByFileId.get(row.id)
        if (!queueEntryId) continue
        if (row.extraction_status === 'failed') {
          updateEntry(queueEntryId, { status: 'done', detail: 'Saved; analysis needs another look' })
        } else if (row.extraction_status === 'done') {
          const connectedName = row.item_id ? itemName.get(row.item_id) : null
          updateEntry(queueEntryId, {
            status: 'done',
            detail: connectedName ? `Connected ${connectedName}` : 'Processed and filed',
          })
        }
      }

      const { data: extractions } = await supabase
        .from('extractions')
        .select('id,file_id,doc_type,status')
        .eq('home_id', homeId)
        .in('file_id', fileIds)
      const extractionIds = (extractions ?? []).map((extraction) => extraction.id)
      const [{ data: suggestionRows }, { data: factRows }] = await Promise.all([
        supabase
          .from('suggestions')
          .select('id,summary,provenance,status')
          .eq('home_id', homeId)
          .order('created_at', { ascending: false })
          .limit(100),
        extractionIds.length
          ? supabase
              .from('home_facts')
              .select('id,statement,source_extraction_id')
              .eq('home_id', homeId)
              .eq('is_current', true)
              .in('source_extraction_id', extractionIds)
          : Promise.resolve({ data: [] }),
      ])

      const fileIdSet = new Set(fileIds)
      const nextDiscoveries: Discovery[] = []
      for (const item of items ?? []) {
        nextDiscoveries.push({ id: `item-${item.id}`, title: `Identified ${item.name}`, detail: 'Connected to your home inventory' })
      }
      for (const extraction of extractions ?? []) {
        if (extraction.status === 'done' && extraction.doc_type) {
          nextDiscoveries.push({
            id: `extraction-${extraction.id}`,
            title: `Recognized ${humanize(extraction.doc_type)}`,
            detail: 'The original file remains attached as evidence',
          })
        }
      }
      for (const fact of factRows ?? []) {
        nextDiscoveries.push({ id: `fact-${fact.id}`, title: fact.statement, detail: 'Added as a source-backed home fact' })
      }
      for (const suggestion of suggestionRows ?? []) {
        const provenance = suggestion.provenance && typeof suggestion.provenance === 'object' && !Array.isArray(suggestion.provenance)
          ? suggestion.provenance as Record<string, unknown>
          : {}
        if (fileIdSet.has(String(provenance.file_id ?? ''))) {
          nextDiscoveries.push({
            id: `suggestion-${suggestion.id}`,
            title: suggestion.summary,
            detail: suggestion.status === 'pending' ? 'Ready for your review' : 'Reviewed',
          })
        }
      }
      setDiscoveries(nextDiscoveries.slice(0, 12))

      const stillReading = (fileRows ?? []).length < fileIds.length
        || (fileRows ?? []).some((file) => file.extraction_status === 'pending')
      if (!stillReading) {
        setMonitoring(false)
        return
      }
      await new Promise((resolve) => window.setTimeout(resolve, 2000))
    }

    setEntries((current) => current.map((entry) => entry.status === 'reading'
      ? { ...entry, status: 'done', detail: 'Saved; processing will continue in your Library' }
      : entry))
    setMonitoring(false)
  }

  const readyCount = entries.filter((entry) => entry.status === 'ready').length
  const settledCount = entries.filter((entry) => ['reading', 'done', 'duplicate', 'failed'].includes(entry.status)).length
  const completeCount = entries.filter((entry) => ['done', 'duplicate', 'failed'].includes(entry.status)).length
  const processingCount = entries.filter((entry) => entry.status === 'reading').length
  const progress = entries.length ? Math.round((settledCount / entries.length) * 100) : 0
  const importSettled = entries.length > 0 && !running && readyCount === 0

  return (
    <div className="space-y-7">
      <Link href="/library" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Library
      </Link>

      <header className="max-w-2xl">
        <p className="flex items-center gap-2 text-sm font-medium text-sage-foreground">
          <Sparkles className="size-4" aria-hidden />
          Import Everything
        </p>
        <h1 className="mt-2 text-balance font-serif text-3xl leading-tight tracking-tight sm:text-4xl">Build your Home Library</h1>
        <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
          Add inspection reports, closing documents, warranties, manuals, receipts, quotes, permits, and photos together. GatheredOS will organize each original and surface only discoveries it can trace back to a source.
        </p>
      </header>

      <section
        onDragOver={(event) => {
          event.preventDefault()
          if (!running) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (!running) addFiles(event.dataTransfer.files)
        }}
        className={cn(
          'rounded-2xl border-2 border-dashed px-5 py-9 text-center transition-colors sm:px-8 sm:py-12',
          dragging ? 'border-primary bg-primary/5' : 'border-border bg-card',
        )}
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UploadCloud className="size-7" strokeWidth={1.5} aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Drop files or an entire folder</h2>
        <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">Up to {MAX_FILES} files per batch, 25 MB each.</p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            <FileText className="size-4" aria-hidden />
            Choose files
            <input
              type="file"
              multiple
              accept={ACCEPTED_FILES}
              disabled={running}
              className="sr-only"
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </label>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent/40">
            <FolderUp className="size-4" aria-hidden />
            Choose a folder
            <input
              ref={folderInputRef}
              type="file"
              multiple
              disabled={running}
              className="sr-only"
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </label>
        </div>
      </section>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {entries.length > 0 && (
        <section aria-labelledby="import-queue-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="import-queue-heading" className="text-lg font-semibold">Import queue</h2>
              <p className="mt-1 text-sm text-muted-foreground">{entries.length} file{entries.length === 1 ? '' : 's'} selected</p>
            </div>
            {readyCount > 0 && (
              <button
                type="button"
                onClick={() => void startImport()}
                disabled={running}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {running ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UploadCloud className="size-4" aria-hidden />}
                {running ? `Importing ${settledCount} of ${entries.length}` : `Import ${readyCount} file${readyCount === 1 ? '' : 's'}`}
              </button>
            )}
          </div>

          {(running || settledCount > 0) && (
            <div className="mt-4" role="status" aria-live="polite">
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Import progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div className="h-full rounded-full bg-sage transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{settledCount} of {entries.length} originals saved or checked</p>
            </div>
          )}

          <ul className="mt-4 divide-y divide-border/70 border-y border-border/70">
            {entries.map((entry) => {
              const active = ['preparing', 'uploading', 'reading'].includes(entry.status)
              const success = entry.status === 'done'
              return (
                <li key={entry.id} className="flex min-h-16 items-center gap-3 py-3">
                  <span className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    success ? 'bg-sage/15 text-sage-foreground' : entry.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground',
                  )}>
                    {active ? <Loader2 className="size-4 animate-spin" aria-hidden /> : success ? <Check className="size-4" aria-hidden /> : <FileText className="size-4" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{displayName(entry.file)}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{entry.detail ?? formatSize(entry.file.size)}</span>
                  </span>
                  {!running && ['ready', 'failed'].includes(entry.status) && (
                    <button type="button" onClick={() => removeEntry(entry.id)} aria-label={`Remove ${entry.file.name}`} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground">
                      <X className="size-4" aria-hidden />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {(monitoring || discoveries.length > 0) && (
        <section className="rounded-2xl bg-secondary/35 p-5 sm:p-6" aria-labelledby="discoveries-heading" aria-live="polite">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground">
              {monitoring ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Sparkles className="size-5" aria-hidden />}
            </span>
            <div>
              <h2 id="discoveries-heading" className="text-base font-semibold">What GatheredOS found</h2>
              <p className="mt-1 text-sm text-muted-foreground">New discoveries appear here as each source finishes processing.</p>
            </div>
          </div>
          {discoveries.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">Reading your files and looking for supported home facts…</p>
          ) : (
            <ul className="mt-5 divide-y divide-border/70 border-y border-border/70">
              {discoveries.map((discovery) => (
                <li key={discovery.id} className="flex gap-3 py-3">
                  <FileSearch className="mt-0.5 size-4 shrink-0 text-sage-foreground" aria-hidden />
                  <span>
                    <span className="block text-sm font-medium">{discovery.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{discovery.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {importSettled && (
        <section className="flex flex-col gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold">Your Library is taking shape.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {processingCount > 0
                ? `${settledCount} original${settledCount === 1 ? ' is' : 's are'} secure. ${processingCount} ${processingCount === 1 ? 'is' : 'are'} still being analyzed—you can leave anytime.`
                : `${completeCount} file${completeCount === 1 ? '' : 's'} finished or checked.`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/library" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent/40">
              <FolderOpen className="size-4" aria-hidden />
              Open Library
            </Link>
            <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
              Open dashboard
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
