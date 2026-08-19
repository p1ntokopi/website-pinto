import {
  DEFAULT_PAPER_WIDTH,
  RECEIPT_LINE_WIDTHS,
  ThermalPaperWidth,
  ReceiptData,
  ReceiptLineItem,
  ReceiptOrderInput,
  ReceiptPayment,
  defaultReceiptBusiness,
} from '@/lib/receipt/receipt-types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatIDR(amount: number): string {
  return `Rp${Math.round(amount).toLocaleString('id-ID')}`
}

export function tableLabel(tableNumber: string | number): string {
  return `MEJA ${String(tableNumber).padStart(2, '0')}`
}

export function formatReceiptDate(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function displayPaymentMethod(payment: ReceiptPayment | null): string {
  if (!payment) return '-'
  // Prefer the concrete channel (DANA, BCA, QRIS) over the generic type (EWALLET).
  const source = payment.channel || payment.method
  if (source) return source
  return 'ONLINE'
}

export function displayPaymentStatus(status: string | null): string {
  switch (status) {
    case 'PAID':
      return 'PAID'
    case 'PENDING':
      return 'BELUM DIBAYAR'
    case 'EXPIRED':
      return 'KEDALUWARSA'
    case 'CANCELED':
      return 'DIBATALKAN'
    case 'REFUNDED':
      return 'DIKEMBALIKAN'
    case 'FAILED':
      return 'GAGAL'
    default:
      return status ? status.toUpperCase() : '-'
  }
}

function center(text: string, width: number): string {
  const trimmed = text.trim()
  if (trimmed.length >= width) return trimmed.slice(0, width)
  const totalPad = width - trimmed.length
  const left = Math.floor(totalPad / 2)
  return ' '.repeat(left) + trimmed + ' '.repeat(totalPad - left)
}

function fit(left: string, right: string, width: number): string {
  const l = left.slice(0, width)
  const r = right.slice(0, width)
  if (l.length + r.length <= width) {
    return l + ' '.repeat(width - l.length - r.length) + r
  }
  const cut = Math.max(0, width - r.length - 1)
  return l.slice(0, cut) + ' ' + r
}

function divider(width: number): string {
  return '-'.repeat(width)
}

function blank(): string {
  return ''
}

export function buildReceiptFromOrder(
  order: ReceiptOrderInput,
  payment?: ReceiptPayment | null
): ReceiptData {
  const items: ReceiptLineItem[] = (order.items || []).map((item) => ({
    name: item.product_name_snapshot,
    variant: item.variant_name_snapshot ?? null,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    subtotal: item.subtotal,
    notes: item.notes ?? null,
    options: (item.options || []).map((opt) => ({
      label: opt.option_value_snapshot,
      priceAdjustment: opt.price_adjustment,
    })),
  }))

  return {
    business: defaultReceiptBusiness(),
    orderNumber: order.order_number,
    tableLabel: order.table ? tableLabel(order.table.table_number) : null,
    createdAt: order.created_at,
    items,
    subtotal: order.subtotal,
    discount: order.discount || 0,
    tax: order.tax || 0,
    total: order.total,
    payment: {
      method: payment?.method ?? null,
      channel: payment?.channel ?? null,
      status: payment?.status ?? null,
    },
    notes: order.notes ?? null,
  }
}

/**
 * Render a thermal receipt as monospace text.
 * 58mm -> 32 chars/line, 80mm -> 48 chars/line (standard ESC/POS font).
 * Pure function, unit tested.
 */
export function formatReceiptText(data: ReceiptData, paperWidth: ThermalPaperWidth = DEFAULT_PAPER_WIDTH): string {
  const w = RECEIPT_LINE_WIDTHS[paperWidth]
  const lines: string[] = []

  lines.push(center(data.business.name, w))
  lines.push(center(data.business.tagline, w))
  lines.push(center(data.business.address, w))
  lines.push(blank())
  lines.push(divider(w))
  lines.push(fit(`ORDER ${data.orderNumber}`, '', w))
  lines.push(fit(formatReceiptDate(data.createdAt), '', w))
  lines.push(blank())

  if (data.tableLabel) {
    lines.push(fit(data.tableLabel, '', w))
    lines.push(blank())
  }

  data.items.forEach((item) => {
    lines.push(fit(`${item.quantity}x ${item.name}`, formatIDR(item.subtotal), w))
    if (item.variant) lines.push(`  ${item.variant}`)
    item.options.forEach((opt) => lines.push(`  ${opt.label}`))
    if (item.notes) lines.push(`  (${item.notes})`)
  })

  lines.push(blank())
  lines.push(divider(w))
  lines.push(fit('SUBTOTAL', formatIDR(data.subtotal), w))
  if (data.discount > 0) lines.push(fit('DISKON', `-${formatIDR(data.discount)}`, w))
  if (data.tax > 0) lines.push(fit('PAJAK', formatIDR(data.tax), w))
  lines.push(fit('TOTAL', formatIDR(data.total), w))
  lines.push(blank())
  lines.push(fit(`PAYMENT: ${displayPaymentMethod(data.payment)}`, '', w))
  lines.push(fit(`STATUS: ${displayPaymentStatus(data.payment.status)}`, '', w))
  lines.push(blank())
  lines.push(fit(`WEB: ${data.business.website}`, '', w))
  lines.push(fit(`WiFi: ${data.business.wifiName} / Pass: ${data.business.wifiPassword}`, '', w))
  lines.push(blank())
  lines.push(center(data.business.footerMessage, w))
  lines.push(blank())
  lines.push(center(data.business.name, w))
  lines.push(divider(w))

  return lines.join('\n')
}