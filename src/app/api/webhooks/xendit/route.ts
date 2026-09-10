import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const RETIRED_RESPONSE = {
  ok: false,
  code: 'XENDIT_WEBHOOK_RETIRED',
  error: 'Xendit webhook endpoint is retired',
} as const

/**
 * The Xendit integration is retired. Fail closed without reading, validating,
 * persisting, or applying any callback payload.
 */
export async function POST(request: Request) {
  void request
  return NextResponse.json(RETIRED_RESPONSE, {
    status: 410,
    headers: { 'Cache-Control': 'no-store' },
  })
}
