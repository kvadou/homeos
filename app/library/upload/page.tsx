import { AppShell } from '@/components/app-shell'
import { UploadFlow } from '@/components/library/upload-flow'
import { BulkImportFlow } from '@/components/library/bulk-import-flow'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'

export default async function UploadPage({ searchParams }: { searchParams: Promise<{ type?: string; mode?: string }> }) {
  const { type, mode } = await searchParams
  const home = await requireHome()

  if (mode === 'bulk') {
    return (
      <AppShell>
        <BulkImportFlow homeId={home.id} />
      </AppShell>
    )
  }

  const supabase = await createClient()
  const { data: items } = await supabase
    .from('items')
    .select('id, name')
    .eq('home_id', home.id)
    .order('name')

  return (
    <AppShell>
      <UploadFlow homeId={home.id} items={items ?? []} initialType={type === 'photo' ? 'photo' : 'document'} />
    </AppShell>
  )
}
