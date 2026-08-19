import { createClient } from "@/lib/supabase/server"
import { getSessionToken } from "@/lib/ordering/session"
import { redirect } from "next/navigation"
import {
  MenuPageClient,
  type MenuCategoryData,
} from "@/components/ordering/menu-page-client"

const CAFE_TYPES = new Set(["CAFE_DRINK", "DESSERT", "FOOD"])

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

  const { data: session } = await supabase.rpc('validate_dining_session', {
    p_table_slug: resolvedParams.slug,
    p_session_token: sessionToken,
  })

  if (!session || !session.success) {
    redirect(`/t/${resolvedParams.slug}`)
  }

  // Fetch Categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, description")
    .eq("is_active", true)
    .order("sort_order")

  // Fetch Products with variants count
  const { data: products } = await supabase
    .from("products")
    .select(`
      id, name, slug, description, base_price, image_url, category_id, product_type,
      variants:product_variants(id)
    `)
    .eq("is_available", true)
    .order("sort_order")

  const productsByCategory: MenuCategoryData[] =
    categories
      ?.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        products:
          products
            ?.filter((p) => p.category_id === cat.id && CAFE_TYPES.has(p.product_type))
            .map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              description: p.description,
              base_price: p.base_price,
              image_url: p.image_url,
              variants_count: p.variants?.length || 0,
            })) || [],
      }))
      .filter((cat) => cat.products.length > 0) || []

  return (
    <MenuPageClient
      tableSlug={resolvedParams.slug}
      tableNumber={table.table_number}
      categories={productsByCategory}
    />
  )
}