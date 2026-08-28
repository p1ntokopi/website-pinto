import { ReceiptData, ThermalPaperWidth } from '@/lib/receipt/receipt-types'
import {
  PrintReceiptOptions,
  PrinterProvider,
  PrinterStatus,
  PrinterConfig,
  PrinterUnavailableError,
  DEFAULT_PRINTER_CONFIG,
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

const STORAGE_KEY = 'pinto.printer.config'

/**
 * PrinterService - the only entry point the receipt flow talks to.
 *
 * The active provider is persisted in localStorage and selectable from the
 * admin settings: "web-print" (browser print fallback) and "escpos-bluetooth"
 * (Web Serial to Bluetooth Classic SPP printers such as the PandaPrinter
 * PRJ-58D). Receipt formatting stays untouched — providers only differ in how
 * the receipt reaches paper.
 */
function getStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  return typeof localStorage === 'undefined' ? null : localStorage
}

function isPrinterConfig(value: unknown): value is PrinterConfig {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.activeProviderId === 'string' &&
    (v.paperWidth === 58 || v.paperWidth === 80) &&
    typeof v.baudRate === 'number'
  )
}
function readConfig(): PrinterConfig {
  const storage = getStorage()
  if (!storage) return { ...DEFAULT_PRINTER_CONFIG }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PRINTER_CONFIG }
    const parsed: unknown = JSON.parse(raw)
    if (!isPrinterConfig(parsed)) return { ...DEFAULT_PRINTER_CONFIG }
    return { ...DEFAULT_PRINTER_CONFIG, ...parsed }
  } catch {
    return { ...DEFAULT_PRINTER_CONFIG }
  }
}

function writeConfig(config: PrinterConfig): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // Private mode / quota errors should never break printing.
  }
}

function getProviderById(id: string): PrinterProvider {
  return PROVIDERS.find((provider) => provider.id === id) ?? PROVIDERS[0]
}

function getActive(): PrinterProvider {
  return getProviderById(readConfig().activeProviderId)
}

export const PrinterService = {
  getProviders(): PrinterProvider[] {
    return PROVIDERS
  },

  getConfig(): PrinterConfig {
    return readConfig()
  },

  getActiveProviderId(): string {
    return readConfig().activeProviderId
  },

  getActiveProvider(): PrinterProvider {
    return getActive()
  },

  setActiveProvider(id: string): void {
    writeConfig({ ...readConfig(), activeProviderId: getProviderById(id).id })
  },

  setPaperWidth(paperWidth: ThermalPaperWidth): void {
    writeConfig({ ...readConfig(), paperWidth })
  },

  setAutoReceiptEnabled(enabled: boolean): void {
    writeConfig({ ...readConfig(), autoReceiptPrint: enabled })
  },

  async connect(): Promise<void> {
    return getActive().connect()
  },

  async disconnect(): Promise<void> {
    return getActive().disconnect()
  },

  /** Silent reconnect to a previously granted device (survives refreshes). */
  async tryReconnect(): Promise<boolean> {
    const provider = getActive()
    if (!provider.tryReconnect) return false
    return provider.tryReconnect()
  },

  /** Raw monospace text (kitchen tickets) via the active provider. */
  async printRawText(text: string): Promise<void> {
    const provider = getActive()
    if (!provider.printRawText) {
      throw new PrinterUnavailableError(
        'Provider printer aktif tidak mendukung cetak teks mentah.'
      )
    }
    try {
      await provider.printRawText(text)
    } catch (err) {
      if (err instanceof PrinterUnavailableError) throw err
      throw new PrinterUnavailableError(
        err instanceof Error ? err.message : 'Gagal mencetak tiket. Periksa printer Anda.'
      )
    }
  },

  async printReceipt(data: ReceiptData, options?: PrintReceiptOptions): Promise<void> {
    try {
      await getActive().printReceipt(data, options)
    } catch (err) {
      if (err instanceof PrinterUnavailableError) throw err
      throw new PrinterUnavailableError(
        err instanceof Error ? err.message : 'Gagal mencetak struk. Periksa printer Anda.'
      )
    }
  },

  async testPrint(): Promise<void> {
    return getActive().testPrint()
  },

  async getStatus(): Promise<PrinterStatus> {
    return getActive().getStatus()
  },
}
