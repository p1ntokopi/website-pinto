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
 * WebPrintProvider - browser print fallback, active today.
 * Renders the thermal receipt in a new window and calls print().
 * This is what makes the "Cetak Struk" button work right now, before the
 * Bluetooth ESC/POS provider is implemented (see docs/printer-compatibility.md).
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

    const win = window.open('', '_blank', 'width=340,height=520')
    if (!win) {
      throw new PrinterUnavailableError(
        'Popup diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.'
      )
    }

    win.document.open()
    win.document.write(renderReceiptHtml(data, paperWidth))
    win.document.close()
    win.focus()

    // Wait for the document to be laid out before printing.
    setTimeout(() => {
      for (let i = 0; i < copies; i++) {
        win.print()
      }
    }, 350)
  }

  async testPrint(): Promise<void> {
    const win = window.open('', '_blank', 'width=340,height=520')
    if (!win) {
      throw new PrinterUnavailableError(
        'Popup diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.'
      )
    }
    win.document.open()
    win.document.write(renderReceiptHtml(createSampleReceipt(), DEFAULT_PAPER_WIDTH))
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 350)
  }

  async printRawText(text: string): Promise<void> {
    if (typeof window === 'undefined') {
      throw new PrinterUnavailableError('Web print hanya tersedia di browser.')
    }
    const win = window.open('', '_blank', 'width=340,height=520')
    if (!win) {
      throw new PrinterUnavailableError(
        'Popup diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.'
      )
    }
    const escaped = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    win.document.open()
    win.document.write(
      `<!doctype html><html><head><title>Tiket</title><style>` +
        `body{font-family:monospace;font-size:13px;line-height:1.35;margin:8px;color:#000}` +
        `pre{margin:0;white-space:pre-wrap}` +
        `</style></head><body><pre>${escaped}</pre></body></html>`
    )
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 250)
  }

  async getStatus(): Promise<PrinterStatus> {
    if (typeof window === 'undefined') return 'disconnected'
    return 'connected'
  }
}