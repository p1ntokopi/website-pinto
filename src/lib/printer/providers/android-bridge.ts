import { DEFAULT_PAPER_WIDTH, ReceiptData, ThermalPaperWidth } from '@/lib/receipt/receipt-types'
import { formatReceiptText } from '@/lib/receipt/receipt-service'
import { encodeReceipt } from '@/lib/printer/escpos-encoder'
import { createSampleReceipt } from '@/lib/receipt/sample-receipt'
import {
  PrintReceiptOptions,
  PrinterProvider,
  PrinterStatus,
  PrinterUnavailableError,
  PrinterCapabilities,
} from '@/lib/printer/printer-types'

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * AndroidPrintBridgeProvider - hands raw ESC/POS bytes directly to the RawBT app
 * on Android devices via its native rawbt: URL scheme.
 *
 * This completely bypasses the Android system print dialog and prints with exact
 * 58mm/80mm thermal paper dimensions and zero margin.
 */
export class AndroidPrintBridgeProvider implements PrinterProvider {
  readonly id = 'android-print-bridge'
  readonly label = 'RawBT (Android)'
  readonly capabilities: PrinterCapabilities = {
    supportsBluetooth: true,
    supportsWebPrint: false,
    supportsWebSerial: false,
    requiresDriver: false,
    supportedPaperWidths: [58, 80],
  }

  async connect(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new PrinterUnavailableError('Provider ini hanya dapat dijalankan di browser HP Android.')
    }
  }

  async disconnect(): Promise<void> {
    // Nothing to release.
  }

  async printReceipt(data: ReceiptData, options?: PrintReceiptOptions): Promise<void> {
    if (typeof window === 'undefined') return

    const paperWidth: ThermalPaperWidth = options?.paperWidth ?? DEFAULT_PAPER_WIDTH
    const payload = encodeReceipt(formatReceiptText(data, paperWidth))
    const base64 = uint8ArrayToBase64(payload)

    // Trigger RawBT app with binary ESC/POS payload
    const rawBtUrl = `rawbt:base64,${base64}`

    // Use a temporary hidden anchor click for cleanest Android intent dispatching
    const a = document.createElement('a')
    a.href = rawBtUrl
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
    }, 500)
  }

  async testPrint(): Promise<void> {
    await this.printReceipt(createSampleReceipt())
  }

  async getStatus(): Promise<PrinterStatus> {
    return typeof window !== 'undefined' ? 'connected' : 'disconnected'
  }
}