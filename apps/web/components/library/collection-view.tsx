import Link from "next/link";
import { ArrowLeft, Plus, ChevronRight } from "lucide-react";
import { LibraryIcon, tintClasses } from "@/components/library/icons";
import type { CollectionData, CollectionRow } from "@/lib/library";

function RowShell({ row, children }: { row: CollectionRow; children: React.ReactNode }) {
  const className =
    "group flex items-center gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md";
  if (row.href?.startsWith("/")) {
    return (
      <Link href={row.href} className={className}>
        {children}
      </Link>
    );
  }
  if (row.href) {
    return (
      <a href={row.href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return <div className={className.replace("hover:-translate-y-0.5 ", "")}>{children}</div>;
}

export function CollectionView({ data }: { data: CollectionData }) {
  return (
    <div className="space-y-6">
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Library
      </Link>

      <header className="flex items-center gap-4">
        <span className={`flex size-14 items-center justify-center rounded-3xl ${tintClasses[data.tint]}`}>
          <LibraryIcon name={data.icon} className="size-7" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-serif text-3xl tracking-tight">{data.label}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {data.rows.length} {data.rows.length === 1 ? "item" : "items"} in this collection
          </p>
        </div>
      </header>

      {data.rows.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.rows.map((row) => (
            <RowShell key={row.key} row={row}>
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tintClasses[row.tint]}`}
              >
                <LibraryIcon name={row.icon} className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{row.title}</p>
                <p className="truncate text-sm text-muted-foreground">{row.subtitle}</p>
              </div>
              {row.href && (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
              )}
            </RowShell>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-secondary/30 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {data.available
              ? `Your ${data.label.toLowerCase()} live here, organized automatically as you add them.`
              : `${data.label} tracking is coming soon to HomeOS.`}
          </p>
          {data.available && (
            <Link
              href="/library/upload"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Add to this collection
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
