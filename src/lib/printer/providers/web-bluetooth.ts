import { ReceiptData, DEFAULT_PAPER_WIDTH, ThermalPaperWidth } from '@/lib/receipt/receipt-types'
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

const COMMON_BLE_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000e781-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '0000af00-0000-1000-8000-00805f9b34fb',
  '0000fee7-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
]

const BLE_CHUNK_SIZE = 100
const BLE_CHUNK_DELAY_MS = 25

type BluetoothCharacteristicLike = {
  properties: {
    write?: boolean
    writeWithoutResponse?: boolean
  }
  writeValue(value: BufferSource): Promise<void>
  writeValueWithoutResponse?(value: BufferSource): Promise<void>
}

type BluetoothServiceLike = {
  getCharacteristics(): Promise<BluetoothCharacteristicLike[]>
}

type BluetoothServerLike = {
  connected: boolean
  connect(): Promise<BluetoothServerLike>
  disconnect(): void
  getPrimaryServices(): Promise<BluetoothServiceLike[]>
  getPrimaryService(service: string): Promise<BluetoothServiceLike>
}

type BluetoothDeviceLike = {
  id: string
  name?: string
  gatt?: BluetoothServerLike
  addEventListener(type: 'gattserverdisconnected', listener: () => void): void
}

type NavigatorBluetoothLike = {
  requestDevice(options: {
    acceptAllDevices?: boolean
    optionalServices?: string[]
  }): Promise<BluetoothDeviceLike>
}

function getBluetooth(): NavigatorBluetoothLike | null {
  if (typeof navigator === 'undefined') return null
  return (navigator as unknown as { bluetooth?: NavigatorBluetoothLike }).bluetooth ?? null
}

export class WebBluetoothProvider implements PrinterProvider {
  readonly id = 'web-bluetooth'
  readonly label = 'Web Bluetooth (BLE)'
  readonly capabilities: PrinterCapabilities = {
    supportsBluetooth: true,
    supportsWebPrint: false,
    supportsWebSerial: false,
    requiresDriver: false,
    supportedPaperWidths: [58, 80],
  }

  private device: BluetoothDeviceLike | null = null
  private characteristic: BluetoothCharacteristicLike | null = null

  async connect(): Promise<void> {
    const bt = getBluetooth()
    if (!bt) {
      throw new PrinterUnavailableError(
        'Browser ini tidak mendukung Web Bluetooth. Gunakan Google Chrome di Android atau Chrome Desktop dengan Bluetooth aktif.'
      )
    }

    try {
      this.device = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: COMMON_BLE_SERVICES,
      })

      if (!this.device.gatt) {
        throw new Error('GATT server tidak tersedia pada perangkat ini.')
      }

      const server = await this.device.gatt.connect()
      this.characteristic = await this.findWritableCharacteristic(server)

      this.device.addEventListener('gattserverdisconnected', () => {
        this.characteristic = null
      })
    } catch (err: unknown) {
      this.device = null
      this.characteristic = null
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        throw new PrinterUnavailableError('Pemilihan printer dibatalkan.')
      }
      throw new PrinterUnavailableError(
        err instanceof Error
          ? err.message
          : 'Gagal terhubung ke printer Bluetooth BLE. Pastikan printer menyala.'
      )
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
    }
    this.device = null
    this.characteristic = null
  }

  async printReceipt(data: ReceiptData, options?: PrintReceiptOptions): Promise<void> {
    if (!this.characteristic || !this.device?.gatt?.connected) {
      await this.connect()
    }

    if (!this.characteristic) {
      throw new PrinterUnavailableError('Printer BLE belum tersambung.')
    }

    const paperWidth: ThermalPaperWidth = options?.paperWidth ?? DEFAULT_PAPER_WIDTH
    const copies = options?.copies ?? 1
    const payload = encodeReceipt(formatReceiptText(data, paperWidth))

    for (let c = 0; c < copies; c++) {
      for (let i = 0; i < payload.length; i += BLE_CHUNK_SIZE) {
        const chunk = payload.subarray(i, i + BLE_CHUNK_SIZE)
        const buffer = (chunk.buffer as ArrayBuffer).slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength)
        if (this.characteristic.properties.writeWithoutResponse && this.characteristic.writeValueWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(buffer)
        } else {
          await this.characteristic.writeValue(buffer)
        }
        if (i + BLE_CHUNK_SIZE < payload.length) {
          await new Promise((r) => setTimeout(r, BLE_CHUNK_DELAY_MS))
        }
      }
    }
  }

  async testPrint(): Promise<void> {
    await this.printReceipt(createSampleReceipt())
  }

  async getStatus(): Promise<PrinterStatus> {
    return this.device?.gatt?.connected && this.characteristic ? 'connected' : 'disconnected'
  }

  private async findWritableCharacteristic(server: BluetoothServerLike): Promise<BluetoothCharacteristicLike> {
    for (const serviceUuid of COMMON_BLE_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid)
        const characteristics = await service.getCharacteristics()
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char
          }
        }
      } catch {
        // Try next service
      }
    }

    try {
      const services = await server.getPrimaryServices()
      for (const service of services) {
        const characteristics = await service.getCharacteristics()
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char
          }
        }
      }
    } catch {
      // Fallback exhausted
    }

    throw new Error('Tidak ditemukan karakteristik write pada printer BLE ini.')
  }
}