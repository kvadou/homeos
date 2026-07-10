import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LookAheadItem {
  title: string;
  detail: string;
  when: string;
  cost: string | null;
  tone: "attention" | "plan" | "good";
}

const toneStyles = {
  attention: "bg-wood/20 text-wood-foreground",
  plan: "bg-sage/15 text-sage-foreground",
  good: "bg-muted text-muted-foreground",
};

export function LookingAhead({ items }: { items: LookAheadItem[] }) {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-sage/15 text-sage-foreground">
          <CalendarClock className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="font-serif text-xl tracking-tight">Looking Ahead</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Your next 12 months</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-10 text-center">
          <p className="text-sm font-medium">Nothing on the horizon</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            No warranties or aging items need attention right now.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-1 flex-col gap-2.5">
          {items.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-border/60 bg-secondary/30 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
                {item.cost && (
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{item.cost}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2.5 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                  toneStyles[item.tone]
                )}
              >
                {item.when}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* ponytail: 12-month cost estimate is mock. no per-item cost model yet */}
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary/5 px-4 py-3.5">
        <div>
          <p className="text-sm font-medium">Plan ahead, not scramble</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Estimated over the next 12 months</p>
        </div>
        <span className="font-serif text-2xl tracking-tight tabular-nums">~$2,700</span>
      </div>
    </section>
  );
}
