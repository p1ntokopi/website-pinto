'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Tags } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createExpenseCategory,
  setExpenseCategoryActive,
  updateExpenseCategory,
} from '@/app/admin/(dashboard)/owner/expenses/actions'

export type ExpenseCategoryRow = {
  id: string
  name: string
  is_active: boolean
  usage_count: number
}

/**
 * Owner-managed expense categories. Categories are never deleted (expenses
 * reference them) — unused ones are simply deactivated.
 */
export function CategoryManager({
  categories,
}: {
  categories: ExpenseCategoryRow[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setError(result.error ?? 'Terjadi kesalahan.')
        return
      }
      router.refresh()
    })
  }

  function submitCreate() {
    if (!newName.trim()) return
    run(async () => {
      const result = await createExpenseCategory(newName)
      if (result.ok) setNewName('')
      return result
    })
  }

  function submitRename() {
    if (!editingId || !editingName.trim()) return
    const id = editingId
    run(async () => {
      const result = await updateExpenseCategory(id, editingName)
      if (result.ok) setEditingId(null)
      return result
    })
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submitCreate()
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Kategori baru, cth. Sewa Sound System"
          className="max-w-xs"
          aria-label="Nama kategori baru"
        />
        <Button type="submit" variant="outline" disabled={pending || !newName.trim()}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          Tambah Kategori
        </Button>
      </form>

      {error && (
        <p role="alert" className="rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <ul className="divide-y divide-border-custom/70 rounded-sm border border-border-custom bg-card">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            {editingId === category.id ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  submitRename()
                }}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <Input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  className="max-w-xs"
                  aria-label="Nama kategori"
                  autoFocus
                />
                <Button type="submit" size="sm" disabled={pending}>
                  Simpan
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(null)}
                  disabled={pending}
                >
                  Batal
                </Button>
              </form>
            ) : (
              <>
                <div className="min-w-0">
                  <p className={cn('truncate text-sm font-medium text-ink', !category.is_active && 'text-muted-text line-through')}>
                    {category.name}
                  </p>
                  <p className="text-xs text-muted-text">
                    {category.usage_count} pengeluaran
                    {!category.is_active && ' · nonaktif'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(category.id)
                      setEditingName(category.name)
                    }}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-2.5 text-xs font-semibold text-muted-text transition-colors hover:bg-muted hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
                  >
                    <Tags className="h-3.5 w-3.5" aria-hidden="true" />
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => setExpenseCategoryActive(category.id, !category.is_active))}
                    disabled={pending}
                    className={cn(
                      'inline-flex min-h-9 items-center rounded-sm px-2.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-50',
                      category.is_active
                        ? 'text-danger hover:bg-danger/10'
                        : 'text-success hover:bg-success/10',
                    )}
                  >
                    {category.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-text">
        Kategori yang sudah dipakai pengeluaran tidak dapat dihapus — cukup nonaktifkan agar tidak
        muncul di form.
      </p>
    </div>
  )
}
