import { AppShell } from '@/components/app-shell'
import { UploadFlow } from '@/components/library/upload-flow'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'

export default async function UploadPage() {
  const home = await requireHome()
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('items')
    .select('id, name')
    .eq('home_id', home.id)
    .order('name')

  return (
    <AppShell>
      <UploadFlow homeId={home.id} items={items ?? []} />
    </AppShell>
  )
}
