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
import { Edit2, Trash2 } from 'lucide-react'
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
    if (!confirm(`Are you sure you want to delete ${category.name}?`)) return
    
    setIsProcessing(true)
    const result = await deleteCategory(category.id)
    setIsProcessing(false)
    
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error })
    } else {
      toast({ title: 'Success', description: 'Category deleted.' })
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-display">Manage Categories</h2>
        <Button onClick={handleAddNew}>Add Category</Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No categories found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="w-20 text-muted-foreground">{cat.sort_order}</TableCell>
                  <TableCell className="font-medium">
                    {cat.name}
                    {cat.description && <span className="block text-xs text-muted-foreground font-normal">{cat.description}</span>}
                  </TableCell>
                  <TableCell>{cat.product_count || 0}</TableCell>
                  <TableCell>
                    {cat.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(cat)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDelete(cat)}
                      disabled={isProcessing || (cat.product_count ? cat.product_count > 0 : false)}
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

      <CategoryFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        category={selectedCategory} 
      />
    </div>
  )
}
