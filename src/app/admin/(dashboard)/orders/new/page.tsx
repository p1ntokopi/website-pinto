import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  PosClient,
  type PosItem,
  type PosOption,
} from "@/components/admin/orders/pos-client";

export const metadata: Metadata = {
  title: "Pesanan Baru - Pinto Admin",
};

/**
 * POS mini for walk-in/cashier orders. Admin doubles as the cashier, so this
 * page is available to admin & owner via the dashboard layout gate.
 *
 * This is the primary entry point of the cashier-first flow: the cashier takes
 * the order, assigns a table, and the customer confirms before it is created.
 */
export default async function PosPage() {
  const supabase = await createClient();

  const [
    { data: categories },
    { data: products },
    { data: coffeeVariants },
    { data: tables },
    { data: activeSessions },
    { data: productOptions },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("products")
      .select(
        `id, name, category_id, base_price, product_type, is_available,
           variants:product_variants(id, name, price, is_available, sort_order)`
      )
      .eq("is_available", true)
      .neq("product_type", "COFFEE_BEAN")
      .order("name"),
    supabase
      .from("coffee_variants")
      .select(
        `id, price, weight_grams, grind_type, is_available,
           coffee_product:coffee_products(product:products(id, name, category_id))`
      )
      .eq("is_available", true),
    supabase
      .from("tables")
      .select("id, table_number")
      .eq("is_active", true)
      .order("table_number"),
    supabase
      .from("dining_sessions")
      .select("id, table_id")
      .eq("status", "open"),
    // Option groups decide whether an item can be ordered at all: the ordering
    // RPC rejects any product whose `is_required` group the payload leaves
    // unmet, so the cashier has to be able to pick these before submitting.
    supabase
      .from("product_options")
      .select(
        `id, product_id, name, is_required, sort_order,
           values:product_option_values(id, name, price_adjustment, is_available, sort_order)`
      )
      .order("sort_order"),
  ]);

  // Untyped embed (hand-maintained database.types.ts has no Relationships).
  type ProductOptionRow = {
    id: string;
    product_id: string;
    name: string;
    is_required: boolean;
    sort_order: number;
    values:
      | {
          id: string;
          name: string;
          price_adjustment: number;
          is_available: boolean;
          sort_order: number;
        }[]
      | null;
  };

  /**
   * Options hang off the product, not the variant, so every variant row of the
   * same product shares one set. Coffee beans are deliberately left out — the
   * RPC rejects product options on a coffee variant.
   */
  const optionsByProduct = new Map<string, PosOption[]>();

  for (const option of (productOptions ?? []) as unknown as ProductOptionRow[]) {
    const values = (option.values ?? [])
      .filter((value) => value.is_available)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((value) => ({
        id: value.id,
        name: value.name,
        priceAdjustment: Number(value.price_adjustment),
      }));

    // An optional group with nothing selectable is noise. A required one is kept
    // so the cashier can see why the item refuses to be added.
    if (values.length === 0 && !option.is_required) continue;

    optionsByProduct.set(option.product_id, [
      ...(optionsByProduct.get(option.product_id) ?? []),
      {
        id: option.id,
        name: option.name,
        isRequired: option.is_required,
        values,
      },
    ]);
  }

  const items: PosItem[] = [];

  for (const product of products ?? []) {
    const availableVariants = (product.variants ?? []).filter(
      (v) => v.is_available
    );
    if (availableVariants.length > 0) {
      for (const variant of availableVariants) {
        items.push({
          key: `p-${product.id}-${variant.id}`,
          productId: product.id,
          productVariantId: variant.id,
          coffeeVariantId: null,
          name: product.name,
          variantLabel: variant.name,
          price: Number(variant.price),
          categoryId: product.category_id,
          options: optionsByProduct.get(product.id) ?? [],
        });
      }
    } else {
      items.push({
        key: `p-${product.id}`,
        productId: product.id,
        productVariantId: null,
        coffeeVariantId: null,
        name: product.name,
        variantLabel: null,
        price: Number(product.base_price),
        categoryId: product.category_id,
        options: optionsByProduct.get(product.id) ?? [],
      });
    }
  }

  for (const variant of coffeeVariants ?? []) {
    // Untyped embed (hand-maintained database.types.ts has no Relationships).
    const embed = variant as unknown as {
      coffee_product?: {
        product?: { id?: string; name?: string; category_id?: string } | null;
      } | null;
    };
    const product = embed.coffee_product?.product;
    if (!product?.id || !product.name) continue;
    items.push({
      key: `v-${variant.id}`,
      productId: product.id,
      productVariantId: null,
      coffeeVariantId: variant.id,
      name: product.name,
      variantLabel: [`${variant.weight_grams}g`, variant.grind_type]
        .filter(Boolean)
        .join(" · "),
      price: Number(variant.price),
      categoryId: product.category_id ?? null,
      // Coffee bean variants accept no product options.
      options: [],
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));

  // Accrued total per open session, so the cashier can see what an occupied
  // table already owes before deciding to join it.
  const openSessionIds = (activeSessions ?? []).map((session) => session.id);
  const sessionTotals = new Map<string, number>();
  if (openSessionIds.length > 0) {
    const { data: sessionOrders } = await supabase
      .from("orders")
      .select("dining_session_id, total, status")
      .in("dining_session_id", openSessionIds);
    for (const order of sessionOrders ?? []) {
      if (order.status === "CANCELLED" || !order.dining_session_id) continue;
      sessionTotals.set(
        order.dining_session_id,
        (sessionTotals.get(order.dining_session_id) ?? 0) + Number(order.total)
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Operasional
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Pesanan Baru
        </h1>
        <p className="text-sm text-muted-text">
          Input pesanan, pilih meja, lalu mintakan konfirmasi pelanggan sebelum
          pesanan dibuat.
        </p>
      </div>

      <PosClient
        items={items}
        categories={(categories ?? []).map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        tables={(tables ?? []).map((table) => {
          const activeSessionId =
            activeSessions?.find((session) => session.table_id === table.id)
              ?.id ?? null;
          return {
            id: table.id,
            tableNumber: table.table_number,
            activeSessionId,
            activeSessionTotal: activeSessionId
              ? (sessionTotals.get(activeSessionId) ?? 0)
              : 0,
          };
        })}
      />
    </div>
  );
}
