import { Check } from "lucide-react";

export function HomeStory({
  yearsCared,
  milestones,
}: {
  yearsCared: number;
  milestones: string[];
}) {
  const yearsCopy =
    yearsCared <= 1 ? "Your first year" : `${yearsCared} years`;

  return (
    <section className="rounded-3xl border border-border/70 bg-primary p-6 text-primary-foreground shadow-sm sm:p-9">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-sm">
          <p className="text-sm font-medium text-primary-foreground/70">Your Home Story</p>
          <h2 className="mt-2 text-balance font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            {yearsCopy} of quiet, consistent care.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/75 text-pretty">
            Since moving into this home, you&apos;ve steadily made it safer, more valuable, and more
            truly yours. Here&apos;s what that adds up to.
          </p>
        </div>

        <ul className="flex flex-1 flex-col gap-3.5 sm:max-w-md">
          {milestones.map((m) => (
            <li key={m} className="flex items-center gap-3.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10">
                <Check className="size-4" strokeWidth={2.5} />
              </span>
              <span className="text-pretty text-sm leading-relaxed sm:text-base">{m}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
