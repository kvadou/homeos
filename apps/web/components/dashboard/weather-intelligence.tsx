import { CloudRain, ArrowRight, Wind, Snowflake } from "lucide-react";

// ponytail: fully mocked. needs a weather API wired to Home.zipCode / lat / lng.
// Kept static so the layout is real while the data source is pending.
const upcoming = [
  { icon: Wind, label: "High winds tomorrow", hint: "Secure the patio furniture" },
  { icon: Snowflake, label: "First freeze next week", hint: "Winterize outdoor faucets" },
];

export function WeatherIntelligence() {
  return (
    <section className="rounded-3xl border border-border/70 bg-accent/40 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card text-sage-foreground shadow-sm">
            <CloudRain className="size-5.5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-medium">Heavy rain expected this weekend</p>
            <p className="mt-1 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground">
              Around 2 inches Saturday into Sunday. A good moment to check that your sump pump is
              running before the storm arrives.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-card/60"
        >
          How to check
          <ArrowRight className="size-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:gap-3">
        {upcoming.map(({ icon: Icon, label, hint }) => (
          <div
            key={label}
            className="flex flex-1 items-center gap-3 rounded-2xl bg-card/60 px-3.5 py-2.5"
          >
            <Icon className="size-4.5 shrink-0 text-muted-foreground" strokeWidth={2} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{label}</p>
              <p className="truncate text-xs text-muted-foreground">{hint}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
