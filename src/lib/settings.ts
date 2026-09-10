import { createClient } from '@/lib/supabase/server'
import { BUSINESS } from '@/config/business'

export type AppSettings = {
  businessName: string
  tagline: string
  address: string
  website: string
  wifiName: string
  wifiPassword: string
  footerMessage: string
  openingHours: string
}

function defaults(): AppSettings {
  return {
    businessName: BUSINESS.name,
    tagline: BUSINESS.tagline,
    address: BUSINESS.address,
    website: BUSINESS.website,
    wifiName: BUSINESS.wifiName,
    wifiPassword: BUSINESS.wifiPassword,
    footerMessage: BUSINESS.footerMessage,
    openingHours: '13.00 – 24.00 (Setiap hari)',
  }
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

/**
 * Server-side accessor for the singleton app_settings row. Falls back to the
 * compiled-in BUSINESS config if the table/row is unavailable, so the site
 * never breaks because of a settings problem.
 */
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('app_settings')
      .select(
        'business_name, tagline, address, website, wifi_name, wifi_password, footer_message, opening_hours',
      )
      .eq('id', 1)
      .maybeSingle()

    if (!data) return defaults()
    const row = data as Record<string, unknown>
    return {
      businessName: text(row.business_name, BUSINESS.name),
      tagline: text(row.tagline, BUSINESS.tagline),
      address: text(row.address, BUSINESS.address),
      website: text(row.website, BUSINESS.website),
      wifiName: text(row.wifi_name, BUSINESS.wifiName),
      wifiPassword: text(row.wifi_password, BUSINESS.wifiPassword),
      footerMessage: text(row.footer_message, BUSINESS.footerMessage),
      openingHours: text(row.opening_hours, '13.00 – 24.00 (Setiap hari)'),
    }
  } catch {
    return defaults()
  }
}
