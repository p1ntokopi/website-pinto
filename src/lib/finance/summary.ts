import { createClient } from '@/lib/supabase/server'
import type { DateRange } from '@/lib/finance/period'
import {
  parseFinancialSummary,
  type FinancialSummary,
} from '@/lib/finance/types'

export type SummaryResult = {
  data: FinancialSummary | null
  error: string | null
}

function translateRpcError(message: string): string {
  if (message.includes('Hanya owner')) return message
  if (message.includes('Rentang')) return message
  return 'Gagal memuat data keuangan. Coba lagi beberapa saat.'
}

/**
 * Calls the owner-only `get_financial_summary` RPC. Authorization is enforced
 * twice: RLS/SECURITY DEFINER inside the function and the owner layout guard
 * above these pages.
 */
export async function getFinancialSummary(range: DateRange): Promise<SummaryResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_financial_summary', {
    p_start: range.start,
    p_end: range.end,
  })

  if (error) {
    return { data: null, error: translateRpcError(error.message) }
  }

  try {
    return { data: parseFinancialSummary(data), error: null }
  } catch {
    return { data: null, error: 'Format data keuangan tidak valid.' }
  }
}
