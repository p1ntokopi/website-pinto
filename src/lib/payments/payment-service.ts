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
   * Create a payment for an order. Online providers return a redirect URL;
   * offline providers (cash/manual) are prepared but dormant until the owner
   * enables them - they throw PaymentProviderUnavailableError.
   */
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>
}

export class PaymentProviderUnavailableError extends Error {
  constructor(method: PaymentMethod) {
    super(`Payment method ${method} is not available yet`)
    this.name = 'PaymentProviderUnavailableError'
  }
}

const REGISTRY: Record<PaymentMethod, PaymentProvider> = {
  XENDIT: new XenditPaymentProvider(),
  CASH: new CashPaymentProvider(),
  MANUAL: new ManualPaymentProvider(),
}

/**
 * PaymentService - the only entry point the order system talks to.
 *
 * Future providers plug in here without touching order logic:
 *   PaymentService
 *   ├── XenditPaymentProvider   (active - wraps lib/payments/xendit)
 *   ├── CashPaymentProvider     (dormant - owner does not use cash today)
 *   └── ManualPaymentProvider   (dormant - owner does not use manual today)
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