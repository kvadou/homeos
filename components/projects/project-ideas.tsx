import { Lightbulb } from 'lucide-react'
import { iconFor, type Idea } from '@/lib/projects-data'
import { CareSection } from '@/components/care/care-section'
import { AddIdeaButton } from './add-idea-button'
import { ConvertIdeaButton } from './convert-idea-button'

export function ProjectIdeas({ ideas }: { ideas: Idea[] }) {
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
        {ideas.map((idea) => {
          const Icon = iconFor(idea.icon)
          return (
          <div
            key={idea.id}
            className="group flex flex-col rounded-2xl border border-border/60 bg-secondary/20 p-4 transition-colors hover:border-wood/40 hover:bg-card"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-wood/20 text-wood-foreground">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{idea.title}</p>
                <p className="text-xs text-muted-foreground">
                  {idea.category} · <span className="tabular-nums">~{idea.roughCost}</span>
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{idea.note}</p>

            <ConvertIdeaButton id={idea.id} />
          </div>
          )
        })}

        {/* Add idea */}
        <AddIdeaButton />
      </div>
    </CareSection>
  )
}
