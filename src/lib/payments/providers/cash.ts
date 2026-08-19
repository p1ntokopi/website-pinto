import {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentProviderUnavailableError,
} from '@/lib/payments/payment-service'

/**
 * DORMANT - prepared for the future, not enabled.
 * The owner does not use cash payments today. When enabled (M6+), this
 * provider will record a CASH payment (staff marks it PAID at the counter)
 * and let the order move straight into the kitchen queue.
 */
export class CashPaymentProvider implements PaymentProvider {
  readonly method = 'CASH' as const

  async createPayment(_params: CreatePaymentParams): Promise<CreatePaymentResult> {
    throw new PaymentProviderUnavailableError(this.method)
  }
}