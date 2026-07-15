'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { House, MailCheck } from 'lucide-react'
import { requestPasswordReset } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      await requestPasswordReset(email)
      setSent(true)
    })
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <House className="size-4.5" strokeWidth={2.25} />
          </div>
          <span className="font-serif text-2xl tracking-tight text-[#1F3D34]">GatherRoot</span>
        </div>

        {sent ? (
          <div className="rounded-3xl border border-border/70 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
              <MailCheck className="size-6" strokeWidth={2} />
            </div>
            <h1 className="font-serif text-2xl tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If that email has an account, a reset link is on the way.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
            <div className="mb-6 space-y-1.5 text-center">
              <h1 className="font-serif text-2xl tracking-tight">Reset your password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a link to get back in.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <Button type="submit" disabled={pending} className="h-11 w-full rounded-xl text-sm">
                {pending ? 'Sending link...' : 'Send reset link'}
              </Button>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it?{' '}
          <Link href="/login" className="inline-block px-1 py-3 -my-3 font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
