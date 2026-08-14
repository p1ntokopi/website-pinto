'use client'

import { useState } from 'react'
import { Database } from '@/types/database.types'
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
import { Switch } from '@/components/ui/switch'
import { Edit2, Trash2 } from 'lucide-react'
import { deleteProduct, toggleProductAvailability } from '@/app/admin/(dashboard)/menu/products/actions'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ProductRow = Database['public']['Tables']['products']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type ProductWithCategory = ProductRow & { category?: CategoryRow | null }

export function ProductList({ products }: { products: ProductWithCategory[] }) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  
  const { toast } = useToast()
  const router = useRouter()

  const handleToggleAvailability = async (product: ProductRow) => {
    setIsProcessing(product.id)
    const result = await toggleProductAvailability(product.id, !product.is_available)
    setIsProcessing(null)
    
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error })
    } else {
      toast({ title: 'Status Updated', description: `${product.name} is now ${!product.is_available ? 'available' : 'unavailable'}.` })
    }
  }

  const handleDelete = async (product: ProductRow) => {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return
    
    setIsProcessing(product.id)
    const result = await deleteProduct(product.id)
    setIsProcessing(null)
    
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error })
    } else {
      toast({ title: 'Success', description: 'Product deleted.' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-display">Manage Products</h2>
        <Button render={<Link href="/admin/menu/products/new" />}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <Body>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No products found. Add your first product.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-md object-cover border" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border text-xs text-muted-foreground">No img</div>
                      )}
                      <div>
                        {product.name}
                        {product.is_featured && <Badge variant="secondary" className="ml-2 text-[10px]">Featured</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category?.name || 'Uncategorized'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {product.product_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.base_price)}
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={product.is_available} 
                      onCheckedChange={() => handleToggleAvailability(product)}
                      disabled={isProcessing === product.id}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button render={<Link href={`/admin/menu/products/${product.id}/edit`} />} variant="outline" size="icon" disabled={isProcessing === product.id}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDelete(product)}
                      disabled={isProcessing === product.id}
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
    </div>
  )
}
