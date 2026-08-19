import {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentProviderUnavailableError,
} from '@/lib/payments/payment-service'

/**
 * DORMANT - prepared for the future, not enabled.
 * Manual payments (pay-at-counter, manual transfer) follow the same shape as
 * cash: staff records the payment and the order enters the kitchen queue.
 */
export class ManualPaymentProvider implements PaymentProvider {
  readonly method = 'MANUAL' as const

  async createPayment(_params: CreatePaymentParams): Promise<CreatePaymentResult> {
    throw new PaymentProviderUnavailableError(this.method)
  }
}