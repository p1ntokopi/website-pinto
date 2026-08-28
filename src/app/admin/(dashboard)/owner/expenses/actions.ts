'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const expenseSchema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi').max(120, 'Judul maksimal 120 karakter'),
  description: z.string().trim().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  amount: z.coerce.number().positive('Nominal harus lebih dari 0').max(99_999_999_999),
  category_id: z.string().min(1, 'Kategori wajib dipilih'),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  payment_method: z.enum(['CASH', 'TRANSFER', 'EWALLET', 'OTHER'], {
    message: 'Metode pembayaran tidak valid',
  }),
  notes: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional(),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
export type ExpenseActionState = { ok: boolean; error?: string }

async function getOwnerClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { supabase, error: 'Sesi berakhir. Silakan login ulang.' as const }
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'owner') {
    return { supabase, error: 'Hanya owner yang dapat mengelola pengeluaran.' as const }
  }
  return { supabase, error: null }
}

function revalidateFinancePages() {
  revalidatePath('/admin/owner/expenses')
  revalidatePath('/admin/owner')
  revalidatePath('/admin/owner/finance')
  revalidatePath('/admin/owner/reports')
}

export async function createExpense(input: unknown): Promise<ExpenseActionState> {
  const parsed = expenseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' }
  }
  const { supabase, error } = await getOwnerClient()
  if (error) return { ok: false, error }

  const { error: insertError } = await supabase.from('expenses').insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    amount: parsed.data.amount,
    category_id: parsed.data.category_id,
    expense_date: parsed.data.expense_date,
    payment_method: parsed.data.payment_method,
    notes: parsed.data.notes || null,
  })

  if (insertError) {
    return { ok: false, error: 'Gagal menyimpan pengeluaran. Coba lagi.' }
  }
  revalidateFinancePages()
  return { ok: true }
}

export async function updateExpense(
  id: string,
  input: unknown,
): Promise<ExpenseActionState> {
  const parsed = expenseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' }
  }
  const { supabase, error } = await getOwnerClient()
  if (error) return { ok: false, error }

  // Voided expenses are immutable history — they must not be edited.
  const { data: existing } = await supabase
    .from('expenses')
    .select('status')
    .eq('id', id)
    .single()
  if (!existing) return { ok: false, error: 'Pengeluaran tidak ditemukan.' }
  if (existing.status === 'VOIDED') {
    return { ok: false, error: 'Pengeluaran yang sudah di-void tidak dapat diubah.' }
  }

  const { error: updateError } = await supabase
    .from('expenses')
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      amount: parsed.data.amount,
      category_id: parsed.data.category_id,
      expense_date: parsed.data.expense_date,
      payment_method: parsed.data.payment_method,
      notes: parsed.data.notes || null,
    })
    .eq('id', id)
    .eq('status', 'ACTIVE')

  if (updateError) {
    return { ok: false, error: 'Gagal memperbarui pengeluaran. Coba lagi.' }
  }
  revalidateFinancePages()
  return { ok: true }
}

export async function voidExpense(id: string): Promise<ExpenseActionState> {
  const { supabase, error } = await getOwnerClient()
  if (error) return { ok: false, error }

  const { error: voidError } = await supabase
    .from('expenses')
    .update({
      status: 'VOIDED',
      voided_at: new Date().toISOString(),
      voided_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    })
    .eq('id', id)
    .eq('status', 'ACTIVE')

  if (voidError) {
    return { ok: false, error: 'Gagal membatalkan pengeluaran. Coba lagi.' }
  }
  revalidateFinancePages()
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Expense categories — database-driven, owner-managed (no hard-coded list).
// ---------------------------------------------------------------------------

const categoryNameSchema = z
  .string()
  .trim()
  .min(1, 'Nama kategori wajib diisi')
  .max(60, 'Nama kategori maksimal 60 karakter')

export async function createExpenseCategory(name: string): Promise<ExpenseActionState> {
  const parsed = categoryNameSchema.safeParse(name)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nama tidak valid.' }
  }
  const { supabase, error } = await getOwnerClient()
  if (error) return { ok: false, error }

  const { error: insertError } = await supabase
    .from('expense_categories')
    .insert({ name: parsed.data })

  if (insertError) {
    if (insertError.code === '23505') {
      return { ok: false, error: `Kategori "${parsed.data}" sudah ada.` }
    }
    console.error('Create expense category error:', insertError)
    return { ok: false, error: 'Gagal menambah kategori. Coba lagi.' }
  }
  revalidateFinancePages()
  return { ok: true }
}

export async function updateExpenseCategory(
  id: string,
  name: string,
): Promise<ExpenseActionState> {
  const parsed = categoryNameSchema.safeParse(name)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nama tidak valid.' }
  }
  const { supabase, error } = await getOwnerClient()
  if (error) return { ok: false, error }

  const { error: updateError } = await supabase
    .from('expense_categories')
    .update({ name: parsed.data })
    .eq('id', id)

  if (updateError) {
    if (updateError.code === '23505') {
      return { ok: false, error: `Kategori "${parsed.data}" sudah ada.` }
    }
    console.error('Update expense category error:', updateError)
    return { ok: false, error: 'Gagal mengubah kategori. Coba lagi.' }
  }
  revalidateFinancePages()
  return { ok: true }
}

export async function setExpenseCategoryActive(
  id: string,
  isActive: boolean,
): Promise<ExpenseActionState> {
  const { supabase, error } = await getOwnerClient()
  if (error) return { ok: false, error }

  const { error: updateError } = await supabase
    .from('expense_categories')
    .update({ is_active: isActive })
    .eq('id', id)

  if (updateError) {
    console.error('Toggle expense category error:', updateError)
    return { ok: false, error: 'Gagal mengubah status kategori. Coba lagi.' }
  }
  revalidateFinancePages()
  return { ok: true }
}
