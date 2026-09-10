import { expect, test } from '@playwright/test'
import {
  adminEmail,
  adminPassword,
  seededGuard,
  seededOrderId,
  seededTableSlug,
} from './env'
import { expectRetiredPaymentUiAbsent, loginAsCashier } from './helpers'

const cashierGuard = seededGuard(
  [Boolean(adminEmail), 'Set PLAYWRIGHT_ADMIN_EMAIL for a seeded admin or owner account.'],
  [Boolean(adminPassword), 'Set PLAYWRIGHT_ADMIN_PASSWORD for that disposable account.'],
)

test.describe('approved manual cashier workflow', () => {
  test.skip(cashierGuard.skip, cashierGuard.reason)

  test('cashier POS offers paid-cash and unpaid order creation', async ({ page }) => {
    await loginAsCashier(page, adminEmail, adminPassword)
    await page.goto('/admin/orders/new')

    await expect(page.getByRole('heading', { name: 'Order Kasir' })).toBeVisible()
    await expect(page.getByText(/Pembayaran tunai bisa langsung ditandai lunas/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Buat & Lunas (Cash)' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Buat Pesanan (Belum Bayar)' })).toBeDisabled()
    await expectRetiredPaymentUiAbsent(page)

    const catalogItem = page.locator('main button').filter({ has: page.locator('p') }).first()
    if ((await catalogItem.count()) === 0) {
      test.skip(true, 'Seeded catalog has no available POS item; add one before exercising creation.')
    }

    await catalogItem.click()
    await expect(page.getByRole('button', { name: 'Buat & Lunas (Cash)' })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Buat Pesanan (Belum Bayar)' })).toBeEnabled()

    // Intentionally do not submit here: both buttons create durable orders. Run the
    // mutation in a disposable seeded environment with a cleanup/reset fixture.
  })

  test.describe('seeded unpaid order', () => {
    test.skip(
      !seededOrderId,
      'Set PLAYWRIGHT_ORDER_ID to a seeded unpaid, non-cancelled order.',
    )

    test('exposes the manual payment dialog', async ({ page }) => {
      await loginAsCashier(page, adminEmail, adminPassword)
      await page.goto(`/admin/orders/${encodeURIComponent(seededOrderId)}`)

      const markPaid = page.getByRole('button', { name: 'Tandai Lunas', exact: true })
      if ((await markPaid.count()) === 0) {
        test.skip(true, 'Seeded order is already paid/cancelled or is not visible to this account.')
      }

      await markPaid.click()
      await expect(page.getByRole('dialog')).toContainText('Catat pembayaran manual')
      await expect(page.getByRole('group', { name: 'Metode pembayaran' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Cash', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await expect(page.getByRole('button', { name: 'Catat Pembayaran' })).toBeVisible()

      // Do not click "Catat Pembayaran": it writes a durable MANUAL payment.
    })
  })
})

test.describe('cashier session mutation outline', () => {
  const sessionGuard = seededGuard(
    [Boolean(seededTableSlug), 'Set PLAYWRIGHT_TABLE_SLUG to an active seeded table.'],
  )
  test.skip(sessionGuard.skip, sessionGuard.reason)

  test('requires a disposable database reset fixture', async () => {
    test.skip(
      true,
      'Starting/closing dining sessions and settling their aggregate cashier bill need a disposable database reset fixture.',
    )
  })
})
