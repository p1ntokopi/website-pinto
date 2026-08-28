'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AccountActionState = { ok: boolean; error?: string }

async function getOwnerClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { supabase, user: null, error: 'Sesi berakhir. Silakan login ulang.' as const }
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'owner') {
    return { supabase, user: null, error: 'Hanya owner yang dapat mengelola akun.' as const }
  }
  return { supabase, user, error: null }
}

/**
 * Pinto only has two practical roles: admin (doubles as cashier/kitchen) and
 * owner. Legacy staff/kitchen enum values may still exist in old rows; this
 * action only ever writes 'admin' or 'owner'.
 */
export async function setUserRole(
  targetId: string,
  role: 'admin' | 'owner',
): Promise<AccountActionState> {
  const { supabase, user, error } = await getOwnerClient()
  if (error || !user) return { ok: false, error }

  if (targetId === user.id) {
    return { ok: false, error: 'Tidak bisa mengubah role akun sendiri.' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', targetId)

  if (updateError) {
    console.error('Set user role error:', updateError)
    return { ok: false, error: 'Gagal mengubah role. Coba lagi.' }
  }
  revalidatePath('/admin/owner/accounts')
  return { ok: true }
}

export async function setUserActive(
  targetId: string,
  isActive: boolean,
): Promise<AccountActionState> {
  const { supabase, user, error } = await getOwnerClient()
  if (error || !user) return { ok: false, error }

  if (targetId === user.id && !isActive) {
    return { ok: false, error: 'Tidak bisa menonaktifkan akun sendiri.' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', targetId)

  if (updateError) {
    console.error('Set user active error:', updateError)
    return { ok: false, error: 'Gagal mengubah status akun. Coba lagi.' }
  }
  revalidatePath('/admin/owner/accounts')
  return { ok: true }
}
