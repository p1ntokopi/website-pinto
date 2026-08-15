import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductList } from '@/components/admin/product-list'

export const metadata: Metadata = {
  title: 'Produk - P1NTO Admin',
}

export default async function AdminProductsPage() {
  const supabase = await createClient()

  // Fetch all products with their category details
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name)
    `)
    .order('sort_order', { ascending: true })

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Gagal memuat produk: {error.message}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary">Produk Menu</h1>
        <p className="text-muted-foreground mt-1">Kelola semua item yang tersedia di menu digital Anda.</p>
      </div>

      <ProductList products={products} />
    </div>
  )
}
