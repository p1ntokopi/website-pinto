"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Edit2, Trash2, Plus, AlertTriangle } from "lucide-react"

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-display">Kelola Produk</h2>
        <Button render={<Link href="/admin/menu/products/new" />}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Harga Dasar</TableHead>
              <TableHead>Tersedia</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <p className="font-medium text-foreground">Belum ada produk</p>
                  <p className="text-sm mt-1">Tambahkan produk pertama Anda untuk mulai berjualan.</p>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-[10px] uppercase text-muted-foreground">
                          P1NTO
                        </div>
                      )}
                      <div>
                        {product.name}
                        {product.is_featured && (
                          <Badge variant="secondary" className="ml-2 text-[10px]">
                            Unggulan
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category?.name || "Tanpa Kategori"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {product.product_type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(product.base_price)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={product.is_available}
                      onCheckedChange={() => handleToggleAvailability(product)}
                      disabled={isProcessing === product.id}
                      aria-label={`Ubah ketersediaan untuk ${product.name}`}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
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
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
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
