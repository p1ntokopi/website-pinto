import { createClient } from "@/lib/supabase/server"
import { getSessionToken } from "@/lib/ordering/session"
import { redirect } from "next/navigation"
import { CategoryNav } from "@/components/ordering/category-nav"
import { ProductCard } from "@/components/ordering/product-card"
import { CartBar } from "@/components/ordering/cart-bar"
import { OrderingHeader } from "@/components/ordering/ordering-header"

export default async function MenuPage({ params }: { params: { slug: string } }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const sessionToken = await getSessionToken()

  // Verify Table & Session
  const { data: table } = await supabase
    .from("tables")
    .select("id, table_number, is_active")
    .eq("slug", resolvedParams.slug)
    .single()

  if (!table || !table.is_active || !sessionToken) {
    redirect(`/t/${resolvedParams.slug}`)
  }

  const { data: session } = await supabase
    .from("dining_sessions")
    .select("id")
    .eq("session_token", sessionToken)
    .eq("table_id", table.id)
    .eq("status", "open")
    .single()

  if (!session) {
    redirect(`/t/${resolvedParams.slug}`)
  }

  // Fetch Categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order")

  // Fetch Products with variants count
  const { data: products } = await supabase
    .from("products")
    .select(`
      id, name, slug, description, base_price, image_url, category_id,
      variants:product_variants(id)
    `)
    .eq("is_available", true)
    .order("sort_order")

  const productsByCategory =
    categories
      ?.map((cat) => ({
        ...cat,
        products: products?.filter((p) => p.category_id === cat.id) || [],
      }))
      .filter((cat) => cat.products.length > 0) || []

  return (
    <div className="pb-32">
      <OrderingHeader tableNumber={table.table_number} />

      <CategoryNav categories={productsByCategory} />

      <main className="mx-auto max-w-2xl px-4 py-6">
        <section className="mb-8" aria-labelledby="menu-heading">
          <h1 id="menu-heading" className="font-display text-3xl font-bold tracking-tight text-ink">
            Menu
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pesan dari meja Anda — langsung ke dapur.
          </p>
        </section>

        {productsByCategory.map((category) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="mb-10 scroll-mt-32"
          >
            <h2 className="mb-4 font-display text-xl font-bold text-ink">
              {category.name}
            </h2>
            <div className="space-y-3">
              {category.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    variants_count: product.variants?.length || 0,
                  }}
                  tableSlug={resolvedParams.slug}
                />
              ))}
            </div>
          </section>
        ))}

        {productsByCategory.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-medium text-foreground">Menu saat ini kosong</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nantikan sebentar — kami sedang menyeduh sesuatu yang baru.
            </p>
          </div>
        )}
      </main>

      <CartBar tableSlug={resolvedParams.slug} />
    </div>
  )
}
