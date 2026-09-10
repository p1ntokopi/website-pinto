import { BUSINESS } from '@/config/business'

export type ReceiptLineItem = {
  name: string
  variant: string | null
  quantity: number
  unitPrice: number
  subtotal: number
  notes: string | null
  options: { label: string; priceAdjustment: number }[]
}

export type ReceiptBusiness = {
  name: string
  tagline: string
  address: string
  website: string
  wifiName: string
  wifiPassword: string
  footerMessage: string
}

export type ReceiptPaymentMethod = 'CASH' | 'QRIS'

/** Canonical payment details printed on a customer receipt. */
export type ReceiptPaymentDetails = {
  method: ReceiptPaymentMethod | null
  displayLabel: string | null
  status: string | null
  cashier: string | null
  paidAt: string | null
  cashReceived: number | null
  change: number | null
}

/**
 * Legacy order-payment input accepted by buildReceiptFromOrder.
 * Kept while existing order and kitchen callers migrate to bill receipts.
 */
export type ReceiptPayment = {
  method: string | null
  channel: string | null
  status: string | null
  cashier?: string | null
  paidAt?: string | null
  cashReceived?: number | null
  change?: number | null
}

export type ReceiptSourceOrder = {
  label: string
  items: ReceiptLineItem[]
}

export type ReceiptBill = {
  reference: string
  sessionReference: string | null
  issuedAt: string
}

export type ReceiptSnapshotSettings = {
  business_name?: string | null
  tagline?: string | null
  address?: string | null
  website?: string | null
  wifi_name?: string | null
  wifi_password?: string | null
  footer_message?: string | null
}

export type ReceiptSnapshotItem = {
  product_name: string
  variant_name?: string | null
  quantity: number
  unit_price: number
  subtotal: number
  notes?: string | null
  options?: {
    option_name?: string | null
    option_value: string
    price_adjustment: number
  }[] | null
}

export type ReceiptSnapshotOrder = {
  id: string
  order_number: string
  created_at: string
  subtotal: number
  discount?: number | null
  tax?: number | null
  service_fee?: number | null
  shipping_fee?: number | null
  total: number
  table_number?: string | null
  notes?: string | null
  items: ReceiptSnapshotItem[]
}

export type ReceiptSnapshot = {
  schema_version: 1
  issued_at: string
  target: { type: 'ORDER' | 'DINING_SESSION'; id: string }
  settings?: ReceiptSnapshotSettings | null
  payment: {
    method: string | null
    channel: string | null
    status: string | null
    paid_at: string | null
    cash_received: number | null
    change_amount: number | null
    cashier_id?: string | null
    cashier_metadata?: Record<string, unknown> | null
  }
  orders: ReceiptSnapshotOrder[]
}

export type ReceiptSnapshotRecord = {
  receipt_number: string
  issued_at?: string | null
  snapshot: ReceiptSnapshot
  cashierName?: string | null
}

export type ReceiptOrderItemInput = {
  quantity: number
  product_name_snapshot: string
  variant_name_snapshot: string | null
  unit_price: number
  subtotal: number
  notes: string | null
  options: { option_value_snapshot: string; price_adjustment: number }[]
}

export type ReceiptOrderInput = {
  order_number: string
  bill_reference?: string | null
  session_reference?: string | null
  source_order_label?: string | null
  subtotal: number
  tax: number
  discount: number
  total: number
  notes: string | null
  created_at: string
  table: { table_number: string } | null
  items: ReceiptOrderItemInput[]
}

export type ReceiptInput = {
  business?: ReceiptBusiness
  bill: ReceiptBill
  sourceOrders: ReceiptSourceOrder[]
  tableLabel: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  payment: ReceiptPaymentDetails
  notes: string | null
}

export type ReceiptData = ReceiptInput & {
  business: ReceiptBusiness
  /** @deprecated Use bill.reference or sourceOrders[].label. */
  orderNumber: string
  /** @deprecated Use bill.issuedAt or payment.paidAt. */
  createdAt: string
  /** @deprecated Use sourceOrders[].items. */
  items: ReceiptLineItem[]
}

export type ThermalPaperWidth = 58 | 80

export const RECEIPT_LINE_WIDTHS: Record<ThermalPaperWidth, number> = {
  58: 32,
  80: 48,
}

export const DEFAULT_PAPER_WIDTH: ThermalPaperWidth = 58

export function defaultReceiptBusiness(): ReceiptBusiness {
  return {
    name: BUSINESS.name,
    tagline: BUSINESS.tagline,
    address: BUSINESS.address,
    website: BUSINESS.website,
    wifiName: BUSINESS.wifiName,
    wifiPassword: BUSINESS.wifiPassword,
    footerMessage: BUSINESS.footerMessage,
  }
}
