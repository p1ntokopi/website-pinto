import { ReceiptData, defaultReceiptBusiness } from '@/lib/receipt/receipt-types'
import { buildReceipt } from '@/lib/receipt/receipt-service'

/**
 * Sample receipt shared by every provider's `testPrint()` so the test output
 * is identical no matter which provider is active.
 */
export function createSampleReceipt(): ReceiptData {
  const now = new Date().toISOString()
  return buildReceipt({
    business: defaultReceiptBusiness(),
    bill: {
      reference: 'BILL-00000',
      sessionReference: 'SESI-00000',
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
            unitPrice: 15000,
            subtotal: 15000,
            notes: null,
            options: [],
          },
        ],
      },
    ],
    tableLabel: 'MEJA 01',
    subtotal: 15000,
    discount: 0,
    tax: 0,
    total: 15000,
    payment: {
      method: 'QRIS',
      displayLabel: 'QRIS',
      status: 'PAID',
      cashier: 'Kasir',
      paidAt: now,
      cashReceived: null,
      change: null,
    },
    notes: null,
  })
}
