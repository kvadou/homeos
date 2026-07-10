"use client";

import { useState } from "react";
import { Check, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";

export interface PriorityTask {
  id: string;
  title: string;
  meta: string; // due display, e.g. "Due in 3 days"
  why: string;
  highlight?: boolean;
}

export function WeekendPriorities({ tasks }: { tasks: PriorityTask[] }) {
  const { toast } = useToast();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const completed = tasks.filter((t) => done[t.id]).length;

  const toggle = async (id: string) => {
    if (pending[id]) return;
    const next = !done[id];
    // Optimistic: flip immediately, roll back if the request fails.
    setDone((prev) => ({ ...prev, [id]: next }));
    setPending((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next ? "completed" : "pending" }),
      });
      if (!res.ok) throw new Error("request failed");
    } catch {
      setDone((prev) => ({ ...prev, [id]: !next }));
      toast({
        variant: "destructive",
        title: "Couldn't update that task",
        description: "Please check your connection and try again.",
      });
    } finally {
      setPending((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl tracking-tight">This Weekend</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Prioritized by what matters most for your home
          </p>
        </div>
        <span className="text-sm font-medium text-muted-foreground tabular-nums">
          {completed}/{tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-10 text-center">
          <Check className="size-6 text-sage-foreground" strokeWidth={2} />
          <p className="mt-2 text-sm font-medium">All caught up</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            No priority tasks for this weekend.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-1 flex-col gap-2.5">
          {tasks.map((task) => {
            const isDone = !!done[task.id];
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => toggle(task.id)}
                  aria-pressed={isDone}
                  className={cn(
                    "flex w-full items-start gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-colors",
                    isDone
                      ? "border-transparent bg-muted/60"
                      : "border-border/70 bg-card hover:border-sage/40 hover:bg-accent/40"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isDone ? "border-sage bg-sage text-primary-foreground" : "border-border"
                    )}
                  >
                    {isDone && <Check className="size-3.5" strokeWidth={3} />}
                  </span>

                  <span className="flex-1">
                    {task.highlight && !isDone && (
                      <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-wood/20 px-2 py-0.5 text-[11px] font-medium text-wood-foreground">
                        <Star className="size-3 fill-current" strokeWidth={2} />
                        Highest impact
                      </span>
                    )}
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span
                        className={cn(
                          "text-sm font-medium transition-colors",
                          isDone && "text-muted-foreground line-through"
                        )}
                      >
                        {task.title}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" strokeWidth={2} />
                        {task.meta}
                      </span>
                    </span>
                    {task.why && (
                      <span
                        className={cn(
                          "mt-1 block text-xs leading-relaxed text-muted-foreground",
                          isDone && "line-through"
                        )}
                      >
                        {task.why}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
