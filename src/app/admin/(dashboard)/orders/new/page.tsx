import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PosClient, type PosItem } from '@/components/admin/orders/pos-client'

export const metadata: Metadata = {
  title: 'Order Kasir - Pinto Admin',
}

/**
 * POS mini for walk-in/cashier orders. Admin doubles as the cashier, so this
 * page is available to admin & owner via the dashboard layout gate.
 */
export default async function PosPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: products }, { data: coffeeVariants }, { data: tables }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('id, name, sort_order')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('products')
        .select(
          `id, name, category_id, base_price, product_type, is_available,
           variants:product_variants(id, name, price, is_available, sort_order)`,
        )
        .eq('is_available', true)
        .neq('product_type', 'COFFEE_BEAN')
        .order('name'),
      supabase
        .from('coffee_variants')
        .select(
          `id, price, weight_grams, grind_type, is_available,
           coffee_product:coffee_products(product:products(id, name, category_id))`,
        )
        .eq('is_available', true),
      supabase
        .from('tables')
        .select('id, table_number')
        .eq('is_active', true)
        .order('table_number'),
    ])

  const items: PosItem[] = []

  for (const product of products ?? []) {
    const availableVariants = (product.variants ?? []).filter((v) => v.is_available)
    if (availableVariants.length > 0) {
      for (const variant of availableVariants) {
        items.push({
          key: `p-${product.id}-${variant.id}`,
          productId: product.id,
          coffeeVariantId: null,
          name: product.name,
          variantLabel: variant.name,
          price: Number(variant.price),
          categoryId: product.category_id,
        })
      }
    } else {
      items.push({
        key: `p-${product.id}`,
        productId: product.id,
        coffeeVariantId: null,
        name: product.name,
        variantLabel: null,
        price: Number(product.base_price),
        categoryId: product.category_id,
      })
    }
  }

  for (const variant of coffeeVariants ?? []) {
    // Untyped embed (hand-maintained database.types.ts has no Relationships).
    const embed = variant as unknown as {
      coffee_product?: { product?: { id?: string; name?: string; category_id?: string } | null } | null
    }
    const product = embed.coffee_product?.product
    if (!product?.id || !product.name) continue
    items.push({
      key: `v-${variant.id}`,
      productId: null,
      coffeeVariantId: variant.id,
      name: product.name,
      variantLabel: [`${variant.weight_grams}g`, variant.grind_type].filter(Boolean).join(' · '),
      price: Number(variant.price),
      categoryId: product.category_id ?? null,
    })
  }

  items.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Operasional
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Order Kasir</h1>
        <p className="text-sm text-muted-text">
          Catat pesanan walk-in di kasir. Pembayaran tunai bisa langsung ditandai lunas.
        </p>
      </div>

      <PosClient
        items={items}
        categories={(categories ?? []).map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        tables={(tables ?? []).map((table) => ({
          id: table.id,
          tableNumber: table.table_number,
        }))}
      />
    </div>
  )
}
