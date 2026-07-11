import { CheckCircle2, FileText, Sparkles, Bell } from 'lucide-react'

const activity = [
  { icon: CheckCircle2, text: 'Gutter cleaning marked complete', time: '2h ago' },
  { icon: Sparkles, text: 'HomeOS scheduled your HVAC filter change', time: 'Yesterday' },
  { icon: FileText, text: 'Warranty added for LG refrigerator', time: '2 days ago' },
  { icon: Bell, text: 'Reminder set for furnace inspection', time: '4 days ago' },
]

export function RecentActivity() {
  return (
    <section className="rounded-3xl border border-border/60 bg-transparent p-6 sm:p-7">
      <h2 className="text-sm font-medium text-muted-foreground">Recent Activity</h2>

      <ul className="mt-4 flex flex-col gap-3">
        {activity.map(({ icon: Icon, text, time }, i) => (
          <li key={i} className="flex items-center gap-3">
            <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
            <p className="flex-1 text-sm text-muted-foreground">{text}</p>
            <span className="text-xs text-muted-foreground/70">{time}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
