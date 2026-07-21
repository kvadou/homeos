'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { House } from 'lucide-react'
import { signIn } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 sm:text-sm'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [next, setNext] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Surface errors bounced back from the auth callback (?error=...) and carry
  // an invite's next target through sign-in.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) setError(err)
    setNext(params.get('next'))
  }, [])

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await signIn(email, password, next ?? undefined)
      if (result?.error) setError(result.error)
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

        <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
          <div className="mb-6 space-y-1.5 text-center">
            <h1 className="font-serif text-2xl tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your home.</p>
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="-mx-2 -my-3 px-2 py-3 text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={inputClass}
              />
            </div>

            <Button type="submit" disabled={pending} className="h-11 w-full rounded-xl text-sm">
              {pending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to GatheredOS?{' '}
          <Link
            href="/signup"
            className="inline-block px-1 py-3 -my-3 font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}
