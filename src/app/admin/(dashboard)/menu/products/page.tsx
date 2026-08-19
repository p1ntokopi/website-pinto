import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductList } from '@/components/admin/product-list'

export const metadata: Metadata = {
  title: 'Produk - Pinto Admin',
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
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">Katalog</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Produk</h1>
        <p className="mt-2 text-sm text-muted-text">
          Kelola semua item yang tersedia di menu digital.
        </p>
      </div>

      <ProductList products={products} />
    </div>
  )
}
