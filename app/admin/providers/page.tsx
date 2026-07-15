import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { requireAdmin } from '@/lib/admin-auth'
import { createProviderBusiness, verifyProviderContact } from '@/lib/actions/service-operations'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Provider registry · GatherRoot Admin' }

const field = 'w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none'

export default async function ProvidersPage() {
  const { admin } = await requireAdmin()
  const [{ data: providers }, { data: verifications }] = await Promise.all([
    admin.from('provider_businesses').select('*').order('display_name'),
    admin.from('provider_verifications').select('*').order('created_at', { ascending: false }),
  ])
  const verifiedByProvider = new Map<string, typeof verifications>()
  for (const row of verifications ?? []) verifiedByProvider.set(row.provider_id, [...(verifiedByProvider.get(row.provider_id) ?? []), row])

  return <AppShell showSearch={false}><div className="space-y-7">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Internal operations</p><h1 className="font-serif text-3xl tracking-tight">Provider registry</h1><p className="mt-1 text-sm text-muted-foreground">Only real businesses with directly confirmed contact facts belong here.</p></div><Link href="/admin/service-cases" className="rounded-lg border bg-card px-4 py-2 text-sm font-medium">Service queue</Link></header>
    <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Add founding provider</h2><p className="mt-1 text-sm text-muted-foreground">A provider cannot receive outreach until its contact is separately verified below.</p>
      <form action={createProviderBusiness} className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <ProviderField label="Display name" name="displayName" required/><ProviderField label="Legal name" name="legalName" placeholder="If different"/><ProviderField label="Phone" name="phone" required/><ProviderField label="Email" name="email" type="email"/><ProviderField label="Website" name="website" type="url"/><ProviderField label="Service ZIP codes" name="zipCodes" required placeholder="Comma separated"/><ProviderField label="Brands serviced" name="brands" placeholder="Comma separated"/><label className="text-xs font-medium text-muted-foreground">Preferred channel<select name="channel" className={`${field} mt-1`} defaultValue="phone"><option value="phone">Phone</option><option value="sms">SMS</option><option value="email">Email</option><option value="booking_link">Booking link</option></select></label><ProviderField label="Diagnostic fee policy" name="diagnosticPolicy"/><ProviderField label="Cancellation policy" name="cancellationPolicy"/><ProviderField label="Parts / labor warranty" name="partsLaborWarranty"/><button className="self-end rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Add provider</button>
      </form>
    </section>
    <section className="space-y-3"><h2 className="font-semibold">Providers</h2>{(providers ?? []).map((provider) => { const checks = verifiedByProvider.get(provider.id) ?? []; const contactVerified = checks.some((v) => v.kind === 'contact' && v.status === 'verified'); return <article key={provider.id} className="rounded-xl border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold">{provider.display_name}</h3><p className="text-sm text-muted-foreground">{provider.phone}{provider.email ? ` · ${provider.email}` : ''}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${contactVerified ? 'bg-sage/20 text-sage-foreground' : 'bg-secondary text-muted-foreground'}`}>{contactVerified ? 'Contact verified' : 'Contact not verified'}</span></div>{!contactVerified && <form action={verifyProviderContact} className="mt-4 flex flex-wrap gap-2"><input type="hidden" name="providerId" value={provider.id}/><input name="value" required placeholder="Confirmed contact name or number" className={`${field} max-w-sm`}/><button className="rounded-lg border bg-background px-4 py-2 text-sm font-medium">Record direct confirmation</button></form>}</article> })}{(providers ?? []).length === 0 && <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No providers have been added. The registry stays empty until a real business is contacted.</div>}</section>
  </div></AppShell>
}

function ProviderField({ label, name, required, placeholder, type = 'text' }: { label: string; name: string; required?: boolean; placeholder?: string; type?: string }) {
  return <label className="text-xs font-medium text-muted-foreground">{label}<input name={name} type={type} required={required} placeholder={placeholder} className={`${field} mt-1`}/></label>
}
