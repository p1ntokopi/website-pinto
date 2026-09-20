'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ClearFinanceInput = {
  scope: 'ALL' | 'ORDERS' | 'EXPENSES' | 'ADJUSTMENTS'
  start?: string | null
  end?: string | null
  reason?: string
}

export type ClearFinanceResult = {
  ok: boolean
  error?: string
  data?: {
    orders_deleted: number
    expenses_voided: number
    adjustments_voided: number
    sessions_closed: number
  }
}

export async function clearFinancialDataAction(
  input: ClearFinanceInput,
): Promise<ClearFinanceResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Sesi berakhir. Silakan login ulang.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return { ok: false, error: 'Hanya Owner yang dapat mereset data keuangan.' }
  }

  const { data, error } = await supabase.rpc('admin_clear_financial_data', {
    p_scope: input.scope,
    p_start: input.start || null,
    p_end: input.end || null,
    p_reason: input.reason || 'Pembersihan data oleh Owner',
  })

  if (error) {
    console.error('admin_clear_financial_data error:', error)
    return { ok: false, error: error.message || 'Gagal mereset data keuangan.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/orders')
  revalidatePath('/admin/owner')
  revalidatePath('/admin/owner/finance')
  revalidatePath('/admin/owner/reports')
  revalidatePath('/admin/owner/expenses')
  revalidatePath('/admin/owner/sales')
  revalidatePath('/admin/tables/live')

  return {
    ok: true,
    data: data as {
      orders_deleted: number
      expenses_voided: number
      adjustments_voided: number
      sessions_closed: number
    },
  }
}
