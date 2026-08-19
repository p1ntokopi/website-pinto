import { ReceiptData } from '@/lib/receipt/receipt-types'
import {
  PrintReceiptOptions,
  PrinterProvider,
  PrinterStatus,
  PrinterUnavailableError,
} from '@/lib/printer/printer-types'
import { WebPrintProvider } from '@/lib/printer/providers/web-print'
import { EscPosBluetoothProvider } from '@/lib/printer/providers/escpos-bluetooth'
import { WebBluetoothProvider } from '@/lib/printer/providers/web-bluetooth'
import { AndroidPrintBridgeProvider } from '@/lib/printer/providers/android-bridge'
import { DesktopPrintAgentProvider } from '@/lib/printer/providers/desktop-agent'

const PROVIDERS: PrinterProvider[] = [
  new WebPrintProvider(),
  new EscPosBluetoothProvider(),
  new WebBluetoothProvider(),
  new AndroidPrintBridgeProvider(),
  new DesktopPrintAgentProvider(),
]

/**
 * PrinterService - the only entry point the receipt flow talks to.
 *
 * The active provider is replaceable: today it is the browser print fallback
 * (WebPrintProvider). Once the exact printer model is confirmed, a new
 * ESC/POS provider plugs in here without touching receipt formatting.
 *
 *   PrinterService
 *   ├── WebPrintProvider          (active)
 *   ├── EscPosBluetoothProvider   (prepared, not implemented)
 *   ├── WebBluetoothProvider      (prepared, not implemented)
 *   ├── AndroidPrintBridgeProvider(prepared, not implemented)
 *   └── DesktopPrintAgentProvider (prepared, not implemented)
 */
export const PrinterService = {
  getProviders(): PrinterProvider[] {
    return PROVIDERS
  },

  getActiveProvider(): PrinterProvider {
    return PROVIDERS[0]
  },

  async connect(): Promise<void> {
    return PROVIDERS[0].connect()
  },

  async disconnect(): Promise<void> {
    return PROVIDERS[0].disconnect()
  },

  async printReceipt(data: ReceiptData, options?: PrintReceiptOptions): Promise<void> {
    try {
      await PROVIDERS[0].printReceipt(data, options)
    } catch (err) {
      if (err instanceof PrinterUnavailableError) throw err
      throw new PrinterUnavailableError(
        err instanceof Error ? err.message : 'Gagal mencetak struk. Periksa printer Anda.'
      )
    }
  },

  async testPrint(): Promise<void> {
    return PROVIDERS[0].testPrint()
  },

  async getStatus(): Promise<PrinterStatus> {
    return PROVIDERS[0].getStatus()
  },
}