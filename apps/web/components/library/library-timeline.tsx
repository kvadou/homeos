import { LibraryIcon, tintClasses } from "@/components/library/icons";
import type { TimelineRow } from "@/lib/library";

export function LibraryTimeline({ entries }: { entries: TimelineRow[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="font-serif text-xl tracking-tight">Home Timeline</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Built automatically as your home&apos;s story unfolds
        </p>
      </div>

      <ol className="relative ml-1">
        <span aria-hidden className="absolute bottom-2 left-[21px] top-2 w-px bg-border" />
        {entries.map(({ year, title, detail, icon, tint }, i) => (
          <li key={`${year}-${title}-${i}`} className="relative flex gap-5 pb-7 last:pb-0">
            <span
              className={`relative z-10 flex size-11 shrink-0 items-center justify-center rounded-2xl ${tintClasses[tint]} ring-4 ring-card`}
            >
              <LibraryIcon name={icon} className="size-5" />
            </span>
            <div className="pt-1">
              <div className="flex items-center gap-2.5">
                <span className="font-serif text-lg tracking-tight tabular-nums">{year}</span>
                <span className="text-sm font-medium">{title}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
