import { cn } from '@/lib/utils'

type Stat = { label: string; value: number }
type ChartDay = { key: string; signups: number; events: number }
type UserRow = {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  createdAt: string
  homes: number
  lastActivity: string | null
}
type FeedItem = {
  id: number
  event: string
  email: string | null
  createdAt: string
  summary: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  const days = Math.floor(diff / 86_400_000)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

function humanizeEvent(event: string): string {
  return event.replace(/_/g, ' ')
}

export function AdminDashboard({
  stats,
  chart,
  users,
  feed,
}: {
  stats: Stat[]
  chart: ChartDay[]
  users: UserRow[]
  feed: FeedItem[]
}) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Internal — HomeOS operations.</p>
      </header>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border/70 bg-card p-4 text-center shadow-sm"
          >
            <div className="font-serif text-3xl leading-none tracking-tight tabular-nums">
              {s.value.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] font-medium leading-tight text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <ActivityChart chart={chart} />

      <UsersTable users={users} />

      <ActivityFeed feed={feed} />
    </div>
  )
}

function ActivityChart({ chart }: { chart: ChartDay[] }) {
  const max = Math.max(1, ...chart.flatMap((d) => [d.signups, d.events]))
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl tracking-tight">Last 14 days</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">New signups and usage events per day.</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-sage" /> Signups
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-wood" /> Events
          </span>
        </div>
      </div>

      <div className="mt-6 flex h-36 items-end gap-1.5 sm:gap-2.5">
        {chart.map((d, i) => {
          const showLabel = i % 3 === 0 || i === chart.length - 1
          const day = new Date(`${d.key}T00:00:00`)
          return (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end justify-center gap-0.5">
                <Bar value={d.signups} max={max} tint="sage" />
                <Bar value={d.events} max={max} tint="wood" />
              </div>
              <span className="h-3 text-[10px] leading-none text-muted-foreground/70 tabular-nums">
                {showLabel ? `${day.getMonth() + 1}/${day.getDate()}` : ''}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Bar({ value, max, tint }: { value: number; max: number; tint: 'sage' | 'wood' }) {
  const pct = value === 0 ? 0 : Math.max(6, (value / max) * 100)
  return (
    <div
      className={cn(
        'w-2 shrink-0 rounded-t-md transition-all sm:w-2.5',
        tint === 'sage' ? 'bg-sage' : 'bg-wood',
      )}
      style={{ height: `${pct}%` }}
      title={`${value}`}
    />
  )
}

function UsersTable({ users }: { users: UserRow[] }) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <h2 className="font-serif text-xl tracking-tight">Users</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Newest first{users.length >= 50 ? ' · showing 50' : ''}.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs font-medium text-muted-foreground">
              <th className="pb-2.5 pr-4 font-medium">User</th>
              <th className="pb-2.5 pr-4 font-medium">Signed up</th>
              <th className="pb-2.5 pr-4 font-medium text-right">Homes</th>
              <th className="pb-2.5 pr-4 font-medium">Last activity</th>
              <th className="pb-2.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {users.map((u) => (
              <tr key={u.id} className="align-middle">
                <td className="py-3 pr-4">
                  <div className="font-medium leading-tight">{u.name ?? u.email}</div>
                  {u.name && <div className="text-xs text-muted-foreground">{u.email}</div>}
                </td>
                <td className="py-3 pr-4 text-muted-foreground tabular-nums">{formatDate(u.createdAt)}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{u.homes}</td>
                <td className="py-3 pr-4 text-muted-foreground tabular-nums">
                  {u.lastActivity ? relativeTime(u.lastActivity) : '—'}
                </td>
                <td className="py-3">
                  {u.isAdmin && (
                    <span className="inline-flex items-center rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-medium text-sage-foreground">
                      Admin
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ActivityFeed({ feed }: { feed: FeedItem[] }) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7">
      <h2 className="font-serif text-xl tracking-tight">Recent activity</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Latest 20 usage events.</p>

      <ul className="mt-5 flex flex-col divide-y divide-border/50">
        {feed.map((f) => (
          <li key={f.id} className="flex items-center gap-3 py-3">
            <span className="inline-flex shrink-0 items-center rounded-lg bg-secondary/60 px-2 py-1 text-[11px] font-medium text-foreground/80">
              {humanizeEvent(f.event)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-muted-foreground">
                {f.email ?? 'Unknown user'}
                {f.summary && <span className="text-muted-foreground/70"> · {f.summary}</span>}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground/70 tabular-nums">
              {relativeTime(f.createdAt)}
            </span>
          </li>
        ))}
        {feed.length === 0 && (
          <li className="py-8 text-center text-sm text-muted-foreground">No activity yet.</li>
        )}
      </ul>
    </section>
  )
}
