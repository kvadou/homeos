'use client'

import { useTransition } from 'react'
import { ArrowRight } from 'lucide-react'
import { convertIdeaToActive } from '@/lib/actions/projects'

/* Drop-in replacement for the inert "Convert to project" button — promotes the
   idea to an active project. No inputs, so a click handler is enough. */
export function ConvertIdeaButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await convertIdeaToActive(id)))}
      className="mt-3 flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-xs font-medium text-wood-foreground transition-colors hover:bg-wood/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      {pending ? 'Converting…' : 'Convert to project'}
      <ArrowRight
        className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
        strokeWidth={2.25}
      />
    </button>
  )
}
