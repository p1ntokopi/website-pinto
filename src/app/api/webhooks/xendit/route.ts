import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyWebhookToken } from '@/lib/payments/xendit'

export const runtime = 'nodejs'

interface SessionWebhookPayload {
  event?: string
  data?: {
    id?: string
    reference_id?: string | null
    status?: string | null
    amount?: number | string | null
    updated?: string | null
    created?: string | null
    expires_at?: string | null
    payment_request_id?: string | null
    payment_id?: string | null
    payment_method?:
      | string
      | { type?: string | null; channel_code?: string | null; name?: string | null }
      | null
  }
}

function extractPaymentMethod(data: SessionWebhookPayload['data']) {
  const method = data?.payment_method
  if (typeof method === 'string') {
    return { type: method, channel: null }
  }
  return { type: method?.type ?? null, channel: method?.channel_code ?? null }
}

export async function POST(req: Request) {
  const token = req.headers.get('x-callback-token')
  const webhookId = req.headers.get('webhook-id')

  if (!verifyWebhookToken(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as SessionWebhookPayload | null
  if (!body || !body.data?.id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const admin = createAdminClient()
  const eventId = webhookId || `${body.event || 'unknown'}:${body.data.id}`
  const eventType = body.event || 'unknown'

  // Idempotency: a webhook-id we already processed is a duplicate.
  const { data: existing } = await admin
    .from('payment_webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const { data: eventRow, error: insertErr } = await admin
    .from('payment_webhook_events')
    .insert({
      event_id: eventId,
      event_type: eventType,
      payload: body as unknown as Record<string, unknown>,
    })
    .select('id')
    .single()

  if (insertErr) {
    if (insertErr.code === '23505') {
      // Concurrent duplicate delivery already logged it.
      return NextResponse.json({ ok: true, duplicate: true })
    }
    console.error('Failed to log webhook event:', insertErr)
    return NextResponse.json({ error: 'Failed to persist webhook' }, { status: 500 })
  }

  try {
    await handleSessionEvent(admin, eventType, body)
    await admin
      .from('payment_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', eventRow.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Webhook processing failed:', err)
    await admin
      .from('payment_webhook_events')
      .update({ error: message })
      .eq('id', eventRow.id)
  }

  // Always respond 200 quickly; Xendit retries otherwise.
  return NextResponse.json({ ok: true })
}

async function handleSessionEvent(
  admin: ReturnType<typeof createAdminClient>,
  eventType: string,
  body: SessionWebhookPayload
) {
  const data = body.data!
  const sessionId = data.id!

  const { data: payment } = await admin
    .from('payments')
    .select('id, order_id, amount')
    .or(`provider_transaction_id.eq.${sessionId},payment_session_id.eq.${sessionId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let orderId: string | null = payment?.order_id ?? null

  // Fallback: locate the order via reference_id (order_number).
  if (!orderId && data.reference_id) {
    const { data: order } = await admin
      .from('orders')
      .select('id')
      .eq('order_number', data.reference_id)
      .maybeSingle()
    orderId = order?.id ?? null
  }

  if (!orderId) {
    throw new Error(`No order found for payment session ${sessionId}`)
  }

  let status: 'PAID' | 'EXPIRED' | 'CANCELED' | null = null
  switch (eventType) {
    case 'payment_session.completed':
      status = 'PAID'
      break
    case 'payment_session.expired':
      status = 'EXPIRED'
      break
    case 'payment_session.canceled':
      status = 'CANCELED'
      break
    default:
      // Unknown event type - nothing to apply.
      return
  }

  let amount = payment?.amount
  if (!amount) {
    const { data: order } = await admin.from('orders').select('total').eq('id', orderId).maybeSingle()
    amount = order?.total ?? 0
  }
  if (!amount) {
    amount = Number(data.amount) || 0
  }

  const { type: methodType, channel: methodChannel } = extractPaymentMethod(data)

  const { error } = await admin.rpc('record_order_payment', {
    p_order_id: orderId,
    p_provider: 'XENDIT',
    p_provider_transaction_id: sessionId,
    p_amount: amount,
    p_status: status,
    p_paid_at: status === 'PAID' ? data.updated ?? new Date().toISOString() : null,
    p_raw: body as unknown as Record<string, unknown>,
    p_payment_session_id: sessionId,
    p_reference_id: data.reference_id ?? null,
    p_payment_request_id: data.payment_request_id ?? null,
    p_payment_id: data.payment_id ?? null,
    p_payment_method: methodType,
    p_payment_channel: methodChannel,
    p_expires_at: data.expires_at ?? null,
    p_canceled_at: status === 'CANCELED' ? data.updated ?? new Date().toISOString() : null,
  })

  if (error) {
    throw error
  }
}