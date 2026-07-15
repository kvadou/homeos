import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser } from '@/lib/supabase/home'

export async function requireAdmin() {
  const { supabase, user } = await requireUser()
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) notFound()
  return { admin: createAdminClient(), user }
}
