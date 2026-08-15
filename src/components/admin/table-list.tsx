'use client'

import { useState } from 'react'
import { Database } from '@/types/database.types'
import { TableFormDialog } from '@/components/admin/table-form-dialog'
import { QRPreview } from '@/components/admin/qr-preview'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Edit2, QrCode, Archive, CheckCircle2 } from 'lucide-react'
import { archiveTable } from '@/app/admin/(dashboard)/tables/actions'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

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
        description: `Meja ${table.table_number} sekarang ${!table.is_active ? 'aktif' : 'diarsipkan'}.`
      })
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-display">Kelola Meja</h2>
        <Button onClick={handleAddNew}>Tambah Meja Baru</Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meja</TableHead>
              <TableHead>Kapasitas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Belum ada meja. Tambahkan meja pertama Anda untuk membuat kode QR.
                </TableCell>
              </TableRow>
            ) : (
              tables.map((table) => {
                let statusVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline'
                let statusText = 'Tidak Diketahui'

                if (!table.is_active) {
                  statusVariant = 'secondary'
                  statusText = 'Diarsipkan'
                } else if (table.has_active_session) {
                  statusVariant = 'destructive'
                  statusText = 'Terisi'
                } else {
                  statusVariant = 'default'
                  statusText = 'Tersedia'
                }

                return (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">
                      Meja {table.table_number}
                      {table.name && <span className="block text-xs text-muted-foreground font-normal">{table.name}</span>}
                    </TableCell>
                    <TableCell>{table.capacity} kursi</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant}>{statusText}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleShowQR(table)} disabled={!table.is_active}>
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(table)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleToggleArchive(table)}
                        disabled={isProcessing}
                      >
                        {table.is_active ? <Archive className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TableFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        table={selectedTable} 
      />

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Kode QR Meja {selectedTable?.table_number}</DialogTitle>
            <DialogDescription>
              Pindai kode ini untuk mengakses menu digital dan memesan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            {selectedTable && (
              <QRPreview slug={selectedTable.slug} tableNumber={selectedTable.table_number} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
