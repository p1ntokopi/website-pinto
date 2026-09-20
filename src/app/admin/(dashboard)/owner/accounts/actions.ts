'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireOwner } from '@/lib/auth/authorization'

export type AccountActionState = { ok: boolean; error?: string }

const createAdminSchema = z.object({
  fullName: z.string().trim().min(2, 'Nama minimal 2 karakter.'),
  email: z.string().trim().email('Format email tidak valid.'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
})

const roleSchema = z.enum(['admin', 'owner'])

/**
 * Account administration is owner-only in three places: the page renders the
 * list, these actions re-resolve the caller's role, and the database RPCs
 * (`admin_set_profile_role`, `admin_set_profile_active`) plus the
 * `profiles_prevent_last_owner_removal` trigger enforce the same rules. The
 * service-role client below never reaches the browser.
 */

async function getOwnerContext() {
  const result = await requireOwner({
    forbidden: 'Hanya Owner yang dapat mengelola akun.',
  })
  if (!result.ok) return { supabase: result.supabase, error: result.error }
  return { supabase: result.context.supabase, error: null }
}

function friendlyAuthError(message: string): string {
  if (/already registered|already exists/i.test(message)) {
    return 'Email ini sudah terdaftar.'
  }
  if (/invalid email/i.test(message)) {
    return 'Format email tidak valid.'
  }
  if (/password/i.test(message)) {
    return 'Kata sandi tidak memenuhi syarat.'
  }
  return 'Akun admin belum dapat dibuat. Coba lagi.'
}

/** Creates a new admin login. Owner only. */
export async function createAdminAccount(
  input: unknown
): Promise<AccountActionState> {
  const parsed = createAdminSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Data tidak valid.',
    }
  }

  const guard = await getOwnerContext()
  if (guard.error) return { ok: false, error: guard.error }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  })

  if (error || !data.user) {
    console.error('Create admin error:', error?.message)
    return {
      ok: false,
      error: friendlyAuthError(error?.message ?? ''),
    }
  }

  // handle_new_user() seeds the profile as 'staff'; promote it to admin through
  // the owner-checked RPC so the audit trail records the change. A failure here
  // would leave an unusable login, so the account is removed again.
  const { error: roleError } = await guard.supabase.rpc(
    'admin_set_profile_role',
    { p_target_id: data.user.id, p_role: 'admin' }
  )

  if (roleError) {
    console.error('Promote admin error:', roleError.message)
    await admin.auth.admin.deleteUser(data.user.id)
    return { ok: false, error: 'Akun admin belum dapat disiapkan. Coba lagi.' }
  }

  revalidatePath('/admin/owner/accounts')
  return { ok: true }
}

/**
 * Deletes an admin login. Owner only. The guard rejects the current user and
 * any owner account; removing the auth user cascades the profile row.
 */
export async function deleteAdminAccount(
  targetId: string
): Promise<AccountActionState> {
  const guard = await getOwnerContext()
  if (guard.error) return { ok: false, error: guard.error }

  const {
    data: { user },
  } = await guard.supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' }
  if (targetId === user.id) {
    return { ok: false, error: 'Tidak bisa menghapus akun sendiri.' }
  }

  const { data: target } = await guard.supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', targetId)
    .single()

  if (!target) return { ok: false, error: 'Akun tidak ditemukan.' }
  if (target.role === 'owner') {
    return { ok: false, error: 'Akun Owner tidak dapat dihapus dari sini.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(targetId)
  if (error) {
    console.error('Delete admin error:', error.message)
    return { ok: false, error: 'Akun admin belum dapat dihapus. Coba lagi.' }
  }

  revalidatePath('/admin/owner/accounts')
  return { ok: true }
}

/** Promotes or demotes an account. Never touches the owner's own row. */
export async function setUserRole(
  targetId: string,
  role: 'admin' | 'owner'
): Promise<AccountActionState> {
  const parsedRole = roleSchema.safeParse(role)
  if (!parsedRole.success) {
    return { ok: false, error: 'Peran tidak valid.' }
  }

  const guard = await getOwnerContext()
  if (guard.error) return { ok: false, error: guard.error }

  const { error } = await guard.supabase.rpc('admin_set_profile_role', {
    p_target_id: targetId,
    p_role: parsedRole.data,
  })

  if (error) {
    console.error('Set user role error:', error.message)
    if (/last active owner/i.test(error.message)) {
      return { ok: false, error: 'Setidaknya harus ada satu Owner aktif.' }
    }
    if (/own role/i.test(error.message)) {
      return { ok: false, error: 'Tidak bisa mengubah peran akun sendiri.' }
    }
    return { ok: false, error: 'Gagal mengubah peran. Coba lagi.' }
  }

  revalidatePath('/admin/owner/accounts')
  return { ok: true }
}

/** Activates or deactivates an account. Never deactivates the owner's own row. */
export async function setUserActive(
  targetId: string,
  isActive: boolean
): Promise<AccountActionState> {
  const guard = await getOwnerContext()
  if (guard.error) return { ok: false, error: guard.error }

  const { error } = await guard.supabase.rpc('admin_set_profile_active', {
    p_target_id: targetId,
    p_is_active: isActive,
  })

  if (error) {
    console.error('Set user active error:', error.message)
    if (/last active owner/i.test(error.message)) {
      return { ok: false, error: 'Setidaknya harus ada satu Owner aktif.' }
    }
    if (/own account/i.test(error.message)) {
      return { ok: false, error: 'Tidak bisa menonaktifkan akun sendiri.' }
    }
    return { ok: false, error: 'Gagal mengubah status akun. Coba lagi.' }
  }

  revalidatePath('/admin/owner/accounts')
  return { ok: true }
}