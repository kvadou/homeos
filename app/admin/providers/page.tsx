import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireAdmin } from '@/lib/admin-auth'
import {
  createProviderBusiness, recordProviderPilotSimulation, updateProviderAvailability,
  verifyProviderContact, verifyProviderRequirement,
} from '@/lib/actions/service-operations'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Provider readiness · GatheredOS Admin' }

const field = 'w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none'
const button = 'rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary'

function isCurrent(expiresAt: string | null) { return !expiresAt || new Date(expiresAt) > new Date() }
function dateTime(iso: string | null) { return iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded' }

export default async function ProvidersPage() {
  const { admin } = await requireAdmin()
  const [{ data: providers }, { data: verifications }, { data: availability }, { data: simulations }] = await Promise.all([
    admin.from('provider_businesses').select('*').order('display_name'),
    admin.from('provider_verifications').select('*').order('created_at', { ascending: false }),
    admin.from('provider_availability').select('*'),
    admin.from('provider_pilot_simulations').select('*').order('performed_at', { ascending: false }),
  ])
  const checksByProvider = new Map<string, NonNullable<typeof verifications>>()
  for (const row of verifications ?? []) checksByProvider.set(row.provider_id, [...(checksByProvider.get(row.provider_id) ?? []), row])
  const availabilityByProvider = new Map((availability ?? []).map((row) => [row.provider_id, row]))
  const simulationsByProvider = new Map<string, NonNullable<typeof simulations>>()
  for (const row of simulations ?? []) simulationsByProvider.set(row.provider_id, [...(simulationsByProvider.get(row.provider_id) ?? []), row])

  const readiness = (providers ?? []).map((provider) => {
    const checks = checksByProvider.get(provider.id) ?? []
    const currentKinds = new Set(checks.filter((row) => row.status === 'verified' && isCurrent(row.expires_at)).map((row) => row.kind))
    const pulse = availabilityByProvider.get(provider.id)
    const available = Boolean(pulse && new Date(pulse.valid_until) > new Date() && ['accepting', 'limited'].includes(pulse.status))
    const simulated = (simulationsByProvider.get(provider.id) ?? []).some((row) => row.result === 'passed')
    return { provider, checks, pulse, available, simulated, ready: ['contact', 'service_area', 'insurance'].every((kind) => currentKinds.has(kind)) && available && simulated }
  })
  const readyCount = readiness.filter((row) => row.ready).length

  return <AppShell showSearch={false}><div className="space-y-7">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Internal operations</p><h1 className="font-serif text-3xl tracking-tight">Provider readiness</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Availability is useful only while a named operator can trace when and how it was confirmed.</p></div><Link href="/admin/service-cases" className={button}>Service queue</Link></header>

    <section className="rounded-xl border bg-card p-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-semibold">Pilot release gate</h2><p className="mt-1 text-sm text-muted-foreground">Ten providers must have current core checks, a recent availability pulse, and a passed simulated request.</p></div><div className="text-right"><div className="font-serif text-3xl tabular-nums">{readyCount} / 10</div><p className="text-xs font-medium text-muted-foreground">pilot-ready providers</p></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Pilot-ready providers" aria-valuenow={readyCount} aria-valuemin={0} aria-valuemax={10}><div className="h-full bg-primary" style={{ width: `${Math.min(100, readyCount * 10)}%` }}/></div>{readyCount < 10 && <p className="mt-3 text-sm text-muted-foreground">Pilot invitations remain blocked. Complete {10 - readyCount} more provider readiness record{10 - readyCount === 1 ? '' : 's'}.</p>}</section>

    <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Add founding provider</h2><p className="mt-1 text-sm text-muted-foreground">Adding a business does not make it eligible for outreach. Complete the checks below first.</p>
      <form action={createProviderBusiness} className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <ProviderField label="Display name" name="displayName" required/><ProviderField label="Legal name" name="legalName" placeholder="If different"/><ProviderField label="Phone" name="phone" required/><ProviderField label="Email" name="email" type="email"/><ProviderField label="Website" name="website" type="url"/><ProviderField label="Service ZIP codes" name="zipCodes" required placeholder="Comma separated"/><ProviderField label="Brands serviced" name="brands" placeholder="Comma separated; blank means not brand-limited"/><label className="text-xs font-medium text-muted-foreground">Preferred channel<select name="channel" className={`${field} mt-1`} defaultValue="phone"><option value="phone">Phone</option><option value="sms">SMS</option><option value="email">Email</option><option value="booking_link">Booking link</option></select></label><ProviderField label="Diagnostic fee policy" name="diagnosticPolicy"/><ProviderField label="Cancellation policy" name="cancellationPolicy"/><ProviderField label="Parts / labor warranty" name="partsLaborWarranty"/><button className="self-end rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Add provider</button>
      </form>
    </section>

    <section className="space-y-4"><h2 className="font-semibold">Provider records</h2>{readiness.map(({ provider, checks, pulse, available, simulated, ready }) => {
      const currentKinds = new Set(checks.filter((row) => row.status === 'verified' && isCurrent(row.expires_at)).map((row) => row.kind))
      const latestSimulation = (simulationsByProvider.get(provider.id) ?? [])[0]
      return <article key={provider.id} className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold">{provider.display_name}</h3><p className="text-sm text-muted-foreground">{provider.phone}{provider.email ? ` · ${provider.email}` : ''}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ready ? 'bg-sage/20 text-sage-foreground' : 'bg-secondary text-muted-foreground'}`}>{ready ? 'Pilot ready' : 'Checks incomplete'}</span></div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ReadinessFact label="Contact" ready={currentKinds.has('contact')} detail={currentKinds.has('contact') ? 'Verified' : 'Required'}/>
          <ReadinessFact label="Service area" ready={currentKinds.has('service_area')} detail={currentKinds.has('service_area') ? 'Verified' : 'Required'}/>
          <ReadinessFact label="Insurance" ready={currentKinds.has('insurance')} detail={currentKinds.has('insurance') ? 'Current' : 'Required'}/>
          <ReadinessFact label="Availability" ready={available} detail={pulse ? `${pulse.status} · until ${dateTime(pulse.valid_until)}` : 'Not checked'}/>
          <ReadinessFact label="Simulation" ready={simulated} detail={latestSimulation ? latestSimulation.result.replaceAll('_', ' ') : 'Not run'}/>
        </dl>

        <div className="mt-5 grid gap-4 border-t pt-5 lg:grid-cols-3">
          <div><h4 className="text-sm font-semibold">Verification</h4>{!currentKinds.has('contact') && <form action={verifyProviderContact} className="mt-3 space-y-2"><input type="hidden" name="providerId" value={provider.id}/><input name="value" required placeholder="Confirmed contact name or number" className={field}/><button className={button}>Confirm contact</button></form>}{(['service_area','insurance'] as const).filter((kind) => !currentKinds.has(kind)).map((kind) => <form key={kind} action={verifyProviderRequirement} className="mt-3 space-y-2"><input type="hidden" name="providerId" value={provider.id}/><input type="hidden" name="kind" value={kind}/><input type="hidden" name="source" value="direct_confirmation"/><input name="value" required placeholder={kind === 'service_area' ? 'Verified ZIPs / coverage source' : 'Carrier and policy reference'} className={field}/>{kind === 'insurance' && <input type="date" name="expiresOn" required aria-label="Insurance expiration" className={field}/>}<button className={button}>Verify {kind.replace('_',' ')}</button></form>)}</div>
          <form action={updateProviderAvailability} className="space-y-2"><input type="hidden" name="providerId" value={provider.id}/><h4 className="text-sm font-semibold">Availability pulse</h4><div className="grid grid-cols-2 gap-2"><select name="status" className={field} defaultValue={pulse?.status ?? 'accepting'}><option value="accepting">Accepting work</option><option value="limited">Limited</option><option value="unavailable">Unavailable</option><option value="unknown">Unknown</option></select><select name="source" className={field} defaultValue="operator_call"><option value="operator_call">Operator call</option><option value="provider_message">Provider message</option><option value="booking_link">Booking link</option><option value="provider_portal">Provider portal</option></select></div><div className="grid grid-cols-2 gap-2"><input type="number" name="validForHours" min="1" max="168" defaultValue="72" aria-label="Valid for hours" className={field}/><input type="number" name="typicalResponseMinutes" min="1" placeholder="Response minutes" aria-label="Typical response minutes" className={field}/></div><input type="date" name="nextAvailableOn" aria-label="Next available date" className={field}/><input name="capacityNotes" placeholder="Capacity or scheduling constraints" className={field}/><button className={button}>Record availability check</button></form>
          <form action={recordProviderPilotSimulation} className="space-y-2"><input type="hidden" name="providerId" value={provider.id}/><h4 className="text-sm font-semibold">Simulated request</h4><div className="grid grid-cols-2 gap-2"><select name="scenario" className={field}><option value="routine_appliance">Routine appliance</option><option value="urgent_appliance">Urgent appliance</option><option value="no_availability">No availability</option><option value="booking_change">Booking change</option></select><select name="result" className={field}><option value="passed">Passed</option><option value="needs_follow_up">Needs follow-up</option><option value="failed">Failed</option></select></div><input type="number" name="responseMinutes" min="0" placeholder="Response minutes" className={field}/><textarea name="notes" required placeholder="What was tested and what happened?" className={`${field} min-h-20`}/><button className={button}>Record simulation</button></form>
        </div>
      </article>
    })}{readiness.length === 0 && <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No providers have been added. The registry stays empty until a real business is contacted.</div>}</section>
  </div></AppShell>
}

function ProviderField({ label, name, required, placeholder, type = 'text' }: { label: string; name: string; required?: boolean; placeholder?: string; type?: string }) {
  return <label className="text-xs font-medium text-muted-foreground">{label}<input name={name} type={type} required={required} placeholder={placeholder} className={`${field} mt-1`}/></label>
}

function ReadinessFact({ label, ready, detail }: { label: string; ready: boolean; detail: string }) {
  return <div><dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><span aria-hidden>{ready ? '✓' : '○'}</span>{label}</dt><dd className="mt-1 text-sm font-medium">{detail}</dd></div>
}
