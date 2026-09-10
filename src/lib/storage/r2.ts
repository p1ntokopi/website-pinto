import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'pintokupi-assets'

export const publicBaseUrl = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || ''
).replace(/\/$/, '')

export function getR2Client() {
  if (!accountId || !accessKeyId || !secretAccessKey || !R2_BUCKET_NAME) {
    throw new Error('Konfigurasi R2 tidak lengkap. Periksa env R2_*')
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

export function buildObjectKey(folder: string, ext: string) {
  const id = crypto.randomUUID()
  return `${folder}/${id}.${ext}`
}

/**
 * Mengubah URL r2.dev (yang diblokir oleh ISP Indonesia)
 * menjadi URL proxy lokal /api/storage/...
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  const r2DevMatch = trimmed.match(/^https?:\/\/[^/]*\.r2\.dev\/(.+)$/)
  if (r2DevMatch) {
    return `/api/storage/${r2DevMatch[1]}`
  }
  return trimmed
}

/**
 * Mengembalikan URL publik yang aman diakses di Indonesia
 * via proxy lokal /api/storage/{key}
 */
export function getPublicUrl(key: string) {
  if (!key) return ''
  const cleanKey = key.replace(/^\/+/, '')
  if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://')) {
    return normalizeImageUrl(cleanKey) || cleanKey
  }
  return `/api/storage/${cleanKey}`
}

export function objectKeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()

  // Match /api/storage/<key>
  const apiStorageMatch = trimmed.match(/\/api\/storage\/(.+)$/)
  if (apiStorageMatch) {
    const key = apiStorageMatch[1].split('?')[0]
    return key && !key.includes('..') ? key : null
  }

  // Match https://...r2.dev/<key>
  const r2DevMatch = trimmed.match(/^https?:\/\/[^/]*\.r2\.dev\/(.+)$/)
  if (r2DevMatch) {
    const key = r2DevMatch[1].split('?')[0]
    return key && !key.includes('..') ? key : null
  }

  // Match configured publicBaseUrl
  if (publicBaseUrl) {
    const prefix = `${publicBaseUrl}/`
    if (trimmed.startsWith(prefix)) {
      const key = trimmed.slice(prefix.length).split('?')[0]
      if (key && !key.includes('..')) return key
    }
  }

  return null
}

export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(getR2Client(), command, { expiresIn })
}

export async function deleteObject(key: string | null | undefined) {
  if (!key || !R2_BUCKET_NAME) return
  if (key.includes('..') || key.startsWith('/')) return
  await getR2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
}

export { GetObjectCommand, PutObjectCommand }