import {
  DEFAULT_PAPER_WIDTH,
  ReceiptData,
  ThermalPaperWidth,
} from '@/lib/receipt/receipt-types'
import { renderReceiptHtml } from '@/lib/receipt/receipt-html'
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
    const sample: ReceiptData = {
      business: {
        name: 'Pinto Coffee',
        tagline: 'Kopi • Makanan • Biji Kopi',
        address: 'Jl. Flamboyan No. 8, Tajur Halang, Bogor',
        website: 'www.pintokopi.web.id',
        wifiName: 'P1NTO',
        wifiPassword: 'terimakasih',
        footerMessage: 'Terima kasih telah berkunjung.',
      },
      orderNumber: 'PNT-00000',
      tableLabel: 'MEJA 01',
      createdAt: new Date().toISOString(),
      items: [
        {
          name: 'Sanger Latte',
          variant: null,
          quantity: 1,
          unitPrice: 15000,
          subtotal: 15000,
          notes: null,
          options: [],
        },
      ],
      subtotal: 15000,
      discount: 0,
      tax: 0,
      total: 15000,
      payment: { method: 'ONLINE', channel: null, status: 'PAID' },
      notes: null,
    }

    const win = window.open('', '_blank', 'width=340,height=520')
    if (!win) {
      throw new PrinterUnavailableError(
        'Popup diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.'
      )
    }
    win.document.open()
    win.document.write(renderReceiptHtml(sample, DEFAULT_PAPER_WIDTH))
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 350)
  }

  async getStatus(): Promise<PrinterStatus> {
    if (typeof window === 'undefined') return 'disconnected'
    return 'connected'
  }
}