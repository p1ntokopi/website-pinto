import type { Metadata } from 'next'
import { PrinterSettings } from '@/components/admin/settings/printer-settings'

export const metadata: Metadata = {
  title: 'Pengaturan - Pinto Admin',
}

export default function SettingsPage() {
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
    </div>
  )
}
