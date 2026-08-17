'use server'

import { createClient } from '@/lib/supabase/server'
import {
  buildObjectKey,
  createPresignedUploadUrl,
  deleteObject,
  getPublicUrl,
  objectKeyFromUrl,
} from '@/lib/storage/r2'

const ALLOWED_FOLDERS = new Set([
  'products',
  'categories',
  'avatars',
  'marketing',
  'gallery',
])

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Sesi berakhir. Silakan masuk kembali.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    throw new Error('Anda tidak memiliki izin untuk mengunggah.')
  }
}

export async function getImageUploadUrl(
  folder: string,
  contentType: string,
  fileSize: number
) {
  await requireAdmin()

  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new Error('Folder tujuan tidak valid.')
  }

  const ext = ALLOWED_MIME[contentType]
  if (!ext) {
    throw new Error('Tipe file tidak didukung. Gunakan JPG, PNG, WebP, AVIF, atau GIF.')
  }

  if (!fileSize || fileSize > MAX_FILE_SIZE) {
    throw new Error('Ukuran file maksimal 2MB.')
  }

  const objectKey = buildObjectKey(folder, ext)
  const uploadUrl = await createPresignedUploadUrl(objectKey, contentType)

  return {
    uploadUrl,
    objectKey,
    publicUrl: getPublicUrl(objectKey),
  }
}

export async function deleteImageByUrl(imageUrl: string | null | undefined) {
  await requireAdmin()
  await deleteObject(objectKeyFromUrl(imageUrl))
}