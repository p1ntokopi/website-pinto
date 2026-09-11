# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cashier-session.spec.ts >> cashier-first POS (Pesanan Baru) >> keeps the retired payment UI absent from the POS
- Location: tests\e2e\cashier-session.spec.ts:119:7

# Error details

```
Error: expect(page).not.toHaveURL(expected) failed

Expected pattern: not /\/admin\/login(?:\?|$)/
Received string: "http://127.0.0.1:3000/admin/login?email=admin%40pinto.kopi&password=admin123"
Timeout: 5000ms

Call log:
  - Expect "not toHaveURL" with timeout 5000ms
    14 × locator resolved to <html lang="id" class="plus_jakarta_sans_c64c55c4-module__YuBn5q__variable cormorant_garamond_55c9a0cf-module__nMUNUG__variable antialiased">…</html>
       - unexpected value "http://127.0.0.1:3000/admin/login?email=admin%40pinto.kopi&password=admin123"

```

```yaml
- text: P Pinto Admin Masukkan kredensial Anda untuk mengakses operasional. Email
- textbox "Email":
  - /placeholder: staff@pinto.id
- text: Kata Sandi
- textbox "Kata Sandi"
- button "Masuk"
- region "Notifications"
```

# Test source

```ts
  1  | import { expect, type Page } from '@playwright/test'
  2  | 
  3  | export async function expectRetiredPaymentUiAbsent(page: Page) {
  4  |   await expect(page.getByText('Bayar Sekarang', { exact: true })).toHaveCount(0)
  5  |   await expect(page.getByText(/Bayar Ulang|Menyiapkan Pembayaran/i)).toHaveCount(0)
  6  |   await expect(page.getByText(/Xendit/i)).toHaveCount(0)
  7  |   await expect(page.locator('a[href*="xendit" i], form[action*="xendit" i]')).toHaveCount(0)
  8  | }
  9  | 
  10 | export async function loginAsCashier(page: Page, email: string, password: string) {
  11 |   await page.goto('/admin/login')
  12 |   await page.getByLabel('Email').fill(email)
  13 |   await page.getByLabel('Kata Sandi').fill(password)
  14 |   await page.getByRole('button', { name: 'Masuk', exact: true }).click()
> 15 |   await expect(page).not.toHaveURL(/\/admin\/login(?:\?|$)/)
     |                          ^ Error: expect(page).not.toHaveURL(expected) failed
  16 | }
  17 | 
```