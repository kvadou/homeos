import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

export type HomeRow = Database["public"]["Tables"]["homes"]["Row"]
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

/** Current auth user or redirect to /login. */
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return { supabase, user }
}

/**
 * The user's current home (first membership) or null.
 * Pages that need a home should redirect to /onboarding when null.
 */
export async function getCurrentHome(): Promise<HomeRow | null> {
  const { supabase } = await requireUser()
  const { data } = await supabase
    .from("homes")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  return data
}

/** Current home or redirect to /onboarding. Most pages use this. */
export async function requireHome(): Promise<HomeRow> {
  const home = await getCurrentHome()
  if (!home) redirect("/onboarding")
  return home
}
