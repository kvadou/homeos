'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { House, MailCheck } from 'lucide-react'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const [next, setNext] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Carried from an invite link (/invite/:token) so we can return there after
  // the account is created. Read client-side; the action re-validates it.
  useEffect(() => {
    setNext(new URLSearchParams(window.location.search).get('next'))
  }, [])

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await signUp(name, email, password, next ?? undefined)
      if (result?.error) setError(result.error)
      else if (result?.checkEmail) setCheckEmail(true)
    })
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <House className="size-4.5" strokeWidth={2.25} />
          </div>
          <span className="font-serif text-2xl tracking-tight text-[#1F3D34]">GatheredOS</span>
        </div>

        {checkEmail ? (
          <div className="rounded-3xl border border-border/70 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-sage/15 text-sage-foreground">
              <MailCheck className="size-6" strokeWidth={2} />
            </div>
            <h1 className="font-serif text-2xl tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to{' '}
              <span className="font-medium text-foreground">{email}</span>. Click it to finish
              setting up your home.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
            <div className="mb-6 space-y-1.5 text-center">
              <h1 className="font-serif text-2xl tracking-tight">Create your home</h1>
              <p className="text-sm text-muted-foreground">
                A calmer way to take care of where you live.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alexis Rivera"
                  className={inputClass}
                />
              </div>

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

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={inputClass}
                />
              </div>

              <Button type="submit" disabled={pending} className="h-11 w-full rounded-xl text-sm">
                {pending ? 'Creating your home...' : 'Create account'}
              </Button>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
            className="inline-block px-1 py-3 -my-3 font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
