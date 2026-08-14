import { createClient } from '@/lib/supabase/server'
import { getSessionToken } from '@/lib/ordering/session'
import { redirect } from 'next/navigation'
import { CategoryNav } from '@/components/ordering/category-nav'
import { ProductCard } from '@/components/ordering/product-card'
import { CartBar } from '@/components/ordering/cart-bar'
import { Coffee } from 'lucide-react'

export default async function MenuPage({ params }: { params: { slug: string } }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const sessionToken = await getSessionToken()

  // Verify Table & Session
  const { data: table } = await supabase
    .from('tables')
    .select('id, table_number, is_active')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!table || !table.is_active || !sessionToken) {
    redirect(`/t/${resolvedParams.slug}`)
  }

  // Check if session is valid
  const { data: session } = await supabase
    .from('dining_sessions')
    .select('id')
    .eq('session_token', sessionToken)
    .eq('table_id', table.id)
    .eq('status', 'open')
    .single()

  if (!session) {
    redirect(`/t/${resolvedParams.slug}`)
  }

  // Fetch Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order')

  // Fetch Products with variants count
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, slug, description, base_price, image_url, category_id,
      variants:product_variants(id)
    `)
    .eq('is_available', true)
    .order('sort_order')

  // Group products by category
  const productsByCategory = categories?.map(cat => ({
    ...cat,
    products: products?.filter(p => p.category_id === cat.id) || []
  })).filter(cat => cat.products.length > 0) || []

  return (
    <div className="pb-32 relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border/50">
        <div className="max-w-md mx-auto px-4 h-[60px] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg tracking-widest uppercase text-primary leading-none">P1NTO</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Coffee</span>
          </div>
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
            <Coffee className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold tracking-wide">TABLE {table.table_number}</span>
          </div>
        </div>
      </header>

      <CategoryNav categories={productsByCategory} />

      <main className="max-w-md mx-auto p-4 space-y-12 mt-4">
        {productsByCategory.map(category => (
          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-32">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {category.products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={{
                    ...product,
                    variants_count: product.variants?.length || 0
                  }}
                  tableSlug={resolvedParams.slug}
                />
              ))}
            </div>
          </section>
        ))}
        
        {productsByCategory.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Menu is currently empty.</p>
          </div>
        )}
      </main>

      <CartBar tableSlug={resolvedParams.slug} />
    </div>
  )
}
