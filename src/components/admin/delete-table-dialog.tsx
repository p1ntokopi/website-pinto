'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { deleteTable } from '@/app/admin/(dashboard)/tables/actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export type DeleteTableTarget = {
  id: string
  tableNumber: string
  name?: string | null
  capacity: number
  slug: string
}

/**
 * Permanent table removal. The dialog names the table so a destructive click
 * cannot land on the wrong card, and `admin_delete_table` re-checks the role
 * and the open-session guard regardless of what this renders.
 */
export function DeleteTableDialog({
  table,
  onDeleted,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  table: DeleteTableTarget
  onDeleted?: () => void
  trigger?: React.ReactNode
  /** Controlled mode — used when the trigger lives inside an overflow menu. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const [pending, setPending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }

  async function handleDelete() {
    setPending(true)
    const result = await deleteTable(table.id)
    setPending(false)

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Penghapusan Gagal',
        description: result.error,
      })
      return
    }

    toast({
      title: 'Meja Dihapus',
      description: `Meja ${table.tableNumber} dihapus. Nomornya kini dapat dipakai ulang.`,
    })
    setOpen(false)
    onDeleted?.()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as React.ReactElement} />
      ) : controlledOpen === undefined ? (
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={`Hapus meja ${table.tableNumber}`}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          }
        />
      ) : null}
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Hapus meja ini?</DialogTitle>
          <DialogDescription>
            Meja {table.tableNumber} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-sm bg-muted/40 px-4 py-3 text-sm">
          <dt className="text-muted-text">Nomor</dt>
          <dd className="text-right font-semibold text-ink">{table.tableNumber}</dd>
          <dt className="text-muted-text">Nama</dt>
          <dd className="text-right font-medium text-ink">{table.name || 'Tanpa nama'}</dd>
          <dt className="text-muted-text">Kapasitas</dt>
          <dd className="text-right font-medium text-ink">{table.capacity} kursi</dd>
        </dl>

        <div className="rounded-sm border border-border-custom bg-muted/30 px-4 py-3 text-xs text-muted-text">
          <p>
            Nomor <span className="font-medium text-ink">{table.tableNumber}</span> dan kode QR{' '}
            <span className="font-mono text-ink">{table.slug}</span> akan bebas dipakai ulang.
          </p>
          <p className="mt-2">
            Pesanan dan sesi lama tetap tersimpan, tetapi tidak lagi menunjuk ke meja ini.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Hapus Meja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}