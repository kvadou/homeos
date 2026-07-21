import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { MaintenanceGuide } from '@/components/care/maintenance-guide'
import { maintenanceGuideFor, maintenanceVideoSearchUrl } from '@/lib/maintenance-guides'
import { manufacturerSupport } from '@/lib/manufacturer-support'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Maintenance guide · GatheredOS',
  description: 'A step-by-step maintenance walkthrough connected to your home record.',
}

export default async function CareTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const home = await requireHome()
  const supabase = await createClient()

  const { data: task } = await supabase
    .from('care_tasks')
    .select('id,title,detail,due_on,recurrence,status,template_slug,item_id')
    .eq('home_id', home.id)
    .eq('id', id)
    .maybeSingle()

  if (!task) notFound()

  const guide = maintenanceGuideFor(task)
  let item: {
    id: string
    name: string
    manufacturer: string | null
    model: string | null
    summary: string | null
  } | null = null

  if (task.item_id) {
    const { data } = await supabase
      .from('items')
      .select('id,name,manufacturer,model,summary')
      .eq('home_id', home.id)
      .eq('id', task.item_id)
      .maybeSingle()
    item = data
  }

  // Older task rows may predate item linking. Reconnect a clear appliance
  // match so guidance and provider handoff still use the home's real record.
  if (!item && ['refrigerator-coils', 'dishwasher-filter'].includes(guide.key)) {
    const { data: appliances } = await supabase
      .from('items')
      .select('id,name,manufacturer,model,summary')
      .eq('home_id', home.id)
      .eq('category', 'appliance')
      .order('created_at', { ascending: true })
    const matcher = guide.key === 'refrigerator-coils' ? /refrigerator|fridge/i : /dishwasher/i
    item = appliances?.find((candidate) => matcher.test(candidate.name)) ?? null
  }

  return (
    <AppShell>
      <MaintenanceGuide
        task={task}
        item={item}
        guide={guide}
        videoUrl={maintenanceVideoSearchUrl(guide, item)}
        manufacturer={manufacturerSupport(item?.manufacturer, item?.model)}
      />
    </AppShell>
  )
}
