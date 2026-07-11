'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, ArrowUp, Plus, Loader2, Check, MessageCircle } from 'lucide-react'
import {
  conversations,
  starterQuestions,
  groundingSteps,
  answerFor,
  type Answer,
} from '@/lib/ask-data'
import { AnswerCard } from './answer-card'
import { cn } from '@/lib/utils'

type Message = {
  id: string
  question: string
  answer: Answer | null
}

export function AskExperience() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const latestRef = useRef<HTMLDivElement>(null)
  const scrollSig = useRef('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Align the top of the latest exchange with the top of the viewport — both
  // when the question is asked and when its answer resolves — so the reader
  // always lands at the beginning of the answer, never the bottom of the page.
  // We measure inside rAF so the (tall) answer has laid out before we compute
  // the window scroll position.
  useEffect(() => {
    const last = messages[messages.length - 1]
    const sig = last ? `${last.id}:${last.answer ? 'answer' : 'question'}` : ''
    if (!sig || sig === scrollSig.current) return
    scrollSig.current = sig
    requestAnimationFrame(() => {
      const el = latestRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - 24
      window.scrollTo({ top, behavior: 'smooth' })
    })
  }, [messages])

  function ask(raw: string) {
    const question = raw.trim()
    if (!question || busy) return
    setInput('')
    setBusy(true)
    const id = crypto.randomUUID()
    setMessages((m) => [...m, { id, question, answer: null }])

    // Simulate grounding, then resolve the answer.
    timers.current.push(
      setTimeout(() => {
        const { answer } = answerFor(question)
        setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, answer } : msg)))
        setBusy(false)
      }, 2300),
    )
  }

  function reset() {
    setMessages([])
    setInput('')
    setBusy(false)
  }

  const started = messages.length > 0

  return (
    <div className="relative">
      {!started ? (
        <Landing input={input} setInput={setInput} onAsk={ask} busy={busy} />
      ) : (
        <div className="space-y-8 pb-40">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-4" strokeWidth={2} />
            New conversation
          </button>

          {messages.map((m, i) => (
            <div
              key={m.id}
              ref={i === messages.length - 1 ? latestRef : undefined}
              className="scroll-mt-6 space-y-4"
            >
              {/* User question */}
              <div className="flex justify-end">
                <div className="ob-fade-in max-w-[85%] rounded-3xl rounded-br-lg bg-primary px-5 py-3 text-primary-foreground shadow-sm">
                  <p className="text-pretty text-sm leading-relaxed sm:text-base">{m.question}</p>
                </div>
              </div>

              {/* Answer or thinking */}
              {m.answer ? (
                <div className="ob-fade-in">
                  <AnswerCard answer={m.answer} onFollowup={ask} />
                </div>
              ) : (
                <Thinking />
              )}
            </div>
          ))}

          {/* Sticky composer */}
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/90 backdrop-blur-md lg:left-60">
            <div className="mx-auto max-w-5xl px-5 py-4 sm:px-8 lg:px-12">
              <Composer input={input} setInput={setInput} onAsk={ask} busy={busy} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Landing({
  input,
  setInput,
  onAsk,
  busy,
}: {
  input: string
  setInput: (v: string) => void
  onAsk: (q: string) => void
  busy: boolean
}) {
  return (
    // Conversation-first: a tall, quiet canvas centered like sitting down with
    // an expert. No cards, no dashboard — just the invitation to ask.
    <div className="flex min-h-[calc(100svh-9rem)] flex-col items-center justify-center py-8">
      <section className="flex w-full max-w-2xl flex-col items-center text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-6 text-balance font-serif text-4xl tracking-tight sm:text-5xl">
          What would you like to know?
        </h1>
        <p className="mt-3 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
          Ask about anything in your home. HomeOS answers from your own documents, history, and the
          things your household knows.
        </p>

        <div className="mt-8 w-full">
          <Composer input={input} setInput={setInput} onAsk={onAsk} busy={busy} />
        </div>

        {/* Suggested questions — plain, quiet chips */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {starterQuestions.map(({ text, icon: Icon }) => (
            <button
              key={text}
              type="button"
              onClick={() => onAsk(text)}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-sage/40 hover:bg-accent/40"
            >
              <Icon className="size-4 text-sage-foreground" strokeWidth={2} />
              {text}
            </button>
          ))}
        </div>
      </section>

      {/* Recent conversations — a quiet text list, never a grid of cards */}
      <section className="mt-14 w-full max-w-2xl">
        <h2 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recent conversations
        </h2>
        <ul className="divide-y divide-border/60">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onAsk(c.question)}
                className="group flex w-full items-center gap-3 py-3 text-left transition-colors"
              >
                <MessageCircle
                  className="size-4 shrink-0 text-muted-foreground/60"
                  strokeWidth={2}
                />
                <span className="flex-1 truncate text-sm text-foreground transition-colors group-hover:text-primary">
                  {c.question}
                </span>
                <ArrowUp
                  className="size-3.5 shrink-0 rotate-45 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground"
                  strokeWidth={2}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Composer({
  input,
  setInput,
  onAsk,
  busy,
  compact = false,
}: {
  input: string
  setInput: (v: string) => void
  onAsk: (q: string) => void
  busy: boolean
  compact?: boolean
}) {
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      onAsk(input)
    }
  }

  return (
    <div className="relative flex items-end gap-2 rounded-[1.75rem] border border-border bg-card p-2 pl-5 shadow-md focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={compact ? 'Ask a follow-up about your home...' : 'Ask about your home...'}
        className={cn(
          'flex-1 resize-none bg-transparent py-2.5 text-foreground outline-none placeholder:text-muted-foreground',
          compact ? 'text-sm' : 'text-base sm:text-lg',
        )}
      />
      <button
        type="button"
        onClick={() => onAsk(input)}
        disabled={busy || !input.trim()}
        aria-label="Ask HomeOS"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40',
          compact ? 'size-10' : 'size-11',
        )}
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" strokeWidth={2} />
        ) : (
          <ArrowUp className="size-5" strokeWidth={2.5} />
        )}
      </button>
    </div>
  )
}

function Thinking() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 1; i < groundingSteps.length; i++) {
      timers.push(setTimeout(() => setStep(i), i * 520))
    }
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="ob-fade-in overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-3.5 sm:px-7">
        <span className="flex size-7 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="ob-pulse-soft size-4" strokeWidth={2} />
        </span>
        <p className="text-sm font-medium">HomeOS is thinking</p>
      </div>
      <ul className="space-y-2.5 px-5 py-5 sm:px-7">
        {groundingSteps.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <li
              key={s}
              className={cn(
                'flex items-center gap-2.5 text-sm transition-opacity',
                i > step && 'opacity-40',
              )}
            >
              {done ? (
                <Check className="size-4 shrink-0 text-sage-foreground" strokeWidth={2.5} />
              ) : active ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-primary" strokeWidth={2} />
              ) : (
                <span className="size-4 shrink-0 rounded-full border border-border" />
              )}
              <span className={cn(done ? 'text-muted-foreground' : 'text-foreground')}>{s}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
