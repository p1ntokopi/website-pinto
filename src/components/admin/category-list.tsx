'use client'

import { useState } from 'react'
import { Database } from '@/types/database.types'
import { CategoryFormDialog } from '@/components/admin/category-form-dialog'
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
import { Edit2, Trash2, Tags } from 'lucide-react'
import { deleteCategory } from '@/app/admin/(dashboard)/menu/categories/actions'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

type CategoryRow = Database['public']['Tables']['categories']['Row']
type CategoryWithCount = CategoryRow & { product_count?: number }

export function CategoryList({ categories }: { categories: CategoryWithCount[] }) {
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  const handleEdit = (category: CategoryRow) => {
    setSelectedCategory(category)
    setFormOpen(true)
  }

  const handleAddNew = () => {
    setSelectedCategory(null)
    setFormOpen(true)
  }

  const handleDelete = async (category: CategoryRow) => {
    if (!confirm(`Yakin ingin menghapus ${category.name}?`)) return

    setIsProcessing(true)
    const result = await deleteCategory(category.id)
    setIsProcessing(false)

    if (result.error) {
      toast({ variant: 'destructive', title: 'Kesalahan', description: result.error })
    } else {
      toast({ title: 'Berhasil', description: 'Kategori dihapus.' })
      router.refresh()
    }
  }

  const statusChip = (isActive: boolean) =>
    isActive ? (
      <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
        Aktif
      </Badge>
    ) : (
      <Badge variant="outline" className="border-border-custom bg-muted text-muted-text">
        Nonaktif
      </Badge>
    )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">Kelola Kategori</h2>
        <Button onClick={handleAddNew}>Tambah Kategori</Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border-custom px-6 py-14 text-center">
          <Tags className="mb-3 h-8 w-8 text-muted-text/60" />
          <p className="text-sm font-semibold text-ink">Belum ada kategori</p>
          <p className="mt-1 text-sm text-muted-text">Buat satu untuk memulai.</p>
          <Button onClick={handleAddNew} className="mt-4">
            Tambah Kategori
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden border border-border-custom/70 md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border-custom/70">
                  <TableHead className="w-16 text-[11px] font-semibold uppercase tracking-wider text-muted-text">Urutan</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">Kategori</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">Produk</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">Status</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-text">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id} className="border-b border-border-custom/60">
                    <TableCell className="text-sm text-muted-text">{cat.sort_order}</TableCell>
                    <TableCell>
                      <div className="font-medium text-ink">{cat.name}</div>
                      {cat.description && (
                        <div className="text-xs font-normal text-muted-text">{cat.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-ink">{cat.product_count || 0}</TableCell>
                    <TableCell>{statusChip(cat.is_active)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(cat)} aria-label={`Edit ${cat.name}`}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(cat)}
                          disabled={isProcessing || (cat.product_count ? cat.product_count > 0 : false)}
                          aria-label={`Hapus ${cat.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {categories.map((cat) => (
              <div key={cat.id} className="rounded-sm border border-border-custom bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink">{cat.name}</div>
                    {cat.description && (
                      <div className="mt-0.5 truncate text-xs text-muted-text">{cat.description}</div>
                    )}
                  </div>
                  {statusChip(cat.is_active)}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border-custom/60 pt-3">
                  <span className="text-xs font-medium text-muted-text">
                    Urutan {cat.sort_order} · {cat.product_count || 0} produk
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="min-h-10 min-w-10"
                      onClick={() => handleEdit(cat)}
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="min-h-10 min-w-10"
                      onClick={() => handleDelete(cat)}
                      disabled={isProcessing || (cat.product_count ? cat.product_count > 0 : false)}
                      aria-label={`Hapus ${cat.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={selectedCategory} />
    </div>
  )
}