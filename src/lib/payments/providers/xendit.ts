import { createPaymentSession } from '@/lib/payments/xendit'
import {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
} from '@/lib/payments/payment-service'

/**
 * Wraps the low-level Xendit SDK calls (lib/payments/xendit.ts).
 * The order system never imports xendit directly - it goes through
 * PaymentService so the provider can be swapped without restructuring.
 */
export class XenditPaymentProvider implements PaymentProvider {
  readonly method = 'XENDIT' as const

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const session = await createPaymentSession({
      referenceId: params.referenceId,
      amount: params.amount,
      description: params.description,
      successReturnUrl: params.successReturnUrl,
      cancelReturnUrl: params.cancelReturnUrl,
      expiresAt: params.expiresAt,
      metadata: params.metadata,
    })

    return {
      paymentLinkUrl: session.payment_link_url,
      providerTransactionId: session.payment_session_id,
      status: 'PENDING',
    }
  }
}