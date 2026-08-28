'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const appSettingsSchema = z.object({
  businessName: z.string().trim().min(1, 'Nama bisnis wajib diisi').max(80),
  tagline: z.string().trim().min(1, 'Tagline wajib diisi').max(120),
  address: z.string().trim().min(1, 'Alamat wajib diisi').max(200),
  website: z.string().trim().min(1, 'Website wajib diisi').max(80),
  wifiName: z.string().trim().min(1, 'Nama WiFi wajib diisi').max(60),
  wifiPassword: z.string().trim().min(1, 'Password WiFi wajib diisi').max(60),
  footerMessage: z.string().trim().min(1, 'Pesan footer wajib diisi').max(120),
  openingHours: z.string().trim().min(1, 'Jam buka wajib diisi').max(80),
})

export type AppSettingsInput = z.infer<typeof appSettingsSchema>
export type AppSettingsActionState = { ok: boolean; error?: string }

export async function saveAppSettings(input: unknown): Promise<AppSettingsActionState> {
  const parsed = appSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'owner') {
    return { ok: false, error: 'Hanya owner yang dapat mengubah profil bisnis.' }
  }

  const { error: upsertError } = await supabase
    .from('app_settings')
    .upsert({ id: 1, ...parsed.data })

  if (upsertError) {
    console.error('Save app settings error:', upsertError)
    return { ok: false, error: 'Gagal menyimpan pengaturan. Coba lagi.' }
  }

  // Business profile appears across marketing pages, receipts, and the admin.
  revalidatePath('/', 'layout')
  return { ok: true }
}
