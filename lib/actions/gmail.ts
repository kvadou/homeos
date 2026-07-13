'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/supabase/home'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptToken, revokeGoogleToken } from '@/lib/gmail/oauth'

export async function disconnectGmail() {
  const { user } = await requireUser()
  const db = createAdminClient()
  const { data } = await db.from('external_connections' as never)
    .select('refresh_token_ciphertext').eq('user_id', user.id).eq('provider', 'gmail').maybeSingle() as { data: { refresh_token_ciphertext: string } | null }
  if (data) await revokeGoogleToken(decryptToken(data.refresh_token_ciphertext))
  await db.from('external_connections' as never).delete().eq('user_id', user.id).eq('provider', 'gmail')
  revalidatePath('/settings')
  return { success: true }
}

