'use client'

import { useState } from 'react'
import { ArrowDownWideNarrow, Coins, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatIDR, formatNumberID } from '@/lib/finance/format'
import { EmptyState } from '@/components/admin/owner/empty-state'
import { Coffee } from 'lucide-react'

export type TopProduct = {
  name: string
  category: string
  units: number
  revenue: number
  avg_price: number | null
}

type SortKey = 'units' | 'revenue'

/** Best-selling products, sortable by units sold or revenue (spec §8). */
export function TopProducts({ products }: { products: TopProduct[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('units')

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Coffee}
        title="Belum ada penjualan"
        description="Produk terlaris muncul setelah ada pesanan yang dibayar."
      />
    )
  }

  const sorted = [...products].sort((a, b) =>
    sortKey === 'units' ? b.units - a.units : b.revenue - a.revenue,
  )
  const max = sortKey === 'units' ? sorted[0]?.units || 1 : sorted[0]?.revenue || 1

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <ArrowDownWideNarrow className="h-4 w-4 text-muted-text" aria-hidden="true" />
        <span className="text-xs font-medium text-muted-text">Urutkan:</span>
        {(
          [
            { key: 'units', label: 'Terbanyak', icon: ListOrdered },
            { key: 'revenue', label: 'Pendapatan', icon: Coins },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={sortKey === key}
            onClick={() => setSortKey(key)}
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
              sortKey === key
                ? 'border-coffee bg-coffee text-paper'
                : 'border-border-custom bg-paper text-muted-text hover:text-ink',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <ol className="divide-y divide-border-custom/70 rounded-sm border border-border-custom bg-card">
        {sorted.map((product, index) => (
          <li key={`${product.name}-${product.category}`} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-ink">
                <span className="mr-2 text-xs font-bold text-coffee">{index + 1}</span>
                {product.name}
              </p>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                {formatIDR(product.revenue)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-text">
              <span>
                {formatNumberID(product.units)} terjual
                {product.avg_price ? ` · rata-rata ${formatIDR(product.avg_price)}` : ''}
              </span>
              <span>{product.category}</span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-coffee/60"
                style={{
                  width: `${Math.max(
                    ((sortKey === 'units' ? product.units : product.revenue) / max) * 100,
                    3,
                  )}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
