import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME

export const publicBaseUrl = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || ''
).replace(/\/$/, '')

function getClient() {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
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

export function getPublicUrl(key: string) {
  return `${publicBaseUrl}/${key}`
}

export function objectKeyFromUrl(url: string | null | undefined): string | null {
  if (!url || !publicBaseUrl) return null
  const prefix = `${publicBaseUrl}/`
  if (!url.startsWith(prefix)) return null
  const key = url.slice(prefix.length)
  if (!key || key.includes('..')) return null
  return key
}

export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(getClient(), command, { expiresIn })
}

export async function deleteObject(key: string | null | undefined) {
  if (!key || !bucketName) return
  if (key.includes('..') || key.startsWith('/')) return
  await getClient().send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }))
}