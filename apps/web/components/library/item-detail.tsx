import Link from "next/link";
import { ArrowLeft, Sparkles, ArrowRight, ChevronRight, DoorOpen, Pencil } from "lucide-react";
import { LibraryIcon, tintClasses } from "@/components/library/icons";
import type { LibraryItemDetail } from "@/lib/library";

const statusTone: Record<string, string> = {
  good: "bg-sage/15 text-sage-foreground",
  attention: "bg-wood/20 text-wood-foreground",
  neutral: "bg-secondary text-muted-foreground",
};

export function ItemDetail({ item }: { item: LibraryItemDetail }) {
  return (
    <div className="space-y-6">
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Library
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:flex-row sm:items-start sm:p-8">
        <span className={`flex size-16 shrink-0 items-center justify-center rounded-3xl ${tintClasses[item.tint]}`}>
          <LibraryIcon name={item.icon} className="size-8" strokeWidth={1.5} />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl tracking-tight">{item.name}</h1>
            {item.status && (
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone[item.status.tone]}`}>
                {item.status.label}
              </span>
            )}
          </div>
          <p className="mt-1.5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {item.summary}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-2.5 py-1 font-medium">{item.category}</span>
            {item.room && (
              <Link
                href={`/library/room/${item.room.id}`}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-medium transition-colors hover:text-foreground"
              >
                <DoorOpen className="size-3.5" strokeWidth={2} />
                {item.room.name}
              </Link>
            )}
          </div>
        </div>
        <Link
          href={`/items/${item.id}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40"
        >
          <Pencil className="size-4" strokeWidth={2} />
          Edit
        </Link>
      </header>

      {/* AI insight */}
      <section className="rounded-3xl border border-primary/15 bg-primary/5 p-6 sm:p-7">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" strokeWidth={2} />
          <span className="text-sm font-medium">HomeOS insight</span>
        </div>
        <p className="mt-3 max-w-2xl text-pretty font-serif text-xl leading-snug tracking-tight">
          {item.status?.tone === "attention"
            ? "This needs your attention. Getting ahead of it now avoids an emergency later, and gives you time to choose."
            : "Everything looks healthy. HomeOS is tracking its warranty and service history so you don’t have to."}
        </p>
      </section>

      {/* Facts */}
      {item.facts.length > 0 && (
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-xl tracking-tight">Details</h2>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            {item.facts.map((f) => (
              <div key={f.label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                <dd className="mt-1 text-sm font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Documents */}
      {item.documents.length > 0 && (
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
          <h2 className="font-serif text-xl tracking-tight">Documents & Manuals</h2>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {item.documents.map((doc, i) => {
              const inner = (
                <>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-navy/10 text-primary">
                    <LibraryIcon name={doc.icon} className="size-5" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{doc.label}</span>
                    {doc.meta && <span className="block text-xs text-muted-foreground">{doc.meta}</span>}
                  </span>
                  {doc.href && <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />}
                </>
              );
              const className =
                "flex w-full items-center gap-3.5 rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-left transition-colors hover:border-sage/40 hover:bg-accent/40";
              return (
                <li key={`${doc.label}-${i}`}>
                  {doc.href ? (
                    <a href={doc.href} target="_blank" rel="noreferrer" className={className}>
                      {inner}
                    </a>
                  ) : (
                    <div className={className}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Maintenance history */}
      {item.maintenance.length > 0 && (
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-xl tracking-tight">Maintenance History</h2>
          <ol className="relative mt-5 ml-1">
            <span aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
            {item.maintenance.map((m, i) => (
              <li key={`${m.date}-${m.title}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
                <span className="relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full bg-sage ring-4 ring-card" />
                <div>
                  <span className="text-sm font-medium">{m.title}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.date}
                    {m.by ? ` · ${m.by}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Related questions */}
      <section className="rounded-3xl border border-border/70 bg-secondary/30 p-6 sm:p-7">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" strokeWidth={2} />
          <span className="text-sm font-medium">Ask about this</span>
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          {item.questions.map((q) => (
            <Link
              key={q}
              href="/dashboard/chat"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm font-medium shadow-sm transition-colors hover:border-sage/40 hover:bg-accent/40"
            >
              {q}
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
