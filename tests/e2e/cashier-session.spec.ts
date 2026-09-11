import { expect, test } from '@playwright/test'
import {
  adminEmail,
  adminPassword,
  mutationE2EEnabled,
  seededGuard,
  seededTableSlug,
  supabaseAnonKey,
  supabaseUrl,
} from './env'
import { expectRetiredPaymentUiAbsent, loginAsCashier } from './helpers'

const cashierGuard = seededGuard(
  [Boolean(adminEmail), 'Set PLAYWRIGHT_ADMIN_EMAIL for a seeded admin or owner account.'],
  [Boolean(adminPassword), 'Set PLAYWRIGHT_ADMIN_PASSWORD for that disposable account.'],
)

const tableGuard = seededGuard(
  [Boolean(seededTableSlug), 'Set PLAYWRIGHT_TABLE_SLUG to an active seeded table.'],
)

const apiGuard = seededGuard(
  [Boolean(supabaseUrl), 'Set PLAYWRIGHT_SUPABASE_URL to the disposable Supabase project URL.'],
  [Boolean(supabaseAnonKey), 'Set PLAYWRIGHT_SUPABASE_ANON_KEY to that project anon key.'],
)

/**
 * Cashier-first ordering. The brief for this flow is the README contract:
 * the cashier takes the initial order, the customer confirms it, and the table
 * QR becomes a secondary "Tambah Pesanan" channel into the same open session.
 */
test.describe('cashier-first POS (Pesanan Baru)', () => {
  test.skip(cashierGuard.skip, cashierGuard.reason)

  // Scenarios 1-3: cashier builds a DINE-IN order, the review step appears, and
  // confirmation is what actually creates the order.
  test('builds a DINE-IN order through the review and confirmation step', async ({ page }) => {
    await loginAsCashier(page, adminEmail, adminPassword)
    await page.goto('/admin/orders/new')

    await expect(page.getByRole('heading', { name: 'Pesanan Baru' })).toBeVisible()
    await expectRetiredPaymentUiAbsent(page)

    const confirm = page.getByRole('button', { name: 'Lanjut ke Konfirmasi' })
    await expect(confirm).toBeDisabled()

    const catalogItem = page.locator('main button').filter({ has: page.locator('p') }).first()
    if ((await catalogItem.count()) === 0) {
      test.skip(true, 'Seeded catalog has no available POS item; add one before exercising creation.')
    }
    await catalogItem.click()
    await expect(confirm).toBeDisabled() // DINE-IN still needs a table

    const tableGrid = page.getByRole('group', { name: 'Pilih meja' })
    const freeTable = tableGrid.getByRole('button').filter({ hasText: 'Tersedia' }).first()
    if ((await freeTable.count()) === 0) {
      test.skip(true, 'Every seeded table is occupied; free one before exercising creation.')
    }
    await freeTable.click()
    await expect(confirm).toBeEnabled()
    await confirm.click()

    // Scenario 2: the customer sees the order summary before anything is written.
    await expect(page.getByText('Pesanan Anda')).toBeVisible()
    await expect(page.getByText('Pesanan sudah sesuai?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Kembali & Ubah' })).toBeVisible()

    // Scenario 3 creates a durable order, so it needs an explicit opt-in and a
    // disposable database that can be reset afterwards.
    const confirmation = page.getByRole('button', { name: 'Konfirmasi Pesanan' })
    await expect(confirmation).toBeVisible()
    if (!mutationE2EEnabled) return

    await confirmation.click()
    await expect(page.getByRole('heading', { name: 'Pesanan diterima.' })).toBeVisible()
  })

  // Scenarios 4, 8 and 9: occupancy is visible, an occupied table never merges
  // silently, and joining is an explicit, deliberate action.
  test('marks occupied tables and requires an explicit join', async ({ page }) => {
    await loginAsCashier(page, adminEmail, adminPassword)
    await page.goto('/admin/orders/new')

    const tableGrid = page.getByRole('group', { name: 'Pilih meja' })
    await expect(tableGrid).toBeVisible()

    const occupied = tableGrid.getByRole('button').filter({ hasText: 'Terisi' })
    if ((await occupied.count()) === 0) {
      test.skip(true, 'No occupied table is seeded; this covers the explicit-join branch only.')
    }

    await occupied.first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('sedang memiliki sesi aktif')
    await expect(dialog).toContainText('Total sesi saat ini')
    await expect(dialog.getByRole('button', { name: 'Batal' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Gabung ke Sesi' })).toBeVisible()

    // Scenario 8: cancelling must not attach the order to that session.
    await dialog.getByRole('button', { name: 'Batal' }).click()
    await expect(dialog).toBeHidden()

    // Scenario 9: joining is explicit.
    await occupied.first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Gabung ke Sesi' }).click()
    await expect(page.getByText(/Bergabung · Meja/)).toBeVisible()
  })

  // Scenario 18: takeaway stays orthogonal — no table, no session.
  test('keeps takeaway available without a table', async ({ page }) => {
    await loginAsCashier(page, adminEmail, adminPassword)
    await page.goto('/admin/orders/new')

    await page.getByRole('button', { name: 'Bawa pulang' }).click()
    await expect(page.getByRole('group', { name: 'Pilih meja' })).toHaveCount(0)
  })

  // Scenario 20: the retired online-payment surface stays unreachable.
  test('keeps the retired payment UI absent from the POS', async ({ page }) => {
    await loginAsCashier(page, adminEmail, adminPassword)
    await page.goto('/admin/orders/new')
    await expectRetiredPaymentUiAbsent(page)
  })
})

/**
 * The table QR is a secondary channel. It resumes a session the cashier opened
 * and must never open one itself.
 */
test.describe('customer table QR is secondary', () => {
  test.skip(tableGuard.skip, tableGuard.reason)

  // Scenarios 6 and 7: with no active session the QR refuses to order and does
  // not create one.
  test('offers no ordering action when the table has no active session', async ({ page }) => {
    await page.goto(`/t/${encodeURIComponent(seededTableSlug)}`)
    await expect(page.getByRole('heading', { name: 'Meja Tidak Ditemukan' })).toHaveCount(0)

    const noSession = page.getByText('Belum ada sesi aktif.')
    if ((await noSession.count()) === 0) {
      test.skip(true, 'Seeded table currently has an open session; free it to cover this branch.')
    }

    await expect(
      page.getByText('Silakan melakukan pemesanan di kasir terlebih dahulu.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tambah Pesanan' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Pesan Sekarang|Bayar Sekarang/ })).toHaveCount(0)
  })

  // Scenario 5: with an active session the QR resumes the SAME session.
  test('offers Tambah Pesanan when the cashier already opened a session', async ({ page }) => {
    await page.goto(`/t/${encodeURIComponent(seededTableSlug)}`)
    const active = page.getByText('Selamat menikmati.')
    if ((await active.count()) === 0) {
      test.skip(true, 'Seeded table has no open session; open one via the POS first.')
    }

    await expect(page.getByRole('button', { name: 'Tambah Pesanan' })).toBeVisible()
    await page.getByRole('button', { name: 'Tambah Pesanan' }).click()
    await expect(page).toHaveURL(new RegExp(`/t/${seededTableSlug}/menu$`))
  })
})

/**
 * Scenario 20 (security): every business write is forced through a role-checked
 * SECURITY DEFINER RPC, so the anon key must not be able to write these tables
 * even though it can read the active catalog.
 */
test.describe('security boundary', () => {
  test.skip(apiGuard.skip, apiGuard.reason)

  test('rejects anonymous writes to orders, payments and dining sessions', async ({ request }) => {
    for (const table of ['orders', 'payments', 'dining_sessions']) {
      const response = await request.post(`${supabaseUrl}/rest/v1/${table}`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        data: {},
      })
      expect(response.ok(), `${table} must reject anonymous inserts`).toBe(false)
    }
  })
})
