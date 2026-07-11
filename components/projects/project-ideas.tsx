import { Lightbulb, Plus, ArrowRight } from 'lucide-react'
import { ideas } from '@/lib/projects-data'
import { CareSection } from '@/components/care/care-section'

export function ProjectIdeas() {
  return (
    <CareSection
      icon={<Lightbulb className="size-5" strokeWidth={1.75} />}
      title="Ideas"
      subtitle="A parking lot for inspiration you're saving for someday"
      collapsible
      defaultOpen={false}
      accessory={
        <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {ideas.length} saved
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className="group flex flex-col rounded-2xl border border-border/60 bg-secondary/20 p-4 transition-colors hover:border-wood/40 hover:bg-card"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-wood/20 text-wood-foreground">
                <idea.icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{idea.title}</p>
                <p className="text-xs text-muted-foreground">
                  {idea.category} · <span className="tabular-nums">~{idea.roughCost}</span>
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{idea.note}</p>

            <button
              type="button"
              className="mt-3 flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-xs font-medium text-wood-foreground transition-colors hover:bg-wood/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Convert to project
              <ArrowRight
                className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.25}
              />
            </button>
          </div>
        ))}

        {/* Add idea */}
        <button
          type="button"
          className="flex min-h-[7rem] items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-transparent p-4 text-sm font-medium text-muted-foreground transition-colors hover:border-wood/50 hover:bg-wood/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          Add an idea
        </button>
      </div>
    </CareSection>
  )
}
