import Link from "next/link";
import {
  ArrowRight,
  Wind,
  Droplets,
  Flame,
  Lightbulb,
  Trees,
  Refrigerator,
  Package,
  type LucideIcon,
} from "lucide-react";

export interface RecentItem {
  id: string;
  name: string;
  timeAgo: string;
  category: string;
}

function categoryIcon(category: string): LucideIcon {
  const c = category.toLowerCase();
  if (c.includes("hvac") || c.includes("air") || c.includes("vent")) return Wind;
  if (c.includes("plumb") || c.includes("water")) return Droplets;
  if (c.includes("heat") || c.includes("furnace")) return Flame;
  if (c.includes("electric") || c.includes("light")) return Lightbulb;
  if (c.includes("yard") || c.includes("garden") || c.includes("lawn") || c.includes("outdoor"))
    return Trees;
  if (c.includes("appliance") || c.includes("kitchen") || c.includes("refriger"))
    return Refrigerator;
  return Package;
}

export function RecentlyAdded({ items }: { items: RecentItem[] }) {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl tracking-tight">Recently Added</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Your home&apos;s growing memory</p>
        </div>
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          Open Library
          <ArrowRight className="size-4" strokeWidth={2.25} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-10 text-center">
          <p className="text-sm font-medium">Nothing added yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Scan or add an item to start building your home&apos;s memory.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-1 flex-col gap-2.5">
          {items.map(({ id, name, timeAgo, category }) => {
            const Icon = categoryIcon(category);
            return (
              <li key={id}>
                <Link
                  href={`/library/item/${id}`}
                  className="flex w-full items-center gap-3.5 rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-left transition-colors hover:border-sage/40 hover:bg-accent/40"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
