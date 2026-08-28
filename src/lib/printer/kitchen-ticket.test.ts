import { describe, it, expect } from 'vitest'
import { formatKitchenTicket } from '@/lib/printer/kitchen-ticket'

const order = {
  order_number: 'Pinto-260828-0001',
  created_at: '2026-08-28T07:15:00Z',
  table_number: '03',
  notes: 'Tolong dipisahkan gelasnya karena dibawa pulang oleh pelanggan yang baik hati',
  items: [
    {
      quantity: 2,
      product_name_snapshot: 'Sanger Latte',
      variant_name_snapshot: 'Large',
      notes: 'Extra panas',
      options: [{ option_value_snapshot: 'Oat Milk' }],
    },
    {
      quantity: 1,
      product_name_snapshot: 'Americanissimo',
      variant_name_snapshot: null,
      notes: null,
      options: [],
    },
  ],
}

describe('formatKitchenTicket', () => {
  it('renders the kitchen header, order info, and table', () => {
    const text = formatKitchenTicket(order)
    expect(text).toContain('TIKET DAPUR')
    expect(text).toContain('Pinto-260828-0001')
    expect(text).toContain('MEJA 03')
  })

  it('lists items with quantities but never prices', () => {
    const text = formatKitchenTicket(order)
    expect(text).toContain('2x Sanger Latte')
    expect(text).toContain('1x Americanissimo')
    expect(text).not.toContain('Rp')
  })

  it('marks variants, options, and item notes distinctly', () => {
    const text = formatKitchenTicket(order)
    expect(text).toContain('- Large')
    expect(text).toContain('+ Oat Milk')
    expect(text).toContain('!! Extra panas')
  })

  it('wraps long order notes across lines', () => {
    const text = formatKitchenTicket(order)
    expect(text).toContain('* Tolong dipisahkan gelasnya')
    expect(text).toContain('* karena dibawa pulang oleh')
    expect(text).toContain('* pelanggan yang baik hati')
  })

  it('keeps every line within 32 characters (58mm paper)', () => {
    const text = formatKitchenTicket(order)
    for (const line of text.split('\n')) {
      expect(line.length).toBeLessThanOrEqual(32)
    }
  })

  it('labels walk-in orders without a table', () => {
    const text = formatKitchenTicket({ ...order, table_number: null })
    expect(text).toContain('WALK-IN')
  })
})
