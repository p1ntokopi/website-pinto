'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const adjustmentSchema = z.object({
  adjustment_type: z.enum(['REFUND', 'CORRECTION'], {
    message: 'Tipe penyesuaian tidak valid',
  }),
  amount: z
    .string()
    .min(1, 'Nominal wajib diisi')
    .refine((value) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) && parsed !== 0
    }, 'Nominal tidak boleh nol'),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid'),
  reason: z.string().trim().min(1, 'Alasan wajib diisi').max(500, 'Alasan maksimal 500 karakter'),
  orderNumber: z.string().trim().max(40).optional(),
})

export type AdjustmentInput = z.infer<typeof adjustmentSchema>
export type AdjustmentActionState = { ok: boolean; error?: string }

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
    return { supabase, user: null, error: 'Hanya owner yang dapat mengelola penyesuaian keuangan.' as const }
  }
  return { supabase, user, error: null }
}

function revalidateFinancePages() {
  revalidatePath('/admin/owner/adjustments')
  revalidatePath('/admin/owner')
  revalidatePath('/admin/owner/finance')
  revalidatePath('/admin/owner/reports')
}

function validateAmount(type: 'REFUND' | 'CORRECTION', amount: number): string | null {
  // Refunds are stored positive and subtracted from net sales; corrections are
  // signed and may go either way, but zero is meaningless.
  if (type === 'REFUND' && amount <= 0) return 'Nominal refund harus lebih dari 0.'
  if (type === 'CORRECTION' && amount === 0) return 'Nominal koreksi tidak boleh nol.'
  return null
}

export async function createAdjustment(input: unknown): Promise<AdjustmentActionState> {
  const parsed = adjustmentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' }
  }
  const { supabase, user, error } = await getOwnerClient()
  if (error || !user) return { ok: false, error }

  const amount = Number(parsed.data.amount)
  const amountError = validateAmount(parsed.data.adjustment_type, amount)
  if (amountError) return { ok: false, error: amountError }

  let orderId: string | null = null
  if (parsed.data.orderNumber) {
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', parsed.data.orderNumber)
      .single()
    if (!order) return { ok: false, error: `Order "${parsed.data.orderNumber}" tidak ditemukan.` }
    orderId = order.id
  }

  const { error: insertError } = await supabase.from('financial_adjustments').insert({
    adjustment_type: parsed.data.adjustment_type,
    amount,
    order_id: orderId,
    effective_date: parsed.data.effective_date,
    reason: parsed.data.reason,
  })
  if (insertError) {
    console.error('Create adjustment error:', insertError)
    return { ok: false, error: 'Gagal menyimpan penyesuaian. Coba lagi.' }
  }

  revalidateFinancePages()
  return { ok: true }
}

export async function voidAdjustment(id: string): Promise<AdjustmentActionState> {
  const { supabase, user, error } = await getOwnerClient()
  if (error || !user) return { ok: false, error }

  const { error: voidError } = await supabase
    .from('financial_adjustments')
    .update({
      status: 'VOIDED',
      voided_at: new Date().toISOString(),
      voided_by: user.id,
    })
    .eq('id', id)
    .eq('status', 'ACTIVE')

  if (voidError) {
    console.error('Void adjustment error:', voidError)
    return { ok: false, error: 'Gagal membatalkan penyesuaian. Coba lagi.' }
  }

  revalidateFinancePages()
  return { ok: true }
}
