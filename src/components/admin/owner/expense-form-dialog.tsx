'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createExpense,
  updateExpense,
  type ExpenseInput,
} from '@/app/admin/(dashboard)/owner/expenses/actions'

const formSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  amount: z
    .string()
    .min(1, 'Nominal wajib diisi')
    .refine((value) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) && parsed > 0
    }, 'Nominal harus lebih dari 0'),
  category_id: z.string().min(1, 'Kategori wajib dipilih'),
  expense_date: z.string().min(1, 'Tanggal wajib diisi'),
  payment_method: z.enum(['CASH', 'TRANSFER', 'EWALLET', 'OTHER']),
  description: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export type ExpenseCategoryOption = { id: string; name: string }

export type EditableExpense = {
  id: string
  title: string
  amount: number
  category_id: string
  expense_date: string
  payment_method: string
  description: string | null
  notes: string | null
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'EWALLET', label: 'E-Wallet' },
  { value: 'OTHER', label: 'Lainnya' },
] as const

const inputClass =
  'h-10 w-full rounded-sm border border-border-custom bg-paper px-3 text-sm text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none'

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-muted-text">
      {children}
    </label>
  )
}

export function ExpenseFormDialog({
  categories,
  expense,
  onClose,
  onSaved,
}: {
  categories: ExpenseCategoryOption[]
  expense: EditableExpense | null
  onClose: () => void
  onSaved: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: expense
      ? {
          title: expense.title,
          amount: String(expense.amount),
          category_id: expense.category_id,
          expense_date: expense.expense_date,
          payment_method: expense.payment_method as FormValues['payment_method'],
          description: expense.description ?? '',
          notes: expense.notes ?? '',
        }
      : {
          payment_method: 'CASH',
          expense_date: new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jakarta',
          }).format(new Date()),
          description: '',
          notes: '',
        },
  })

  async function submit(values: FormValues) {
    setServerError(null)
    const payload: ExpenseInput = {
      title: values.title,
      amount: Number(values.amount),
      category_id: values.category_id,
      expense_date: values.expense_date,
      payment_method: values.payment_method,
      description: values.description,
      notes: values.notes,
    }
    const result = expense
      ? await updateExpense(expense.id, payload)
      : await createExpense(payload)
    if (result.ok) {
      onSaved()
      onClose()
    } else {
      setServerError(result.error ?? 'Terjadi kesalahan.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={expense ? 'Ubah pengeluaran' : 'Tambah pengeluaran'}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-border-custom bg-paper p-5 shadow-lg sm:rounded-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">
            {expense ? 'Ubah Pengeluaran' : 'Tambah Pengeluaran'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-sm px-3 text-sm font-medium text-muted-text transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
          >
            Batal
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <Label htmlFor="expense-title">Judul</Label>
            <Input
              id="expense-title"
              placeholder="cth. Gas, Fresh Milk, Sewa Tempat"
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-danger">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="expense-amount">Nominal (Rp)</Label>
              <Input
                id="expense-amount"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="250000"
                aria-invalid={!!errors.amount}
                {...register('amount')}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="expense-date">Tanggal</Label>
              <input
                id="expense-date"
                type="date"
                className={inputClass}
                aria-invalid={!!errors.expense_date}
                {...register('expense_date')}
              />
              {errors.expense_date && (
                <p className="mt-1 text-xs text-danger">{errors.expense_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="expense-category">Kategori</Label>
              <select
                id="expense-category"
                className={inputClass}
                aria-invalid={!!errors.category_id}
                {...register('category_id')}
              >
                <option value="">Pilih kategori…</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-xs text-danger">{errors.category_id.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="expense-method">Metode Pembayaran</Label>
              <select id="expense-method" className={inputClass} {...register('payment_method')}>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="expense-description">Deskripsi (opsional)</Label>
            <Input
              id="expense-description"
              placeholder="cth. Belanja mingguan kopi & susu"
              {...register('description')}
            />
          </div>

          <div>
            <Label htmlFor="expense-notes">Catatan (opsional)</Label>
            <Textarea id="expense-notes" rows={2} {...register('notes')} />
          </div>

          {serverError && (
            <p role="alert" className="rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {expense ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
