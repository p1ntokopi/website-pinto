'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdminRole } from '@/lib/auth/authorization'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const tableSchema = z.object({
  table_number: z.string().min(1, 'Table number is required'),
  name: z.string().optional(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  is_active: z.boolean().default(true),
})

export async function createTable(prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  try {
    const rawData = {
      table_number: formData.get('table_number'),
      name: formData.get('name'),
      capacity: formData.get('capacity'),
      is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
    }

    const validatedData = tableSchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        error: 'Validation failed',
        fieldErrors: validatedData.error.flatten().fieldErrors,
      }
    }

    // Auto-generate slug with leading zero padding for single digit numbers (e.g. 1 -> table-01)
    const rawNumber = validatedData.data.table_number.trim()
    const paddedNumber = /^\d$/.test(rawNumber) ? `0${rawNumber}` : rawNumber
    const slug = `table-${paddedNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

    const { data, error } = await supabase
      .from('tables')
      .insert({
        ...validatedData.data,
        slug,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'A table with this number or slug already exists.' }
      }
      throw error
    }

    revalidatePath('/admin/tables')
    return { success: true, data }
  } catch (err: unknown) {
    console.error('Create table error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to create table.' }
  }
}

export async function updateTable(id: string, prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  try {
    const rawData = {
      table_number: formData.get('table_number'),
      name: formData.get('name'),
      capacity: formData.get('capacity'),
      is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
    }

    const validatedData = tableSchema.safeParse(rawData)

    if (!validatedData.success) {
      return {
        error: 'Validation failed',
        fieldErrors: validatedData.error.flatten().fieldErrors,
      }
    }

    // Auto-generate slug with leading zero padding for single digit numbers (e.g. 1 -> table-01)
    const rawNumber = validatedData.data.table_number.trim()
    const paddedNumber = /^\d$/.test(rawNumber) ? `0${rawNumber}` : rawNumber
    const slug = `table-${paddedNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

    const { data, error } = await supabase
      .from('tables')
      .update({
        ...validatedData.data,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'A table with this number or slug already exists.' }
      }
      throw error
    }

    revalidatePath('/admin/tables')
    return { success: true, data }
  } catch (err: unknown) {
    console.error('Update table error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to update table.' }
  }
}

/**
 * Soft toggles a table on or off. This is not deletion: the row, its number,
 * and its slug stay occupied, which is what you want for a table that is merely
 * out of service for a while. Use `deleteTable` to retire one for good.
 */
export async function setTableActive(id: string, isActive: boolean) {
  const guard = await requireAdminRole()
  if (!guard.ok) return { error: guard.error }

  try {
    const { error } = await guard.context.supabase
      .from('tables')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/tables')
    return { success: true }
  } catch (err: unknown) {
    console.error('Set table active error:', err)
    return { error: 'Gagal mengubah status meja. Coba lagi.' }
  }
}

/**
 * Permanently removes a table, freeing its number and slug for reuse.
 *
 * The RPC is the enforcement point: it re-checks the admin/owner role, refuses
 * a table with an open dining session (deleting mid-service would strand the
 * guest and the checkout), and snapshots the row into `audit_logs` before the
 * delete. Past sessions and orders survive with a null table pointer.
 */
export async function deleteTable(id: string) {
  const guard = await requireAdminRole()
  if (!guard.ok) return { error: guard.error }

  if (!id?.trim()) return { error: 'Meja tidak valid.' }

  const { data, error } = await guard.context.supabase.rpc('admin_delete_table', {
    p_table_id: id,
  })

  if (error) {
    console.error('admin_delete_table error:', error.message)
    if (/open dining session/i.test(error.message)) {
      return {
        error: 'Meja masih memiliki sesi yang terbuka. Tutup sesi tamu terlebih dahulu.',
      }
    }
    if (/admin access required/i.test(error.message)) {
      return { error: 'Hanya Admin atau Owner yang dapat menghapus meja.' }
    }
    if (/table not found/i.test(error.message)) {
      return { error: 'Meja tidak ditemukan. Muat ulang halaman.' }
    }
    return { error: 'Gagal menghapus meja. Coba lagi.' }
  }

  const result = data as { success?: boolean } | null
  if (!result?.success) {
    return { error: 'Penghapusan meja ditolak.' }
  }

  revalidatePath('/admin/tables')
  revalidatePath('/admin/tables/live')
  revalidatePath('/admin/tables/print')
  return { success: true }
}