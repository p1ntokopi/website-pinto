import { ReceiptData, defaultReceiptBusiness } from '@/lib/receipt/receipt-types'
import { buildReceipt } from '@/lib/receipt/receipt-service'

/**
 * Sample receipt shared by every provider's `testPrint()` so the test output
 * is identical no matter which provider is active.
 *
 * Shaped like a real bill rather than a single bare item. The first item
 * carries a chosen option on purpose: the test print is also the check that a
 * selected option does NOT clutter the customer's copy.
 */
export function createSampleReceipt(): ReceiptData {
  const now = new Date().toISOString()
  return buildReceipt({
    business: defaultReceiptBusiness(),
    bill: {
      reference: 'R-260911-0000000000',
      sessionReference: '0f8c1a2e-1111-4222-8333-444455556666',
      issuedAt: now,
    },
    sourceOrders: [
      {
        label: 'PNT-00000',
        items: [
          {
            name: 'Sanger Latte',
            variant: null,
            quantity: 1,
            unitPrice: 18000,
            subtotal: 18000,
            notes: null,
            options: [{ label: 'Dingin / Ice', priceAdjustment: 0 }],
          },
          {
            name: 'Americano',
            variant: null,
            quantity: 1,
            unitPrice: 10000,
            subtotal: 10000,
            notes: null,
            options: [],
          },
        ],
      },
    ],
    tableLabel: 'MEJA 01',
    subtotal: 28000,
    discount: 0,
    tax: 0,
    total: 28000,
    payment: {
      method: 'QRIS',
      displayLabel: 'QRIS',
      status: 'PAID',
      // No cashier name: a real receipt does not carry one either, so the test
      // print shows the same set of lines production prints.
      cashier: null,
      paidAt: now,
      cashReceived: null,
      change: null,
    },
    notes: null,
  })
}
