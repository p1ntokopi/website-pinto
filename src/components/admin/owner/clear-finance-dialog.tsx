'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { clearFinancialDataAction } from '@/app/admin/(dashboard)/owner/finance/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface ClearFinanceDialogProps {
  currentRange?: { start: string; end: string }
  rangeLabel?: string
  trigger?: React.ReactNode
}

export function ClearFinanceDialog({
  currentRange,
  rangeLabel,
  trigger,
}: ClearFinanceDialogProps) {
  const [open, setOpen] = useState(false)
  const [scopeMode, setScopeMode] = useState<'RANGE' | 'ALL'>('RANGE')
  const [includeExpenses, setIncludeExpenses] = useState(true)
  const [reason, setReason] = useState('Pembersihan data uji coba')
  const [confirmText, setConfirmText] = useState('')
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const isConfirmed = confirmText.trim().toUpperCase() === 'HAPUS'

  async function handleClear() {
    if (!isConfirmed) return

    setIsPending(true)
    const scope = includeExpenses ? 'ALL' : 'ORDERS'
    const start = scopeMode === 'RANGE' ? currentRange?.start : null
    const end = scopeMode === 'RANGE' ? currentRange?.end : null

    const result = await clearFinancialDataAction({
      scope,
      start,
      end,
      reason,
    })

    setIsPending(false)

    if (!result.ok) {
      toast({
        variant: 'destructive',
        title: 'Penghapusan Gagal',
        description: result.error || 'Terjadi kesalahan saat menghapus data keuangan.',
      })
      return
    }

    const { orders_deleted = 0, expenses_voided = 0, adjustments_voided = 0 } = result.data || {}

    toast({
      title: 'Data Keuangan Berhasil Dibersihkan',
      description: `${orders_deleted} pesanan dihapus, ${expenses_voided} pengeluaran & ${adjustments_voided} penyesuaian dibatalkan.`,
    })

    setOpen(false)
    setConfirmText('')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (trigger as React.ReactElement) ?? (
            <Button
              variant="outline"
              size="sm"
              className="border-danger/40 text-danger hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus / Reset Data
            </Button>
          )
        }
      />

      <DialogContent className="max-w-md border-border-custom bg-card text-ink">
        <DialogHeader>
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Hapus &amp; Reset Data Keuangan</DialogTitle>
          </div>
          <DialogDescription className="text-muted-text">
            Tindakan ini khusus Owner untuk membersihkan catatan transaksi dan pengeluaran agar
            laporan keuangan rapi dan tidak membingungkan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-text">
              Cakupan Data yang Dihapus
            </label>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-border-custom p-2.5 transition-colors hover:bg-muted/50">
                <input
                  type="radio"
                  name="scope"
                  checked={scopeMode === 'RANGE'}
                  onChange={() => setScopeMode('RANGE')}
                  className="accent-coffee"
                />
                <div>
                  <p className="font-medium text-ink">
                    Hanya Periode Terpilih {rangeLabel ? `(${rangeLabel})` : ''}
                  </p>
                  <p className="text-xs text-muted-text">
                    Menghapus data pesanan pada rentang tanggal filter yang aktif.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-border-custom p-2.5 transition-colors hover:bg-muted/50">
                <input
                  type="radio"
                  name="scope"
                  checked={scopeMode === 'ALL'}
                  onChange={() => setScopeMode('ALL')}
                  className="accent-coffee"
                />
                <div>
                  <p className="font-medium text-ink">Semua Data (Mulai dari Nol)</p>
                  <p className="text-xs text-muted-text">
                    Menghapus seluruh pesanan dan transaksi yang ada di sistem.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-border-custom/80 p-2.5">
            <input
              type="checkbox"
              checked={includeExpenses}
              onChange={(e) => setIncludeExpenses(e.target.checked)}
              className="accent-coffee"
            />
            <span className="text-xs font-medium text-ink">
              Sertakan catatan Pengeluaran (Beban) &amp; Penyesuaian
            </span>
          </label>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-text">
              Alasan Penghapusan
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Pembersihan data uji coba awal"
              className="text-sm"
            />
          </div>

          <div className="rounded-sm border border-danger/25 bg-danger/5 p-3 text-xs text-danger">
            <p className="font-semibold">Konfirmasi Keamanan:</p>
            <p className="mt-1">
              Ketik <span className="font-mono font-bold">HAPUS</span> di bawah ini untuk
              melanjutkan.
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Ketik HAPUS"
              className="mt-2 border-danger/30 bg-background text-ink placeholder:text-muted-text"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleClear}
            disabled={!isConfirmed || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              'Hapus Sekarang'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
