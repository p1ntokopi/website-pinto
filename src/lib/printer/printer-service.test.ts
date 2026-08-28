import { describe, it, expect, beforeEach } from 'vitest'
import { PrinterService } from '@/lib/printer/printer-service'

const STORAGE_KEY = 'pinto.printer.config'

function installLocalStorageStub(): void {
  const store = new Map<string, string>()
  ;(globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  }
}

describe('PrinterService dynamic provider selection', () => {
  beforeEach(() => {
    installLocalStorageStub()
  })

  it('defaults to web-print when nothing is stored', () => {
    expect(PrinterService.getActiveProviderId()).toBe('web-print')
    expect(PrinterService.getActiveProvider().id).toBe('web-print')
  })

  it('switches and persists the active provider', () => {
    PrinterService.setActiveProvider('escpos-bluetooth')
    expect(PrinterService.getActiveProviderId()).toBe('escpos-bluetooth')
    expect(PrinterService.getActiveProvider().id).toBe('escpos-bluetooth')
  })

  it('falls back to web-print for unknown provider ids', () => {
    PrinterService.setActiveProvider('does-not-exist')
    expect(PrinterService.getActiveProvider().id).toBe('web-print')
  })

  it('falls back to web-print when the stored config is corrupt', () => {
    ;(globalThis as Record<string, unknown>).localStorage = {
      getItem: () => '{not json',
      setItem: () => undefined,
    }
    expect(PrinterService.getActiveProviderId()).toBe('web-print')

    ;(globalThis as Record<string, unknown>).localStorage = {
      getItem: () => JSON.stringify({ activeProviderId: 42 }),
      setItem: () => undefined,
    }
    expect(PrinterService.getActiveProviderId()).toBe('web-print')
  })

  it('persists paper width in the config', () => {
    PrinterService.setPaperWidth(80)
    expect(PrinterService.getConfig().paperWidth).toBe(80)
    PrinterService.setPaperWidth(58)
    expect(PrinterService.getConfig().paperWidth).toBe(58)
  })

  it('keeps provider, paper width, and baud rate in one stored config', () => {
    PrinterService.setActiveProvider('escpos-bluetooth')
    PrinterService.setPaperWidth(80)

    const raw = (globalThis as unknown as { localStorage: Storage }).localStorage.getItem(
      STORAGE_KEY
    )
    expect(JSON.parse(raw!)).toMatchObject({
      activeProviderId: 'escpos-bluetooth',
      paperWidth: 80,
      baudRate: 9600,
    })
  })
})
