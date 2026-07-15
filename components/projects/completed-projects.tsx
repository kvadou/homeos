import { PartyPopper, FileText, HardHat, TrendingUp } from 'lucide-react'
import type { CompletedProject } from '@/lib/projects-data'
import { CareSection } from '@/components/care/care-section'

export function CompletedProjects({
  projects,
  count,
  investedShort,
  valueAddedShort,
}: {
  projects: CompletedProject[]
  count: number
  investedShort: string
  valueAddedShort: string
}) {
  return (
    <CareSection
      icon={<PartyPopper className="size-5" strokeWidth={1.75} />}
      iconTint="wood"
      title="Look What You've Accomplished"
      subtitle="Every project you've brought to life in this home"
      collapsible
      defaultOpen={false}
      accessory={
        <span className="rounded-full border border-wood/30 bg-wood/[0.12] px-3 py-1.5 text-xs font-medium text-wood-foreground">
          {count} completed
        </span>
      }
    >
      {/* Celebration banner — reframes finished work as achievements */}
      <div className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-wood/25 bg-wood/[0.08] p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-wood/25 text-wood-foreground">
            <PartyPopper className="size-5.5" strokeWidth={1.75} />
          </span>
          <p className="text-pretty text-sm leading-relaxed text-foreground">
            You&apos;ve completed{' '}
            <span className="font-semibold">
              {count} project{count === 1 ? '' : 's'}
            </span>{' '}
            — real, lasting transformations of your home.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="font-serif text-2xl leading-none tracking-tight tabular-nums">
              {investedShort}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Invested</p>
          </div>
          <div>
            <p className="font-serif text-2xl leading-none tracking-tight tabular-nums text-sage-foreground">
              {valueAddedShort}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Est. value added</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <article
            key={p.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-secondary/20 text-left"
          >
            {/* Photo cover — makes each finished project instantly recognizable */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img
                src={p.image || '/placeholder.svg'}
                alt={p.imageAlt}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute right-4 top-4 rounded-full bg-black/40 px-2.5 py-1 font-serif text-sm tracking-tight tabular-nums text-white backdrop-blur-sm">
                {p.year}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                <h3 className="font-serif text-xl leading-tight tracking-tight text-white text-balance">
                  {p.name}
                </h3>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {p.summary}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/60 pt-3.5 text-xs text-muted-foreground">
                <span className="font-serif text-base tracking-tight tabular-nums text-foreground">
                  {p.cost}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sage/[0.1] px-2 py-0.5 font-medium text-sage-foreground">
                  <TrendingUp className="size-3.5" strokeWidth={2.25} />
                  <span className="tabular-nums">{p.valueAdded}</span> est. value
                </span>
                <span className="flex items-center gap-1.5">
                  <HardHat className="size-3.5" strokeWidth={2} />
                  {p.contractor}
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="size-3.5" strokeWidth={2} />
                  {p.records} records
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </CareSection>
  )
}
