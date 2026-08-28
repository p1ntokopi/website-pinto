import { ReceiptData, DEFAULT_PAPER_WIDTH } from '@/lib/receipt/receipt-types'
import { formatReceiptText } from '@/lib/receipt/receipt-service'
import { createSampleReceipt } from '@/lib/receipt/sample-receipt'
import { encodeReceipt } from '@/lib/printer/escpos-encoder'
import {
  PrintReceiptOptions,
  PrinterProvider,
  PrinterStatus,
  PrinterUnavailableError,
  PrinterCapabilities,
} from '@/lib/printer/printer-types'

/** Standard Bluetooth Classic Serial Port Profile service class ID. */
export const SPP_SERVICE_CLASS_ID = '00001101-0000-1000-8000-00805f9b34fb'

/**
 * Default baud rate. RFCOMM/Bluetooth links ignore it, but the Serial API
 * requires it at open() time and USB-serial adapters do use it.
 */
export const ESCPOS_DEFAULT_BAUD_RATE = 9600

/** Thermal printers have small MCUs — write in small chunks with a short gap. */
const WRITE_CHUNK_SIZE = 512
const WRITE_CHUNK_DELAY_MS = 25

// ---------------------------------------------------------------------------
// Minimal Web Serial typings. Not every TypeScript lib.dom version ships the
// Serial API, and we only need a small surface, so we declare it locally.
// ---------------------------------------------------------------------------

type SerialPortInfoLike = { bluetoothServiceClassId?: string }

type SerialPortLike = {
  writable: WritableStream<Uint8Array> | null
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
  getInfo(): SerialPortInfoLike
}

type SerialRequestPortOptions = {
  filters?: { bluetoothServiceClassId?: string }[]
  allowedBluetoothServiceClassIds?: string[]
}

type SerialLike = {
  requestPort(options?: SerialRequestPortOptions): Promise<SerialPortLike>
  getPorts(): Promise<SerialPortLike[]>
  addEventListener(type: 'disconnect', listener: (event: Event) => void): void
  removeEventListener(type: 'disconnect', listener: (event: Event) => void): void
}

function getSerial(): SerialLike | null {
  if (typeof navigator === 'undefined') return null
  return (navigator as unknown as { serial?: SerialLike }).serial ?? null
}

function unsupportedError(): PrinterUnavailableError {
  return new PrinterUnavailableError(
    'Browser ini tidak mendukung Web Serial API. Gunakan Chrome/Edge (desktop 117+ ' +
      'atau Android Chrome 138+). Untuk Safari/Firefox, gunakan provider "Print Browser".'
  )
}

/**
 * ESC/POS over Bluetooth Classic (SPP) through the Web Serial API.
 *
 * Works with paired SPP printers on desktop Chrome/Edge 117+ and Android
 * Chrome 138+ (RFCOMM serial emulation). The printer must be paired at the
 * OS level first (PandaPrinter PRJ-58D pairing code: 0000); after that,
 * `requestPort()` lists it without any filters and `getPorts()` allows a
 * silent reconnect for previously granted devices.
 */
export class EscPosBluetoothProvider implements PrinterProvider {
  readonly id = 'escpos-bluetooth'
  readonly label = 'ESC/POS Bluetooth'
  readonly capabilities: PrinterCapabilities = {
    supportsBluetooth: true,
    supportsWebPrint: false,
    supportsWebSerial: true,
    requiresDriver: false,
    supportedPaperWidths: [58, 80],
  }

  private port: SerialPortLike | null = null
  private disconnectListener: ((event: Event) => void) | null = null

  async connect(): Promise<void> {
    const serial = getSerial()
    if (!serial) throw unsupportedError()
    if (this.port?.writable) return

    try {
      const existing = await this.openExistingPort(serial)
      this.port = existing ?? (await serial.requestPort())
      await this.openPort(this.port)
      this.watchDisconnect(serial)
    } catch (err) {
      this.port = null
      throw this.toProviderError(err)
    }
  }

  /**
   * Reconnect silently to a previously granted port — no picker, no user
   * gesture needed. Used to survive page refreshes.
   */
  async tryReconnect(): Promise<boolean> {
    const serial = getSerial()
    if (!serial) return false
    if (this.port?.writable) return true

    try {
      const existing = await this.openExistingPort(serial)
      if (!existing) return false
      this.port = existing
      this.watchDisconnect(serial)
      return true
    } catch {
      this.port = null
      return false
    }
  }

  async disconnect(): Promise<void> {
    const port = this.port
    this.port = null
    this.unwatchDisconnect()
    if (!port) return
    try {
      await port.close()
    } catch {
      // Port may already be gone (printer off/unpaired) — nothing to release.
    }
  }

  async printReceipt(data: ReceiptData, options?: PrintReceiptOptions): Promise<void> {
    const port = this.port
    if (!port?.writable) {
      throw new PrinterUnavailableError(
        'Printer belum tersambung. Sambungkan printer terlebih dahulu.'
      )
    }

    const paperWidth = options?.paperWidth ?? DEFAULT_PAPER_WIDTH
    const copies = options?.copies ?? 1
    const payload = encodeReceipt(formatReceiptText(data, paperWidth))

    try {
      for (let i = 0; i < copies; i++) {
        await this.write(port, payload)
      }
    } catch (err) {
      // A write failure means the port is effectively dead (printer off or
      // out of range), so drop it and force a fresh connect next time.
      this.port = null
      throw this.toProviderError(err, true)
    }
  }

  async testPrint(): Promise<void> {
    await this.printReceipt(createSampleReceipt())
  }

  async getStatus(): Promise<PrinterStatus> {
    return this.port?.writable ? 'connected' : 'disconnected'
  }

  private async openExistingPort(serial: SerialLike): Promise<SerialPortLike | null> {
    const ports = await serial.getPorts()
    if (ports.length === 0) return null
    const port = ports[ports.length - 1]
    await this.openPort(port)
    return port
  }

  private async openPort(port: SerialPortLike): Promise<void> {
    if (port.writable) return
    await port.open({ baudRate: ESCPOS_DEFAULT_BAUD_RATE })
  }

  private async write(port: SerialPortLike, payload: Uint8Array): Promise<void> {
    const stream = port.writable
    if (!stream) throw new Error('Serial port is closed')
    const writer = stream.getWriter()
    try {
      for (let offset = 0; offset < payload.length; offset += WRITE_CHUNK_SIZE) {
        await writer.write(payload.subarray(offset, offset + WRITE_CHUNK_SIZE))
        if (offset + WRITE_CHUNK_SIZE < payload.length) {
          await new Promise((resolve) => setTimeout(resolve, WRITE_CHUNK_DELAY_MS))
        }
      }
    } finally {
      writer.releaseLock()
    }
  }

  private watchDisconnect(serial: SerialLike): void {
    if (this.disconnectListener) return
    this.disconnectListener = (event: Event) => {
      if (event.target === this.port) {
        this.port = null
        this.unwatchDisconnect()
      }
    }
    serial.addEventListener('disconnect', this.disconnectListener)
  }

  private unwatchDisconnect(): void {
    if (!this.disconnectListener) return
    getSerial()?.removeEventListener('disconnect', this.disconnectListener)
    this.disconnectListener = null
  }

  private toProviderError(err: unknown, duringWrite = false): PrinterUnavailableError {
    if (err instanceof PrinterUnavailableError) return err
    if (err instanceof DOMException && err.name === 'NotFoundError') {
      return new PrinterUnavailableError('Pemilihan printer dibatalkan.')
    }
    if (duringWrite) {
      return new PrinterUnavailableError(
        'Koneksi ke printer terputus saat mencetak. Pastikan printer menyala, ' +
          'lalu sambungkan ulang.'
      )
    }
    return new PrinterUnavailableError(
      'Gagal membuka koneksi ke printer. Pastikan printer sudah di-pair di ' +
        'pengaturan Bluetooth (PIN: 0000), menyala (terhubung listrik), dan ' +
        'tidak sedang dipakai aplikasi lain.'
    )
  }
}
