"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Edit2, Trash2, Plus, AlertTriangle, Coffee } from "lucide-react"

import { Database } from "@/types/database.types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  deleteProduct,
  toggleProductAvailability,
} from "@/app/admin/(dashboard)/menu/products/actions"
import { useToast } from "@/hooks/use-toast"

type ProductRow = Database["public"]["Tables"]["products"]["Row"]
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"]
type ProductWithCategory = ProductRow & { category?: CategoryRow | null }

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price)

export function ProductList({ products }: { products: ProductWithCategory[] }) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  const handleToggleAvailability = async (product: ProductRow) => {
    setIsProcessing(product.id)
    const result = await toggleProductAvailability(product.id, !product.is_available)
    setIsProcessing(null)

    if (result.error) {
      toast({ variant: "destructive", title: "Kesalahan", description: result.error })
    } else {
      toast({
        title: "Status Diperbarui",
        description: `${product.name} sekarang ${!product.is_available ? "tersedia" : "tidak tersedia"}.`,
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsProcessing(deleteTarget.id)
    const result = await deleteProduct(deleteTarget.id)
    setIsProcessing(null)
    setDeleteDialogOpen(false)
    setDeleteTarget(null)

    if (result.error) {
      toast({ variant: "destructive", title: "Kesalahan", description: result.error })
    } else {
      toast({ title: "Berhasil", description: "Produk dihapus." })
      router.refresh()
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">Kelola Produk</h2>
        <Button render={<Link href="/admin/menu/products/new" />}>
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      <div className="hidden overflow-hidden border border-border-custom/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border-custom/70">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">Produk</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">Kategori</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">Tipe</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">Harga Dasar</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">Tersedia</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-text">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-text">
                  <Coffee className="mx-auto mb-3 h-7 w-7 text-muted-text/50" />
                  <p className="font-medium text-ink">Belum ada produk</p>
                  <p className="mt-1 text-sm">Tambahkan produk pertama Anda.</p>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="border-b border-border-custom/60">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded-sm border border-border-custom object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-border-custom bg-muted/60 text-[10px] font-semibold uppercase text-muted-text">
                          Pinto
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-ink">{product.name}</span>
                        {product.is_featured && (
                          <Badge variant="secondary" className="mt-0.5 text-[10px]">
                            Unggulan
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-text">
                    {product.category?.name || "Tanpa Kategori"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border-custom text-xs font-medium text-muted-text">
                      {product.product_type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-ink">
                    {formatPrice(product.base_price)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={product.is_available}
                      onCheckedChange={() => handleToggleAvailability(product)}
                      disabled={isProcessing === product.id}
                      aria-label={`Ubah ketersediaan untuk ${product.name}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        render={<Link href={`/admin/menu/products/${product.id}`} />}
                        variant="outline"
                        size="icon"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setDeleteTarget(product)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={isProcessing === product.id}
                        aria-label={`Hapus ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border-custom px-6 py-14 text-center">
            <Coffee className="mb-3 h-7 w-7 text-muted-text/50" />
            <p className="text-sm font-medium text-ink">Belum ada produk</p>
            <p className="mt-1 text-sm text-muted-text">Tambahkan produk pertama Anda.</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="rounded-sm border border-border-custom bg-card p-4">
              <div className="flex items-start gap-3">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-14 w-14 shrink-0 rounded-sm border border-border-custom object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-border-custom bg-muted/60 text-[10px] font-semibold uppercase text-muted-text">
                    Pinto
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {product.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-text">
                        {product.category?.name || "Tanpa Kategori"} ·{" "}
                        {product.product_type.replace("_", " ")}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-ink">
                      {formatPrice(product.base_price)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border-custom/60 pt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.is_available}
                        onCheckedChange={() => handleToggleAvailability(product)}
                        disabled={isProcessing === product.id}
                        aria-label={`Ubah ketersediaan untuk ${product.name}`}
                      />
                      <span className="text-xs font-medium text-muted-text">
                        {product.is_available ? "Tersedia" : "Kosong"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        render={<Link href={`/admin/menu/products/${product.id}`} />}
                        variant="outline"
                        size="icon"
                        className="min-h-10 min-w-10"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="min-h-10 min-w-10"
                        onClick={() => {
                          setDeleteTarget(product)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={isProcessing === product.id}
                        aria-label={`Hapus ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger" />
              Hapus Produk
            </DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus &quot;{deleteTarget?.name}&quot;? Tindakan ini
              tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Pertahankan Produk
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing !== null}>
              Hapus Produk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}