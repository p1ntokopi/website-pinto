import { expect, test } from '@playwright/test'
import {
  MOBILE_VIEWPORTS,
  mutationE2EEnabled,
  seededGuard,
  seededOrderNumber,
  seededTableSlug,
} from './env'
import { expectRetiredPaymentUiAbsent } from './helpers'

const CART_CASHIER_COPY =
  'Pesanan langsung diteruskan ke kasir. Pembayaran seluruh tagihan meja dilakukan setelah selesai melalui kasir dengan tunai atau QRIS.'
const STATUS_CASHIER_COPY =
  'Tidak perlu membayar lewat ponsel. Sebutkan nomor meja dan bayar seluruh tagihan dengan tunai atau QRIS.'

for (const viewport of MOBILE_VIEWPORTS) {
  test.describe(`${viewport.width}px table-ordering surface`, () => {
    const guard = seededGuard(
      [Boolean(seededTableSlug), 'Set PLAYWRIGHT_TABLE_SLUG to an active seeded table.'],
    )
    test.skip(guard.skip, guard.reason)
    test.skip(
      !mutationE2EEnabled,
      'Starting a dining session mutates data; also set PLAYWRIGHT_ALLOW_MUTATIONS=1 for a disposable database.',
    )
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('shows the exact cashier copy and no retired online-payment controls', async ({
      page,
    }) => {
      expect(page.viewportSize()).toEqual({ width: viewport.width, height: viewport.height })

      await page.goto(`/t/${encodeURIComponent(seededTableSlug)}`)
      await expect(page.getByRole('button', { name: 'Lihat Menu & Pesan' })).toBeVisible()
      await expectRetiredPaymentUiAbsent(page)

      await page.getByRole('button', { name: 'Lihat Menu & Pesan' }).click()
      await expect(page).toHaveURL(new RegExp(`/t/${seededTableSlug}/menu(?:\\?|$)`))
      await expect(page.getByRole('heading', { name: 'Menu', exact: true })).toBeVisible()
      await expectRetiredPaymentUiAbsent(page)

      const firstProduct = page.locator('main a[href*="/product/"]').first()
      if ((await firstProduct.count()) === 0) {
        test.skip(true, 'Seeded table has no reachable cafe product; add one to exercise the cart UI.')
      }

      await firstProduct.click()
      await page.getByRole('button', { name: /Tambah ke Pesanan/i }).click()
      await page.getByRole('link', { name: /Keranjang, [1-9]\d* item/i }).click()

      await expect(page.getByText(CART_CASHIER_COPY, { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: /Kirim Pesanan/i })).toBeVisible()
      await expectRetiredPaymentUiAbsent(page)
    })
  })
}

test.describe('seeded order status', () => {
  const guard = seededGuard(
    [Boolean(seededTableSlug), 'Set PLAYWRIGHT_TABLE_SLUG to the seeded order table.'],
    [Boolean(seededOrderNumber), 'Set PLAYWRIGHT_ORDER_NUMBER to an order in the seeded session.'],
  )
  test.skip(guard.skip, guard.reason)
  test.skip(
    !mutationE2EEnabled,
    'Creating the browser dining-session cookie mutates data; use a disposable database and set PLAYWRIGHT_ALLOW_MUTATIONS=1.',
  )

  test('shows exact pay-at-cashier copy and no online-payment action', async ({ page }) => {
    await page.goto(`/t/${encodeURIComponent(seededTableSlug)}`)
    await page.getByRole('button', { name: 'Lihat Menu & Pesan' }).click()
    await page.goto(
      `/t/${encodeURIComponent(seededTableSlug)}/order/${encodeURIComponent(seededOrderNumber)}`,
    )

    await expect(page.getByRole('heading', { name: 'Pembayaran di Kasir' })).toBeVisible()
    await expect(
      page.getByText('Silakan lakukan pembayaran di kasir setelah selesai.', { exact: true }),
    ).toBeVisible()
    await expect(page.getByText(STATUS_CASHIER_COPY, { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pesan Lagi' })).toBeVisible()
    await expectRetiredPaymentUiAbsent(page)
  })
})
