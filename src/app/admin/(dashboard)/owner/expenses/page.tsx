import type { Metadata } from 'next'
import { TriangleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolvePeriod, formatRangeLabel } from '@/lib/finance/period'
import { getFinancialSummary } from '@/lib/finance/summary'
import { PeriodFilter } from '@/components/admin/owner/period-filter'
import {
  ExpensesClient,
  type ClientExpenseRow,
} from '@/components/admin/owner/expenses-client'

export const metadata: Metadata = {
  title: 'Pengeluaran - Pinto Admin',
}

export default async function OwnerExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const period = resolvePeriod(params)
  const supabase = await createClient()

  const [{ data: summary, error }, { data: categories }, { data: expenses }, { data: profiles }] =
    await Promise.all([
      getFinancialSummary(period.range),
      supabase
        .from('expense_categories')
        .select('id, name, sort_order')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('expenses')
        .select(
          'id, title, description, amount, category_id, expense_date, payment_method, notes, status, created_by, created_at',
        )
        .gte('expense_date', period.range.start)
        .lte('expense_date', period.range.end)
        .order('expense_date', { ascending: false })
        .limit(500),
      supabase.from('profiles').select('id, full_name'),
    ])

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]))
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))

  const rows: ClientExpenseRow[] = (expenses ?? []).map((expense) => ({
    id: expense.id,
    title: expense.title,
    description: expense.description,
    amount: Number(expense.amount),
    category_id: expense.category_id,
    category_name: categoryMap.get(expense.category_id) ?? 'Lainnya',
    expense_date: expense.expense_date,
    payment_method: expense.payment_method,
    notes: expense.notes,
    status: expense.status,
    created_by_name: profileMap.get(expense.created_by) ?? null,
  }))

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Keuangan
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Pengeluaran</h1>
        <p className="text-sm text-muted-text">Periode {formatRangeLabel(period.range)}</p>
      </div>

      <PeriodFilter currentKey={period.key} />

      {error ? (
        <div className="flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : summary ? (
        <ExpensesClient
          rows={rows}
          categories={(categories ?? []).map((category) => ({
            id: category.id,
            name: category.name,
          }))}
          strip={{
            total: summary.expense.total,
            count: summary.expense.count,
            avgDaily: summary.expense.avg_daily,
            topCategory: summary.expense_by_category[0]?.category ?? null,
          }}
        />
      ) : null}
    </div>
  )
}
