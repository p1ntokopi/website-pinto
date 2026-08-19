import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/payments/xendit', () => ({
  createPaymentSession: vi.fn(),
}))

import { createPaymentSession } from '@/lib/payments/xendit'
import type { PaymentSessionResponse } from '@/lib/payments/xendit'
import {
  PaymentService,
  PaymentProviderUnavailableError,
} from '@/lib/payments/payment-service'
import { XenditPaymentProvider } from '@/lib/payments/providers/xendit'

const params = {
  referenceId: 'PNT-00001',
  amount: 33000,
  description: 'Pesanan PNT-00001',
  successReturnUrl: 'http://localhost:3000/t/t1/order/1?payment=success',
  cancelReturnUrl: 'http://localhost:3000/t/t1/order/1?payment=cancelled',
  expiresAt: '2026-08-19T10:45:00Z',
  metadata: { order_id: 'order-1', order_number: 'PNT-00001' },
}

describe('PaymentService dispatch', () => {
  beforeEach(() => {
    vi.mocked(createPaymentSession).mockReset()
  })

  it('routes XENDIT to the active provider and maps the session result', async () => {
    vi.mocked(createPaymentSession).mockResolvedValue({
      payment_session_id: 'sess-1',
      reference_id: 'PNT-00001',
      payment_link_url: 'https://checkout.xendit.co/pay/sess-1',
      status: 'ACTIVE',
      amount: '33000',
      currency: 'IDR',
      country: 'ID',
      session_type: 'PAY',
      mode: 'PAYMENT_LINK',
      business_id: 'biz-1',
      created: '2026-08-19T10:15:00Z',
      updated: '2026-08-19T10:15:00Z',
      expires_at: '2026-08-19T10:45:00Z',
    } satisfies PaymentSessionResponse)

    const result = await PaymentService.createPayment('XENDIT', params)

    expect(createPaymentSession).toHaveBeenCalledWith({
      referenceId: params.referenceId,
      amount: params.amount,
      description: params.description,
      successReturnUrl: params.successReturnUrl,
      cancelReturnUrl: params.cancelReturnUrl,
      expiresAt: params.expiresAt,
      metadata: params.metadata,
    })
    expect(result).toEqual({
      paymentLinkUrl: 'https://checkout.xendit.co/pay/sess-1',
      providerTransactionId: 'sess-1',
      status: 'PENDING',
    })
  })

  it('raises a provider-unavailable error for dormant CASH', async () => {
    await expect(PaymentService.createPayment('CASH', params)).rejects.toThrow(
      PaymentProviderUnavailableError
    )
  })

  it('raises a provider-unavailable error for dormant MANUAL', async () => {
    await expect(PaymentService.createPayment('MANUAL', params)).rejects.toThrow(
      PaymentProviderUnavailableError
    )
  })

  it('exposes the registered providers', () => {
    expect(PaymentService.getProvider('XENDIT')).toBeInstanceOf(XenditPaymentProvider)
  })
})