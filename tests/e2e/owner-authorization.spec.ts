import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import {
  adminEmail,
  adminPassword,
  ownerEmail,
  ownerPassword,
  seededE2EEnabled,
  seededGuard,
  seededOrderId,
  supabaseAnonKey,
  supabaseUrl,
} from './env'
import { loginAsCashier } from './helpers'

/**
 * Owner-only administration is enforced in three layers: the layout hides the
 * navigation, the server actions re-resolve the caller's role, and the
 * `admin_delete_order` / `admin_set_profile_*` RPCs reject anyone who is not an
 * owner. These tests exercise the last layer directly so a future UI change
 * cannot silently reopen the hole.
 */

// Each layer needs a different actor, so the guards are per-capability rather
// than per-file: the anonymous boundary can run on a bare seeded project, while
// the admin-rejection and owner-success cases each need their own credentials.
const ownerGuard = seededGuard(
  [Boolean(ownerEmail && ownerPassword), 'Requires PLAYWRIGHT_OWNER_EMAIL/PASSWORD.']
)
const adminGuard = seededGuard(
  [Boolean(adminEmail && adminPassword), 'Requires PLAYWRIGHT_ADMIN_EMAIL/PASSWORD.']
)
const apiGuard = seededGuard(
  [Boolean(supabaseUrl && supabaseAnonKey), 'Requires PLAYWRIGHT_SUPABASE_URL/ANON_KEY.']
)
const rpcGuard = seededGuard(
  [Boolean(supabaseUrl && supabaseAnonKey), 'Requires PLAYWRIGHT_SUPABASE_URL/ANON_KEY.'],
  [Boolean(adminEmail && adminPassword), 'Requires PLAYWRIGHT_ADMIN_EMAIL/PASSWORD.']
)
const ownerRpcGuard = seededGuard(
  [Boolean(supabaseUrl && supabaseAnonKey), 'Requires PLAYWRIGHT_SUPABASE_URL/ANON_KEY.'],
  [Boolean(ownerEmail && ownerPassword), 'Requires PLAYWRIGHT_OWNER_EMAIL/PASSWORD.']
)

function clientFor(email: string, password: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth.signInWithPassword({ email, password })
}

test.describe('owner-only administration', () => {
  test.skip(ownerGuard.skip, ownerGuard.reason)

  test('owner sees Kelola Admin, admin does not', async ({ page }) => {
    await loginAsCashier(page, ownerEmail, ownerPassword)
    await page.goto('/admin/owner/accounts')
    await expect(page.getByRole('heading', { name: 'Kelola Admin' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tambah Admin' })).toBeVisible()
  })

  test('admin cannot reach the owner page and sees no destructive order action', async ({ page }) => {
    test.skip(adminGuard.skip, adminGuard.reason)
    await loginAsCashier(page, adminEmail, adminPassword)

    await page.goto('/admin/owner/accounts')
    await expect(page.getByText('Akses Terbatas')).toBeVisible()

    await page.goto('/admin/orders')
    // The list only loads the last 24h, so a seeded project can legitimately
    // render an empty state. Assert the page itself loaded rather than a row.
    await expect(page.getByRole('heading', { name: 'Pesanan' })).toBeVisible()
    // Admins keep the operational cancel action but never the archival one.
    await expect(page.getByRole('button', { name: /Hapus Pesanan/ })).toHaveCount(0)
  })
})

test.describe('owner-only RPC enforcement', () => {

  test('admin cannot archive an order or change roles through the RPC layer', async ({ request }) => {
    test.skip(rpcGuard.skip, rpcGuard.reason)
    const signIn = await clientFor(adminEmail, adminPassword)
    expect(signIn.error).toBeNull()
    const adminToken = signIn.data.session?.access_token
    expect(adminToken).toBeTruthy()

    const headers = {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    }

    if (seededOrderId) {
      const archive = await request.post(`${supabaseUrl}/rest/v1/rpc/admin_delete_order`, {
        headers,
        data: { p_order_id: seededOrderId, p_reason: 'e2e admin attempt' },
      })
      expect(archive.ok(), 'admin must not archive an order').toBe(false)
    }

    const roleChange = await request.post(`${supabaseUrl}/rest/v1/rpc/admin_set_profile_role`, {
      headers,
      data: { p_target_id: '00000000-0000-0000-0000-000000000000', p_role: 'owner' },
    })
    expect(roleChange.ok(), 'admin must not change roles').toBe(false)
  })

  test('anonymous cannot call owner-only RPCs', async ({ request }) => {
    test.skip(apiGuard.skip, apiGuard.reason)
    const headers = {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    }

    const archive = await request.post(`${supabaseUrl}/rest/v1/rpc/admin_delete_order`, {
      headers,
      data: { p_order_id: '00000000-0000-0000-0000-000000000000', p_reason: 'anon attempt' },
    })
    expect(archive.ok(), 'anonymous must not archive an order').toBe(false)

    const activation = await request.post(`${supabaseUrl}/rest/v1/rpc/admin_set_profile_active`, {
      headers,
      data: { p_target_id: '00000000-0000-0000-0000-000000000000', p_is_active: false },
    })
    expect(activation.ok(), 'anonymous must not change account status').toBe(false)
  })

  test('owner can archive a seeded order', async ({ request }) => {
    test.skip(ownerRpcGuard.skip, ownerRpcGuard.reason)
    test.skip(!seededOrderId, 'Requires PLAYWRIGHT_ORDER_ID for a disposable seeded order.')

    const signIn = await clientFor(ownerEmail, ownerPassword)
    expect(signIn.error).toBeNull()
    const ownerToken = signIn.data.session?.access_token
    expect(ownerToken).toBeTruthy()

    const response = await request.post(`${supabaseUrl}/rest/v1/rpc/admin_delete_order`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${ownerToken}`,
        'Content-Type': 'application/json',
      },
      data: { p_order_id: seededOrderId, p_reason: 'e2e owner archive' },
    })
    expect(response.ok(), 'owner must be able to archive the seeded order').toBe(true)
  })
})

test.describe('owner dashboard shell', () => {
  test.skip(!seededE2EEnabled, 'Requires PLAYWRIGHT_SEEDED_E2E=1.')

  test('owner sidebar exposes management navigation in Indonesian', async ({ page }) => {
    test.skip(!ownerEmail || !ownerPassword, 'Requires PLAYWRIGHT_OWNER_EMAIL/PASSWORD.')
    await loginAsCashier(page, ownerEmail, ownerPassword)
    await page.goto('/admin')
    await expect(page.getByRole('link', { name: 'Kelola Admin' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ringkasan Owner' })).toBeVisible()
  })
})