'use client'

import { useState } from 'react'
import { useOnboarding } from '../onboarding-provider'
import { StepFrame } from '../step-frame'
import { roles, roleHints, type Role } from '@/lib/onboarding'
import { UserPlus, X, Users, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StepHousehold() {
  const { data, update } = useOnboarding()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('Family Member')

  const canAdd = name.trim().length > 0

  function add() {
    if (!canAdd) return
    update({
      members: [
        ...data.members,
        { id: crypto.randomUUID(), name: name.trim(), email: email.trim(), role },
      ],
    })
    setName('')
    setEmail('')
    setRole('Family Member')
  }

  function remove(id: string) {
    update({ members: data.members.filter((m) => m.id !== id) })
  }

  return (
    <StepFrame
      title="Who helps care for this home?"
      description="Shared access means important home knowledge never lives with only one person."
    >
      <div className="space-y-6">
        {data.members.length > 0 && (
          <div className="space-y-2.5">
            {data.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm"
              >
                <span className="flex size-10 items-center justify-center rounded-2xl bg-sage/15 font-serif text-lg text-sage-foreground">
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.email || 'No email'} · {m.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label={`Remove ${m.name}`}
                  className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
          <p className="mb-4 flex items-center gap-2 text-sm font-medium">
            <UserPlus className="size-4 text-sage-foreground" strokeWidth={2} />
            Invite someone
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan"
                className="h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Email (optional)
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </label>
          </div>

          <div className="mt-4">
            <span className="mb-2 block text-xs font-medium text-muted-foreground">Role</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    'rounded-2xl border px-3.5 py-3 text-left transition-colors',
                    role === r
                      ? 'border-sage bg-sage/15'
                      : 'border-border bg-card hover:bg-secondary',
                  )}
                >
                  <span
                    className={cn(
                      'block text-sm font-medium',
                      role === r ? 'text-sage-foreground' : 'text-foreground',
                    )}
                  >
                    {r}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{roleHints[r]}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={add}
            disabled={!canAdd}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <UserPlus className="size-4" strokeWidth={2} />
            Add to household
          </button>
        </div>

        <p className="flex items-start gap-2 rounded-2xl bg-secondary/50 p-4 text-xs leading-relaxed text-muted-foreground">
          <Shield className="mt-0.5 size-4 shrink-0 text-sage-foreground" strokeWidth={2} />
          Owners manage everything, family members can add and edit, and guests can view only. You
          can adjust roles anytime.
        </p>

        {data.members.length === 0 && (
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Users className="size-3.5" strokeWidth={2} />
            You can also do this later — skip for now if it&rsquo;s just you.
          </p>
        )}
      </div>
    </StepFrame>
  )
}
