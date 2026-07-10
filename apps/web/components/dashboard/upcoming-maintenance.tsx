"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wrench,
  Wind,
  Droplets,
  Flame,
  Trees,
  Snowflake,
  Refrigerator,
  Lightbulb,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type MaintenanceGroup = "This Week" | "This Month" | "This Season";

export interface UpcomingTask {
  id: string;
  title: string;
  due: string;
  category: string;
}

export type UpcomingGroups = Record<MaintenanceGroup, UpcomingTask[]>;

const groups: MaintenanceGroup[] = ["This Week", "This Month", "This Season"];

function categoryIcon(category: string): LucideIcon {
  const c = category.toLowerCase();
  if (c.includes("hvac") || c.includes("air") || c.includes("vent")) return Wind;
  if (c.includes("plumb") || c.includes("water")) return Droplets;
  if (c.includes("heat") || c.includes("furnace")) return Flame;
  if (c.includes("electric") || c.includes("light")) return Lightbulb;
  if (c.includes("yard") || c.includes("garden") || c.includes("lawn") || c.includes("outdoor"))
    return Trees;
  if (c.includes("winter") || c.includes("seasonal")) return Snowflake;
  if (c.includes("appliance") || c.includes("kitchen") || c.includes("refriger"))
    return Refrigerator;
  return Wrench;
}

export function UpcomingMaintenance({ groups: data }: { groups: UpcomingGroups }) {
  const [active, setActive] = useState<MaintenanceGroup>("This Week");
  const filtered = data[active];

  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl tracking-tight">Upcoming Maintenance</h2>
        <Link
          href="/dashboard/maintenance"
          className="flex items-center gap-0.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          View all
          <ChevronRight className="size-4" strokeWidth={2} />
        </Link>
      </div>

      <div className="mt-4 flex gap-1 rounded-2xl bg-muted/70 p-1">
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setActive(g)}
            className={cn(
              "flex-1 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors",
              active === g
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-2 flex flex-1 flex-col items-center justify-center py-10 text-center">
          <p className="text-sm font-medium">Nothing scheduled</p>
          <p className="mt-0.5 text-xs text-muted-foreground">No tasks due {active.toLowerCase()}.</p>
        </div>
      ) : (
        <ul className="mt-2 flex flex-1 flex-col divide-y divide-border/70">
          {filtered.map((task) => {
            const Icon = categoryIcon(task.category);
            return (
              <li key={task.id} className="flex items-center gap-3.5 py-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <Icon className="size-5" strokeWidth={2} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">Recurring · Auto-scheduled</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  {task.due}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
