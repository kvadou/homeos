import Link from "next/link";
import { ChevronRight, Hammer } from "lucide-react";

export interface ActiveProject {
  id: string;
  title: string;
  detail: string;
  status: "Planned" | "In progress" | "Completed";
  budget: string | null;
  when: string;
}

const statusTone: Record<ActiveProject["status"], string> = {
  Planned: "bg-wood/20 text-wood-foreground",
  "In progress": "bg-sage/15 text-sage-foreground",
  Completed: "bg-secondary text-secondary-foreground",
};

// ponytail: real title/budget/date from HomeEvent(type=improvement); when there are
// none we show an empty state rather than fabricate ROI/lifestyle scores.
export function ActiveProjects({ projects }: { projects: ActiveProject[] }) {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl tracking-tight">Active Projects</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Decisions worth making for your home</p>
        </div>
        <Link
          href="/dashboard/timeline"
          className="flex items-center gap-0.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          Manage
          <ChevronRight className="size-4" strokeWidth={2} />
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
            <Hammer className="size-5" strokeWidth={1.75} />
          </span>
          <p className="mt-3 text-sm font-medium">No projects underway</p>
          <p className="mt-0.5 max-w-xs text-xs text-muted-foreground">
            Improvements you log will show up here so you can track what you&apos;re working toward.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid flex-1 gap-3 sm:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-2xl border border-border/60 bg-secondary/30 p-4"
            >
              <h3 className="text-sm font-semibold leading-tight text-pretty">{p.title}</h3>
              <span
                className={`mt-2 w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[p.status]}`}
              >
                {p.status}
              </span>

              {p.detail && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
              )}

              <div className="mt-auto pt-4">
                <p className="text-xs text-muted-foreground">{p.when}</p>
                {p.budget && <p className="text-sm font-semibold tabular-nums">{p.budget}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
