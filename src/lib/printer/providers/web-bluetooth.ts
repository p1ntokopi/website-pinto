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
 * Prepared, NOT implemented. Chrome's Web Bluetooth API - viable only for
 * BLE printers and requires user activation per connection.
 */
export class WebBluetoothProvider implements PrinterProvider {
  readonly id = 'web-bluetooth'
  readonly label = 'Web Bluetooth'
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