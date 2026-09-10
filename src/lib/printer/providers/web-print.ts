import {
  DEFAULT_PAPER_WIDTH,
  ReceiptData,
  ThermalPaperWidth,
} from '@/lib/receipt/receipt-types'
import { renderReceiptHtml } from '@/lib/receipt/receipt-html'
import { createSampleReceipt } from '@/lib/receipt/sample-receipt'
import {
  PrintReceiptOptions,
  PrinterProvider,
  PrinterStatus,
  PrinterUnavailableError,
  PrinterCapabilities,
} from '@/lib/printer/printer-types'

/**
 * Opens the print popup, prints `copies` times, then closes the popup
 * automatically so print jobs don't leave stray tabs behind.
 */
function openPrintWindow(html: string, copies: number): Window {
  const win = window.open('', '_blank', 'width=340,height=520')
  if (!win) {
    throw new PrinterUnavailableError(
      'Popup diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.'
    )
  }

  // Close the popup as soon as the print dialog is dismissed (and a delayed
  // fallback for browsers that don't fire `afterprint` reliably).
  win.addEventListener('afterprint', () => win.close())

  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()

  setTimeout(() => {
    for (let i = 0; i < copies; i++) {
      win.print()
    }
    setTimeout(() => win.close(), 400)
  }, 350)

  return win
}

/**
 * WebPrintProvider - browser print fallback.
 * Renders the thermal receipt in a new window, prints it, and closes the
 * popup automatically when the print dialog is dismissed.
 */
export class WebPrintProvider implements PrinterProvider {
  readonly id = 'web-print'
  readonly label = 'Print Browser'
  readonly capabilities: PrinterCapabilities = {
    supportsBluetooth: false,
    supportsWebPrint: true,
    supportsWebSerial: false,
    requiresDriver: true,
    supportedPaperWidths: [58, 80],
  }

  async connect(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new PrinterUnavailableError('Web print hanya tersedia di browser.')
    }
  }

  async disconnect(): Promise<void> {
    // Nothing to release.
  }

  async printReceipt(data: ReceiptData, options?: PrintReceiptOptions): Promise<void> {
    const paperWidth: ThermalPaperWidth = options?.paperWidth ?? DEFAULT_PAPER_WIDTH
    const copies = options?.copies ?? 1
    openPrintWindow(renderReceiptHtml(data, paperWidth), copies)
  }

  async testPrint(): Promise<void> {
    openPrintWindow(renderReceiptHtml(createSampleReceipt(), DEFAULT_PAPER_WIDTH), 1)
  }

  async getStatus(): Promise<PrinterStatus> {
    if (typeof window === 'undefined') return 'disconnected'
    return 'connected'
  }
}
