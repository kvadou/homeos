import { CircleCheck, FileText, Sparkles, Bell, type LucideIcon } from "lucide-react";

export type ActivityIconKey = "complete" | "added" | "event";

export interface ActivityEntry {
  id: string;
  iconKey: ActivityIconKey;
  text: string;
  timeAgo: string;
}

const ICON: Record<ActivityIconKey, LucideIcon> = {
  complete: CircleCheck,
  added: FileText,
  event: Sparkles,
};

export function RecentActivity({ activity }: { activity: ActivityEntry[] }) {
  if (activity.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border/60 bg-transparent p-6 sm:p-7">
      <h2 className="text-sm font-medium text-muted-foreground">Recent Activity</h2>

      <ul className="mt-4 flex flex-col gap-3">
        {activity.map(({ id, iconKey, text, timeAgo }) => {
          const Icon = ICON[iconKey] ?? Bell;
          return (
            <li key={id} className="flex items-center gap-3">
              <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
              <p className="flex-1 text-sm text-muted-foreground">{text}</p>
              <span className="text-xs text-muted-foreground/70">{timeAgo}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
