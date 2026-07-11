'use client'

import { useState } from 'react'
import { Check, Clock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type Task = {
  id: string
  title: string
  time: string
  why: string
  highlight?: boolean
  done: boolean
}

const initial: Task[] = [
  {
    id: '1',
    title: 'Replace HVAC filter',
    time: '15 min',
    why: 'Could improve HVAC efficiency by up to 8% and lower this month\u2019s energy bill.',
    highlight: true,
    done: false,
  },
  {
    id: '2',
    title: 'Inspect the deck',
    time: '20 min',
    why: 'Catching loose boards now avoids an estimated $1,200 repair before winter.',
    done: false,
  },
  {
    id: '3',
    title: 'Test smoke & CO detectors',
    time: '10 min',
    why: 'Keeps your family safe and satisfies most home insurance requirements.',
    done: false,
  },
]

export function WeekendPriorities() {
  const [tasks, setTasks] = useState(initial)
  const completed = tasks.filter((t) => t.done).length

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl tracking-tight">This Weekend</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Prioritized by what matters most for your home
          </p>
        </div>
        <span className="text-sm font-medium text-muted-foreground tabular-nums">
          {completed}/{tasks.length}
        </span>
      </div>

      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => toggle(task.id)}
              className={cn(
                'flex w-full items-start gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-colors',
                task.done
                  ? 'border-transparent bg-muted/60'
                  : 'border-border/70 bg-card hover:border-sage/40 hover:bg-accent/40',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  task.done ? 'border-sage bg-sage text-primary-foreground' : 'border-border',
                )}
              >
                {task.done && <Check className="size-3.5" strokeWidth={3} />}
              </span>

              <span className="flex-1">
                {task.highlight && !task.done && (
                  <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-wood/20 px-2 py-0.5 text-[11px] font-medium text-wood-foreground">
                    <Star className="size-3 fill-current" strokeWidth={2} />
                    Highest impact
                  </span>
                )}
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors',
                      task.done && 'text-muted-foreground line-through',
                    )}
                  >
                    {task.title}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" strokeWidth={2} />
                    {task.time}
                  </span>
                </span>
                <span
                  className={cn(
                    'mt-1 block text-xs leading-relaxed text-muted-foreground',
                    task.done && 'line-through',
                  )}
                >
                  {task.why}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
