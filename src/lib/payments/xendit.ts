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

export const XENDIT_GATEWAY_RETIRED_MESSAGE = 'Xendit online payment gateway is retired'

export class XenditGatewayRetiredError extends Error {
  constructor() {
    super(XENDIT_GATEWAY_RETIRED_MESSAGE)
    this.name = 'XenditGatewayRetiredError'
  }
}

/**
 * Historical API retained for source compatibility. It always fails before
 * reading credentials or issuing a network request.
 */
export async function createPaymentSession(
  params: CreatePaymentSessionParams
): Promise<PaymentSessionResponse> {
  void params
  throw new XenditGatewayRetiredError()
}

/**
 * Historical verifier retained for source compatibility. Retired callbacks
 * are never accepted, even when old credentials remain configured.
 */
export function verifyWebhookToken(token: string | null): boolean {
  void token
  return false
}
