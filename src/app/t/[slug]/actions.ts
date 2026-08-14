'use server'

import { createClient } from '@/lib/supabase/server'
import { getSessionToken, setSessionToken } from '@/lib/ordering/session'
import { redirect } from 'next/navigation'

export async function startOrResumeDiningSession(tableSlug: string) {
  const supabase = await createClient()

  // 1. Get Table
  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('id, is_active')
    .eq('slug', tableSlug)
    .single()

  if (tableError || !table) {
    return { error: 'Table not found' }
  }

  if (!table.is_active) {
    return { error: 'Table is not currently accepting orders' }
  }

  // 2. Check for an existing open session for this table
  const { data: existingSession } = await supabase
    .from('dining_sessions')
    .select('id, session_token')
    .eq('table_id', table.id)
    .eq('status', 'open')
    .single()

  let tokenToUse = existingSession?.session_token

  if (!existingSession) {
    // 3. Create a new session if none exists
    const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    const { error: createError } = await supabase
      .from('dining_sessions')
      .insert({
        table_id: table.id,
        session_token: newToken,
        status: 'open'
      })

    if (createError) {
      console.error('Failed to create session:', createError)
      return { error: 'Could not start dining session. Please try again.' }
    }
    
    tokenToUse = newToken
  }

  // 4. Set cookie with the active token
  if (tokenToUse) {
    await setSessionToken(tokenToUse)
  }

  // Redirect to menu
  redirect(`/t/${tableSlug}/menu`)
}

export async function submitOrder(tableSlug: string, customerName: string, notes: string, cartItems: Record<string, unknown>[], _requestId: string) {
  const supabase = await createClient()
  const sessionToken = await getSessionToken()

  if (!sessionToken) {
    return { error: 'Your session has expired. Please rescan the table QR code.' }
  }

  // Basic validation on the server before hitting RPC
  if (!cartItems || cartItems.length === 0) {
    return { error: 'Your cart is empty.' }
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
    p_customer_name: customerName,
    p_notes: notes,
    p_items: formattedItems
  })

  if (error) {
    console.error('Order creation RPC error:', error)
    return { error: 'Failed to create order. Please try again or ask staff for assistance.' }
  }

  if (data && data.success) {
    return { success: true, orderNumber: data.order_number }
  } else {
    console.error('Order creation RPC failed internally:', data)
    return { error: data?.error || 'Failed to create order due to an invalid item or price.' }
  }
}

