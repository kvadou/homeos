"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ITEM_CATEGORIES } from "@homeos/shared";

interface Props {
  activeCategory?: string;
}

export function CategoryFilter({ activeCategory }: Props) {
  const searchParams = useSearchParams();

  function buildHref(category?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    return `/items?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildHref()}
        className={cn(
          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          !activeCategory
            ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
        )}
      >
        All
      </Link>
      {Object.entries(ITEM_CATEGORIES).map(([value, label]) => (
        <Link
          key={value}
          href={buildHref(value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            activeCategory === value
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
