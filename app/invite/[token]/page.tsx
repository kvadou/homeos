import Link from 'next/link'
import { redirect } from 'next/navigation'
import { House, Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AcceptInvite } from '@/components/invite/accept-invite'

export const metadata = { title: 'Join a home · HomeOS' }

/* Public route (see PUBLIC_PREFIXES) so signed-out visitors reach the signup
   redirect. The service-role read is scoped strictly to the token row — it
   never leaks anything beyond the home name and inviter name for this invite. */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/signup?next=/invite/${token}`)

  const admin = createAdminClient()
  const { data: invite } = await admin
    .from('home_invites')
    .select('home_id, invited_by, status, expires_at')
    .eq('token', token)
    .maybeSingle()

  const valid =
    invite && invite.status === 'pending' && new Date(invite.expires_at) > new Date()

  let homeName = ''
  let inviterName = ''
  if (valid) {
    const [{ data: home }, { data: inviter }] = await Promise.all([
      admin.from('homes').select('name').eq('id', invite.home_id).maybeSingle(),
      admin.from('profiles').select('name, email').eq('id', invite.invited_by).maybeSingle(),
    ])
    homeName = home?.name ?? 'a home'
    inviterName = inviter?.name || inviter?.email || 'Someone'
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <House className="size-4.5" strokeWidth={2.25} />
          </div>
          <span className="font-serif text-2xl tracking-tight">HomeOS</span>
        </div>

        {valid ? (
          <AcceptInvite token={token} homeName={homeName} inviterName={inviterName} />
        ) : (
          <div className="rounded-3xl border border-border/70 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <Link2 className="size-6" strokeWidth={2} />
            </div>
            <h1 className="font-serif text-2xl tracking-tight">This link isn&rsquo;t active</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This invite has expired or was already used. Ask whoever invited you to send a fresh
              link.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-card text-sm font-medium transition-colors hover:bg-accent/40"
            >
              Go to HomeOS
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
