import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { ItemForm } from '@/components/library/item-form'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import { categoryMeta } from '@/lib/library-data'

export default async function NewItemPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  const home = await requireHome()
  const supabase = await createClient()
  const { data: rooms } = await supabase.from('rooms').select('id, name').eq('home_id', home.id).order('name')
  const defaultCategory = category && category in categoryMeta ? category : undefined

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6">
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Library
        </Link>

        <header>
          <h1 className="font-serif text-3xl tracking-tight">Add an item</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track a system, appliance, or anything else in your home.
          </p>
        </header>

        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <ItemForm
            mode="create"
            rooms={(rooms ?? []).map((r) => ({ id: r.id, name: r.name }))}
            defaultCategory={defaultCategory}
            cancelHref="/library"
          />
        </div>
      </div>
    </AppShell>
  )
}
