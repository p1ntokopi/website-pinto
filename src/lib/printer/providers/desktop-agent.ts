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
 * Prepared, NOT implemented. Local agent (Windows/macOS helper) that receives
 * ESC/POS bytes over HTTP/WebSocket and writes them to a USB/Bluetooth printer.
 */
export class DesktopPrintAgentProvider implements PrinterProvider {
  readonly id = 'desktop-print-agent'
  readonly label = 'Desktop Print Agent'
  readonly capabilities: PrinterCapabilities = {
    supportsBluetooth: false,
    supportsWebPrint: false,
    requiresDriver: true,
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