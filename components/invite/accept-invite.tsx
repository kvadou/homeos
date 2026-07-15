'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { House, Check, ArrowRight } from 'lucide-react'
import { acceptInvite } from '@/lib/actions/invites'
import { Button } from '@/components/ui/button'

/* The accept step. The server component has already confirmed the invite is
   valid and the visitor is signed in; this just fires acceptInvite and shows
   the calm success state before sending them into their (now shared) home. */
export function AcceptInvite({
  token,
  homeName,
  inviterName,
}: {
  token: string
  homeName: string
  inviterName: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)
  const [pending, startTransition] = useTransition()

  function accept() {
    setError(null)
    startTransition(async () => {
      const res = await acceptInvite(token)
      if ('homeName' in res) {
        setJoined(true)
        router.refresh()
        return
      }
      setError(res.error)
    })
  }

  if (joined) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
          <Check className="size-6" strokeWidth={2.25} />
        </div>
        <h1 className="font-serif text-2xl tracking-tight">You&rsquo;re in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You now share <span className="font-medium text-foreground">{homeName}</span>.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Go to your home
          <ArrowRight className="size-4" strokeWidth={2.25} />
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <House className="size-6" strokeWidth={2} />
      </div>
      <h1 className="font-serif text-2xl tracking-tight">Join {homeName}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{inviterName}</span> invited you to help care
        for their home on GatherRoot.
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button onClick={accept} disabled={pending} className="mt-6 h-11 w-full rounded-xl text-sm">
        {pending ? 'Joining…' : 'Accept invitation'}
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">
          Not now
        </Link>
      </p>
    </div>
  )
}
