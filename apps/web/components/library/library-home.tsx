"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, ArrowRight } from "lucide-react";
import { LibraryIcon, tintClasses, type CollectionKey } from "@/components/library/icons";
import { CollectionsGrid } from "@/components/library/collections-grid";
import { LibraryTimeline } from "@/components/library/library-timeline";
import type { RecentRow, SearchRow, TimelineRow } from "@/lib/library";

export function LibraryHome({
  counts,
  recent,
  timeline,
  searchItems,
}: {
  counts: Record<CollectionKey, number>;
  recent: RecentRow[];
  timeline: TimelineRow[];
  searchItems: SearchRow[];
}) {
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => searchItems.slice(0, 4).map((i) => i.name), [searchItems]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q),
    );
  }, [query, searchItems]);

  const searching = query.trim().length > 0;

  return (
    <div className="space-y-10">
      {/* Search-first hero */}
      <section className="flex flex-col items-center pt-6 text-center sm:pt-10">
        <p className="text-sm font-medium text-muted-foreground">The memory of your home</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-balance sm:text-5xl">
          Everything your home remembers
        </h1>
        <div className="relative mt-7 w-full max-w-2xl">
          <Search
            className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your home..."
            aria-label="Search your home"
            className="h-16 w-full rounded-3xl border border-border bg-card pl-14 pr-5 text-lg text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </div>
        {!searching && suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground shadow-sm transition-colors hover:border-sage/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </section>

      {searching ? (
        <section>
          <p className="mb-4 text-sm text-muted-foreground">
            {results.length > 0
              ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${query}”`
              : `No matches for “${query}” yet`}
          </p>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {results.map((item) => (
                <Link
                  key={item.id}
                  href={`/library/item/${item.id}`}
                  className="group flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md"
                >
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tintClasses[item.tint]}`}
                  >
                    <LibraryIcon name={item.icon} className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{item.summary}</p>
                  </div>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-secondary/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                HomeOS will remember it the moment you add it.
              </p>
              <Link
                href="/library/upload"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                Add to your home
              </Link>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Recently added */}
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-serif text-xl tracking-tight">Recently Added</h2>
              <Link
                href="/library/upload"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                Add
              </Link>
            </div>
            {recent.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {recent.map(({ id, name, icon, when, kind, tint }) => (
                  <Link
                    key={id}
                    href={`/library/item/${id}`}
                    className="group flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md"
                  >
                    <span className={`flex size-11 items-center justify-center rounded-2xl ${tintClasses[tint]}`}>
                      <LibraryIcon name={icon} className="size-5" />
                    </span>
                    <div className="mt-1">
                      <p className="text-sm font-medium leading-snug">{name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {kind} · {when}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-secondary/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nothing here yet. Add your first item and HomeOS starts remembering.
                </p>
                <Link
                  href="/library/upload"
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                >
                  <Plus className="size-4" strokeWidth={2.5} />
                  Add to your home
                </Link>
              </div>
            )}
          </section>

          <CollectionsGrid counts={counts} />
          <LibraryTimeline entries={timeline} />
        </>
      )}
    </div>
  );
}
