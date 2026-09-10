import { XenditPaymentProvider } from '@/lib/payments/providers/xendit'
import { CashPaymentProvider } from '@/lib/payments/providers/cash'
import { ManualPaymentProvider } from '@/lib/payments/providers/manual'

export type PaymentMethod = 'XENDIT' | 'CASH' | 'MANUAL'

export type CreatePaymentParams = {
  referenceId: string
  amount: number
  description: string
  successReturnUrl: string
  cancelReturnUrl: string
  expiresAt?: string
  metadata?: Record<string, string>
}

export type CreatePaymentResult = {
  paymentLinkUrl: string | null
  providerTransactionId: string | null
  status: 'PENDING' | 'UNSUPPORTED'
}

export interface PaymentProvider {
  readonly method: PaymentMethod
  /**
   * Create a payment for an order. Retired or dormant providers reject with a
   * PaymentProviderUnavailableError and must not contact an external service.
   */
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>
}

export class PaymentProviderUnavailableError extends Error {
  constructor(
    method: PaymentMethod,
    message = `Payment method ${method} is not available yet`
  ) {
    super(message)
    this.name = 'PaymentProviderUnavailableError'
  }
}

export class PaymentProviderRetiredError extends PaymentProviderUnavailableError {
  constructor(method: PaymentMethod) {
    super(method, `Payment method ${method} is retired`)
    this.name = 'PaymentProviderRetiredError'
  }
}

// Method keys and provider instances remain available for historical callers,
// but every currently registered provider is intentionally unavailable.
const REGISTRY: Record<PaymentMethod, PaymentProvider> = {
  XENDIT: new XenditPaymentProvider(),
  CASH: new CashPaymentProvider(),
  MANUAL: new ManualPaymentProvider(),
}

/**
 * PaymentService remains the compatibility entry point for existing callers.
 * XENDIT is retired; CASH and MANUAL remain dormant.
 */
export const PaymentService = {
  getProvider(method: PaymentMethod): PaymentProvider {
    return REGISTRY[method]
  },

  async createPayment(
    method: PaymentMethod,
    params: CreatePaymentParams
  ): Promise<CreatePaymentResult> {
    return REGISTRY[method].createPayment(params)
  },
}
