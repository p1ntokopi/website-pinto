import { NextRequest, NextResponse } from 'next/server'
import { getR2Client, R2_BUCKET_NAME, GetObjectCommand } from '@/lib/storage/r2'

export const dynamic = 'force-dynamic'

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

    // Transform Node stream to Web ReadableStream
    const webStream = typeof (r2Response.Body as any).transformToWebStream === 'function'
      ? (r2Response.Body as any).transformToWebStream()
      : (r2Response.Body as any)

    return new NextResponse(webStream, {
      status,
      headers,
    })
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return new NextResponse('File tidak ditemukan', { status: 404 })
    }
    console.error('Error fetching file from R2 proxy:', error)
    return new NextResponse(
      'Gagal memuat file dari penyimpanan',
      { status: 500 }
    )
  }
}
