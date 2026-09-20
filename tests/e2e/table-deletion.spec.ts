import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import {
  adminEmail,
  adminPassword,
  ownerEmail,
  ownerPassword,
  seededGuard,
  supabaseAnonKey,
  supabaseUrl,
} from './env'

/**
 * Table deletion is admin+owner, but it must never be reachable by writing to
 * the `tables` table directly — a raw DELETE would bypass the open-session
 * guard and strand a live guest. These tests exercise the RPC boundary the same
 * way the earlier owner tests do: they prove who is allowed in, without
 * mutating any real table.
 *
 * A non-existent UUID is deliberate. Reaching "Table not found" means the role
 * check passed; being turned away with "Admin access required" means it did not.
 */

const apiGuard = seededGuard(
  [Boolean(supabaseUrl && supabaseAnonKey), 'Requires PLAYWRIGHT_SUPABASE_URL/ANON_KEY.']
)
const adminGuard = seededGuard(
  [Boolean(supabaseUrl && supabaseAnonKey), 'Requires PLAYWRIGHT_SUPABASE_URL/ANON_KEY.'],
  [Boolean(adminEmail && adminPassword), 'Requires PLAYWRIGHT_ADMIN_EMAIL/PASSWORD.']
)
const ownerGuard = seededGuard(
  [Boolean(supabaseUrl && supabaseAnonKey), 'Requires PLAYWRIGHT_SUPABASE_URL/ANON_KEY.'],
  [Boolean(ownerEmail && ownerPassword), 'Requires PLAYWRIGHT_OWNER_EMAIL/PASSWORD.']
)

const MISSING_TABLE_ID = '11111111-1111-1111-1111-111111111111'

async function tokenFor(email: string, password: string) {
  const signIn = await createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth.signInWithPassword({ email, password })
  expect(signIn.error).toBeNull()
  const token = signIn.data.session?.access_token
  expect(token).toBeTruthy()
  return token as string
}

test.describe('table deletion boundary', () => {
  test('anonymous cannot call admin_delete_table', async ({ request }) => {
    test.skip(apiGuard.skip, apiGuard.reason)

    const response = await request.post(`${supabaseUrl}/rest/v1/rpc/admin_delete_table`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      data: { p_table_id: MISSING_TABLE_ID },
    })
    expect(response.ok(), 'anonymous must not delete tables').toBe(false)
  })

  test('admin passes the role guard on admin_delete_table', async ({ request }) => {
    test.skip(adminGuard.skip, adminGuard.reason)

    const token = await tokenFor(adminEmail, adminPassword)
    const response = await request.post(`${supabaseUrl}/rest/v1/rpc/admin_delete_table`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: { p_table_id: MISSING_TABLE_ID },
    })

    // The guard let an admin through; only the lookup failed.
    const body = (await response.json()) as { message?: string }
    expect(body.message ?? '').toMatch(/table not found/i)
  })

  test('owner passes the role guard on admin_delete_table', async ({ request }) => {
    test.skip(ownerGuard.skip, ownerGuard.reason)

    const token = await tokenFor(ownerEmail, ownerPassword)
    const response = await request.post(`${supabaseUrl}/rest/v1/rpc/admin_delete_table`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: { p_table_id: MISSING_TABLE_ID },
    })

    const body = (await response.json()) as { message?: string }
    expect(body.message ?? '').toMatch(/table not found/i)
  })

  test('admin cannot bypass the RPC with a raw table DELETE', async ({ request }) => {
    test.skip(adminGuard.skip, adminGuard.reason)

    const token = await tokenFor(adminEmail, adminPassword)
    const response = await request.delete(
      `${supabaseUrl}/rest/v1/tables?id=eq.${MISSING_TABLE_ID}`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      }
    )

    // The DELETE grant on `tables` is revoked, so this fails on privileges
    // before it ever reaches row selection.
    expect(response.ok(), 'admin must not delete tables directly').toBe(false)
  })
})