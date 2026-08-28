'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bluetooth, Loader2, Printer, RotateCcw, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatReceiptText } from '@/lib/receipt/receipt-service'
import { PrinterService } from '@/lib/printer/printer-service'
import type { PrinterStatus } from '@/lib/printer/printer-types'
import {
  ReceiptPrinter,
  type ReceiptPrinterStage,
} from '@/components/receipt/receipt-printer'
import type { ReceiptData, ThermalPaperWidth } from '@/lib/receipt/receipt-types'

const PAPER_OPTIONS: { value: ThermalPaperWidth; label: string }[] = [
  { value: 58, label: '58mm' },
  { value: 80, label: '80mm' },
]

const STATUS_LABELS: Record<PrinterStatus, string> = {
  connected: 'Tersambung',
  connecting: 'Menghubungkan…',
  disconnected: 'Tidak tersambung',
  error: 'Error',
}

const STATUS_BADGE_CLASS: Record<PrinterStatus, string> = {
  connected: 'border-success/30 bg-success/10 text-success',
  connecting: 'border-coffee/30 bg-coffee/10 text-coffee',
  disconnected: 'border-border-custom bg-muted text-muted-text',
  error: 'border-danger/30 bg-danger/10 text-danger',
}

// Slightly longer than the 3.4s feed animation so the paper finishes first.
const FEED_DURATION_MS = 3700
const TEAR_DURATION_MS = 900

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ReceiptPrintView({ orderId, receiptData }: { orderId: string; receiptData: ReceiptData }) {
  const [paperWidth, setPaperWidth] = useState<ThermalPaperWidth>(58)
  const [providerId, setProviderId] = useState<string>('web-print')
  const [status, setStatus] = useState<PrinterStatus>('disconnected')
  const [stage, setStage] = useState<ReceiptPrinterStage>('complete')
  const [hasPrinted, setHasPrinted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEscpos = providerId === 'escpos-bluetooth'

  const receiptText = formatReceiptText(receiptData, paperWidth)

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await PrinterService.getStatus())
    } catch {
      setStatus('disconnected')
    }
  }, [])

  // Restore the persisted config, silently reconnect a previously granted
  // Bluetooth port, and keep the auto browser print only for web-print.
  useEffect(() => {
    let cancelled = false
    let autoPrintTimer: ReturnType<typeof setTimeout> | undefined

    async function init() {
      const config = PrinterService.getConfig()
      if (config.activeProviderId === 'escpos-bluetooth') {
        await PrinterService.tryReconnect()
      }
      await refreshStatus()
      if (cancelled) return
      setProviderId(config.activeProviderId)
      setPaperWidth(config.paperWidth)
      if (config.activeProviderId === 'web-print') {
        autoPrintTimer = setTimeout(() => window.print(), 500)
      }
    }
    void init()

    return () => {
      cancelled = true
      if (autoPrintTimer) clearTimeout(autoPrintTimer)
    }
  }, [refreshStatus])

  async function handleQuickConnect() {
    setConnecting(true)
    setError(null)
    try {
      await PrinterService.connect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyambungkan printer.')
    } finally {
      setConnecting(false)
      await refreshStatus()
    }
  }

  async function handlePrint() {
    setError(null)
    if (!isEscpos) {
      window.print()
      return
    }

    setBusy(true)
    try {
      if (status !== 'connected') {
        setStage('processing')
        setConnecting(true)
        await PrinterService.connect()
        setConnecting(false)
        setStatus('connected')
      }

      setStage('printing')
      let printError: unknown = null
      const printPromise = PrinterService.printReceipt(receiptData, { paperWidth }).catch(
        (err: unknown) => {
          printError = err
        },
      )

      // The machine feeds while the printer does the real work.
      await sleep(FEED_DURATION_MS)
      setStage('tearing')
      await sleep(TEAR_DURATION_MS)
      setStage('complete')
      setHasPrinted(true)

      await printPromise
      if (printError) {
        setError(
          printError instanceof Error
            ? printError.message
            : 'Gagal mencetak struk. Periksa printer Anda.'
        )
        await refreshStatus()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencetak struk.')
      setStage('complete')
      await refreshStatus()
    } finally {
      setBusy(false)
      setConnecting(false)
    }
  }

  function handlePaperWidthChange(width: ThermalPaperWidth) {
    PrinterService.setPaperWidth(width)
    setPaperWidth(width)
  }

  const printerStatusText =
    stage === 'processing'
      ? connecting
        ? 'Menyambungkan ke printer…'
        : 'Menyiapkan printer…'
      : stage === 'printing'
        ? 'Mencetak struk…'
        : stage === 'tearing'
          ? 'Menyobek struk…'
          : hasPrinted
            ? 'Struk tercetak'
            : 'Pratinjau struk'

  return (
    <div className="min-h-screen bg-muted/40 pb-24">
      <div className="sticky top-0 z-10 border-b border-border-custom/60 bg-paper/95 px-4 py-3 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/orders/${orderId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-text transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none rounded-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Kembali
            </Link>
            {isEscpos && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                  STATUS_BADGE_CLASS[status]
                )}
              >
                {STATUS_LABELS[status]}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isEscpos && status !== 'connected' && (
              <button
                type="button"
                onClick={handleQuickConnect}
                disabled={connecting || busy}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-border-custom bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-60"
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Bluetooth className="h-4 w-4" aria-hidden="true" />
                )}
                Sambungkan
              </button>
            )}
            <div className="inline-flex rounded-sm border border-border-custom bg-muted/40 p-0.5">
              {PAPER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePaperWidthChange(opt.value)}
                  aria-pressed={paperWidth === opt.value}
                  className={cn(
                    'rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
                    paperWidth === opt.value ? 'bg-ink text-paper' : 'text-muted-text hover:text-ink'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {isEscpos && status !== 'connected' && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-11 items-center justify-center rounded-sm border border-border-custom bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
              >
                Cetak via Browser
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              disabled={busy || connecting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-coffee px-4 text-sm font-semibold text-paper transition-colors hover:bg-coffee/90 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-60"
            >
              {busy || connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Printer className="h-4 w-4" aria-hidden="true" />
              )}
              Cetak Sekarang
            </button>
          </div>
        </div>
        {error && (
          <div className="mx-auto mt-3 w-full max-w-3xl">
            <p
              role="alert"
              className="flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-10 print:hidden">
        <div className="flex justify-center">
          <ReceiptPrinter.Root stage={stage} tuckAway={false} aria-label="Pratinjau struk">
            <ReceiptPrinter.Machine>
              <ReceiptPrinter.Header>
                <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/40">
                  PandaPrinter PRJ-58D
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'mr-1 inline-block size-2 rounded-full shadow-[0_0_6px_rgba(46,139,87,0.9)] transition-colors',
                    !isEscpos || status === 'connected' ? 'bg-success/80' : 'bg-danger/70'
                  )}
                />
              </ReceiptPrinter.Header>
              <ReceiptPrinter.Screen>
                <ReceiptPrinter.Status>{printerStatusText}</ReceiptPrinter.Status>
              </ReceiptPrinter.Screen>
              <ReceiptPrinter.Output>
                <ReceiptPrinter.Paper>
                  <pre className="overflow-x-auto whitespace-pre text-[13px] leading-5">
                    {receiptText}
                  </pre>
                </ReceiptPrinter.Paper>
              </ReceiptPrinter.Output>
            </ReceiptPrinter.Machine>
          </ReceiptPrinter.Root>
        </div>
        <p className="mt-6 text-center text-xs text-muted-text">
          Struk dicetak dengan lebar kertas {paperWidth}mm · lebar {paperWidth === 58 ? 32 : 48} karakter per baris.
        </p>
      </div>

      {/* What the browser print dialog receives — the printer visual above is screen-only. */}
      <pre className="hidden whitespace-pre font-mono text-[13px] leading-5 text-black print:block">
        {receiptText}
      </pre>
    </div>
  )
}
