import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  PaymentService,
  PaymentProviderRetiredError,
  PaymentProviderUnavailableError,
} from '@/lib/payments/payment-service'
import { XenditPaymentProvider } from '@/lib/payments/providers/xendit'
import {
  createPaymentSession,
  verifyWebhookToken,
  XenditGatewayRetiredError,
} from '@/lib/payments/xendit'

const params = {
  referenceId: 'PNT-00001',
  amount: 33000,
  description: 'Pesanan PNT-00001',
  successReturnUrl: 'http://localhost:3000/t/t1/order/1?payment=success',
  cancelReturnUrl: 'http://localhost:3000/t/t1/order/1?payment=cancelled',
  expiresAt: '2026-08-19T10:45:00Z',
  metadata: { order_id: 'order-1', order_number: 'PNT-00001' },
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('PaymentService retired gateway behavior', () => {
  it('retains XENDIT registration but rejects it as retired without network access', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const provider = PaymentService.getProvider('XENDIT')

    expect(provider).toBeInstanceOf(XenditPaymentProvider)

    const error = await PaymentService.createPayment('XENDIT', params).catch(
      (cause: unknown) => cause
    )

    expect(error).toBeInstanceOf(PaymentProviderRetiredError)
    expect(error).toBeInstanceOf(PaymentProviderUnavailableError)
    expect(error).toMatchObject({ message: 'Payment method XENDIT is retired' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('keeps the exported Xendit provider inert when instantiated directly', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await expect(new XenditPaymentProvider().createPayment(params)).rejects.toThrow(
      PaymentProviderRetiredError
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('keeps the low-level session export inert without reading credentials or fetching', async () => {
    vi.stubEnv('XENDIT_API_KEY', 'historical-key')
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    await expect(createPaymentSession(params)).rejects.toThrow(XenditGatewayRetiredError)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('never accepts retired webhook tokens', () => {
    vi.stubEnv('XENDIT_WEBHOOK_TOKEN', 'historical-token')

    expect(verifyWebhookToken('historical-token')).toBe(false)
    expect(verifyWebhookToken(null)).toBe(false)
  })

  it('continues to reject dormant CASH', async () => {
    await expect(PaymentService.createPayment('CASH', params)).rejects.toThrow(
      PaymentProviderUnavailableError
    )
  })

  it('continues to reject dormant MANUAL', async () => {
    await expect(PaymentService.createPayment('MANUAL', params)).rejects.toThrow(
      PaymentProviderUnavailableError
    )
  })
})
