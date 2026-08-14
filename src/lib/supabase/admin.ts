import { createServerClient } from '@supabase/ssr'

export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Do nothing - admin client shouldn't manage browser cookies
        },
      },
    }
  )
}
