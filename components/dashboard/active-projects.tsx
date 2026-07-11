import { ChevronRight, ArrowRight } from 'lucide-react'

const projects = [
  {
    title: 'Landscape lighting',
    status: 'Planning',
    roi: 92,
    lifestyle: 98,
    budget: '$2,400',
    nextStep: 'Request quotes',
  },
  {
    title: 'Kitchen refresh',
    status: 'In progress',
    roi: 84,
    lifestyle: 90,
    budget: '$6,000',
    nextStep: 'Approve backsplash',
  },
  {
    title: 'Attic insulation',
    status: 'Researching',
    roi: 95,
    lifestyle: 72,
    budget: '$1,800',
    nextStep: 'Book energy audit',
  },
]

const statusTone: Record<string, string> = {
  Planning: 'bg-wood/20 text-wood-foreground',
  'In progress': 'bg-sage/15 text-sage-foreground',
  Researching: 'bg-secondary text-secondary-foreground',
}

export function ActiveProjects() {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl tracking-tight">Active Projects</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Decisions worth making for your home</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-0.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          Manage
          <ChevronRight className="size-4" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-5 grid flex-1 gap-3 sm:grid-cols-3">
        {projects.map((p) => (
          <div
            key={p.title}
            className="flex flex-col rounded-2xl border border-border/60 bg-secondary/30 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-tight text-pretty">{p.title}</h3>
            </div>
            <span
              className={`mt-2 w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[p.status]}`}
            >
              {p.status}
            </span>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">ROI</p>
                <p className="text-lg font-semibold leading-none tabular-nums">{p.roi}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lifestyle</p>
                <p className="text-lg font-semibold leading-none tabular-nums">{p.lifestyle}</p>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-semibold tabular-nums">{p.budget}</p>
            </div>

            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
            >
              {p.nextStep}
              <ArrowRight className="size-3.5" strokeWidth={2.25} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
