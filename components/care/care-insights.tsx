import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { type Insight } from '@/lib/care-data'
import { CareSection } from './care-section'
import { AiBadge } from '@/components/ai-badge'

export function CareInsights({ insights }: { insights: Insight[] }) {
  return (
    <CareSection
      icon={<Sparkles className="size-5" strokeWidth={1.75} />}
      title="A few things I've picked up about your home"
      subtitle="Patterns I keep an eye on so you don't have to"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {insights.map((insight) => (
          <article
            key={insight.id}
            className="flex flex-col rounded-2xl border border-border/60 bg-secondary/30 p-5"
          >
            <AiBadge verb="noticed" className="self-start" />
            <h3 className="mt-3 text-pretty font-serif text-lg leading-snug tracking-tight">
              {insight.headline}
            </h3>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
              {insight.detail}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
              <p className="text-[11px] text-muted-foreground">{insight.basis}</p>
              <Link
                href={insight.link.href}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-medium text-primary transition-opacity hover:opacity-80"
              >
                {insight.link.label}
                <ArrowRight className="size-3" strokeWidth={2.5} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </CareSection>
  )
}
