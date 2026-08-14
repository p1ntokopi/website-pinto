import { createClient } from '@/lib/supabase/server'
import { getSessionToken } from '@/lib/ordering/session'
import { redirect, notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/ordering/product-detail-client'

export default async function ProductDetailPage({ params }: { params: { slug: string, productSlug: string } }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const sessionToken = await getSessionToken()

  // Verify Table & Session
  const { data: table } = await supabase
    .from('tables')
    .select('id, is_active')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!table || !table.is_active || !sessionToken) {
    redirect(`/t/${resolvedParams.slug}`)
  }

  // Fetch Product
  const { data: product } = await supabase
    .from('products')
    .select('id, name, description, base_price, image_url, is_available')
    .eq('slug', resolvedParams.productSlug)
    .single()

  if (!product) {
    notFound()
  }

  if (!product.is_available) {
    // Show unavailable state, but for M3 simplicity we redirect to menu
    redirect(`/t/${resolvedParams.slug}/menu`)
  }

  // Fetch Variants
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, name, price, is_default')
    .eq('product_id', product.id)
    .eq('is_available', true)
    .order('sort_order')

  // Fetch Options with Values
  const { data: optionsData } = await supabase
    .from('product_options')
    .select(`
      id, name, is_required, sort_order,
      values:product_option_values(id, name, price_adjustment, sort_order)
    `)
    .eq('product_id', product.id)
    .order('sort_order')

  // Filter available values and sort them
  const options = optionsData?.map(opt => ({
    ...opt,
    // @ts-ignore - Supabase type return nesting
    values: opt.values.sort((a, b) => a.sort_order - b.sort_order)
  })) || []

  return (
    <ProductDetailClient 
      tableSlug={resolvedParams.slug}
      product={product}
      variants={variants || []}
      options={options}
    />
  )
}
