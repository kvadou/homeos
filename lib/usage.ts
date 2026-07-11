import { createClient } from "@/lib/supabase/server"

/**
 * Log a user action for /admin analytics. Fire-and-forget: never throws,
 * never blocks the action that called it.
 */
export async function logUsage(
  event: string,
  props: Record<string, unknown> = {},
  homeId?: string,
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("usage_events").insert({
      user_id: user.id,
      home_id: homeId ?? null,
      event,
      props: props as never,
    })
  } catch {
    // analytics must never break product flows
  }
}
