import Link from "next/link";
import { ArrowLeft, Sparkles, ArrowRight, ChevronRight, DoorOpen, Plus } from "lucide-react";
import { LibraryIcon } from "@/components/library/icons";
import type { RoomDetail } from "@/lib/library";

export function RoomView({ room }: { room: RoomDetail }) {
  const itemCount = room.groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Library
      </Link>

      {/* Visual hero */}
      <header className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
        <div className="relative h-52 w-full sm:h-64">
          {room.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={room.photoUrl} alt={`The ${room.name}`} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-wood/15">
              <DoorOpen className="size-16 text-wood-foreground/50" strokeWidth={1.25} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 sm:p-8">
            <h1 className="font-serif text-4xl tracking-tight text-background">{room.name}</h1>
            <p className="mt-1 text-sm text-background/85">
              {itemCount} {itemCount === 1 ? "thing" : "things"} connected
            </p>
          </div>
        </div>
        <p className="p-6 text-pretty text-sm leading-relaxed text-muted-foreground sm:p-8">
          {room.summary}
        </p>
      </header>

      {/* Connected groups */}
      {room.groups.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {room.groups.map((group) => (
            <section
              key={group.label}
              className="flex flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
                  <LibraryIcon name={group.icon} className="size-5" strokeWidth={2} />
                </span>
                <h2 className="text-sm font-semibold">{group.label}</h2>
                <span className="ml-auto text-xs text-muted-foreground">{group.items.length}</span>
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {group.items.map((it, i) => {
                  const content = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{it.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{it.meta}</span>
                      </span>
                      {it.id && <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />}
                    </>
                  );
                  return (
                    <li key={it.id ?? `${group.label}-${i}`}>
                      {it.id ? (
                        <Link
                          href={`/library/item/${it.id}`}
                          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/30 px-3.5 py-2.5 transition-colors hover:border-sage/40 hover:bg-accent/40"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/30 px-3.5 py-2.5">
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-secondary/30 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing is connected to the {room.name.toLowerCase()} yet.
          </p>
          <Link
            href="/items/new"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Add something to this room
          </Link>
        </div>
      )}

      {/* Ask about this room */}
      <section className="flex flex-col items-start gap-4 rounded-3xl border border-primary/15 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm font-medium">Ask about the {room.name.toLowerCase()}</p>
            <p className="text-xs text-muted-foreground">
              &ldquo;What&apos;s in this room?&rdquo; · &ldquo;When was it painted?&rdquo;
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/chat"
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          Ask HomeOS
          <ArrowRight className="size-4" strokeWidth={2.25} />
        </Link>
      </section>
    </div>
  );
}
