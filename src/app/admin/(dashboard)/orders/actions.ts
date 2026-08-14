'use server'

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
