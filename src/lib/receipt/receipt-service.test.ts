import { describe, it, expect } from 'vitest'
import {
  buildReceipt,
  buildReceiptFromSnapshot,
  buildReceiptFromOrder,
  displayPaymentMethod,
  displayPaymentStatus,
  formatIDR,
  formatReceiptText,
  tableLabel,
} from '@/lib/receipt/receipt-service'
import type {
  ReceiptData,
  ReceiptLineItem,
  ReceiptOrderInput,
  ReceiptSnapshotRecord,
} from '@/lib/receipt/receipt-types'

const latte: ReceiptLineItem = {
  name: 'Sanger Latte',
  variant: 'Large',
  quantity: 2,
  unitPrice: 15000,
  subtotal: 30000,
  notes: 'Extra panas',
  options: [{ label: 'Oat Milk', priceAdjustment: 3000 }],
}

const sampleData: ReceiptData = buildReceipt({
  business: {
    name: 'Pinto Coffee',
    tagline: 'Kopi • Makanan • Biji Kopi',
    address: 'Jl. Flamboyan No. 8, Tajur Halang, Bogor',
    website: 'www.pintokopi.web.id',
    wifiName: 'P1NTO',
    wifiPassword: 'terimakasih',
    footerMessage: 'Terima kasih telah berkunjung.',
  },
  bill: {
    reference: 'BILL-00001',
    sessionReference: 'SESI-00003',
    issuedAt: '2026-08-19T10:15:00Z',
  },
  sourceOrders: [
    { label: 'PNT-00001', items: [latte] },
    {
      label: 'PNT-00002',
      items: [
        {
          name: 'Americano',
          variant: null,
          quantity: 1,
          unitPrice: 18000,
          subtotal: 18000,
          notes: null,
          options: [],
        },
      ],
    },
  ],
  tableLabel: 'MEJA 03',
  subtotal: 51000,
  discount: 0,
  tax: 0,
  total: 51000,
  payment: {
    method: 'CASH',
    displayLabel: 'CASH',
    status: 'PAID',
    cashier: 'Ayu',
    paidAt: '2026-08-19T10:20:00Z',
    cashReceived: 60000,
    change: 9000,
  },
  notes: null,
})

describe('formatIDR', () => {
  it('formats as id-ID without decimals', () => {
    expect(formatIDR(33000)).toBe('Rp33.000')
    expect(formatIDR(15000)).toBe('Rp15.000')
    expect(formatIDR(1_000_000)).toBe('Rp1.000.000')
  })
})

describe('tableLabel', () => {
  it('pads single-digit table numbers', () => {
    expect(tableLabel(3)).toBe('MEJA 03')
    expect(tableLabel('12')).toBe('MEJA 12')
  })
})

describe('displayPaymentStatus', () => {
  it('maps payment statuses to receipt wording', () => {
    expect(displayPaymentStatus('PAID')).toBe('PAID')
    expect(displayPaymentStatus('PENDING')).toBe('BELUM DIBAYAR')
    expect(displayPaymentStatus('EXPIRED')).toBe('KEDALUWARSA')
    expect(displayPaymentStatus(null)).toBe('-')
  })
})

describe('displayPaymentMethod', () => {
  it('normalizes supported methods without an ONLINE fallback', () => {
    expect(displayPaymentMethod({ method: 'QR_CODE', channel: null, status: 'PAID' })).toBe('QRIS')
    expect(displayPaymentMethod({ method: 'CASH', channel: null, status: 'PAID' })).toBe('CASH')
    expect(displayPaymentMethod({ method: null, channel: null, status: 'PAID' })).toBe('-')
    expect(displayPaymentMethod(null)).toBe('-')
  })
})

describe('buildReceipt', () => {
  it('keeps durable bill, source-order, cashier, and cash tender details', () => {
    expect(sampleData.bill).toEqual({
      reference: 'BILL-00001',
      sessionReference: 'SESI-00003',
      issuedAt: '2026-08-19T10:15:00Z',
    })
    expect(sampleData.sourceOrders.map((order) => order.label)).toEqual(['PNT-00001', 'PNT-00002'])
    expect(sampleData.payment).toMatchObject({
      method: 'CASH',
      cashier: 'Ayu',
      paidAt: '2026-08-19T10:20:00Z',
      cashReceived: 60000,
      change: 9000,
    })
    expect(sampleData.items).toHaveLength(2)
  })
})

describe('buildReceiptFromSnapshot', () => {
  it('maps an immutable session receipt snapshot into the receipt domain', () => {
    const record = {
      receipt_number: 'R-260819-000001',
      snapshot: {
        schema_version: 1,
        issued_at: '2026-08-19T10:20:00Z',
        target: { type: 'DINING_SESSION', id: 'session-123' },
        settings: {
          business_name: 'Pinto Snapshot',
          tagline: 'Snapshot Tagline',
          address: 'Snapshot Address',
          website: 'snapshot.example',
          wifi_name: 'SNAPSHOT',
          wifi_password: 'durable',
          footer_message: 'Stored footer',
        },
        payment: {
          method: 'CASH',
          channel: 'CASH',
          status: 'PAID',
          paid_at: '2026-08-19T10:19:00Z',
          cash_received: 60000,
          change_amount: 9000,
          cashier_id: 'cashier-1',
          cashier_metadata: { cashier_name: 'Ayu' },
        },
        orders: [
          {
            id: 'order-1',
            order_number: 'PNT-00001',
            created_at: '2026-08-19T10:00:00Z',
            subtotal: 33000,
            discount: 0,
            tax: 0,
            service_fee: 0,
            shipping_fee: 0,
            total: 33000,
            table_number: '03',
            notes: null,
            items: [
              {
                product_name: 'Sanger Latte',
                variant_name: 'Large',
                quantity: 2,
                unit_price: 15000,
                subtotal: 33000,
                notes: 'Extra panas',
                options: [
                  {
                    option_name: 'Susu',
                    option_value: 'Oat Milk',
                    price_adjustment: 3000,
                  },
                ],
              },
            ],
          },
          {
            id: 'order-2',
            order_number: 'PNT-00002',
            created_at: '2026-08-19T10:05:00Z',
            subtotal: 18000,
            discount: 0,
            tax: 0,
            service_fee: 0,
            shipping_fee: 0,
            total: 18000,
            table_number: '03',
            notes: null,
            items: [
              {
                product_name: 'Americano',
                variant_name: null,
                quantity: 1,
                unit_price: 18000,
                subtotal: 18000,
                notes: null,
                options: [],
              },
            ],
          },
        ],
      },
    } satisfies ReceiptSnapshotRecord

    const data = buildReceiptFromSnapshot(record)

    expect(data.business.name).toBe('Pinto Snapshot')
    expect(data.bill).toEqual({
      reference: 'R-260819-000001',
      sessionReference: 'session-123',
      issuedAt: '2026-08-19T10:20:00Z',
    })
    expect(data.sourceOrders.map((order) => order.label)).toEqual(['PNT-00001', 'PNT-00002'])
    expect(data.sourceOrders[0].items[0].options[0].label).toBe('Susu: Oat Milk')
    expect(data.tableLabel).toBe('MEJA 03')
    expect(data.total).toBe(51000)
    expect(data.payment).toMatchObject({
      method: 'CASH',
      cashier: 'Ayu',
      paidAt: '2026-08-19T10:19:00Z',
      cashReceived: 60000,
      change: 9000,
    })
  })

  it('rejects unknown or empty snapshot shapes', () => {
    const base: ReceiptSnapshotRecord = {
      receipt_number: 'R-1',
      snapshot: {
        schema_version: 1,
        issued_at: '2026-08-19T10:20:00Z',
        target: { type: 'ORDER', id: 'order-1' },
        settings: null,
        payment: {
          method: 'QRIS',
          channel: 'QRIS',
          status: 'PAID',
          paid_at: '2026-08-19T10:20:00Z',
          cash_received: null,
          change_amount: null,
        },
        orders: [],
      },
    }

    expect(() => buildReceiptFromSnapshot(base)).toThrow('no source orders')
    expect(() =>
      buildReceiptFromSnapshot({
        ...base,
        snapshot: { ...base.snapshot, schema_version: 2 as 1 },
      })
    ).toThrow('Unsupported receipt snapshot version')
  })
})

describe('buildReceiptFromOrder', () => {
  it('adapts the existing single-order shape to the bill receipt', () => {
    const order = {
      order_number: 'PNT-00001',
      bill_reference: 'BILL-00001',
      session_reference: 'SESI-00003',
      subtotal: 33000,
      tax: 0,
      discount: 0,
      total: 33000,
      notes: null,
      created_at: '2026-08-19T10:15:00Z',
      table: { table_number: '03' },
      items: [
        {
          quantity: 2,
          product_name_snapshot: 'Sanger Latte',
          variant_name_snapshot: 'Large',
          unit_price: 15000,
          subtotal: 30000,
          notes: 'Extra panas',
          options: [{ option_value_snapshot: 'Oat Milk', price_adjustment: 3000 }],
        },
      ],
    } satisfies ReceiptOrderInput

    const data = buildReceiptFromOrder(order, {
      method: 'QR_CODE',
      channel: null,
      status: 'PAID',
      cashier: 'Ayu',
      paidAt: '2026-08-19T10:20:00Z',
    })

    expect(data.bill.reference).toBe('BILL-00001')
    expect(data.bill.sessionReference).toBe('SESI-00003')
    expect(data.sourceOrders[0].label).toBe('PNT-00001')
    expect(formatReceiptText(data, 58)).toContain('ORDER PNT-00001')
    expect(data.tableLabel).toBe('MEJA 03')
    expect(data.items[0].unitPrice).toBe(15000)
    expect(data.items[0].options[0].label).toBe('Oat Milk')
    expect(data.payment).toMatchObject({ method: 'QRIS', displayLabel: 'QRIS', cashier: 'Ayu' })
  })

  it('preserves legacy payment labels but never invents ONLINE', () => {
    const order: ReceiptOrderInput = {
      order_number: 'PNT-00002',
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      notes: null,
      created_at: '2026-08-19T10:15:00Z',
      table: null,
      items: [],
    }

    expect(buildReceiptFromOrder(order).payment.displayLabel).toBeNull()
    expect(
      buildReceiptFromOrder(order, {
        method: 'EWALLET',
        channel: 'DANA',
        status: 'PAID',
      }).payment
    ).toMatchObject({ method: null, displayLabel: 'DANA' })
  })
})

describe('formatReceiptText', () => {
  it.each([58, 80] as const)('keeps every line within the %smm width', (paperWidth) => {
    const width = paperWidth === 58 ? 32 : 48
    for (const line of formatReceiptText(sampleData, paperWidth).split('\n')) {
      expect(line.length).toBeLessThanOrEqual(width)
    }
  })

  it('renders bill/session references, grouped orders, totals, and cash details', () => {
    const text = formatReceiptText(sampleData, 58)
    expect(text).toContain('Pinto Coffee')
    expect(text).toContain('BILL BILL-00001')
    expect(text).toContain('SESI SESI-00003')
    expect(text).toContain('ORDER PNT-00001')
    expect(text).toContain('ORDER PNT-00002')
    expect(text).toContain('MEJA 03')
    expect(text).toContain('PAYMENT: CASH')
    expect(text).toContain('KASIR: Ayu')
    expect(text).toContain('TUNAI')
    expect(text).toContain('Rp60.000')
    expect(text).toContain('KEMBALI')
    expect(text).toContain('Rp9.000')
    expect(text).toContain('TOTAL')
    expect(text).toContain('Rp51.000')
    expect(text).toContain('PAID')
  })

  it('renders the website and wifi footer', () => {
    const text = formatReceiptText(sampleData, 58)
    expect(text).toContain('www.pintokopi.web.id')
    expect(text).toContain('WiFi: P1NTO / Pass: terimakasih')
  })

  it('is deterministic for identical input', () => {
    expect(formatReceiptText(sampleData, 58)).toBe(formatReceiptText(sampleData, 58))
  })
})
