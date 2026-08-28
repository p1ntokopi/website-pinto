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
  const lower = message.toLowerCase()

  // PostgREST hasn't picked up the new RPC yet — common when migrations are
  // applied manually via the SQL editor. Reload the API schema cache.
  if (lower.includes('schema cache') || lower.includes('pgrst202') || lower.includes('does not exist')) {
    return (
      'Fungsi laporan keuangan belum terdaftar di API server. ' +
      "Jalankan di Supabase SQL Editor: NOTIFY pgrst, 'reload schema'; " +
      'lalu muat ulang halaman ini.'
    )
  }
  if (lower.includes('permission denied')) {
    return 'Akses ke data keuangan ditolak server. Pastikan akun ini memiliki role Owner.'
  }
  if (lower.includes('hanya owner') || lower.includes('rentang')) {
    return message
  }

  console.error('[get_financial_summary]', message)
  return `Gagal memuat data keuangan (${message.slice(0, 140)}). Coba lagi beberapa saat.`
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
