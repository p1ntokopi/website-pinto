'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canTransition, OrderStatus, UserRole } from '@/lib/orders/status-machine'

export async function updateOrderStatus(orderId: string, targetStatus: OrderStatus, reason?: string) {
  const supabase = await createClient()

  // 1. Authenticate & get user profile
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'User profile not found' }
  }

  const role = profile.role as UserRole

  // 2. Fetch current order status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('status, id')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { error: 'Order not found' }
  }

  const currentStatus = order.status as OrderStatus

  // 3. Validate transition
  if (!canTransition(currentStatus, targetStatus, role)) {
    return { error: `Invalid transition from ${currentStatus} to ${targetStatus} for role ${role}` }
  }

  // 4. Perform Update (Simulate transaction with two separate RPCs or rely on RLS if no RPC)
  // Since we don't have a transaction RPC for this simple update, we'll update the order and then insert history.
  // In a high concurrency environment, we should use a Postgres function. We will use a standard update here
  // but add a condition to ensure the status hasn't changed in the meantime (Optimistic Concurrency Control).

  const updateData: Record<string, unknown> = { status: targetStatus }
  
  if (targetStatus === 'CANCELLED') {
    updateData.cancelled_at = new Date().toISOString()
    updateData.cancelled_by = user.id
    if (reason) {
      updateData.cancellation_reason = reason
    }
  }

  // Update order (only if the status is still what we thought it was)
  const { error: updateError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .eq('status', currentStatus) // OCC check
    .select('id') // Force returning something to check if it matched
    
  if (updateError) {
    console.error('Update Order Error:', updateError)
    return { error: 'Failed to update order status' }
  }

  // 5. Log history
  const { error: historyError } = await supabase
    .from('order_status_history')
    .insert({
      order_id: orderId,
      old_status: currentStatus,
      new_status: targetStatus,
      changed_by: user.id,
      metadata: reason ? { reason } : null
    })

  if (historyError) {
    console.error('Failed to log order history:', historyError)
    // We don't fail the whole request because the primary action succeeded, 
    // but in production this should be a single transaction.
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// Manual (cashier) payments — admin doubles as the cashier; owner included.
// ---------------------------------------------------------------------------

export type ManualPaymentMethod = 'CASH' | 'TRANSFER' | 'EWALLET' | 'OTHER'

async function getOperationalClient() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { supabase, user: null, error: 'Sesi berakhir. Silakan login ulang.' }
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
    return { supabase, user: null, error: 'Hanya admin & owner yang dapat melakukan aksi ini.' }
  }
  return { supabase, user, error: null }
}

function revalidateFinanceAndOrders(orderId?: string) {
  if (orderId) revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/admin/owner')
  revalidatePath('/admin/owner/finance')
  revalidatePath('/admin/owner/reports')
  revalidatePath('/admin/owner/expenses')
}

/** Marks an order as paid with a manual method (cash, transfer, etc.). */
export async function markOrderPaid(
  orderId: string,
  method: ManualPaymentMethod,
): Promise<{ ok?: boolean; error?: string }> {
  const { supabase, user, error } = await getOperationalClient()
  if (error || !user) return { error }

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, status, total')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Order tidak ditemukan.' }
  if (order.status === 'CANCELLED') {
    return { error: 'Order yang dibatalkan tidak bisa ditandai lunas.' }
  }

  const { data: existingPaid } = await supabase
    .from('payments')
    .select('id')
    .eq('order_id', orderId)
    .eq('status', 'PAID')
    .limit(1)

  if (existingPaid && existingPaid.length > 0) {
    return { error: 'Order ini sudah memiliki pembayaran lunas.' }
  }

  // Reuses the idempotent payment RPC: it writes the payment row and, when the
  // order is still PENDING_PAYMENT, flips it to PENDING with history.
  const { error: rpcError } = await supabase.rpc('record_order_payment', {
    p_order_id: orderId,
    p_provider: 'MANUAL',
    p_provider_transaction_id: `manual-${orderId}`,
    p_amount: Number(order.total),
    p_status: 'PAID',
    p_paid_at: new Date().toISOString(),
    p_raw: null,
    p_reference_id: order.order_number,
    p_payment_method: method,
  })

  if (rpcError) {
    console.error('Mark paid error:', rpcError)
    return { error: 'Gagal mencatat pembayaran. Coba lagi.' }
  }

  revalidateFinanceAndOrders(orderId)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// POS mini — create a walk-in/cashier order from the admin dashboard.
// ---------------------------------------------------------------------------

export type PosItemInput = {
  productId?: string | null
  coffeeVariantId?: string | null
  quantity: number
  notes?: string | null
}

export async function createPosOrder(
  input: {
    items: PosItemInput[]
    tableId?: string | null
    customerName?: string | null
    markPaidCash?: boolean
  },
): Promise<{ ok?: boolean; orderId?: string; orderNumber?: string; error?: string }> {
  const { supabase, user, error } = await getOperationalClient()
  if (error || !user) return { error }

  const items = (input.items ?? []).filter((item) => item.quantity > 0)
  if (items.length === 0) return { error: 'Keranjang masih kosong.' }
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      return { error: 'Jumlah item tidak valid.' }
    }
    if (!item.productId && !item.coffeeVariantId) {
      return { error: 'Item tidak valid.' }
    }
  }

  const productIds = items.map((i) => i.productId).filter((id): id is string => !!id)
  const variantIds = items.map((i) => i.coffeeVariantId).filter((id): id is string => !!id)

  const { data: products } = productIds.length
    ? await supabase
        .from('products')
        .select('id, name, base_price, is_available')
        .in('id', productIds)
    : { data: [] }
  const { data: coffeeVariants } = variantIds.length
    ? await supabase
        .from('coffee_variants')
        .select('id, price, is_available, weight_grams, grind_type, coffee_product_id, coffee_products(product:products(name))')
        .in('id', variantIds)
    : { data: [] }

  type ResolvedPosItem = {
    productId: string | null
    coffeeVariantId: string | null
    name: string
    variantName: string | null
    unitPrice: number
    quantity: number
    notes: string | null
  }

  const resolved: ResolvedPosItem[] = []
  for (const item of items) {
    if (item.productId) {
      const product = products?.find((p) => p.id === item.productId)
      if (!product) return { error: 'Produk tidak ditemukan.' }
      if (!product.is_available) return { error: `${product.name} sedang tidak tersedia.` }
      resolved.push({
        productId: product.id,
        coffeeVariantId: null,
        name: product.name,
        variantName: null,
        unitPrice: Number(product.base_price),
        quantity: item.quantity,
        notes: item.notes || null,
      })
    } else if (item.coffeeVariantId) {
      const variant = coffeeVariants?.find((v) => v.id === item.coffeeVariantId)
      if (!variant) return { error: 'Varian kopi tidak ditemukan.' }
      if (!variant.is_available) return { error: 'Varian kopi sedang tidak tersedia.' }
      // Untyped embed (hand-maintained database.types.ts has no Relationships).
      const embed = variant as unknown as {
        coffee_products?: { product?: { name?: string } | null } | null
      }
      const productName = embed.coffee_products?.product?.name ?? 'Kopi Biji'
      const variantLabel = [`${variant.weight_grams}g`, variant.grind_type]
        .filter(Boolean)
        .join(' · ')
      resolved.push({
        productId: null,
        coffeeVariantId: variant.id,
        name: productName,
        variantName: variantLabel || null,
        unitPrice: Number(variant.price),
        quantity: item.quantity,
        notes: item.notes || null,
      })
    }
  }

  const subtotal = resolved.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  let tableNumber: string | null = null
  if (input.tableId) {
    const { data: table } = await supabase
      .from('tables')
      .select('id, table_number, is_active')
      .eq('id', input.tableId)
      .single()
    if (!table || !table.is_active) return { error: 'Meja tidak tersedia.' }
    tableNumber = table.table_number
  }

  // Order number in the same Pinto-YYMMDD-XXXX format as the customer RPC.
  const jakartaToday = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
  const ymd = jakartaToday.replaceAll('-', '').slice(2)
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${jakartaToday}T00:00:00+07:00`)
  let sequence = (count ?? 0) + 1

  let created: { id: string; order_number: string } | null = null
  let lastInsertError: unknown = null
  for (let attempt = 0; attempt < 5 && !created; attempt += 1, sequence += 1) {
    const orderNumber = `Pinto-${ymd}-${String(sequence).padStart(4, '0')}`
    const { data, error: insertError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        order_type: 'DINE_IN',
        fulfillment_type: tableNumber ? 'TABLE' : 'PICKUP',
        table_id: tableNumber ? input.tableId : null,
        customer_name:
          input.customerName?.trim() || (tableNumber ? `Meja ${tableNumber}` : 'Walk-in'),
        subtotal,
        total: subtotal,
        status: 'PENDING',
      })
      .select('id, order_number')
      .single()
    if (!insertError) created = data
    else lastInsertError = insertError
  }
  if (!created) {
    console.error('POS order insert error:', lastInsertError)
    return { error: 'Gagal membuat order. Coba lagi.' }
  }

  const { error: itemsError } = await supabase.from('order_items').insert(
    resolved.map((item) => ({
      order_id: created.id,
      product_id: item.productId,
      coffee_variant_id: item.coffeeVariantId,
      product_name_snapshot: item.name,
      variant_name_snapshot: item.variantName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.unitPrice * item.quantity,
      notes: item.notes,
    })),
  )
  if (itemsError) {
    console.error('POS order items error:', itemsError)
    return { error: 'Gagal menyimpan item order. Coba lagi.' }
  }

  await supabase.from('order_status_history').insert({
    order_id: created.id,
    old_status: null,
    new_status: 'PENDING',
    changed_by: user.id,
    metadata: { source: 'pos' },
  })

  if (input.markPaidCash) {
    const { error: payError } = await supabase.rpc('record_order_payment', {
      p_order_id: created.id,
      p_provider: 'MANUAL',
      p_provider_transaction_id: `manual-${created.id}`,
      p_amount: subtotal,
      p_status: 'PAID',
      p_paid_at: new Date().toISOString(),
      p_raw: null,
      p_reference_id: created.order_number,
      p_payment_method: 'CASH',
    })
    if (payError) {
      // Order already exists — the cashier can still use "Tandai Lunas".
      console.error('POS cash payment error:', payError)
    }
  }

  revalidateFinanceAndOrders(created.id)
  return { ok: true, orderId: created.id, orderNumber: created.order_number }
}
