import {
  DEFAULT_PAPER_WIDTH,
  RECEIPT_LINE_WIDTHS,
  ThermalPaperWidth,
  ReceiptData,
  ReceiptBusiness,
  ReceiptInput,
  ReceiptLineItem,
  ReceiptOrderInput,
  ReceiptPayment,
  ReceiptPaymentDetails,
  ReceiptPaymentMethod,
  ReceiptSnapshotRecord,
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

function normalizePaymentMethod(method: string | null, channel: string | null): ReceiptPaymentMethod | null {
  const values = [channel, method].filter((value): value is string => Boolean(value)).map((value) => value.toUpperCase())
  if (values.includes('CASH')) return 'CASH'
  if (values.some((value) => value === 'QRIS' || value === 'QR_CODE')) return 'QRIS'
  return null
}

function normalizePayment(payment?: ReceiptPayment | null): ReceiptPaymentDetails {
  const method = normalizePaymentMethod(payment?.method ?? null, payment?.channel ?? null)
  const legacyLabel = payment?.channel || payment?.method || null
  return {
    method,
    displayLabel: method ?? legacyLabel,
    status: payment?.status ?? null,
    cashier: payment?.cashier ?? null,
    paidAt: payment?.paidAt ?? null,
    cashReceived: method === 'CASH' ? (payment?.cashReceived ?? null) : null,
    change: method === 'CASH' ? (payment?.change ?? null) : null,
  }
}

export function displayPaymentMethod(payment: ReceiptPaymentDetails | ReceiptPayment | null): string {
  if (!payment) return '-'
  if ('displayLabel' in payment) return payment.displayLabel || payment.method || '-'
  return normalizePayment(payment).displayLabel || '-'
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

/** Build the canonical customer receipt, including compatibility aliases. */
export function buildReceipt(input: ReceiptInput): ReceiptData {
  const items = input.sourceOrders.flatMap((sourceOrder) => sourceOrder.items)
  return {
    ...input,
    business: input.business ?? defaultReceiptBusiness(),
    orderNumber: input.bill.reference,
    createdAt: input.bill.issuedAt,
    items,
  }
}

function snapshotBusiness(
  settings: ReceiptSnapshotRecord['snapshot']['settings'],
): ReceiptBusiness {
  const fallback = defaultReceiptBusiness()
  return {
    name: settings?.business_name || fallback.name,
    tagline: settings?.tagline || fallback.tagline,
    address: settings?.address || fallback.address,
    website: settings?.website || fallback.website,
    wifiName: settings?.wifi_name || fallback.wifiName,
    wifiPassword: settings?.wifi_password || fallback.wifiPassword,
    footerMessage: settings?.footer_message || fallback.footerMessage,
  }
}

function snapshotCashier(
  record: ReceiptSnapshotRecord,
): string | null {
  if (record.cashierName) return record.cashierName
  const metadata = record.snapshot.payment.cashier_metadata
  if (!metadata) return null
  for (const key of ['cashier_name', 'cashierName', 'name']) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

/** Map an immutable receipts.snapshot record into the printable receipt domain. */
export function buildReceiptFromSnapshot(record: ReceiptSnapshotRecord): ReceiptData {
  const { snapshot } = record
  if (snapshot.schema_version !== 1) {
    throw new Error(`Unsupported receipt snapshot version: ${String(snapshot.schema_version)}`)
  }
  if (snapshot.orders.length === 0) {
    throw new Error('Receipt snapshot has no source orders.')
  }

  const payment = normalizePayment({
    method: snapshot.payment.method,
    channel: snapshot.payment.channel,
    status: snapshot.payment.status,
    cashier: snapshotCashier(record),
    paidAt: snapshot.payment.paid_at,
    cashReceived: snapshot.payment.cash_received,
    change: snapshot.payment.change_amount,
  })
  const issuedAt = snapshot.issued_at || record.issued_at || payment.paidAt
  if (!issuedAt) throw new Error('Receipt snapshot has no issue timestamp.')
  const tableNumber = snapshot.orders.find((order) => order.table_number)?.table_number ?? null

  return buildReceipt({
    business: snapshotBusiness(snapshot.settings),
    bill: {
      reference: record.receipt_number,
      sessionReference:
        snapshot.target.type === 'DINING_SESSION' ? snapshot.target.id : null,
      issuedAt,
    },
    sourceOrders: snapshot.orders.map((order) => ({
      label: order.order_number,
      items: order.items.map((item) => ({
        name: item.product_name,
        variant: item.variant_name ?? null,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
        notes: item.notes ?? null,
        options: (item.options ?? []).map((option) => ({
          label: option.option_name
            ? `${option.option_name}: ${option.option_value}`
            : option.option_value,
          priceAdjustment: option.price_adjustment,
        })),
      })),
    })),
    tableLabel: tableNumber ? tableLabel(tableNumber) : null,
    subtotal: snapshot.orders.reduce((sum, order) => sum + order.subtotal, 0),
    discount: snapshot.orders.reduce((sum, order) => sum + (order.discount ?? 0), 0),
    tax: snapshot.orders.reduce(
      (sum, order) => sum + (order.tax ?? 0) + (order.service_fee ?? 0) + (order.shipping_fee ?? 0),
      0,
    ),
    total: snapshot.orders.reduce((sum, order) => sum + order.total, 0),
    payment,
    notes: snapshot.orders.length === 1 ? (snapshot.orders[0].notes ?? null) : null,
  })
}

/**
 * Compatibility adapter for existing single-order callers. New bill/session
 * flows should call buildReceipt with all source order groups.
 */
export function buildReceiptFromOrder(
  order: ReceiptOrderInput,
  payment?: ReceiptPayment | null,
  business: ReceiptBusiness = defaultReceiptBusiness(),
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

  return buildReceipt({
    business,
    bill: {
      reference: order.bill_reference || order.order_number,
      sessionReference: order.session_reference ?? null,
      issuedAt: payment?.paidAt || order.created_at,
    },
    sourceOrders: [{ label: order.source_order_label || order.order_number, items }],
    tableLabel: order.table ? tableLabel(order.table.table_number) : null,
    subtotal: order.subtotal,
    discount: order.discount || 0,
    tax: order.tax || 0,
    total: order.total,
    payment: normalizePayment(payment),
    notes: order.notes ?? null,
  })
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
  lines.push(fit(`BILL ${data.bill.reference}`, '', w))
  if (data.bill.sessionReference) lines.push(fit(`SESI ${data.bill.sessionReference}`, '', w))
  lines.push(fit(formatReceiptDate(data.bill.issuedAt), '', w))
  lines.push(blank())

  if (data.tableLabel) {
    lines.push(fit(data.tableLabel, '', w))
    lines.push(blank())
  }

  const showSourceLabels =
    data.sourceOrders.length > 1 ||
    data.sourceOrders.some((sourceOrder) => sourceOrder.label !== data.bill.reference)
  data.sourceOrders.forEach((sourceOrder, index) => {
    if (showSourceLabels) {
      if (index > 0) lines.push(blank())
      lines.push(fit(`ORDER ${sourceOrder.label}`, '', w))
    }
    sourceOrder.items.forEach((item) => {
      lines.push(fit(`${item.quantity}x ${item.name}`, formatIDR(item.subtotal), w))
      if (item.variant) lines.push(`  ${item.variant}`)
      item.options.forEach((opt) => lines.push(`  ${opt.label}`))
      if (item.notes) lines.push(`  (${item.notes})`)
    })
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
  if (data.payment.paidAt) lines.push(fit(`DIBAYAR: ${formatReceiptDate(data.payment.paidAt)}`, '', w))
  if (data.payment.cashier) lines.push(fit(`KASIR: ${data.payment.cashier}`, '', w))
  if (data.payment.method === 'CASH') {
    if (data.payment.cashReceived !== null) {
      lines.push(fit('TUNAI', formatIDR(data.payment.cashReceived), w))
    }
    if (data.payment.change !== null) lines.push(fit('KEMBALI', formatIDR(data.payment.change), w))
  }
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
