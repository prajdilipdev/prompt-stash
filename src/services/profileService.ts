import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import { assertNoError } from './promptService'

interface ProfileRow {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  assertNoError(error, 'Could not load your profile.')
  if (!data) return null
  const row = data as ProfileRow
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  }
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('id', userId)
  assertNoError(error, 'Could not update your display name.')
}

/**
 * Delete all user-owned library data (prompts, tags, links).
 *
 * Note: Supabase does not allow an authenticated client to delete its own
 * auth account — that requires an admin call with a service-role key, which
 * this app deliberately never ships. Users wanting the auth record removed
 * can do so from the Supabase dashboard. This is documented in Settings.
 */
export async function deleteAllUserData(): Promise<void> {
  const { error: promptError } = await supabase.from('prompts').delete().not('id', 'is', null)
  assertNoError(promptError, 'Could not delete your prompts.')
  const { error: tagError } = await supabase.from('tags').delete().not('id', 'is', null)
  assertNoError(tagError, 'Could not delete your tags.')
}
