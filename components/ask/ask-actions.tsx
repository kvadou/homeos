'use client'

import { useState, useTransition } from 'react'
import { CalendarPlus, Check, Hammer, Loader2, Save, X } from 'lucide-react'
import { createAskAction, type AskActionKind } from '@/lib/actions/ask-actions'

const choices: { kind: AskActionKind; label: string; icon: typeof Save }[] = [
  { kind: 'task', label: 'Schedule task', icon: CalendarPlus },
  { kind: 'project', label: 'Save as project', icon: Hammer },
  { kind: 'fact', label: 'Remember this', icon: Save },
]

export function AskActions({ question, answer }: { question: string; answer: string }) {
  const [kind, setKind] = useState<AskActionKind | null>(null)
  const [title, setTitle] = useState(question.replace(/[?!.]+$/, '').slice(0, 120))
  const [detail, setDetail] = useState(answer.slice(0, 2000))
  const [dueOn, setDueOn] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<AskActionKind | null>(null)
  const [pending, startTransition] = useTransition()

  function open(value: AskActionKind) {
    setKind(value)
    setError(null)
    setTitle(value === 'fact' ? (answer.split(/\n|(?<=[.!?])\s/)[0] || question).slice(0, 180) : question.replace(/[?!.]+$/, '').slice(0, 120))
  }

  function submit() {
    if (!kind) return
    setError(null)
    startTransition(async () => {
      const result = await createAskAction({ kind, title, detail, dueOn: kind === 'task' ? dueOn : undefined })
      if (result.error) setError(result.error)
      else { setSaved(kind); setKind(null) }
    })
  }

  if (saved) return <div className="border-t border-border/60 bg-sage/[0.06] px-5 py-4 sm:px-7"><p className="flex items-center gap-2 text-sm font-medium text-sage-foreground"><Check className="size-4" />{saved === 'task' ? 'Task scheduled' : saved === 'project' ? 'Project idea saved' : 'Added to your home memory'}</p></div>

  return <div className="border-t border-border/60 bg-secondary/10 px-5 py-4 sm:px-7">
    {!kind ? <div><p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Take action</p><div className="flex flex-wrap gap-2">{choices.map(({ kind: value, label, icon: Icon }) => <button key={value} type="button" onClick={() => open(value)} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm hover:bg-accent/40"><Icon className="size-3.5 text-sage-foreground" />{label}</button>)}</div></div> :
      <div className="space-y-3">
        <div className="flex items-center justify-between"><p className="text-sm font-medium">{choices.find((c) => c.kind === kind)?.label}</p><button type="button" onClick={() => setKind(null)} aria-label="Cancel action" className="text-muted-foreground"><X className="size-4" /></button></div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/15" />
        {kind !== 'fact' && <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} placeholder="Details" className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/15" />}
        {kind === 'task' && <input type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm" />}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button type="button" onClick={submit} disabled={pending || !title.trim()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">{pending && <Loader2 className="size-3.5 animate-spin" />}Save</button>
      </div>}
  </div>
}
