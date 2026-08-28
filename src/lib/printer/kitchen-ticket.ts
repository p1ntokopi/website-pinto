/**
 * Kitchen ticket formatter — monospace 32-char (58mm) text with NO prices.
 * Printed via the active printer provider through printRawText().
 */

const WIDTH = 32

function center(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length >= WIDTH) return trimmed.slice(0, WIDTH)
  const totalPad = WIDTH - trimmed.length
  const left = Math.floor(totalPad / 2)
  return ' '.repeat(left) + trimmed + ' '.repeat(totalPad - left)
}

function divider(): string {
  return '-'.repeat(WIDTH)
}

function wordWrap(text: string, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= width) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word.slice(0, width)
    }
  }
  if (current) lines.push(current)
  return lines
}

export type KitchenTicketItem = {
  quantity: number
  product_name_snapshot: string
  variant_name_snapshot: string | null
  notes: string | null
  options: { option_value_snapshot: string | null }[] | null
}

export type KitchenTicketOrder = {
  order_number: string
  created_at: string
  table_number?: string | null
  notes?: string | null
  items: KitchenTicketItem[]
}

/**
 * Renders a kitchen ticket: header, order info, then items with qty — no
 * prices. Long notes are word-wrapped; item notes get a `!!` prefix.
 */
export function formatKitchenTicket(order: KitchenTicketOrder): string {
  const lines: string[] = []

  lines.push(center('** TIKET DAPUR **'))
  lines.push(order.order_number)
  const created = new Date(order.created_at).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  lines.push(order.table_number ? `MEJA ${order.table_number} · ${created}` : `WALK-IN · ${created}`)
  lines.push(divider())

  for (const item of order.items ?? []) {
    lines.push(`${item.quantity}x ${item.product_name_snapshot}`.slice(0, WIDTH))
    if (item.variant_name_snapshot) {
      lines.push(`  - ${item.variant_name_snapshot}`.slice(0, WIDTH))
    }
    for (const option of item.options ?? []) {
      lines.push(`  + ${option.option_value_snapshot}`.slice(0, WIDTH))
    }
    if (item.notes) {
      for (const noteLine of wordWrap(item.notes, WIDTH - 5)) {
        lines.push(`  !! ${noteLine}`)
      }
    }
  }

  if (order.notes) {
    lines.push(divider())
    for (const noteLine of wordWrap(order.notes, WIDTH - 2)) {
      lines.push(`* ${noteLine}`)
    }
  }

  lines.push(divider())
  return lines.join('\n')
}
