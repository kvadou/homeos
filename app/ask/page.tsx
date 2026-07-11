import { AppShell } from '@/components/app-shell'
import { AskExperience, type RecentConversation } from '@/components/ask/ask-experience'
import { requireHome } from '@/lib/supabase/home'
import { createClient } from '@/lib/supabase/server'
import type { AnswerBlock } from '@/lib/ask-data'

export const dynamic = 'force-dynamic'

type MessageRow = { role: string; content: unknown; created_at: string }

/* First line of a conversation's answer, used as the recent-list teaser. */
function teaserFor(messages: MessageRow[]): string {
  const answer = messages
    .filter((m) => m.role === 'assistant')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
  const blocks = (answer?.content as { blocks?: AnswerBlock[] } | null)?.blocks ?? []
  const lead = blocks.find((b) => b.type === 'lead' || b.type === 'text')
  const text = lead && 'text' in lead ? lead.text : ''
  return text.split('\n')[0].trim()
}

export default async function AskPage() {
  const home = await requireHome()
  const supabase = await createClient()

  const { data } = await supabase
    .from('conversations')
    .select('id, question, created_at, messages(role, content, created_at)')
    .eq('home_id', home.id)
    .order('created_at', { ascending: false })
    .limit(8)

  const recent: RecentConversation[] = (data ?? []).map((c) => ({
    id: c.id,
    question: c.question,
    teaser: teaserFor((c.messages ?? []) as MessageRow[]),
  }))

  return (
    <AppShell showSearch={false}>
      <AskExperience recent={recent} />
    </AppShell>
  )
}
