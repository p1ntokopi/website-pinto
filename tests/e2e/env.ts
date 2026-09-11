export const MOBILE_VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-412', width: 412, height: 915 },
] as const

export const seededE2EEnabled = process.env.PLAYWRIGHT_SEEDED_E2E === '1'
export const mutationE2EEnabled = process.env.PLAYWRIGHT_ALLOW_MUTATIONS === '1'
export const seededTableSlug = process.env.PLAYWRIGHT_TABLE_SLUG?.trim() ?? ''
export const seededOrderNumber = process.env.PLAYWRIGHT_ORDER_NUMBER?.trim() ?? ''
export const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL?.trim() ?? ''
export const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? ''
export const seededOrderId = process.env.PLAYWRIGHT_ORDER_ID?.trim() ?? ''
export const supabaseUrl = process.env.PLAYWRIGHT_SUPABASE_URL?.trim() ?? ''
export const supabaseAnonKey = process.env.PLAYWRIGHT_SUPABASE_ANON_KEY?.trim() ?? ''

export function seededGuard(...requirements: Array<[value: boolean, message: string]>) {
  const missing = requirements.find(([value]) => !value)
  return {
    skip: !seededE2EEnabled || Boolean(missing),
    reason: !seededE2EEnabled
      ? 'Requires explicit PLAYWRIGHT_SEEDED_E2E=1 and a disposable seeded Supabase environment.'
      : missing?.[1] ?? '',
  }
}
