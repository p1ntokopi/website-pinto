// Mobile responsiveness audit for the admin/owner dashboard.
//
// Visits every dashboard route at 320px and 390px, logged in as admin and
// owner, and reports elements that extend past the viewport. Such elements
// either push the page into horizontal scroll or get clipped by the shell's
// overflow guard — both are mobile bugs.
//
// Usage: node scripts/check-mobile-responsive.mjs   (dev server on :3000)
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3000'
const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? 'admin@pinto.kopi'
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? 'admin123'
const OWNER_EMAIL = process.env.PLAYWRIGHT_OWNER_EMAIL ?? 'owner@pinto.kupi'
const OWNER_PASSWORD = process.env.PLAYWRIGHT_OWNER_PASSWORD ?? 'owner123'

const VIEWPORTS = [
  { name: '320', width: 320, height: 800 },
  { name: '390', width: 390, height: 844 },
]

// Runs inside the page: finds elements wider than the viewport.
const MEASURE = () => {
  const vw = document.documentElement.clientWidth
  const sw = Math.max(
    document.documentElement.scrollWidth,
    document.body ? document.body.scrollWidth : 0
  )
  const scrollableAncestor = (el) => {
    let p = el.parentElement
    while (p && p !== document.body) {
      const s = getComputedStyle(p).overflowX
      if (s === 'auto' || s === 'scroll') return true
      p = p.parentElement
    }
    return false
  }
  const offenders = []
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('[aria-hidden="true"]')) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if ((r.right <= vw + 1 && r.left >= -1) || r.right <= 0) continue
    if (scrollableAncestor(el)) continue
    offenders.push({
      tag: el.tagName.toLowerCase(),
      cls:
        typeof el.className === 'string'
          ? el.className.replace(/\s+/g, ' ').slice(0, 110)
          : '',
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
      right: Math.round(r.right),
      width: Math.round(r.width),
    })
  }
  offenders.sort((a, b) => b.right - a.right)

  // Touch targets: every visible interactive control should be at least 44px
  // in its smallest dimension so it can be tapped reliably on a phone.
  const smallTargets = []
  for (const el of document.querySelectorAll(
    'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"]'
  )) {
    if (el.closest('[aria-hidden="true"]')) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (r.bottom < 0 || r.top > window.innerHeight * 6) continue
    const min = Math.min(r.width, r.height)
    if (min >= 44) continue
    // Text links inside prose are exempt: they are not tap-only controls.
    if (el.tagName === 'A' && el.closest('p, li') && r.height < 24) continue
    smallTargets.push({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28),
      w: Math.round(r.width),
      h: Math.round(r.height),
      cls:
        typeof el.className === 'string'
          ? el.className.replace(/\s+/g, ' ').slice(0, 90)
          : '',
    })
  }
  smallTargets.sort((a, b) => Math.min(a.w, a.h) - Math.min(b.w, b.h))
  return { vw, delta: sw - vw, offenders: offenders.slice(0, 6), smallTargets: smallTargets.slice(0, 8) }
}

const results = []

async function login(page, email, password) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'load', timeout: 60_000 })
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata Sandi').fill(password)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.waitForURL(
    (url) => !url.href.includes('/admin/login'),
    { timeout: 60_000 }
  )
}

async function audit(context, role, routes) {
  const page = await context.newPage()
  page.setDefaultTimeout(60_000)
  for (const route of routes) {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      try {
        await page.goto(BASE + route, { waitUntil: 'load', timeout: 60_000 })
        await page.waitForTimeout(700)
      } catch (e) {
        results.push({ role, route, vp: vp.name, error: String(e).slice(0, 90) })
        continue
      }
      const m = await page.evaluate(MEASURE)
      results.push({ role, route, vp: vp.name, ...m })
    }
  }
  return page
}

const browser = await chromium.launch()

// Logged-out: the login page itself.
{
  const ctx = await browser.newContext()
  await audit(ctx, 'anon', ['/admin/login'])
  await ctx.close()
}

// Admin routes + dynamic detail pages discovered from list pages.
{
  const ctx = await browser.newContext()
  const loginPage = await ctx.newPage()
  await login(loginPage, ADMIN_EMAIL, ADMIN_PASSWORD)
  await loginPage.close()
  // Detail routes are supplied by id: a freshly seeded database may have an
  // empty 24-hour order window, so discovery from the list page finds nothing.
  const orderId = process.env.AUDIT_ORDER_ID ?? ''
  const receiptId = process.env.AUDIT_RECEIPT_ID ?? ''
  const sessionId = process.env.AUDIT_SESSION_ID ?? ''
  const page = await audit(ctx, 'admin', [
    '/admin',
    '/admin/orders',
    '/admin/orders/new',
    '/admin/tables',
    '/admin/tables/live',
    '/admin/tables/print',
    '/admin/menu/products',
    '/admin/menu/products/new',
    '/admin/menu/categories',
    '/admin/settings',
    '/admin/kitchen',
    ...(orderId
      ? [`/admin/orders/${orderId}`, `/admin/orders/${orderId}/receipt`]
      : []),
    ...(receiptId ? [`/admin/receipts/${receiptId}`] : []),
    ...(sessionId ? [`/admin/sessions/${sessionId}`] : []),
  ])

  await page.setViewportSize({ width: 390, height: 844 })
  const dyn = []
  await page.goto(`${BASE}/admin/orders`, { waitUntil: 'load' })
  const orderHref = await page
    .locator('a[href^="/admin/orders/"]:not([href$="/new"])')
    .first()
    .getAttribute('href')
    .catch(() => null)
  if (orderHref) dyn.push(orderHref)
  await page.goto(`${BASE}/admin/menu/products`, { waitUntil: 'load' })
  const productHref = await page
    .locator('a[href^="/admin/menu/products/"]:not([href$="/new"])')
    .first()
    .getAttribute('href')
    .catch(() => null)
  if (productHref) dyn.push(productHref)
  await page.goto(`${BASE}/admin/tables/live`, { waitUntil: 'load' })
  const sessionHref = await page
    .locator('a[href^="/admin/sessions/"]')
    .first()
    .getAttribute('href')
    .catch(() => null)
  if (sessionHref) dyn.push(sessionHref)
  if (orderHref) {
    await page.goto(BASE + orderHref, { waitUntil: 'load' })
    const receiptHref = await page
      .locator('a[href^="/admin/receipts/"]')
      .first()
      .getAttribute('href')
      .catch(() => null)
    if (receiptHref) dyn.push(receiptHref)
  }
  console.log('dynamic routes found:', dyn.length ? dyn.join(', ') : '(none)')
  if (dyn.length) await audit(ctx, 'admin', dyn)
  await ctx.close()
}

// Owner routes.
{
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await login(page, OWNER_EMAIL, OWNER_PASSWORD)
  await page.close()
  await audit(ctx, 'owner', [
    '/admin/owner',
    '/admin/owner/finance',
    '/admin/owner/sales',
    '/admin/owner/expenses',
    '/admin/owner/adjustments',
    '/admin/owner/reports',
    '/admin/owner/audit',
    '/admin/owner/testimonials',
    '/admin/owner/accounts',
  ])
  await ctx.close()
}

await browser.close()

// ---- report ----
let fail = 0
let targetFails = 0
for (const r of results) {
  if (r.error) {
    fail++
    console.log(`ERROR ${r.role} ${r.route} @${r.vp}: ${r.error}`)
    continue
  }
  if (r.offenders.length > 0 || r.delta > 1) {
    fail++
    console.log(
      `FAIL  ${r.role} ${r.route} @${r.vp}  (pageDelta=${r.delta}px, vw=${r.vw})`
    )
    for (const o of r.offenders) {
      console.log(`      <${o.tag}> right=${o.right} w=${o.width} "${o.text}"`)
      console.log(`      ${o.cls}`)
    }
  }
  if (r.smallTargets?.length > 0) {
    targetFails++
    console.log(
      `TAP   ${r.role} ${r.route} @${r.vp}  ${r.smallTargets.length} control(s) below 44px`
    )
    for (const t of r.smallTargets) {
      console.log(`      <${t.tag}> ${t.w}x${t.h} "${t.text}"`)
      console.log(`      ${t.cls}`)
    }
  }
}
console.log(
  `\n${results.length} checks, ${fail} overflowing, ${targetFails} with small tap targets, ${results.length - fail} clean`
)
