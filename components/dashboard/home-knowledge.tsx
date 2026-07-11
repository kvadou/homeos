import { Video, Palette, MapPin, FileText, Camera, StickyNote, Plus } from 'lucide-react'

const chips = [
  { icon: Video, label: 'Videos', count: 8 },
  { icon: StickyNote, label: 'Notes', count: 23 },
  { icon: FileText, label: 'Documents', count: 41 },
  { icon: MapPin, label: 'Locations', count: 6 },
  { icon: Camera, label: 'Photos', count: 112 },
]

const knowledge = [
  {
    icon: Video,
    title: 'How to winterize the sprinkler system',
    meta: 'Recorded by Doug · 2-min video',
  },
  {
    icon: Palette,
    title: 'Paint color for Claire\u2019s bedroom',
    meta: 'Benjamin Moore · Pale Oak OC-20',
  },
  {
    icon: MapPin,
    title: 'Main water shutoff location',
    meta: 'Documented · Basement, north wall',
  },
]

export function HomeKnowledge() {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl tracking-tight">What Your Home Remembers</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The details that usually live only in someone&apos;s memory
          </p>
        </div>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          aria-label="Add knowledge"
        >
          <Plus className="size-4.5" strokeWidth={2.25} />
        </button>
      </div>

      {/* Category chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map(({ icon: Icon, label, count }) => (
          <button
            key={label}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/40 py-1.5 pl-2.5 pr-3 text-xs font-medium text-muted-foreground transition-colors hover:border-wood/40 hover:text-foreground"
          >
            <Icon className="size-3.5 text-wood-foreground" strokeWidth={2} />
            {label}
            <span className="tabular-nums text-muted-foreground/70">{count}</span>
          </button>
        ))}
      </div>

      <ul className="mt-4 flex flex-1 flex-col gap-2.5">
        {knowledge.map(({ icon: Icon, title, meta }) => (
          <li key={title}>
            <button
              type="button"
              className="flex w-full items-center gap-3.5 rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-left transition-colors hover:border-wood/40 hover:bg-accent/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-wood/20 text-wood-foreground">
                <Icon className="size-5" strokeWidth={2} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
