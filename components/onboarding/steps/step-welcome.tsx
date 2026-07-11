'use client'

import Link from 'next/link'
import { House, Wind, FileText, Hammer, Camera, ArrowRight } from 'lucide-react'
import { useOnboarding } from '../onboarding-provider'

const nodes = [
  { icon: Wind, label: 'Systems', className: 'left-0 top-4' },
  { icon: FileText, label: 'Documents', className: 'right-0 top-4' },
  { icon: Hammer, label: 'Projects', className: 'left-2 bottom-4' },
  { icon: Camera, label: 'Memories', className: 'right-2 bottom-4' },
]

export function StepWelcome() {
  const { next } = useOnboarding()

  return (
    <div className="mx-auto flex min-h-[calc(100svh-8.5rem)] max-w-2xl flex-col items-center justify-center px-5 pb-16 pt-10 text-center sm:px-8">
      {/* Home connected to systems, documents, projects, and memories */}
      <div className="relative mb-10 h-56 w-full max-w-sm">
        <svg
          className="absolute inset-0 h-full w-full text-border"
          viewBox="0 0 320 224"
          fill="none"
          aria-hidden="true"
        >
          <line x1="160" y1="112" x2="48" y2="40" stroke="currentColor" strokeWidth="1.5" />
          <line x1="160" y1="112" x2="272" y2="40" stroke="currentColor" strokeWidth="1.5" />
          <line x1="160" y1="112" x2="52" y2="188" stroke="currentColor" strokeWidth="1.5" />
          <line x1="160" y1="112" x2="268" y2="188" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <div className="absolute left-1/2 top-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-md">
          <House className="size-9" strokeWidth={1.75} />
        </div>

        {nodes.map(({ icon: Icon, label, className }) => (
          <div key={label} className={`absolute ${className} flex flex-col items-center gap-1.5`}>
            <span className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-card text-sage-foreground shadow-sm">
              <Icon className="size-5.5" strokeWidth={1.75} />
            </span>
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <p className="text-sm font-medium text-sage-foreground">Welcome to HomeOS</p>
      <h1 className="mt-3 text-balance font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        Let&rsquo;s build your home&rsquo;s memory.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
        We&rsquo;ll help you organize what you know, understand what your home needs, and stay
        prepared for what comes next.
      </p>

      <div className="mt-9 flex w-full max-w-xs flex-col items-center gap-3">
        <button
          type="button"
          onClick={next}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          Get Started
          <ArrowRight className="size-4.5" strokeWidth={2.25} />
        </button>
        <Link
          href="/"
          className="rounded-2xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          I&rsquo;ll finish this later
        </Link>
      </div>
    </div>
  )
}
