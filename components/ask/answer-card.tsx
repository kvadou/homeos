'use client'

import { useState } from 'react'
import {
  Sparkles,
  CornerDownRight,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  Lightbulb,
  ArrowUpRight,
  Copy,
  Check,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Eye,
  History,
} from 'lucide-react'
import {
  type Answer,
  type Source,
  getNarrative,
  getSections,
  getConfidence,
  getActions,
} from '@/lib/ask-data'
import { AnswerBlockView } from './answer-blocks'
import { SourceViewer } from './source-viewer'
import { cn } from '@/lib/utils'

const sourceTint: Record<string, string> = {
  sage: 'bg-sage/15 text-sage-foreground',
  navy: 'bg-primary/10 text-primary',
  wood: 'bg-wood/20 text-wood-foreground',
}

const confidenceStyle = {
  high: { label: 'High confidence', cls: 'bg-sage/15 text-sage-foreground', Icon: ShieldCheck },
  medium: { label: 'Medium confidence', cls: 'bg-wood/20 text-wood-foreground', Icon: ShieldAlert },
  low: { label: 'Still learning', cls: 'bg-secondary text-muted-foreground', Icon: ShieldAlert },
}

export function AnswerCard({
  answer,
  onFollowup,
}: {
  answer: Answer
  onFollowup: (q: string) => void
}) {
  const [openSource, setOpenSource] = useState<Source | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [rating, setRating] = useState<'up' | 'down' | null>(null)

  const narrative = getNarrative(answer)
  const sections = getSections(answer)
  const confidence = getConfidence(answer)
  const actions = getActions(answer)
  const conf = confidenceStyle[confidence.level]

  function copyAnswer() {
    const text = [...narrative, ...confidence.basis].join('\n')
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      {/* Header — signals synthesized intelligence, not a search hit */}
      <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-3.5 sm:px-7">
        <span className="flex size-7 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="size-4" strokeWidth={2} />
        </span>
        <p className="text-sm font-medium">HomeOS</p>
        <div className="ml-auto flex items-center gap-1">
          <IconButton label={copied ? 'Copied' : 'Copy answer'} onClick={copyAnswer}>
            {copied ? (
              <Check className="size-4 text-sage-foreground" strokeWidth={2.5} />
            ) : (
              <Copy className="size-4" strokeWidth={2} />
            )}
          </IconButton>
          <IconButton
            label={saved ? 'Saved' : 'Save answer'}
            onClick={() => setSaved((s) => !s)}
            active={saved}
          >
            <Bookmark
              className={cn('size-4', saved && 'fill-current text-primary')}
              strokeWidth={2}
            />
          </IconButton>
        </div>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-7 sm:py-7">
        {/* 1. Conversational narrative */}
        {narrative.length > 0 && (
          <div className="ob-stagger space-y-3">
            {narrative.map((p, i) => (
              <p
                key={i}
                className={cn(
                  'text-pretty leading-relaxed',
                  i === 0
                    ? 'font-serif text-xl tracking-tight text-foreground sm:text-2xl'
                    : 'text-sm text-muted-foreground sm:text-[0.95rem]',
                )}
              >
                {p}
              </p>
            ))}
            {answer.memory && (
              <p className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <History className="size-3.5 shrink-0 text-sage-foreground" strokeWidth={2} />
                {answer.memory}
              </p>
            )}
          </div>
        )}

        {/* 2. What HomeOS noticed — cross-record insights */}
        {answer.noticed && answer.noticed.length > 0 && (
          <div className="rounded-2xl border border-sage/25 bg-sage/[0.07] p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-sage-foreground">
              <Eye className="size-4" strokeWidth={2} />
              What HomeOS noticed
            </p>
            <ul className="ob-stagger mt-3 space-y-2.5">
              {answer.noticed.map((n) => (
                <li key={n} className="flex items-start gap-2.5 text-sm leading-relaxed">
                  <Sparkles
                    className="mt-0.5 size-4 shrink-0 text-sage-foreground"
                    strokeWidth={2}
                  />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Why HomeOS knows this — auditable evidence, not a generic badge */}
        <div className="rounded-2xl border border-border/60 bg-secondary/30 p-5">
          <div className="flex items-center gap-2">
            <conf.Icon className="size-4 text-primary" strokeWidth={2} />
            <p className="text-sm font-medium">Why HomeOS knows this</p>
            <span
              className={cn(
                'ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium',
                conf.cls,
              )}
            >
              {conf.label}
            </span>
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {confidence.basis.map((b) => (
              <li
                key={b}
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs"
              >
                <Check className="size-3.5 shrink-0 text-sage-foreground" strokeWidth={3} />
                <span className="text-foreground">{b}</span>
              </li>
            ))}
          </ul>
          {confidence.note && (
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{confidence.note}</p>
          )}
        </div>

        {/* 4. Structured sections */}
        {sections.map((section, i) => (
          <Section key={section.label + i} label={section.label} section={section} />
        ))}

        {/* 4. Why I'm recommending this */}
        {answer.reasoning && answer.reasoning.length > 0 && (
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Lightbulb className="size-4" strokeWidth={2} />
              Why I&apos;m recommending this
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Here&apos;s the reasoning behind that:
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {answer.reasoning.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-sm leading-relaxed">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. Sources — interactive citations */}
        {answer.sources.length > 0 && (
          <div>
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Based on {answer.sources.length} sources in your home
            </p>
            <div className="flex flex-wrap gap-2">
              {answer.sources.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setOpenSource(s)}
                    className="group flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2 text-left shadow-sm transition-colors hover:border-sage/40 hover:bg-accent/40"
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-lg',
                        sourceTint[s.tint],
                      )}
                    >
                      <Icon className="size-3.5" strokeWidth={2} />
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span className="text-xs font-medium">{s.label}</span>
                      <span className="text-[11px] text-muted-foreground">{s.kind}</span>
                    </span>
                    <ArrowUpRight
                      className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Tap any source to see the original record.
            </p>
          </div>
        )}

        {/* 6. Actions */}
        {actions.length > 0 && (
          <div>
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              What you can do
            </p>
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => {
                const Icon = a.icon
                return (
                  <button
                    key={a.label}
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm transition-colors',
                      a.variant === 'primary'
                        ? 'bg-primary text-primary-foreground hover:opacity-90'
                        : 'border border-border bg-card hover:bg-accent/40',
                    )}
                  >
                    <Icon className="size-4" strokeWidth={2} />
                    {a.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Follow-up questions */}
      {answer.followups.length > 0 && (
        <div className="border-t border-border/60 bg-secondary/20 px-5 py-5 sm:px-7">
          <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Suggested next questions
          </p>
          <div className="flex flex-col gap-2">
            {answer.followups.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onFollowup(q)}
                className="group flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card px-4 py-3 text-left text-sm font-medium shadow-sm transition-colors hover:border-sage/40 hover:bg-accent/40"
              >
                <CornerDownRight className="size-4 shrink-0 text-sage-foreground" strokeWidth={2} />
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Was this helpful? */}
      <div className="flex items-center gap-3 border-t border-border/60 px-5 py-3.5 sm:px-7">
        <span className="text-xs text-muted-foreground">
          {rating ? 'Thanks — I\u2019ll keep learning your home.' : 'Was this helpful?'}
        </span>
        {!rating && (
          <div className="ml-auto flex items-center gap-1">
            <IconButton label="Helpful" onClick={() => setRating('up')}>
              <ThumbsUp className="size-4" strokeWidth={2} />
            </IconButton>
            <IconButton label="Not helpful" onClick={() => setRating('down')}>
              <ThumbsDown className="size-4" strokeWidth={2} />
            </IconButton>
          </div>
        )}
      </div>

      <SourceViewer source={openSource} onClose={() => setOpenSource(null)} />
    </div>
  )
}

function Section({ label, section }: { label: string; section: ReturnType<typeof getSections>[number] }) {
  const [open, setOpen] = useState(!section.defaultCollapsed)

  return (
    <section>
      <button
        type="button"
        onClick={() => section.collapsible && setOpen((o) => !o)}
        className={cn(
          'mb-2.5 flex w-full items-center gap-2',
          section.collapsible ? 'cursor-pointer' : 'cursor-default',
        )}
        aria-expanded={section.collapsible ? open : undefined}
      >
        <span className="h-px flex-1 bg-border/60" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {section.collapsible ? (
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
            strokeWidth={2}
          />
        ) : (
          <span className="h-px flex-1 bg-border/60" />
        )}
      </button>
      {open && (
        <div className="space-y-4">
          {section.blocks.map((block, i) => (
            <AnswerBlockView key={i} block={block} />
          ))}
        </div>
      )}
    </section>
  )
}

function IconButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
        active && 'text-primary',
      )}
    >
      {children}
    </button>
  )
}
