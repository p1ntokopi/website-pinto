'use client'

import { Users, Receipt, Clock, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiveTablesClientProps {
  initialTables: Record<string, unknown>[]
}

export function LiveTablesClient({ initialTables }: LiveTablesClientProps) {
  const [tables] = useState<Record<string, unknown>[]>(initialTables)

  // In a full production environment, we'd subscribe to `dining_sessions` and `orders` changes.
  // For now, we will simply poll every 30 seconds since we don't want to overcomplicate 
  // the client with complex relational subscriptions for tables in M4.
  // We can easily use supabase.channel('tables_live') if needed later.

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {tables.map(tableData => {
        const table = tableData as any
        const isOccupied = !!table.session
        const orderCount = table.session?.orders.length || 0
        const totalAmount = table.session?.orders.reduce((sum: number, o: any) => sum + o.total, 0) || 0

        if (!table.is_active) {
          return (
            <div key={table.id} className="bg-muted/30 border border-border/30 rounded-2xl p-4 flex flex-col items-center justify-center opacity-50 h-40">
              <Ban className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <div className="font-bold text-muted-foreground text-xl">T{table.table_number}</div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">Inactive</div>
            </div>
          )
        }

        return (
          <div 
            key={table.id} 
            className={cn(
              "rounded-2xl p-4 flex flex-col h-48 border shadow-sm transition-all hover:shadow-md",
              isOccupied 
                ? "bg-amber-500/10 border-amber-500/30" 
                : "bg-white border-border/50 hover:border-primary/50"
            )}
          >
            <div className="flex justify-between items-start mb-auto">
              <div className={cn("text-2xl font-black", isOccupied ? "text-amber-700" : "text-ink")}>
                T{table.table_number}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs font-semibold bg-muted/50 px-2 py-1 rounded-md">
                <Users className="w-3 h-3" /> {table.capacity}
              </div>
            </div>

            {isOccupied ? (
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700/80">
                  <Clock className="w-3.5 h-3.5" /> 
                  Since {formatTime(table.session.created_at)}
                </div>
                
                <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                      <Receipt className="w-3 h-3" /> {orderCount} Orders
                    </span>
                    {orderCount > 0 && (
                      <span className="text-xs font-bold text-amber-900">{formatPrice(totalAmount)}</span>
                    )}
                  </div>
                  {orderCount > 0 ? (
                    <div className="mt-2 text-xs text-amber-800/80 line-clamp-1">
                      {table.session.orders.map((o: any) => o.order_number).join(', ')}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-amber-800/60 italic">No orders yet</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-auto pt-4 flex flex-col items-center justify-center text-muted-foreground">
                <div className="text-sm font-semibold uppercase tracking-wider">Available</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
