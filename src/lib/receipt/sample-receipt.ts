import { ReceiptData, defaultReceiptBusiness } from '@/lib/receipt/receipt-types'

/**
 * Sample receipt shared by every provider's `testPrint()` so the test output
 * is identical no matter which provider is active.
 */
export function createSampleReceipt(): ReceiptData {
  return {
    business: defaultReceiptBusiness(),
    orderNumber: 'PNT-00000',
    tableLabel: 'MEJA 01',
    createdAt: new Date().toISOString(),
    items: [
      {
        name: 'Sanger Latte',
        variant: null,
        quantity: 1,
        unitPrice: 15000,
        subtotal: 15000,
        notes: null,
        options: [],
      },
    ],
    subtotal: 15000,
    discount: 0,
    tax: 0,
    total: 15000,
    payment: { method: 'ONLINE', channel: null, status: 'PAID' },
    notes: null,
  }
}
