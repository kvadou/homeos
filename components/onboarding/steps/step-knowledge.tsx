'use client'

import { useOnboarding } from '../onboarding-provider'
import { StepFrame } from '../step-frame'
import { knowledgePrompts, captureMethods } from '@/lib/onboarding'
import { Check, Heart, Camera, Droplet, Flame, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StepKnowledge() {
  const { data, update } = useOnboarding()

  const captured = (key: string) => data.knowledge.find((k) => k.key === key)

  function capture(key: string, method: string) {
    const existing = captured(key)
    if (existing && existing.method === method) {
      update({ knowledge: data.knowledge.filter((k) => k.key !== key) })
      return
    }
    update({
      knowledge: [...data.knowledge.filter((k) => k.key !== key), { key, method }],
    })
  }

  const methodLabel = (m: string) => captureMethods.find((c) => c.key === m)?.label ?? m

  return (
    <StepFrame
      title="Help your home remember."
      description="Capture the little things that usually live in one person’s memory — so they’re never lost. Even one is a great start, and you can always add more later."
    >
      <div className="space-y-3">
        {/* Completed examples so it's instantly clear what "home knowledge" means. */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Here&rsquo;s what others remember
          </p>
          <div className="space-y-2.5">
            <div className="rounded-3xl border border-sage/40 bg-accent/40 p-5 shadow-sm">
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sage/20 text-sage-foreground">
                  <Droplet className="size-5" strokeWidth={1.75} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">
                    Where is the main water shutoff?
                  </p>
                  <div className="mt-2.5 flex items-start gap-2 rounded-2xl bg-card/70 p-3">
                    <Camera
                      className="mt-0.5 size-4 shrink-0 text-sage-foreground"
                      strokeWidth={2}
                    />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Basement, north wall behind the shelving.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-sage/40 bg-accent/40 p-5 shadow-sm">
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sage/20 text-sage-foreground">
                  <Flame className="size-5" strokeWidth={1.75} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">Who services the furnace?</p>
                  <div className="mt-2.5 flex items-center gap-2 rounded-2xl bg-card/70 p-3">
                    <Phone className="size-4 shrink-0 text-sage-foreground" strokeWidth={2} />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      ABC Heating &middot; 612-555-1212
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Now, a few for your home
        </p>

        {knowledgePrompts.map(({ key, prompt, icon: Icon }) => {
          const done = captured(key)
          return (
            <div
              key={key}
              className={cn(
                'rounded-3xl border p-5 shadow-sm transition-colors',
                done ? 'border-sage/40 bg-accent/40' : 'border-border/70 bg-card',
              )}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-2xl transition-colors',
                    done ? 'bg-sage/20 text-sage-foreground' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">{prompt}</p>

                  {done ? (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-sage-foreground">
                      <Check className="size-3.5" strokeWidth={2.5} />
                      Saved as a {methodLabel(done.method).toLowerCase()}
                      <button
                        type="button"
                        onClick={() => update({ knowledge: data.knowledge.filter((k) => k.key !== key) })}
                        className="ml-1 text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Undo
                      </button>
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {captureMethods.map(({ key: mKey, label, icon: MIcon }) => (
                        <button
                          key={mKey}
                          type="button"
                          onClick={() => capture(key, mKey)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-sage/40 hover:bg-accent/40"
                        >
                          <MIcon className="size-3.5" strokeWidth={2} />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-muted-foreground">
          <Heart className="size-3.5 text-sage-foreground" strokeWidth={2} />
          This is how a home&rsquo;s story stays with it, even as people come and go.
        </p>
      </div>
    </StepFrame>
  )
}
