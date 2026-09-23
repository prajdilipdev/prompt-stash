import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client bootstrap.
 *
 * SECURITY: only the publishable/anon key is ever used in the frontend.
 * The service-role key must NEVER appear in this codebase — all data access
 * is enforced server-side by PostgreSQL Row Level Security.
 */

let url = import.meta.env.VITE_SUPABASE_URL?.trim()

// Dev-only QA mode (`QA_PROXY=1 npm run dev`): the dev server proxies /rest
// and /auth to the QA double, so every viewer — including sandbox preview
// browsers on other origins — must call the same origin it was served from.
// This flag is compiled to `false` in production builds.
if (typeof __QA_PROXY__ !== 'undefined' && __QA_PROXY__ && import.meta.env.DEV && typeof window !== 'undefined') {
  url = window.location.origin
}

const publishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim()

export const isSupabaseConfigured = Boolean(url && publishableKey)

/**
 * A client always exists so module imports stay simple; when unconfigured,
 * the app renders a setup gate instead of issuing any requests.
 */
export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder.supabase.co',
  publishableKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'promptstash:auth',
    },
  },
)

/** Human-readable error message from a Supabase error object. */
export function supabaseErrorMessage(error: { message?: string } | null | undefined): string {
  if (!error?.message) return 'Something went wrong. Please try again.'
  const msg = error.message
  if (/invalid login credentials/i.test(msg)) return 'Incorrect email or password.'
  if (/email not confirmed/i.test(msg))
    return 'Please confirm your email address before signing in.'
  if (/rate limit/i.test(msg)) return 'Too many attempts. Please wait a moment and try again.'
  if (/network|fetch failed|failed to fetch/i.test(msg))
    return 'Connection problem. Check your network and try again.'
  return msg
}
