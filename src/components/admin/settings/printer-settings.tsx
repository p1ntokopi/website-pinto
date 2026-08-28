'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bluetooth, Loader2, Printer, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrinterService } from '@/lib/printer/printer-service'
import type { PrinterStatus } from '@/lib/printer/printer-types'
import type { ThermalPaperWidth } from '@/lib/receipt/receipt-types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
      'Struk dikirim langsung ke printer thermal via Bluetooth Classic (SPP) menggunakan Web Serial API — tanpa dialog print browser.',
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

  const isEscpos = providerId === 'escpos-bluetooth'

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

          {isEscpos && (
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
                    disabled={busy !== null || (isEscpos && status !== 'connected')}
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
                Pair printer di pengaturan Bluetooth perangkat terlebih dahulu (pairing code:{' '}
                <span className="font-semibold text-ink">0000</span>), lalu klik Sambungkan.
                Didukung Chrome/Edge desktop 117+ dan Android Chrome 138+. Safari &amp; Firefox
                tidak mendukung Web Serial — gunakan &quot;Print Browser&quot; sebagai fallback.
              </p>
            </div>
          )}

          {!isEscpos && (
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
                Membuka dialog print browser dengan struk contoh.
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
