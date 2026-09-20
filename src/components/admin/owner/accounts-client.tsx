'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateID } from '@/lib/finance/period'
import {
  createAdminAccount,
  deleteAdminAccount,
  setUserActive,
  setUserRole,
} from '@/app/admin/(dashboard)/owner/accounts/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type AccountRow = {
  id: string
  fullName: string
  email: string | null
  role: string
  isActive: boolean
  createdAt: string
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'owner') {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-coffee/30 bg-coffee/10 font-semibold text-coffee"
      >
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Owner
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 font-semibold text-ink">
      <UserCog className="h-3.5 w-3.5" aria-hidden="true" />
      Admin
    </Badge>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold',
        isActive
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-danger/25 bg-danger/10 text-danger'
      )}
    >
      {isActive ? 'Aktif' : 'Nonaktif'}
    </Badge>
  )
}

export function AccountsClient({
  accounts,
  currentUserId,
}: {
  accounts: AccountRow[]
  currentUserId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AccountRow | null>(null)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successMessage?: string
  ) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setError(result.error ?? 'Terjadi kesalahan.')
        return
      }
      if (successMessage) setSuccess(successMessage)
      router.refresh()
    })
  }

  function handleCreate() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await createAdminAccount(form)
      if (!result.ok) {
        setError(result.error ?? 'Terjadi kesalahan.')
        return
      }
      setAddOpen(false)
      setForm({ fullName: '', email: '', password: '' })
      setSuccess('Admin berhasil ditambahkan.')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await deleteAdminAccount(target.id)
      if (!result.ok) {
        setError(result.error ?? 'Terjadi kesalahan.')
        setDeleteTarget(null)
        return
      }
      setDeleteTarget(null)
      setSuccess(`Akun ${target.fullName} telah dihapus.`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-text">
          {accounts.length} akun terdaftar
        </p>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button className="min-h-11 gap-1.5">
                <Plus className="h-4 w-4" />
                Tambah Admin
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Admin</DialogTitle>
              <DialogDescription>
                Admin baru akan dapat menggunakan sistem untuk operasional
                harian.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-name">Nama</Label>
                <Input
                  id="admin-name"
                  className="min-h-11"
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                  placeholder="Nama lengkap admin"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  className="min-h-11"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="nama@email.com"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Kata Sandi</Label>
                <Input
                  id="admin-password"
                  type="password"
                  className="min-h-11"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-text">
                  Sampaikan kata sandi ini kepada admin. Mereka dapat
                  menggantinya setelah masuk.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  pending ||
                  form.fullName.trim().length < 2 ||
                  !form.email.trim() ||
                  form.password.length < 8
                }
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Tambah Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-sm border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {success}
        </p>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-hidden border border-border-custom/70 bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border-custom/70">
              <TableHead className="text-xs-plus font-semibold uppercase tracking-wider text-muted-text">
                Nama
              </TableHead>
              <TableHead className="text-xs-plus font-semibold uppercase tracking-wider text-muted-text">
                Email
              </TableHead>
              <TableHead className="text-xs-plus font-semibold uppercase tracking-wider text-muted-text">
                Peran
              </TableHead>
              <TableHead className="text-xs-plus font-semibold uppercase tracking-wider text-muted-text">
                Status
              </TableHead>
              <TableHead className="text-xs-plus font-semibold uppercase tracking-wider text-muted-text">
                Dibuat
              </TableHead>
              <TableHead className="text-right text-xs-plus font-semibold uppercase tracking-wider text-muted-text">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <Users className="mx-auto mb-3 h-7 w-7 text-muted-text/50" />
                  <p className="font-medium text-ink">Belum ada akun admin</p>
                  <p className="mt-1 text-sm text-muted-text">
                    Tambahkan admin untuk membantu operasional harian.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => {
              const isSelf = account.id === currentUserId
              return (
                <TableRow
                  key={account.id}
                  className={cn(
                    'border-b border-border-custom/60',
                    !account.isActive && 'opacity-60'
                  )}
                >
                  <TableCell className="font-semibold text-ink">
                    <span className="flex items-center gap-2">
                      {account.fullName}
                      {isSelf && (
                        <span className="rounded-full border border-coffee/30 bg-coffee/10 px-2 py-0.5 text-2xs font-semibold text-coffee">
                          Anda
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-text">
                    {account.email ?? '—'}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={account.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={account.isActive} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-text">
                    {formatDateID(account.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      {account.role === 'owner' ? (
                        <button
                          type="button"
                          disabled={pending || isSelf}
                          onClick={() =>
                            run(
                              () => setUserRole(account.id, 'admin'),
                              `${account.fullName} kini berperan Admin.`
                            )
                          }
                          className="min-h-11 rounded-sm border border-border-custom px-2.5 text-xs font-semibold text-muted-text transition-colors hover:border-coffee/40 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-40"
                        >
                          Jadikan Admin
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () => setUserRole(account.id, 'owner'),
                              `${account.fullName} kini berperan Owner.`
                            )
                          }
                          className="min-h-11 rounded-sm border border-border-custom px-2.5 text-xs font-semibold text-muted-text transition-colors hover:border-coffee/40 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-40"
                        >
                          Jadikan Owner
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={pending || isSelf}
                        onClick={() =>
                          run(
                            () => setUserActive(account.id, !account.isActive),
                            account.isActive
                              ? `${account.fullName} dinonaktifkan.`
                              : `${account.fullName} diaktifkan kembali.`
                          )
                        }
                        className={cn(
                          'min-h-11 rounded-sm border px-2.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-40',
                          account.isActive
                            ? 'border-danger/25 text-danger hover:bg-danger/10'
                            : 'border-success/25 text-success hover:bg-success/10'
                        )}
                      >
                        {account.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      {account.role !== 'owner' && !isSelf && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="outline"
                                size="icon"
                                className="min-h-11 min-w-11"
                                aria-label={`Aksi lain untuk ${account.fullName}`}
                              />
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(account)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Hapus Admin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border-custom px-6 py-14 text-center">
            <Users className="mb-3 h-7 w-7 text-muted-text/50" />
            <p className="text-sm font-medium text-ink">Belum ada akun admin</p>
            <p className="mt-1 text-sm text-muted-text">
              Tambahkan admin untuk membantu operasional harian.
            </p>
          </div>
        ) : (
          accounts.map((account) => {
            const isSelf = account.id === currentUserId
            return (
              <div
                key={account.id}
                className={cn(
                  'rounded-sm border border-border-custom bg-card p-4',
                  !account.isActive && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink">
                      {account.fullName}
                      {isSelf && (
                        <span className="rounded-full border border-coffee/30 bg-coffee/10 px-2 py-0.5 text-2xs font-semibold text-coffee">
                          Anda
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-text">
                      {account.email ?? 'Tanpa email'}
                    </p>
                  </div>
                  <RoleBadge role={account.role} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-custom/60 pt-3">
                  <StatusBadge isActive={account.isActive} />
                  <span className="text-xs text-muted-text">
                    Dibuat {formatDateID(account.createdAt)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {account.role === 'owner' ? (
                    <button
                      type="button"
                      disabled={pending || isSelf}
                      onClick={() =>
                        run(
                          () => setUserRole(account.id, 'admin'),
                          `${account.fullName} kini berperan Admin.`
                        )
                      }
                      className="min-h-11 rounded-sm border border-border-custom px-3 text-xs font-semibold text-muted-text focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-40"
                    >
                      Jadikan Admin
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => setUserRole(account.id, 'owner'),
                          `${account.fullName} kini berperan Owner.`
                        )
                      }
                      className="min-h-11 rounded-sm border border-border-custom px-3 text-xs font-semibold text-muted-text focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-40"
                    >
                      Jadikan Owner
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending || isSelf}
                    onClick={() =>
                      run(
                        () => setUserActive(account.id, !account.isActive),
                        account.isActive
                          ? `${account.fullName} dinonaktifkan.`
                          : `${account.fullName} diaktifkan kembali.`
                      )
                    }
                    className={cn(
                      'min-h-11 rounded-sm border px-3 text-xs font-semibold focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-40',
                      account.isActive
                        ? 'border-danger/25 text-danger'
                        : 'border-success/25 text-success'
                    )}
                  >
                    {account.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  {account.role !== 'owner' && !isSelf && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon"
                            className="min-h-11 min-w-11"
                            aria-label={`Aksi lain untuk ${account.fullName}`}
                          />
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(account)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs leading-relaxed text-muted-text">
        P1NTO memakai dua peran:{' '}
        <span className="font-semibold text-ink">Admin</span> (operasional
        harian: kasir, dapur, meja) dan{' '}
        <span className="font-semibold text-ink">Owner</span> (kelola sistem,
        staf, dan laporan keuangan). Akun yang dinonaktifkan tidak bisa membuka
        dashboard admin.
      </p>

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus admin ini?</DialogTitle>
            <DialogDescription>
              Admin tidak lagi dapat masuk ke dashboard setelah akun dihapus.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-sm bg-muted/40 px-4 py-3 text-sm">
              <p className="font-semibold text-ink">{deleteTarget.fullName}</p>
              <p className="text-muted-text">
                {deleteTarget.email ?? 'Tanpa email'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={pending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Hapus Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}