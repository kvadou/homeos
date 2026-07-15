'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[ui-error]', error) }, [error])
  return <main className="flex min-h-dvh items-center justify-center bg-background p-5">
    <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
      <BrandLogo className="mx-auto justify-center" />
      <span className="mx-auto mt-8 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><AlertCircle className="size-6" /></span>
      <h1 className="mt-4 font-serif text-2xl tracking-tight text-balance">This part of your home record didn’t load</h1>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">Your information is still safe. Try loading this page again, or return home and continue elsewhere.</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center"><button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><RotateCcw className="size-4" />Try again</button><Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Return home</Link></div>
      {error.digest && <p className="mt-5 text-xs text-muted-foreground">Reference: {error.digest}</p>}
    </section>
  </main>
}
