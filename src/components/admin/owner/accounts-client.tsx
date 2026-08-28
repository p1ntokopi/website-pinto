'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateID } from '@/lib/finance/period'
import {
  setUserActive,
  setUserRole,
} from '@/app/admin/(dashboard)/owner/accounts/actions'

export type AccountRow = {
  id: string
  fullName: string
  role: string
  isActive: boolean
  createdAt: string
}

/**
 * Account management for the two-role model: admin (doubles as cashier &
 * kitchen) and owner. Role changes only ever write 'admin' or 'owner'.
 */
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

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <ul className="divide-y divide-border-custom/70 rounded-sm border border-border-custom bg-card">
        {accounts.map((account) => {
          const isSelf = account.id === currentUserId
          return (
            <li
              key={account.id}
              className={cn('flex flex-wrap items-center justify-between gap-3 px-4 py-4', !account.isActive && 'opacity-60')}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink">
                  {account.fullName}
                  {isSelf && (
                    <span className="rounded-full border border-coffee/30 bg-coffee/10 px-2 py-0.5 text-[10px] font-semibold text-coffee">
                      Anda
                    </span>
                  )}
                  {!account.isActive && (
                    <span className="rounded-full border border-danger/25 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
                      Nonaktif
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-text">
                  Dibuat {formatDateID(account.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Role switcher: only the two practical roles exist. */}
                {(['admin', 'owner'] as const).map((role) => {
                  const isCurrent = account.role === role
                  if (isCurrent) {
                    return (
                      <span
                        key={role}
                        className={cn(
                          'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold',
                          role === 'owner'
                            ? 'border-coffee/30 bg-coffee/10 text-coffee'
                            : 'border-border-custom bg-muted text-ink',
                        )}
                      >
                        {role === 'owner' ? (
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <UserCog className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {role === 'owner' ? 'Owner' : 'Admin'}
                      </span>
                    )
                  }
                  return (
                    <button
                      key={role}
                      type="button"
                      disabled={pending || isSelf}
                      title={isSelf ? 'Tidak bisa mengubah role akun sendiri' : undefined}
                      onClick={() => run(() => setUserRole(account.id, role))}
                      className="min-h-9 rounded-full border border-border-custom px-3 text-xs font-semibold text-muted-text transition-colors hover:border-coffee/40 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-50"
                    >
                      Jadikan {role === 'owner' ? 'Owner' : 'Admin'}
                    </button>
                  )
                })}

                <button
                  type="button"
                  disabled={pending || isSelf}
                  title={isSelf ? 'Tidak bisa menonaktifkan akun sendiri' : undefined}
                  onClick={() => run(() => setUserActive(account.id, !account.isActive))}
                  className={cn(
                    'min-h-9 rounded-sm border px-3 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-50',
                    account.isActive
                      ? 'border-danger/25 text-danger hover:bg-danger/10'
                      : 'border-success/25 text-success hover:bg-success/10',
                  )}
                >
                  {account.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="text-xs leading-relaxed text-muted-text">
        Pinto hanya memakai dua peran: <span className="font-semibold text-ink">Admin</span>{' '}
        (merangkap kasir, dapur, dan operasional) dan{' '}
        <span className="font-semibold text-ink">Owner</span> (semua akses + keuangan). Akun yang
        dinonaktifkan tidak bisa membuka dashboard admin.
      </p>
    </div>
  )
}
