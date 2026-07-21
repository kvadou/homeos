import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gauge,
  PlayCircle,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import type { ManufacturerSupport } from '@/lib/manufacturer-support'
import type { MaintenanceGuide as Guide } from '@/lib/maintenance-guides'
import { MaintenanceCompletion, ProfessionalHelp } from '@/components/care/maintenance-guide-actions'

type TaskView = {
  id: string
  title: string
  detail: string | null
  due_on: string | null
  recurrence: string | null
  status: string
}

type ItemView = {
  id: string
  name: string
  manufacturer: string | null
  model: string | null
  summary: string | null
} | null

function dueLabel(dueOn: string | null): string {
  if (!dueOn) return 'No date set'
  const date = new Date(`${dueOn}T00:00:00`)
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000)
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`
  if (days === 0) return 'Due today'
  if (days <= 7) return `Due in ${days} day${days === 1 ? '' : 's'}`
  return `Due ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
}

function CoilLocationDiagram() {
  return (
    <figure className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-secondary/45 p-4">
          <svg role="img" aria-labelledby="bottom-coils-title bottom-coils-description" viewBox="0 0 280 190" className="mx-auto h-auto w-full max-w-72 text-primary">
            <title id="bottom-coils-title">Bottom condenser location</title>
            <desc id="bottom-coils-description">Front view of a refrigerator with the owner-accessible toe grille highlighted at the bottom.</desc>
            <rect x="72" y="14" width="136" height="160" rx="8" fill="white" stroke="currentColor" strokeWidth="3" />
            <line x1="72" y1="103" x2="208" y2="103" stroke="currentColor" strokeWidth="2" />
            <line x1="188" y1="34" x2="188" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="188" y1="119" x2="188" y2="145" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <rect x="72" y="153" width="136" height="21" rx="5" fill="#f3dfd5" stroke="currentColor" strokeWidth="2" />
            <path d="M91 160h98M91 167h98" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 5" />
            <path d="M140 180v-21" stroke="#a65338" strokeWidth="2" />
            <circle cx="140" cy="182" r="4" fill="#a65338" />
          </svg>
          <figcaption className="mt-3">
            <span className="block text-sm font-semibold">Common location: behind the toe grille</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Open only the grille your manual identifies as owner-removable.</span>
          </figcaption>
        </div>

        <div className="rounded-2xl bg-secondary/45 p-4">
          <svg role="img" aria-labelledby="rear-coils-title rear-coils-description" viewBox="0 0 280 190" className="mx-auto h-auto w-full max-w-72 text-primary">
            <title id="rear-coils-title">Rear condenser location</title>
            <desc id="rear-coils-description">Rear view of a refrigerator with exposed serpentine coils and a sealed mechanical cover marked as technician-only.</desc>
            <rect x="72" y="14" width="136" height="160" rx="8" fill="white" stroke="currentColor" strokeWidth="3" />
            <path d="M93 37h94v13H93v13h94v13H93v13h94v13H93v13h94" fill="none" stroke="#6f8f7c" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="88" y="130" width="104" height="34" rx="5" fill="#eeeae2" stroke="currentColor" strokeWidth="2" />
            <path d="m131 140 18 15m0-15-18 15" stroke="#a65338" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <figcaption className="mt-3">
            <span className="block text-sm font-semibold">Exposed rear coils vs. sealed cover</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Clean exposed coils only when the manual permits it. Never open the sealed compressor cover.</span>
          </figcaption>
        </div>
      </div>
      <figcaption className="mt-3 text-xs leading-relaxed text-muted-foreground">Common layouts only. Your refrigerator may place the condenser underneath, behind, on top, or in a non-serviceable enclosure.</figcaption>
    </figure>
  )
}

export function MaintenanceGuide({
  task,
  item,
  guide,
  videoUrl,
  manufacturer,
}: {
  task: TaskView
  item: ItemView
  guide: Guide
  videoUrl: string
  manufacturer: ManufacturerSupport | null
}) {
  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Home briefing
      </Link>

      <header className="border-b border-border/70 pb-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-sage/15 px-3 py-1 font-medium text-sage-foreground">Maintenance guide</span>
          <span>{dueLabel(task.due_on)}</span>
          {item && <><span aria-hidden>·</span><Link href={`/library/item/${item.id}`} className="font-medium text-foreground hover:text-primary">{item.name}</Link></>}
        </div>
        <h1 className="mt-4 max-w-3xl text-balance font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{guide.title}</h1>
        <p className="mt-3 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">{guide.summary}</p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-sage-foreground" aria-hidden />{guide.time}</span>
          <span className="inline-flex items-center gap-2"><Gauge className="size-4 text-sage-foreground" aria-hidden />{guide.difficulty}</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-sage-foreground" aria-hidden />{guide.cadence}</span>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.75fr)]">
        <main className="min-w-0 space-y-10">
          <section aria-labelledby="why-heading">
            <h2 id="why-heading" className="text-xl font-semibold">Why this matters</h2>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-foreground/90">{guide.whyItMatters}</p>
            {guide.key === 'refrigerator-coils' && <CoilLocationDiagram />}
          </section>

          <section aria-labelledby="steps-heading">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Wrench className="size-5" strokeWidth={1.75} aria-hidden /></span>
              <div><h2 id="steps-heading" className="text-xl font-semibold">Step-by-step walkthrough</h2><p className="mt-0.5 text-sm text-muted-foreground">Follow your model’s manual whenever it differs from this guide.</p></div>
            </div>
            <ol className="mt-6 border-y border-border/70">
              {guide.steps.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-4 border-b border-border/70 py-6 last:border-b-0">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold tabular-nums text-primary-foreground">{index + 1}</span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                    {step.confirmation && <p className="mt-3 flex items-start gap-2 text-sm text-sage-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />Checkpoint: {step.confirmation}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="resources-heading">
            <div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground"><BookOpen className="size-5" strokeWidth={1.75} aria-hidden /></span><div><h2 id="resources-heading" className="text-xl font-semibold">Videos, manual, and trusted references</h2><p className="mt-0.5 text-sm text-muted-foreground">Start with your exact model whenever possible.</p></div></div>
            <div className="mt-5 divide-y divide-border/70 border-y border-border/70">
              {manufacturer && (
                <a href={manufacturer.url} target="_blank" rel="noopener noreferrer" className="flex min-h-20 items-center gap-4 py-4 transition-colors hover:text-primary">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="size-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{manufacturer.label}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Look up {manufacturer.model ? `model ${manufacturer.model}` : 'the model number'} for the authoritative owner’s manual.</span></span>
                  <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </a>
              )}
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-20 items-center gap-4 py-4 transition-colors hover:text-primary">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-wood/15 text-wood-foreground"><PlayCircle className="size-5" aria-hidden /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Find model-specific walkthroughs on YouTube</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">The search includes {item?.manufacturer || 'the appliance type'}{item?.model ? ` ${item.model}` : ''}. Prefer videos from the manufacturer or an authorized service channel.</span></span>
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </a>
              {guide.resources.map((resource) => (
                <a key={resource.url} href={resource.url} target="_blank" rel="noopener noreferrer" className="flex min-h-20 items-center gap-4 py-4 transition-colors hover:text-primary">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><BookOpen className="size-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{resource.label}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{resource.detail}</span></span>
                  <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </a>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">External instructions can change. Confirm that any video or article matches the exact model before removing parts.</p>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold">Before you start</h2>
            <h3 className="mt-5 text-sm font-semibold">What you’ll need</h3>
            <ul className="mt-3 space-y-2">
              {guide.tools.map((tool) => <li key={tool} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage-foreground" aria-hidden />{tool}</li>)}
            </ul>
            <h3 className="mt-6 text-sm font-semibold">Safety first</h3>
            <ul className="mt-3 space-y-2">
              {guide.safety.map((note) => <li key={note} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage-foreground" aria-hidden />{note}</li>)}
            </ul>
          </section>

          <section className="rounded-2xl bg-wood/[0.09] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-wood-foreground"><AlertTriangle className="size-5" aria-hidden /><h2 className="text-base font-semibold">Stop and get help if…</h2></div>
            <ul className="mt-4 space-y-3">
              {guide.stopWhen.map((note) => <li key={note} className="text-sm leading-relaxed text-foreground/85">{note}</li>)}
            </ul>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold">Record the work</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Completing this task updates the home history and schedules the next occurrence when applicable.</p>
            <div className="mt-5"><MaintenanceCompletion taskId={task.id} initialStatus={task.status} /></div>
          </section>
        </aside>
      </div>

      <ProfessionalHelp itemId={item?.id ?? null} itemName={item?.name ?? null} taskTitle={task.title} summary={guide.professionalSummary} />
    </div>
  )
}
