'use client'

import { useEffect, useState } from 'react'
import { Printer, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatReceiptText } from '@/lib/receipt/receipt-service'
import type { ReceiptData, ThermalPaperWidth } from '@/lib/receipt/receipt-types'

const PAPER_OPTIONS: { value: ThermalPaperWidth; label: string }[] = [
  { value: 58, label: '58mm' },
  { value: 80, label: '80mm' },
]

export function ReceiptPrintView({ orderId, receiptData }: { orderId: string; receiptData: ReceiptData }) {
  const [paperWidth, setPaperWidth] = useState<ThermalPaperWidth>(58)

  const receiptText = formatReceiptText(receiptData, paperWidth)
  const maxWidth = paperWidth === 58 ? 'max-w-[300px]' : 'max-w-[420px]'

  useEffect(() => {
    const t = setTimeout(() => window.print(), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-muted/40 pb-24 print:bg-white print:pb-0">
      <div className="sticky top-0 z-10 border-b border-border-custom/60 bg-paper/95 px-4 py-3 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/orders/${orderId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-text transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none rounded-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Kembali
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-sm border border-border-custom bg-muted/40 p-0.5">
              {PAPER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaperWidth(opt.value)}
                  aria-pressed={paperWidth === opt.value}
                  className={cn(
                    'rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
                    paperWidth === opt.value ? 'bg-ink text-paper' : 'text-muted-text hover:text-ink'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-coffee px-4 text-sm font-semibold text-paper transition-colors hover:bg-coffee/90 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
            >
              <Printer className="h-4 w-4" />
              Cetak Sekarang
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-8 print:py-0">
        <div className="flex justify-center">
          <pre
            className={cn(
              'w-full rounded-sm border border-border-custom/60 bg-white p-6 font-mono text-[13px] leading-5 text-ink shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none',
              maxWidth
            )}
            data-paper-width={paperWidth}
          >
            {receiptText}
          </pre>
        </div>
        <p className="mt-4 text-center text-xs text-muted-text print:hidden">
          Struk dicetak dengan lebar kertas {paperWidth}mm · lebar {paperWidth === 58 ? 32 : 48} karakter per baris.
        </p>
      </div>
    </div>
  )
}