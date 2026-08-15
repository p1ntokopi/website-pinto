'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Receipt, Clock, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'

type TableOrder = {
  id: string
  order_number: string
  dining_session_id: string | null
  total: number
  status: string
}

type LiveTableData = {
  id: string
  table_number: number
  capacity: number
  is_active: boolean
  session: {
    id: string
    created_at: string
    orders: TableOrder[]
  } | null
}

interface LiveTablesClientProps {
  initialTables: LiveTableData[]
}

export function LiveTablesClient({ initialTables }: LiveTablesClientProps) {
  const [tables] = useState<LiveTableData[]>(initialTables)
  const router = useRouter()

  // Poll the server for fresh data every 30 seconds so occupancy
  // stays reasonably current without complex client subscriptions.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) router.refresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [router])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
      {tables.map((table) => {
        const isOccupied = !!table.session
        const orderCount = table.session?.orders.length || 0
        const totalAmount =
          table.session?.orders.reduce((sum, o) => sum + o.total, 0) || 0

        if (!table.is_active) {
          return (
            <div
              key={table.id}
              className="flex h-40 flex-col items-center justify-center rounded-lg border border-border/30 bg-muted/30 p-4 opacity-50"
            >
              <Ban className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <div className="text-xl font-bold text-muted-foreground">
                T{table.table_number}
              </div>
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Nonaktif
              </div>
            </div>
          )
        }

        return (
          <div
            key={table.id}
            className={cn(
              'flex h-48 flex-col rounded-lg border p-4 shadow-card transition-all hover:shadow-raised',
              isOccupied
                ? 'border-warning/30 bg-warning/5'
                : 'border-border/50 bg-white hover:border-primary/50'
            )}
          >
            <div className="mb-auto flex items-start justify-between">
              <div
                className={cn(
                  'text-2xl font-black',
                  isOccupied ? 'text-warning' : 'text-ink'
                )}
              >
                T{table.table_number}
              </div>
              <div className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs font-semibold text-muted-foreground">
                <Users className="h-3 w-3" /> {table.capacity}
              </div>
            </div>

            {isOccupied ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-warning/80">
                  <Clock className="h-3.5 w-3.5" />
                  Sejak {formatTime(table.session!.created_at)}
                </div>

                <div className="rounded-lg border border-warning/20 bg-warning/10 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs font-semibold text-warning">
                      <Receipt className="h-3 w-3" /> {orderCount} Pesanan
                    </span>
                    {orderCount > 0 && (
                      <span className="text-xs font-bold text-warning">
                        {formatPrice(totalAmount)}
                      </span>
                    )}
                  </div>
                  {orderCount > 0 ? (
                    <div className="mt-2 line-clamp-1 text-xs text-warning/80">
                      {table.session!.orders.map((o) => o.order_number).join(', ')}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs italic text-warning/60">Belum ada pesanan</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-auto flex flex-col items-center justify-center pt-4 text-muted-foreground">
                <div className="text-sm font-semibold uppercase tracking-wider">Tersedia</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
