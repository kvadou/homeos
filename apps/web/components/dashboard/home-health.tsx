"use client";

import { useState } from "react";
import {
  House,
  ChevronDown,
  ArrowUpRight,
  Thermometer,
  ShieldCheck,
  FileText,
  Wrench,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealthCategory, HealthCategoryKey } from "@/lib/home-health";

const CATEGORY_ICON: Record<HealthCategoryKey, LucideIcon> = {
  Systems: Thermometer,
  Safety: ShieldCheck,
  Documentation: FileText,
  Maintenance: Wrench,
  Knowledge: Lightbulb,
};

interface HomeHealthProps {
  score: number;
  label: string;
  categories: HealthCategory[];
  /** share of maintenance tasks completed (0-100), real */
  completionPct: number;
}

export function HomeHealth({ score, label, categories, completionPct }: HomeHealthProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      {/* Hero */}
      <div className="flex flex-col items-center gap-6 px-6 pt-10 pb-8 text-center sm:px-8">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
          <House className="size-7" strokeWidth={1.75} />
        </span>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Home Health</p>
          <div className="flex flex-col items-center gap-2">
            <h2 className="font-serif text-5xl leading-none tracking-tight sm:text-6xl">{label}</h2>
            <span className="mt-1 font-serif text-4xl leading-none tracking-tight tabular-nums">
              {score}
            </span>
            {/* ponytail: trend badge is mock copy. needs a stored score history to compute a real delta */}
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-sage/15 px-3 py-1.5 text-sm font-medium text-sage-foreground">
              <ArrowUpRight className="size-4" strokeWidth={2.5} />
              Trending up since you moved in
            </span>
          </div>
        </div>

        <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          {"You've completed "}
          <span className="font-medium text-foreground">{completionPct}%</span>
          {" of your maintenance. Small, steady care keeps your home healthy."}
        </p>

        {/* Segmented health bar */}
        <div className="w-full max-w-sm">
          <div className="flex h-2.5 gap-1 overflow-hidden rounded-full">
            {categories.map((c) => (
              <span
                key={c.label}
                className="h-full flex-1 rounded-full bg-sage"
                style={{ opacity: 0.35 + (c.value / 100) * 0.65 }}
              />
            ))}
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">
            {categories.length} areas monitored continuously
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          {expanded ? "Hide breakdown" : "See what makes up your score"}
          <ChevronDown
            className={cn("size-4 transition-transform", expanded && "rotate-180")}
            strokeWidth={2.25}
          />
        </button>
      </div>

      {expanded && (
        <div className="grid gap-3 border-t border-border/70 bg-secondary/30 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
          {categories.map(({ label: catLabel, value, note }) => {
            const Icon = CATEGORY_ICON[catLabel];
            return (
              <div key={catLabel} className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="size-4 text-sage-foreground" strokeWidth={2} />
                    {catLabel}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{value}</span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-sage" style={{ width: `${value}%` }} />
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{note}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
