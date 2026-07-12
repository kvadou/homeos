'use server'

import { createClient } from '@/lib/supabase/server'
import type { AnswerBlock, Citation } from '@/lib/ask-data'

/* One turn as the Ask UI renders it: the user's question and, once answered,
   the assistant's blocks + the citations they reference. */
export type LoadedExchange = {
  id: string
  question: string
  blocks: AnswerBlock[] | null
  citations?: Citation[]
}

type UserContent = { text?: string }
type AssistantContent = { blocks?: AnswerBlock[]; citations?: Citation[] }

/**
 * Load a stored conversation's messages, folded back into question/answer
 * exchanges. RLS limits this to conversations in a home the user belongs to.
 */
export async function getConversationMessages(conversationId: string): Promise<LoadedExchange[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('messages')
    .select('id, role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const exchanges: LoadedExchange[] = []
  for (const m of data ?? []) {
    if (m.role === 'user') {
      const question = (m.content as UserContent)?.text ?? ''
      exchanges.push({ id: m.id, question, blocks: null })
    } else {
      const content = m.content as AssistantContent
      const blocks = content?.blocks ?? []
      const citations = content?.citations ?? []
      const last = exchanges[exchanges.length - 1]
      if (last && last.blocks === null) {
        last.blocks = blocks
        last.citations = citations
      } else {
        exchanges.push({ id: m.id, question: '', blocks, citations })
      }
    }
  }
  return exchanges
}
