'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clock, Star, CalendarCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type WeekTask } from '@/lib/care-data'
import { completeTask } from '@/lib/actions/care'

export function ThisWeek({ tasks }: { tasks: WeekTask[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const completed = Object.values(done).filter(Boolean).length

  const toggle = (id: string) => {
    const nowDone = !done[id]
    setDone((p) => ({ ...p, [id]: nowDone }))
    if (nowDone) startTransition(async () => {
      const result = await completeTask(id)
      if ('error' in result && result.error) {
        setDone((p) => ({ ...p, [id]: false }))
        setError(result.error)
        return
      }
      setError(null)
      router.refresh()
    })
  }

  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground">
            <CalendarCheck className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="font-serif text-xl tracking-tight">Today&apos;s Priorities</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              What GatheredOS would focus on next, in order
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-muted-foreground tabular-nums">
          {completed}/{tasks.length}
        </span>
      </div>

      <ul className="mt-5 flex flex-col gap-2.5">
        {tasks.map((task) => {
          const isDone = !!done[task.id]
          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => toggle(task.id)}
                disabled={pending && !isDone}
                className={cn(
                  'flex w-full items-start gap-3.5 rounded-2xl border px-4 py-4 text-left transition-colors',
                  isDone
                    ? 'border-transparent bg-muted/60'
                    : 'border-border/70 bg-card hover:border-sage/40 hover:bg-accent/40',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isDone ? 'border-sage bg-sage text-primary-foreground' : 'border-border',
                  )}
                >
                  {isDone && <Check className="size-3.5" strokeWidth={3} />}
                </span>

                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {task.priority === 'highest' && !isDone && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-wood/20 px-2 py-0.5 text-[11px] font-medium text-wood-foreground">
                        <Star className="size-3 fill-current" strokeWidth={2} />
                        Start here
                      </span>
                    )}
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {task.system}
                    </span>
                  </span>

                  <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isDone && 'text-muted-foreground line-through',
                      )}
                    >
                      {task.title}
                    </span>
                    {task.time && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" strokeWidth={2} />
                        {task.time}
                      </span>
                    )}
                  </span>

                  {task.why && (
                    <span
                      className={cn(
                        'mt-1.5 block text-xs leading-relaxed text-muted-foreground',
                        isDone && 'line-through',
                      )}
                    >
                      {task.why}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {error && <p role="alert" className="mt-3 text-sm text-destructive">Could not save that completion: {error}</p>}

      {tasks.length > 0 && completed === tasks.length && (
        <p className="mt-4 rounded-2xl bg-sage/[0.08] px-4 py-3 text-center text-sm font-medium text-sage-foreground">
          That&apos;s every priority handled. Nicely done — your home thanks you.
        </p>
      )}
    </section>
  )
}
