import { ReceiptData } from '@/lib/receipt/receipt-types'
import {
  PrintReceiptOptions,
  PrinterProvider,
  PrinterStatus,
  PrinterUnavailableError,
  PrinterCapabilities,
  PRINTER_COMPATIBILITY_DOC,
} from '@/lib/printer/printer-types'

const NOT_IMPLEMENTED = (id: string) =>
  new PrinterUnavailableError(
    `${id} belum diimplementasikan. Konfirmasikan dulu model printer (lihat ${PRINTER_COMPATIBILITY_DOC}).`
  )

/**
 * Prepared, NOT implemented. Bridge that hands raw ESC/POS bytes to a native
 * Android app (e.g. a print helper) for reliable Bluetooth Classic printing.
 */
export class AndroidPrintBridgeProvider implements PrinterProvider {
  readonly id = 'android-print-bridge'
  readonly label = 'Android Print Bridge'
  readonly capabilities: PrinterCapabilities = {
    supportsBluetooth: true,
    supportsWebPrint: false,
    requiresDriver: false,
    supportedPaperWidths: [58, 80],
  }

  async connect(): Promise<void> {
    throw NOT_IMPLEMENTED(this.id)
  }
  async disconnect(): Promise<void> {
    throw NOT_IMPLEMENTED(this.id)
  }
  async printReceipt(_data: ReceiptData, _options?: PrintReceiptOptions): Promise<void> {
    throw NOT_IMPLEMENTED(this.id)
  }
  async testPrint(): Promise<void> {
    throw NOT_IMPLEMENTED(this.id)
  }
  async getStatus(): Promise<PrinterStatus> {
    return 'disconnected'
  }
}