import crypto from 'crypto'

const XENDIT_API_URL = 'https://api.xendit.co'

export interface PaymentSessionItem {
  reference_id: string
  name: string
  description?: string
  net_unit_amount: number
  quantity: number
  category?: string
  type?: 'DIGITAL_PRODUCT' | 'PHYSICAL_PRODUCT' | 'DIGITAL_SERVICE' | 'PHYSICAL_SERVICE' | 'FEE'
  url?: string
}

export interface CreatePaymentSessionParams {
  referenceId: string
  amount: number
  description: string
  items?: PaymentSessionItem[]
  successReturnUrl: string
  cancelReturnUrl: string
  expiresAt?: string
  metadata?: Record<string, string>
}

export type PaymentSessionStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELED'

export interface PaymentSessionResponse {
  payment_session_id: string
  reference_id: string
  status: PaymentSessionStatus
  payment_link_url: string | null
  amount: string
  currency: string
  country: string
  session_type: string
  mode: string
  expires_at?: string | null
  payment_request_id?: string | null
  payment_id?: string | null
  business_id: string
  created: string
  updated: string
}

function getApiKey(): string {
  const key = process.env.XENDIT_API_KEY
  if (!key) {
    throw new Error('XENDIT_API_KEY is not configured')
  }
  return key
}

function basicAuthHeader(): string {
  const token = Buffer.from(`:${getApiKey()}`).toString('base64')
  return `Basic ${token}`
}

export async function createPaymentSession(
  params: CreatePaymentSessionParams
): Promise<PaymentSessionResponse> {
  const body = {
    reference_id: params.referenceId,
    session_type: 'PAY',
    mode: 'PAYMENT_LINK',
    amount: params.amount,
    currency: 'IDR',
    country: 'ID',
    locale: 'id',
    description: params.description,
    success_return_url: params.successReturnUrl,
    cancel_return_url: params.cancelReturnUrl,
    ...(params.expiresAt ? { expires_at: params.expiresAt } : {}),
    ...(params.metadata ? { metadata: params.metadata } : {}),
    ...(params.items && params.items.length > 0 ? { items: params.items } : {}),
  }

  const response = await fetch(`${XENDIT_API_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: basicAuthHeader(),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const data = (await response.json().catch(() => null)) as PaymentSessionResponse & {
    message?: string
    error_code?: string
  } | null

  if (!response.ok || !data) {
    const message = data?.message || `Xendit create session failed with status ${response.status}`
    throw new Error(message)
  }

  return data as PaymentSessionResponse
}

export function verifyWebhookToken(token: string | null): boolean {
  const expected = process.env.XENDIT_WEBHOOK_TOKEN
  if (!expected || !token) return false

  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}