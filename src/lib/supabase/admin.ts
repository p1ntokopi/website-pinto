import { createServerClient } from '@supabase/ssr'

/**
 * Service-role client. It bypasses RLS entirely, so it must never reach the
 * browser: this module has no client import path and the guard below fails
 * loudly if the key is missing rather than silently degrading to anon access.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient must never run in the browser.')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  return createServerClient(url, serviceRoleKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // Do nothing - admin client shouldn't manage browser cookies
      },
    },
  })
}