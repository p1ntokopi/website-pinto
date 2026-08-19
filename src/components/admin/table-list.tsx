'use client'

import { useState } from 'react'
import { Database } from '@/types/database.types'
import { TableFormDialog } from '@/components/admin/table-form-dialog'
import { QRPreview } from '@/components/admin/qr-preview'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Edit2, QrCode, Archive, CheckCircle2, Users, Plus } from 'lucide-react'
import { archiveTable } from '@/app/admin/(dashboard)/tables/actions'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type TableRow = Database['public']['Tables']['tables']['Row']
type TableWithSession = TableRow & { has_active_session: boolean }

export function TableList({ tables }: { tables: TableWithSession[] }) {
  const [formOpen, setFormOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableRow | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  const handleEdit = (table: TableRow) => {
    setSelectedTable(table)
    setFormOpen(true)
  }

  const handleAddNew = () => {
    setSelectedTable(null)
    setFormOpen(true)
  }

  const handleShowQR = (table: TableRow) => {
    setSelectedTable(table)
    setQrOpen(true)
  }

  const handleToggleArchive = async (table: TableRow) => {
    setIsProcessing(true)
    const result = await archiveTable(table.id, !table.is_active)
    setIsProcessing(false)

    if (result.error) {
      toast({ variant: 'destructive', title: 'Kesalahan', description: result.error })
    } else {
      toast({
        title: 'Status Diperbarui',
        description: `Meja ${table.table_number} sekarang ${!table.is_active ? 'aktif' : 'diarsipkan'}.`,
      })
      router.refresh()
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">Kelola Meja</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4" />
          Tambah Meja
        </Button>
      </div>

      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border-custom px-6 py-14 text-center">
          <Users className="mb-3 h-8 w-8 text-muted-text/60" />
          <p className="text-sm font-semibold text-ink">Belum ada meja</p>
          <p className="mt-1 max-w-sm text-sm text-muted-text">
            Tambahkan meja pertama untuk membuat kode QR pemesanan.
          </p>
          <Button onClick={handleAddNew} className="mt-4">
            <Plus className="h-4 w-4" />
            Tambah Meja
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => {
            let statusChip: React.ReactNode
            if (!table.is_active) {
              statusChip = (
                <Badge variant="outline" className="border-border-custom bg-muted text-muted-text">
                  Diarsipkan
                </Badge>
              )
            } else if (table.has_active_session) {
              statusChip = (
                <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
                  Terisi
                </Badge>
              )
            } else {
              statusChip = (
                <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                  Tersedia
                </Badge>
              )
            }

            return (
              <div
                key={table.id}
                className={cn(
                  'flex flex-col rounded-sm border border-border-custom bg-card p-4 transition-colors',
                  table.is_active ? 'hover:border-coffee/40' : 'opacity-55'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-base font-bold tracking-tight text-ink">
                      Meja {table.table_number}
                    </div>
                    {table.name && (
                      <div className="mt-0.5 truncate text-xs text-muted-text">{table.name}</div>
                    )}
                  </div>
                  {statusChip}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-text">
                  <Users className="h-3.5 w-3.5" />
                  {table.capacity} kursi
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-border-custom/60 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowQR(table)}
                    disabled={!table.is_active}
                    className="min-h-10 flex-1 gap-1.5"
                  >
                    <QrCode className="h-4 w-4" />
                    QR
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(table)}
                    aria-label={`Edit meja ${table.table_number}`}
                    className="min-h-10 min-w-10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleToggleArchive(table)}
                    disabled={isProcessing}
                    aria-label={table.is_active ? `Arsipkan meja ${table.table_number}` : `Aktifkan meja ${table.table_number}`}
                    className="min-h-10 min-w-10"
                  >
                    {table.is_active ? (
                      <Archive className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TableFormDialog open={formOpen} onOpenChange={setFormOpen} table={selectedTable} />

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Kode QR Meja {selectedTable?.table_number}</DialogTitle>
            <DialogDescription>
              Pindai kode ini untuk mengakses menu digital dan memesan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {selectedTable && (
              <QRPreview slug={selectedTable.slug} tableNumber={selectedTable.table_number} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}