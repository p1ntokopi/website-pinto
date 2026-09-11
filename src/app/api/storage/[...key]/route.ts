import { NextRequest, NextResponse } from 'next/server'
import { getR2Client, R2_BUCKET_NAME, GetObjectCommand } from '@/lib/storage/r2'

export const dynamic = 'force-dynamic'

/**
 * R2 surfaces a missing object either as a named `NoSuchKey` error or as a 404 on
 * the SDK's `$metadata`. Neither field is guaranteed to be present, so narrow on
 * the value instead of trusting the error's static type.
 */
function isObjectNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const { name, $metadata } = error as {
    name?: unknown
    $metadata?: { httpStatusCode?: unknown }
  }
  return name === 'NoSuchKey' || $metadata?.httpStatusCode === 404
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> | { key: string[] } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const keyParts = resolvedParams.key
    if (!keyParts || keyParts.length === 0) {
      return new NextResponse('Key is required', { status: 400 })
    }

    const rawObjectKey = keyParts.join('/')
    let objectKey = rawObjectKey
    try {
      objectKey = decodeURIComponent(rawObjectKey)
    } catch {
      // keep rawObjectKey if decoding fails
    }

    // Security: avoid path traversal
    if (objectKey.includes('..') || objectKey.startsWith('/')) {
      return new NextResponse('Invalid key', { status: 400 })
    }

    const rangeHeader = request.headers.get('range')
    const client = getR2Client()

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Range: rangeHeader || undefined,
    })

    const r2Response = await client.send(command)

    if (!r2Response.Body) {
      return new NextResponse('Object not found', { status: 404 })
    }

    const headers = new Headers()
    if (r2Response.ContentType) {
      headers.set('Content-Type', r2Response.ContentType)
    }
    if (r2Response.ContentLength !== undefined) {
      headers.set('Content-Length', String(r2Response.ContentLength))
    }
    if (r2Response.ETag) {
      headers.set('ETag', r2Response.ETag)
    }

    headers.set('Accept-Ranges', 'bytes')
    // Cache heavily for static assets
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    const isPartial = Boolean(rangeHeader && r2Response.ContentRange)
    if (isPartial && r2Response.ContentRange) {
      headers.set('Content-Range', r2Response.ContentRange)
    }

    const status = isPartial ? 206 : 200

    // Transform Node stream to Web ReadableStream. The SDK types both runtime
    // bodies as SdkStream, whose mixin supplies transformToWebStream(); the
    // fallback passes the body straight through for a pre-transformed stream.
    const body = r2Response.Body
    const webStream: ReadableStream =
      typeof body.transformToWebStream === 'function'
        ? body.transformToWebStream()
        : (body as unknown as ReadableStream)

    return new NextResponse(webStream, {
      status,
      headers,
    })
  } catch (error) {
    if (isObjectNotFoundError(error)) {
      return new NextResponse('File tidak ditemukan', { status: 404 })
    }
    console.error('Error fetching file from R2 proxy:', error)
    return new NextResponse(
      'Gagal memuat file dari penyimpanan',
      { status: 500 }
    )
  }
}
