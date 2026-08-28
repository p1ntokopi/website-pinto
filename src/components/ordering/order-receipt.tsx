'use client'

import { useEffect, useState } from 'react'
import {
  ReceiptPrinter,
  type ReceiptPrinterStage,
} from '@/components/receipt/receipt-printer'
import { BUSINESS } from '@/config/business'
import { formatIDR } from '@/lib/receipt/receipt-service'
import { cn } from '@/lib/utils'

export type OrderReceiptItem = {
  id: string
  quantity: number
  product_name_snapshot: string
  variant_name_snapshot: string | null
  subtotal: number
  notes: string | null
  options: { option_value_snapshot: string; price_adjustment: number }[]
}

type OrderReceiptProps = {
  orderNumber: string
  tableNumber: string | number
  items: OrderReceiptItem[]
  total: number
  paymentStatus: string | null
}

// Slightly longer than the 3.4s feed animation so the paper finishes first.
const FEED_DURATION_MS = 3700
const TEAR_DURATION_MS = 900

function Divider() {
  return <div className="my-3 border-t border-dashed border-ink/20" aria-hidden="true" />
}

/**
 * Buyer-facing order summary rendered as a receipt coming out of a thermal
 * printer. The print animation plays once per order (per browser session);
 * on later visits the receipt is already "printed" and the paper sits out.
 */
export function OrderReceipt({
  orderNumber,
  tableNumber,
  items,
  total,
  paymentStatus,
}: OrderReceiptProps) {
  const [stage, setStage] = useState<ReceiptPrinterStage>('processing')

  useEffect(() => {
    const storageKey = `pinto.receipt-printed.${orderNumber}`
    let cancelled = false

    async function run() {
      let played = false
      try {
        played = sessionStorage.getItem(storageKey) !== null
      } catch {
        // Storage unavailable (private mode) — just replay, harmless.
      }

      if (played) {
        await Promise.resolve()
        if (!cancelled) setStage('complete')
        return
      }

      try {
        sessionStorage.setItem(storageKey, '1')
      } catch {
        // Ignore — the animation still plays for this visit.
      }

      await new Promise((resolve) => setTimeout(resolve, 900))
      if (cancelled) return
      setStage('printing')
      await new Promise((resolve) => setTimeout(resolve, FEED_DURATION_MS))
      if (cancelled) return
      setStage('tearing')
      await new Promise((resolve) => setTimeout(resolve, TEAR_DURATION_MS))
      if (cancelled) return
      setStage('complete')
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [orderNumber])

  const isPaid = paymentStatus === 'PAID'

  return (
    <ReceiptPrinter.Root stage={stage} aria-label="Struk pesanan">
      <ReceiptPrinter.Machine>
        <ReceiptPrinter.Header>
          <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/40">
            Pinto POS
          </span>
          <span
            aria-hidden="true"
            className="mr-1 inline-block size-2 rounded-full bg-success/80 shadow-[0_0_6px_rgba(46,139,87,0.9)]"
          />
        </ReceiptPrinter.Header>
        <ReceiptPrinter.Screen>
          <ReceiptPrinter.Status />
        </ReceiptPrinter.Screen>
        <ReceiptPrinter.Output>
          <ReceiptPrinter.Paper>
            <div className="text-center">
              <p className="font-display text-2xl font-bold tracking-tight text-ink">
                {BUSINESS.name}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-text">
                {BUSINESS.tagline}
              </p>
            </div>

            <Divider />

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-text">ORDER</span>
                <span className="font-semibold">#{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-text">MEJA</span>
                <span className="font-semibold">{String(tableNumber).padStart(2, '0')}</span>
              </div>
            </div>

            <Divider />

            <ul className="space-y-3 text-xs">
              {items.map((item) => (
                <li key={item.id}>
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">
                      {item.quantity}x {item.product_name_snapshot}
                    </span>
                    <span>{formatIDR(item.subtotal)}</span>
                  </div>
                  {item.variant_name_snapshot && (
                    <p className="mt-0.5 text-muted-text">• {item.variant_name_snapshot}</p>
                  )}
                  {item.options.map((opt, i) => (
                    <p key={i} className="text-muted-text">
                      • {opt.option_value_snapshot}
                    </p>
                  ))}
                  {item.notes && <p className="mt-0.5 italic text-muted-text">&quot;{item.notes}&quot;</p>}
                </li>
              ))}
            </ul>

            <Divider />

            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold uppercase tracking-wide">Total</span>
              <span className="text-lg font-bold">{formatIDR(total)}</span>
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-muted-text">PEMBAYARAN</span>
              <span className={cn('font-semibold', isPaid ? 'text-success' : 'text-warning')}>
                {isPaid ? 'LUNAS' : 'BELUM DIBAYAR'}
              </span>
            </div>

            <Divider />

            <p className="text-center text-[11px] text-muted-text">{BUSINESS.footerMessage}</p>
            <p className="mt-1 text-center text-[10px] text-muted-text">{BUSINESS.website}</p>
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Machine>
    </ReceiptPrinter.Root>
  )
}
