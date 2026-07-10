import Link from "next/link";
import {
  Video,
  MapPin,
  FileText,
  Camera,
  StickyNote,
  Plus,
  type LucideIcon,
} from "lucide-react";

export type KnowledgeIconKey = "location" | "note" | "document" | "video";

export interface KnowledgeEntry {
  iconKey: KnowledgeIconKey;
  title: string;
  meta: string;
  href: string;
}

export interface KnowledgeCounts {
  videos: number;
  notes: number;
  documents: number;
  locations: number;
  photos: number;
}

const ENTRY_ICON: Record<KnowledgeIconKey, LucideIcon> = {
  location: MapPin,
  note: StickyNote,
  document: FileText,
  video: Video,
};

export function HomeKnowledge({
  counts,
  entries,
}: {
  counts: KnowledgeCounts;
  entries: KnowledgeEntry[];
}) {
  const chips = [
    { icon: Video, label: "Videos", count: counts.videos },
    { icon: StickyNote, label: "Notes", count: counts.notes },
    { icon: FileText, label: "Documents", count: counts.documents },
    { icon: MapPin, label: "Locations", count: counts.locations },
    { icon: Camera, label: "Photos", count: counts.photos },
  ];

  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl tracking-tight">What Your Home Remembers</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The details that usually live only in someone&apos;s memory
          </p>
        </div>
        <Link
          href="/library"
          className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          aria-label="Open library"
        >
          <Plus className="size-4.5" strokeWidth={2.25} />
        </Link>
      </div>

      {/* Category chips (counts are real; videos is not tracked yet) */}
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map(({ icon: Icon, label, count }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/40 py-1.5 pl-2.5 pr-3 text-xs font-medium text-muted-foreground"
          >
            <Icon className="size-3.5 text-wood-foreground" strokeWidth={2} />
            {label}
            <span className="tabular-nums text-muted-foreground/70">{count}</span>
          </span>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-10 text-center">
          <p className="text-sm font-medium">Nothing captured yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Document shutoffs, notes, and how-tos so they aren&apos;t lost.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-1 flex-col gap-2.5">
          {entries.map(({ iconKey, title, meta, href }) => {
            const Icon = ENTRY_ICON[iconKey];
            return (
              <li key={`${iconKey}-${title}`}>
                <Link
                  href={href}
                  className="flex w-full items-center gap-3.5 rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-left transition-colors hover:border-wood/40 hover:bg-accent/40"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-wood/20 text-wood-foreground">
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
