'use client'

import { useState, useRef, useEffect } from 'react'
import { UploadCloud, Camera, Sparkles, Check, Loader2, FileText } from 'lucide-react'
import { useOnboarding } from '../onboarding-provider'
import { StepFrame } from '../step-frame'
import { uploadExamples } from '@/lib/onboarding'
import { cn } from '@/lib/utils'

/* Each document reveals a short sequence of "understanding" lines, one by one,
   so the intelligence of HomeOS is visible rather than instant. */
type Added = {
  id: number
  name: string
  steps: string[]
  revealed: number
  tags: { label: string; value: string }[]
}

const sampleExtractions: Record<
  string,
  { steps: string[]; tags: { label: string; value: string }[] }
> = {
  'Roof warranty': {
    steps: [
      'Reading',
      'Understanding',
      'Found roof warranty · GAF',
      'Coverage: 25 years · Summit Roofing',
      'Linking to your Roof system',
      'Setting a renewal reminder',
    ],
    tags: [
      { label: 'System', value: 'Roof' },
      { label: 'Manufacturer', value: 'GAF' },
      { label: 'Warranty', value: '25 years' },
      { label: 'Contractor', value: 'Summit Roofing' },
    ],
  },
  'Furnace manual': {
    steps: [
      'Reading',
      'Understanding',
      'Found HVAC manual',
      'Manufacturer: Carrier · installed 2018',
      'Linking to your HVAC system',
      'Creating maintenance reminders',
    ],
    tags: [
      { label: 'System', value: 'HVAC' },
      { label: 'Manufacturer', value: 'Carrier' },
      { label: 'Installed', value: '2018' },
      { label: 'Warranty', value: 'Until 2028' },
    ],
  },
  'Water-shutoff photo': {
    steps: [
      'Looking at photo',
      'Recognized a shutoff valve',
      'Location: Basement',
      'Linked to Plumbing',
      'Saved to household knowledge',
    ],
    tags: [
      { label: 'Type', value: 'Location photo' },
      { label: 'System', value: 'Plumbing' },
      { label: 'Room', value: 'Basement' },
    ],
  },
  'Paint label': {
    steps: [
      'Reading label',
      'Identified paint color',
      'Color: SW 7036',
      'Matched to Living Room',
      'Saved to your paint library',
    ],
    tags: [
      { label: 'Type', value: 'Paint' },
      { label: 'Color', value: 'SW 7036' },
      { label: 'Room', value: 'Living Room' },
    ],
  },
  'Sprinkler walkthrough video': {
    steps: [
      'Processing video',
      'Detected irrigation walkthrough',
      'Topic: Winterizing',
      'Linked to Irrigation',
      'Saved as a how-to',
    ],
    tags: [
      { label: 'Type', value: 'How-to video' },
      { label: 'System', value: 'Irrigation' },
      { label: 'Project', value: 'Winterizing' },
    ],
  },
}

const fallback = {
  steps: ['Reading', 'Understanding', 'Organizing', 'Filed to your library'],
  tags: [{ label: 'Type', value: 'Document' }],
}

export function StepUpload() {
  const { data, update } = useOnboarding()
  const [added, setAdded] = useState<Added[]>([])
  const [dragging, setDragging] = useState(false)
  const idRef = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function add(name: string) {
    const id = ++idRef.current
    const config = sampleExtractions[name] ?? fallback
    setAdded((a) => [{ id, name, steps: config.steps, revealed: 1, tags: config.tags }, ...a])
    update({ uploads: [...data.uploads, { name, kind: 'document' }] })

    // Reveal each understanding line one at a time.
    for (let i = 2; i <= config.steps.length; i++) {
      timers.current.push(
        setTimeout(
          () => setAdded((a) => a.map((x) => (x.id === id ? { ...x, revealed: i } : x))),
          i * 650,
        ),
      )
    }
  }

  return (
    <StepFrame
      title="Help your home remember."
      description="Add anything you already have. Watch HomeOS read it, understand it, and file it for you — no typing required."
    >
      <div className="space-y-6">
        <div
          role="button"
          tabIndex={0}
          onClick={() => add('Roof warranty')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && add('Roof warranty')}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            add('Roof warranty')
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-8 text-center transition-colors sm:p-10',
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-sage/50 hover:bg-accent/30',
          )}
        >
          <span className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <UploadCloud className="size-7" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm font-medium">Drag &amp; drop, or click to add</p>
            <p className="mt-1 text-xs text-muted-foreground">PDFs, photos, receipts, manuals</p>
          </div>
          <span className="mt-1 inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3.5 py-2 text-xs font-medium text-muted-foreground">
            <Camera className="size-4" strokeWidth={2} />
            On mobile, snap a photo to capture instantly
          </span>
        </div>

        {/* Examples */}
        <div>
          <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Try an example
          </p>
          <div className="flex flex-wrap gap-2">
            {uploadExamples.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => add(label)}
                className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-3.5 py-2 text-sm font-medium transition-colors hover:border-sage/40 hover:bg-accent/40"
              >
                <Icon className="size-4 text-sage-foreground" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Organized results */}
        {added.length > 0 && (
          <div className="space-y-3">
            {added.map((item) => {
              const done = item.revealed >= item.steps.length
              return (
                <div
                  key={item.id}
                  className={cn(
                    'ob-fly-in rounded-3xl border bg-card p-5 shadow-sm transition-colors',
                    done ? 'ob-glow border-sage/30' : 'border-border/70',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors',
                        done ? 'bg-sage/20 text-sage-foreground' : 'bg-navy/10 text-primary',
                      )}
                    >
                      {done ? (
                        <Check className="ob-check-pop size-5" strokeWidth={2.5} />
                      ) : (
                        <Loader2 className="size-5 animate-spin" strokeWidth={2} />
                      )}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {done ? (
                          <>
                            <Sparkles className="size-3.5 text-sage-foreground" strokeWidth={2} />
                            Understood and filed automatically
                          </>
                        ) : (
                          'HomeOS is reading this…'
                        )}
                      </p>
                    </div>
                    <FileText className="size-5 text-muted-foreground" strokeWidth={1.75} />
                  </div>

                  {/* Progressive understanding lines */}
                  <ul className="mt-4 space-y-2 border-t border-border/60 pt-4">
                    {item.steps.slice(0, item.revealed).map((line, idx) => {
                      const isLatest = idx === item.revealed - 1
                      const lineDone = idx < item.revealed - 1 || done
                      return (
                        <li
                          key={line}
                          className="ob-fade-in flex items-center gap-2.5 text-sm"
                        >
                          {lineDone ? (
                            <Check
                              className="size-4 shrink-0 text-sage-foreground"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <Loader2
                              className="size-4 shrink-0 animate-spin text-primary"
                              strokeWidth={2}
                            />
                          )}
                          <span
                            className={cn(
                              lineDone ? 'text-foreground' : 'text-muted-foreground',
                              isLatest && !done && 'text-foreground',
                            )}
                          >
                            {line}
                          </span>
                        </li>
                      )
                    })}
                  </ul>

                  {done && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.tags.map((t) => (
                        <span
                          key={t.label}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-2.5 py-1.5 text-xs"
                        >
                          <span className="text-muted-foreground">{t.label}:</span>
                          <span className="font-medium">{t.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <p className="text-center text-xs text-muted-foreground">
              Everything you add makes HomeOS smarter. You can always add more later.
            </p>
          </div>
        )}
      </div>
    </StepFrame>
  )
}
