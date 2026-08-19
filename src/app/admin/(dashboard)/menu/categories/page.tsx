import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CategoryList } from '@/components/admin/category-list'

export const metadata: Metadata = {
  title: 'Kategori - Pinto Admin',
}

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  // Fetch all categories
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Gagal memuat kategori: {error.message}
      </div>
    )
  }

  // To get product count for each category, we can fetch product counts
  // A simpler way for M2 since we don't have a complex join view:
  const { data: products } = await supabase
    .from('products')
    .select('category_id')

  const productCounts = products?.reduce((acc: Record<string, number>, p) => {
    acc[p.category_id] = (acc[p.category_id] || 0) + 1
    return acc
  }, {}) || {}

  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    product_count: productCounts[cat.id] || 0
  }))

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">Katalog</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Kategori</h1>
        <p className="mt-2 text-sm text-muted-text">
          Atur item menu ke dalam kategori yang jelas.
        </p>
      </div>

      <CategoryList categories={categoriesWithCounts} />
    </div>
  )
}
