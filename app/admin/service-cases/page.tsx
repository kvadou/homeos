import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Service cases · GatherRoot Admin' }

const queueLabel: Record<string, string> = {
  safety_stopped: 'Safety review', intake_ready: 'Intake ready', sharing_approved: 'Outreach due',
  sourcing: 'Outreach due', awaiting_provider_responses: 'Awaiting provider response',
  options_ready: 'Options need review', selection_approved: 'Booking due', booking_pending: 'Confirmation overdue',
  confirmed: 'Appointment scheduled', service_underway: 'Appointment today', completed: 'Completion follow-up',
  booking_failed: 'Booking failure', disputed: 'Dispute', no_availability: 'No availability', no_qualified_provider: 'No qualified provider',
}

function age(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}h`
  return `${Math.floor(minutes / 1_440)}d`
}

export default async function ServiceCasesPage() {
  const { admin } = await requireAdmin()
  const [{ data: cases }, { data: escalations }, { data: operators }] = await Promise.all([
    admin.from('service_cases').select('id,status,urgency,symptom_summary,item_snapshot,sharing_status,sharing_expires_at,assigned_operator_id,opened_at,updated_at').order('updated_at', { ascending: false }),
    admin.from('service_escalations').select('service_case_id,priority').eq('status', 'open'),
    admin.from('profiles').select('id,name,email').eq('is_admin', true),
  ])
  const escalationByCase = new Map((escalations ?? []).map((row) => [row.service_case_id, row.priority]))
  const operatorById = new Map((operators ?? []).map((row) => [row.id, row.name ?? row.email]))

  return (
    <AppShell showSearch={false}>
      <div className="space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Internal operations</p>
            <h1 className="font-serif text-3xl tracking-tight">Service cases</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Every external action must stay within active homeowner authorization. Proposed times are not appointments.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/providers" className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary">Provider registry</Link>
            <Link href="/admin" className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary">Admin overview</Link>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Open cases" value={(cases ?? []).filter((row) => !['recorded','cancelled','diy_resolved','warranty_routed'].includes(row.status)).length} />
          <Metric label="Outreach due" value={(cases ?? []).filter((row) => ['sharing_approved','sourcing'].includes(row.status)).length} />
          <Metric label="Open escalations" value={(escalations ?? []).length} />
        </div>

        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Operations queue</h2>
            <p className="text-sm text-muted-foreground">Oldest attention within each state should be handled first.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-secondary/35 text-left text-xs text-muted-foreground">
                <tr><th className="px-5 py-3 font-medium">Queue</th><th className="px-4 py-3 font-medium">Item / problem</th><th className="px-4 py-3 font-medium">Authorization</th><th className="px-4 py-3 font-medium">Owner</th><th className="px-4 py-3 text-right font-medium">Age</th></tr>
              </thead>
              <tbody className="divide-y">
                {(cases ?? []).map((row) => {
                  const item = row.item_snapshot as Record<string, unknown>
                  const escalation = escalationByCase.get(row.id)
                  return (
                    <tr key={row.id} className="group hover:bg-secondary/20">
                      <td className="px-5 py-4"><Link href={`/admin/service-cases/${row.id}`} className="font-semibold text-primary group-hover:underline">{queueLabel[row.status] ?? row.status.replaceAll('_', ' ')}</Link>{escalation && <div className="mt-1 text-xs font-medium text-destructive">{escalation} escalation</div>}</td>
                      <td className="max-w-md px-4 py-4"><div className="font-medium">{String(item.name ?? 'Unknown item')}</div><div className="truncate text-muted-foreground">{row.symptom_summary ?? 'No symptom recorded'}</div></td>
                      <td className="px-4 py-4"><span className={row.sharing_status === 'approved' ? 'text-primary' : 'text-muted-foreground'}>{row.sharing_status.replaceAll('_', ' ')}</span></td>
                      <td className="px-4 py-4 text-muted-foreground">{row.assigned_operator_id ? operatorById.get(row.assigned_operator_id) ?? 'Assigned' : 'Unassigned'}</td>
                      <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">{age(row.opened_at)}</td>
                    </tr>
                  )
                })}
                {(cases ?? []).length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No service cases yet. Household repair requests will appear here.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card px-5 py-4"><div className="font-serif text-3xl tabular-nums">{value}</div><div className="mt-1 text-sm text-muted-foreground">{label}</div></div>
}
