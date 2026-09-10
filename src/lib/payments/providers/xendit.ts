import {
  type CreatePaymentParams,
  type CreatePaymentResult,
  type PaymentProvider,
  PaymentProviderRetiredError,
} from '@/lib/payments/payment-service'

/**
 * RETIRED compatibility provider. The class and method key remain exported so
 * historical callers still compile, but no Xendit session can be created.
 */
export class XenditPaymentProvider implements PaymentProvider {
  readonly method = 'XENDIT' as const

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    void params
    throw new PaymentProviderRetiredError(this.method)
  }
}
