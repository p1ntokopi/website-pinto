'use server'

import { createClient } from '@/lib/supabase/server'
import { getSessionToken, setSessionToken } from '@/lib/ordering/session'
import { redirect } from 'next/navigation'

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

