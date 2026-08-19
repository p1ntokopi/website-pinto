import { describe, it, expect } from 'vitest'
import {
  buildReceiptFromOrder,
  displayPaymentMethod,
  displayPaymentStatus,
  formatIDR,
  formatReceiptText,
  tableLabel,
} from '@/lib/receipt/receipt-service'
import type { ReceiptData, ReceiptOrderInput } from '@/lib/receipt/receipt-types'

const sampleData: ReceiptData = {
  business: {
    name: 'Pinto Coffee',
    tagline: 'Kopi • Makanan • Biji Kopi',
    address: 'Jl. Flamboyan No. 8, Tajur Halang, Bogor',
    website: 'www.pintokopi.web.id',
    wifiName: 'P1NTO',
    wifiPassword: 'terimakasih',
    footerMessage: 'Terima kasih telah berkunjung.',
  },
  orderNumber: 'PNT-00001',
  tableLabel: 'MEJA 03',
  createdAt: '2026-08-19T10:15:00Z',
  items: [
    {
      name: 'Sanger Latte',
      variant: 'Large',
      quantity: 2,
      unitPrice: 15000,
      subtotal: 30000,
      notes: 'Extra panas',
      options: [{ label: 'Oat Milk', priceAdjustment: 3000 }],
    },
  ],
  subtotal: 33000,
  discount: 0,
  tax: 0,
  total: 33000,
  payment: { method: 'EWALLET', channel: 'DANA', status: 'PAID' },
  notes: null,
}

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
  it('prefers channel, falls back to method', () => {
    expect(displayPaymentMethod({ method: 'EWALLET', channel: 'DANA', status: 'PAID' })).toBe('DANA')
    expect(displayPaymentMethod({ method: 'BANK_TRANSFER', channel: null, status: 'PENDING' })).toBe(
      'BANK_TRANSFER'
    )
    expect(displayPaymentMethod(null)).toBe('-')
  })
})

describe('buildReceiptFromOrder', () => {
  it('flattens order items and payment into receipt shape', () => {
    const order = {
      order_number: 'PNT-00001',
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
      method: 'EWALLET',
      channel: 'DANA',
      status: 'PAID',
    })

    expect(data.tableLabel).toBe('MEJA 03')
    expect(data.items[0].unitPrice).toBe(15000)
    expect(data.items[0].options[0].label).toBe('Oat Milk')
    expect(data.payment.channel).toBe('DANA')
  })
})

describe('formatReceiptText', () => {
  it('keeps every line within the 58mm width (32 chars)', () => {
    const text = formatReceiptText(sampleData, 58)
    for (const line of text.split('\n')) {
      expect(line.length).toBeLessThanOrEqual(32)
    }
  })

  it('keeps every line within the 80mm width (48 chars)', () => {
    const text = formatReceiptText(sampleData, 80)
    for (const line of text.split('\n')) {
      expect(line.length).toBeLessThanOrEqual(48)
    }
  })

  it('renders business identity and totals', () => {
    const text = formatReceiptText(sampleData, 58)
    expect(text).toContain('Pinto Coffee')
    expect(text).toContain('ORDER PNT-00001')
    expect(text).toContain('MEJA 03')
    expect(text).toContain('TOTAL')
    expect(text).toContain('Rp33.000')
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