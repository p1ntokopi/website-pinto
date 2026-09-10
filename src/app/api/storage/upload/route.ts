import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getR2Client,
  R2_BUCKET_NAME,
  PutObjectCommand,
  buildObjectKey,
  getPublicUrl,
} from '@/lib/storage/r2'

export const dynamic = 'force-dynamic'

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

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Sesi berakhir. Silakan masuk kembali.' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk mengunggah.' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'products'

    if (!file) {
      return NextResponse.json(
        { error: 'Tidak ada file yang diunggah.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json(
        { error: 'Folder tujuan tidak valid.' },
        { status: 400 }
      )
    }

    const ext = ALLOWED_MIME[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: 'Tipe file tidak didukung. Gunakan JPG, PNG, WebP, AVIF, atau GIF.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 10MB.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const objectKey = buildObjectKey(folder, ext)

    const client = getR2Client()
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const publicUrl = getPublicUrl(objectKey)

    return NextResponse.json({
      success: true,
      objectKey,
      url: publicUrl,
    })
  } catch (error: any) {
    console.error('Upload handler error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal mengunggah file.' },
      { status: 500 }
    )
  }
}
