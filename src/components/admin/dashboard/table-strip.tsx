'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type StripTable = {
  id: string
  table_number: number
  capacity: number
  is_active: boolean
  session: {
    id: string
    created_at: string
    orders: { id: string; order_number: string; total: number; status: string }[]
  } | null
}

interface TableStripProps {
  initialTables: StripTable[]
}

export function TableStrip({ initialTables }: TableStripProps) {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) router.refresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="grid grid-cols-3 gap-2">
      {initialTables.map((table) => {
        const isOccupied = !!table.session
        const orderCount = table.session?.orders.length || 0

        return (
          <Link
            key={table.id}
            href="/admin/tables/live"
            aria-label={`Meja ${table.table_number}`}
            className={cn(
              'rounded-sm border p-3 transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
              !table.is_active
                ? 'border-border-custom/60 opacity-45'
                : isOccupied
                  ? 'border-warning/40 bg-warning/5 hover:bg-warning/10'
                  : 'border-border-custom bg-card hover:border-coffee/40'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink">T{table.table_number}</span>
              {table.is_active && (
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    isOccupied ? 'bg-warning' : 'bg-success'
                  )}
                />
              )}
            </div>
            <div className="mt-1 text-[11px] font-medium leading-snug text-muted-text">
              {!table.is_active
                ? 'Nonaktif'
                : isOccupied
                  ? `${orderCount} pesanan`
                  : 'Kosong'}
            </div>
          </Link>
        )
      })}
    </div>
  )
}