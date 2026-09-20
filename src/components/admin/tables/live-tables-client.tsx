'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Receipt, Clock, Ban, QrCode, CheckCircle2 } from 'lucide-react'
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

  if (initialTables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border-custom px-6 py-14 text-center">
        <QrCode className="mb-3 h-8 w-8 text-muted-text/60" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink">Belum ada meja</p>
        <p className="mt-1 max-w-sm text-sm text-muted-text">
          Tambahkan meja dan kode QR pemesanan terlebih dahulu.
        </p>
        <Link
          href="/admin/tables"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm bg-coffee px-4 text-sm font-semibold text-paper transition-colors hover:bg-coffee/90 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
        >
          <QrCode className="h-4 w-4" aria-hidden="true" />
          Kelola Meja &amp; QR
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
      {initialTables.map((table) => {
        const isOccupied = !!table.session
        const orderCount = table.session?.orders.length || 0
        const totalAmount =
          table.session?.orders.reduce((sum, o) => sum + o.total, 0) || 0

        if (!table.is_active) {
          return (
            <div
              key={table.id}
              className="flex h-40 flex-col items-center justify-center rounded-sm border border-border-custom/70 bg-muted/30 p-4 opacity-50"
            >
              <Ban className="mb-2 h-8 w-8 text-muted-text/50" aria-hidden="true" />
              <div className="text-xl font-bold text-muted-text">
                T{table.table_number}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-text">
                <Ban className="h-3 w-3" aria-hidden="true" />
                Nonaktif
              </div>
            </div>
          )
        }

        return (
          <div
            key={table.id}
            className={cn(
              'flex h-48 flex-col rounded-sm border p-4 transition-colors',
              isOccupied
                ? 'border-warning/40 bg-warning/5 hover:bg-warning/10'
                : 'border-border-custom bg-card hover:border-coffee/40'
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
              <div className="flex items-center gap-1 rounded-sm bg-muted/60 px-2 py-1 text-xs font-semibold text-muted-text">
                <Users className="h-3 w-3" /> {table.capacity}
              </div>
            </div>

            {isOccupied ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-sm border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-warning">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    Terisi
                  </span>
                  <span className="text-xs font-semibold text-warning/90">
                    Sejak {formatTime(table.session!.created_at)}
                  </span>
                </div>

                <div className="rounded-sm border border-warning/25 bg-warning/10 p-3">
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
                    <div className="mt-2 text-xs italic text-warning/70">Belum ada pesanan</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-auto flex flex-col items-center justify-center pt-4 text-success">
                <div className="flex items-center gap-1 text-sm font-semibold uppercase tracking-wider">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Tersedia
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
