import { describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/webhooks/xendit/route'

describe('POST /api/webhooks/xendit', () => {
  it('fails closed with an explicit permanent retirement response', async () => {
    const readBody = vi.fn()
    const request = {
      headers: new Headers({
        'x-callback-token': 'historical-token',
        'webhook-id': 'historical-event',
      }),
      json: readBody,
    } as unknown as Request

    const response = await POST(request)

    expect(readBody).not.toHaveBeenCalled()
    expect(response.status).toBe(410)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: 'XENDIT_WEBHOOK_RETIRED',
      error: 'Xendit webhook endpoint is retired',
    })
  })
})
