import Link from "next/link";
import { COLLECTION_META, LibraryIcon, tintClasses, type CollectionKey } from "@/components/library/icons";

export function CollectionsGrid({ counts }: { counts: Record<CollectionKey, number> }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-serif text-xl tracking-tight">Collections</h2>
        <p className="text-sm text-muted-foreground">Organized automatically</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {COLLECTION_META.map(({ key, label, icon, tint }) => {
          const count = counts[key] ?? 0;
          return (
            <Link
              key={key}
              href={`/library/collection/${key}`}
              className="group flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md"
            >
              <span className={`flex size-11 items-center justify-center rounded-2xl ${tintClasses[tint]}`}>
                <LibraryIcon name={icon} className="size-5" />
              </span>
              <span className="mt-1 flex flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {count} {count === 1 ? "item" : "items"}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
