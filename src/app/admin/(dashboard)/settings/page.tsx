import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAppSettings } from '@/lib/settings'
import { PrinterSettings } from '@/components/admin/settings/printer-settings'
import { BusinessSettingsForm } from '@/components/admin/settings/business-settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Pengaturan - Pinto Admin',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [settings, { data: profile }] = await Promise.all([
    getAppSettings(),
    user
      ? supabase.from('profiles').select('role').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])
  const isOwner = profile?.role === 'owner'

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Sistem
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
          Pengaturan
        </h1>
        <p className="mt-2 text-sm text-muted-text">
          Konfigurasi printer struk dan preferensi operasional kasir.
        </p>
      </div>

      <PrinterSettings />

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle>Profil Bisnis</CardTitle>
            <CardDescription>
              Informasi yang tampil di struk, halaman pelanggan, dan situs marketing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BusinessSettingsForm
              initialSettings={{
                businessName: settings.businessName,
                tagline: settings.tagline,
                address: settings.address,
                website: settings.website,
                wifiName: settings.wifiName,
                wifiPassword: settings.wifiPassword,
                footerMessage: settings.footerMessage,
                openingHours: settings.openingHours,
              }}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
