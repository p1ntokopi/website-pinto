'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bluetooth, Loader2, Printer, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrinterService } from '@/lib/printer/printer-service'
import type { PrinterStatus } from '@/lib/printer/printer-types'
import type { ThermalPaperWidth } from '@/lib/receipt/receipt-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

const PROVIDER_OPTIONS = [
  {
    id: 'web-print',
    label: 'Print Browser',
    description:
      'Struk dibuka di tab baru dan dicetak lewat dialog print browser. Bekerja dengan printer apa pun yang terpasang di perangkat.',
  },
  {
    id: 'escpos-bluetooth',
    label: 'ESC/POS Bluetooth',
    description:
      'Struk dikirim langsung via Bluetooth Classic (SPP) menggunakan Web Serial API (Desktop PC / Laptop) — tanpa watermark.',
  },
  {
    id: 'web-bluetooth',
    label: 'Web Bluetooth (BLE)',
    description:
      'Koneksi langsung dari Chrome HP Android via Bluetooth Low Energy (BLE) — instan, tanpa aplikasi tambahan, dan tanpa watermark.',
  },
  {
    id: 'android-print-bridge',
    label: 'RawBT (Android)',
    description:
      'Struk dikirim langsung ke aplikasi RawBT di HP Android via ESC/POS — otomatis pas 58mm/80mm.',
  },
] as const

const PAPER_OPTIONS: { value: ThermalPaperWidth; label: string }[] = [
  { value: 58, label: '58mm' },
  { value: 80, label: '80mm' },
]

const STATUS_META: Record<PrinterStatus, { label: string; className: string }> = {
  connected: { label: 'Tersambung', className: 'border-success/30 bg-success/10 text-success' },
  connecting: { label: 'Menghubungkan…', className: 'border-coffee/30 bg-coffee/10 text-coffee' },
  disconnected: {
    label: 'Tidak tersambung',
    className: 'border-border-custom bg-muted text-muted-text',
  },
  error: { label: 'Error', className: 'border-danger/30 bg-danger/10 text-danger' },
}

type BusyAction = 'connect' | 'disconnect' | 'test' | null

export function PrinterSettings() {
  const [providerId, setProviderId] = useState<string>('web-print')
  const [paperWidth, setPaperWidth] = useState<ThermalPaperWidth>(58)
  const [autoReceipt, setAutoReceipt] = useState(false)
  const [status, setStatus] = useState<PrinterStatus>('disconnected')
  const [busy, setBusy] = useState<BusyAction>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await PrinterService.getStatus())
    } catch {
      setStatus('disconnected')
    }
  }, [])

  // Restore the persisted config, then silently reconnect to a previously
  // granted Bluetooth port (no picker) so a page refresh keeps the printer up.
  useEffect(() => {
    let cancelled = false

    async function restore() {
      const config = PrinterService.getConfig()
      if (config.activeProviderId === 'escpos-bluetooth') {
        await PrinterService.tryReconnect()
      }
      await refreshStatus()
      if (cancelled) return
      setProviderId(config.activeProviderId)
      setPaperWidth(config.paperWidth)
      setAutoReceipt(config.autoReceiptPrint)
    }
    void restore()

    return () => {
      cancelled = true
    }
  }, [refreshStatus])

  async function handleSelectProvider(id: string) {
    if (id === providerId) return
    setError(null)
    PrinterService.setActiveProvider(id)
    setProviderId(id)
    await refreshStatus()
  }

  async function handleConnect() {
    setBusy('connect')
    setError(null)
    try {
      await PrinterService.connect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyambungkan printer.')
    } finally {
      setBusy(null)
      await refreshStatus()
    }
  }

  async function handleDisconnect() {
    setBusy('disconnect')
    setError(null)
    try {
      await PrinterService.disconnect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memutus koneksi printer.')
    } finally {
      setBusy(null)
      await refreshStatus()
    }
  }

  async function handleTestPrint() {
    setBusy('test')
    setError(null)
    try {
      await PrinterService.testPrint()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test print gagal.')
    } finally {
      setBusy(null)
      await refreshStatus()
    }
  }

  function handlePaperWidth(width: ThermalPaperWidth) {
    PrinterService.setPaperWidth(width)
    setPaperWidth(width)
  }

  const isDirectBluetooth = providerId === 'escpos-bluetooth' || providerId === 'web-bluetooth'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Metode Cetak</CardTitle>
          <CardDescription>Pilih bagaimana struk dikirim ke printer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="inline-flex rounded-sm border border-border-custom bg-muted/40 p-0.5">
            {PROVIDER_OPTIONS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleSelectProvider(provider.id)}
                aria-pressed={providerId === provider.id}
                className={cn(
                  'rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
                  providerId === provider.id
                    ? 'bg-ink text-paper'
                    : 'text-muted-text hover:text-ink'
                )}
              >
                {provider.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-muted-text">
            {PROVIDER_OPTIONS.find((provider) => provider.id === providerId)?.description}
          </p>

          <div className="flex items-center justify-between gap-3 rounded-sm border border-border-custom/60 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Auto-print struk saat lunas</p>
              <p className="mt-0.5 text-xs text-muted-text">
                Struk otomatis dikirim ke printer aktif ketika ada pembayaran berstatus PAID
                (misalnya tab dapur/monitor terbuka).
              </p>
            </div>
            <Switch
              checked={autoReceipt}
              onCheckedChange={(checked) => {
                PrinterService.setAutoReceiptEnabled(checked)
                setAutoReceipt(checked)
              }}
              aria-label="Auto-print struk saat lunas"
            />
          </div>

          {isDirectBluetooth && (
            <div className="space-y-3 rounded-sm border border-border-custom/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bluetooth className="h-4 w-4 text-coffee" aria-hidden="true" />
                  <span className="text-sm font-semibold text-ink">Printer Bluetooth</span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                      STATUS_META[status].className
                    )}
                  >
                    {STATUS_META[status].label}
                  </span>
                </div>
                <div className="flex gap-2">
                  {status === 'connected' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={busy !== null}
                    >
                      Putuskan
                    </Button>
                  ) : (
                    <Button onClick={handleConnect} disabled={busy !== null}>
                      {busy === 'connect' ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Bluetooth className="h-4 w-4" aria-hidden="true" />
                      )}
                      Sambungkan
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleTestPrint}
                    disabled={busy !== null || (isDirectBluetooth && status !== 'connected')}
                  >
                    {busy === 'test' ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Printer className="h-4 w-4" aria-hidden="true" />
                    )}
                    Test Print
                  </Button>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-text">
                {providerId === 'web-bluetooth'
                  ? 'Buka di Google Chrome HP Android dengan Bluetooth aktif. Nyalakan printer thermal Anda, lalu klik "Sambungkan" untuk memilih printer dari daftar pop-up Bluetooth.'
                  : 'Pair printer di pengaturan Bluetooth Windows/Laptop terlebih dahulu (PIN: 0000), lalu klik Sambungkan (didukung Chrome/Edge desktop 117+).'}
              </p>
            </div>
          )}

          {!isDirectBluetooth && (
            <div>
              <Button variant="outline" onClick={handleTestPrint} disabled={busy !== null}>
                {busy === 'test' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Printer className="h-4 w-4" aria-hidden="true" />
                )}
                Test Print
              </Button>
              <p className="mt-2 text-xs text-muted-text">
                {providerId === 'android-print-bridge'
                  ? 'Mengirim struk langsung ke aplikasi RawBT di HP via ESC/POS.'
                  : 'Membuka dialog cetak browser Android / Windows (bebas watermark).'}
              </p>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lebar Kertas</CardTitle>
          <CardDescription>
            Sesuaikan dengan kertas printer thermal. 58mm = 32 karakter per baris, 80mm = 48
            karakter per baris.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="inline-flex rounded-sm border border-border-custom bg-muted/40 p-0.5">
            {PAPER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePaperWidth(option.value)}
                aria-pressed={paperWidth === option.value}
                className={cn(
                  'rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
                  paperWidth === option.value
                    ? 'bg-ink text-paper'
                    : 'text-muted-text hover:text-ink'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
