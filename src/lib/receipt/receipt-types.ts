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

export type ReceiptPayment = {
  method: string | null
  channel: string | null
  status: string | null
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
  subtotal: number
  tax: number
  discount: number
  total: number
  notes: string | null
  created_at: string
  table: { table_number: string } | null
  items: ReceiptOrderItemInput[]
}

export type ReceiptData = {
  business: ReceiptBusiness
  orderNumber: string
  tableLabel: string | null
  createdAt: string
  items: ReceiptLineItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  payment: ReceiptPayment
  notes: string | null
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
