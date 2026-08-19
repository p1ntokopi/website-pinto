import { ReceiptData, ThermalPaperWidth } from '@/lib/receipt/receipt-types'

export type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export type PrinterCapabilities = {
  supportsBluetooth: boolean
  supportsWebPrint: boolean
  requiresDriver: boolean
  supportedPaperWidths: ThermalPaperWidth[]
}

export type PrintReceiptOptions = {
  paperWidth?: ThermalPaperWidth
  copies?: number
}

export interface PrinterProvider {
  readonly id: string
  readonly label: string
  readonly capabilities: PrinterCapabilities
  connect(): Promise<void>
  disconnect(): Promise<void>
  printReceipt(data: ReceiptData, options?: PrintReceiptOptions): Promise<void>
  testPrint(): Promise<void>
  getStatus(): Promise<PrinterStatus>
}

export class PrinterUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PrinterUnavailableError'
  }
}

export const PRINTER_COMPATIBILITY_DOC = 'docs/printer-compatibility.md'