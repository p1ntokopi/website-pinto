'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionToken, setSessionToken } from '@/lib/ordering/session'
import { redirect } from 'next/navigation'
import { createPaymentSession } from '@/lib/payments/xendit'

export async function startOrResumeDiningSession(tableSlug: string) {
  const supabase = await createClient()

  // RPC validates the table and creates/resumes the dining session
  // (security definer bypasses RLS for the insert).
  const { data, error } = await supabase.rpc('start_or_resume_dining_session', {
    p_table_slug: tableSlug
  })

  if (error) {
    console.error('Failed to start dining session:', error)
    return { error: 'Tidak dapat memulai sesi makan. Silakan coba lagi.' }
  }

  if (!data || !data.success) {
    return { error: data?.error || 'Tidak dapat memulai sesi makan. Silakan coba lagi.' }
  }

  await setSessionToken(data.session_token)

  redirect(`/t/${tableSlug}/menu`)
}

export async function submitOrder(tableSlug: string, notes: string, cartItems: Record<string, unknown>[], requestId: string) {
  const supabase = await createClient()
  const sessionToken = await getSessionToken()

  if (!sessionToken) {
    return { error: 'Sesi Anda telah berakhir. Silakan pindai ulang kode QR meja.' }
  }

  // Basic validation on the server before hitting RPC
  if (!cartItems || cartItems.length === 0) {
    return { error: 'Keranjang Anda kosong.' }
  }

  if (!requestId) {
    return { error: 'Permintaan tidak valid. Silakan coba lagi.' }
  }

  // Format cart items for the RPC
  const formattedItems = cartItems.map(item => ({
    product_id: item.product_id,
    variant_id: item.variant_id || null,
    quantity: Number(item.quantity),
    notes: item.notes || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: (item.options as any[]).map((opt: any) => ({
      option_id: opt.option_id,
      option_value_id: opt.option_value_id
    }))
  }))

  const { data, error } = await supabase.rpc('create_customer_order', {
    p_table_slug: tableSlug,
    p_session_token: sessionToken,
    p_request_id: requestId,
    p_notes: notes,
    p_items: formattedItems
  })

  if (error) {
    console.error('Order creation RPC error:', error)
    return { error: 'Gagal membuat pesanan. Silakan coba lagi atau minta bantuan staf.' }
  }

  if (data && data.success) {
    return { success: true, orderNumber: data.order_number }
  } else {
    console.error('Order creation RPC failed internally:', data)
    return { error: data?.error || 'Gagal membuat pesanan karena item atau harga tidak valid.' }
  }
}

export async function initiatePayment(tableSlug: string, orderNumber: string) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const sessionToken = await getSessionToken()

  if (!sessionToken) {
    return { error: 'Sesi Anda telah berakhir. Silakan pindai ulang kode QR meja.' }
  }

  // Validate the dining session and confirm the order belongs to it.
  const { data: session } = await supabase.rpc('validate_dining_session', {
    p_table_slug: tableSlug,
    p_session_token: sessionToken,
  })

  if (!session || !session.success) {
    return { error: 'Sesi tidak valid. Silakan pindai ulang kode QR meja.' }
  }

  const { data: result } = await supabase.rpc('get_order_tracking', {
    p_table_slug: tableSlug,
    p_session_token: sessionToken,
    p_order_number: orderNumber,
  })

  if (!result || !result.success || !result.order) {
    return { error: 'Pesanan tidak ditemukan.' }
  }

  const order = result.order as {
    id: string
    order_number: string
    status: string
    total: number
  }

  if (order.status !== 'PENDING_PAYMENT') {
    return { error: 'Pesanan ini tidak memerlukan pembayaran.' }
  }

  if (!order.total || order.total <= 0) {
    return { error: 'Total pesanan tidak valid.' }
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000)

  // Reuse an existing, still-valid payment session for this order.
  const { data: existing } = await admin
    .from('payments')
    .select('id, payment_session_id, raw_response, expired_at')
    .eq('order_id', order.id)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(1)

  const pendingPayment = existing?.[0]
  if (pendingPayment?.expired_at && new Date(pendingPayment.expired_at) > now) {
    const link = (pendingPayment.raw_response as { payment_link_url?: string } | null)?.payment_link_url
    if (link) {
      return { paymentLinkUrl: link }
    }
  }

  // Expired pending session -> mark it expired so a fresh one can be created.
  if (pendingPayment) {
    await admin
      .from('payments')
      .update({ status: 'EXPIRED', updated_at: now.toISOString() })
      .eq('id', pendingPayment.id)
      .eq('status', 'PENDING')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  let sessionResponse
  try {
    sessionResponse = await createPaymentSession({
      referenceId: order.order_number,
      amount: order.total,
      description: `Pesanan ${order.order_number}`,
      successReturnUrl: `${appUrl}/t/${tableSlug}/order/${orderNumber}?payment=success`,
      cancelReturnUrl: `${appUrl}/t/${tableSlug}/order/${orderNumber}?payment=cancelled`,
      expiresAt: expiresAt.toISOString(),
      metadata: { order_id: order.id, order_number: order.order_number },
    })
  } catch (err) {
    console.error('Xendit session creation failed:', err)
    return { error: 'Tidak dapat membuat pembayaran. Silakan coba lagi atau minta bantuan staf.' }
  }

  if (!sessionResponse.payment_link_url) {
    return { error: 'Pembayaran tidak tersedia saat ini. Silakan coba lagi.' }
  }

  const { error: insertError } = await admin.from('payments').insert({
    order_id: order.id,
    provider: 'XENDIT',
    provider_transaction_id: sessionResponse.payment_session_id,
    payment_session_id: sessionResponse.payment_session_id,
    reference_id: sessionResponse.reference_id,
    status: 'PENDING',
    amount: order.total,
    expired_at: expiresAt.toISOString(),
    raw_response: sessionResponse as unknown as Record<string, unknown>,
  })

  if (insertError) {
    console.error('Failed to persist payment:', insertError)
    return { error: 'Tidak dapat menyimpan pembayaran. Silakan coba lagi.' }
  }

  return { paymentLinkUrl: sessionResponse.payment_link_url }
}

