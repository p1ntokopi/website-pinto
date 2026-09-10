import { expect, type Page } from '@playwright/test'

export async function expectRetiredPaymentUiAbsent(page: Page) {
  await expect(page.getByText('Bayar Sekarang', { exact: true })).toHaveCount(0)
  await expect(page.getByText(/Bayar Ulang|Menyiapkan Pembayaran/i)).toHaveCount(0)
  await expect(page.getByText(/Xendit/i)).toHaveCount(0)
  await expect(page.locator('a[href*="xendit" i], form[action*="xendit" i]')).toHaveCount(0)
}

export async function loginAsCashier(page: Page, email: string, password: string) {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata Sandi').fill(password)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page).not.toHaveURL(/\/admin\/login(?:\?|$)/)
}
