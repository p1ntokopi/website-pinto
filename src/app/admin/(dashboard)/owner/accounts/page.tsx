import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountsClient, type AccountRow } from '@/components/admin/owner/accounts-client'

export const metadata: Metadata = {
  title: 'Manajemen Akun - Pinto Admin',
}

export default async function OwnerAccountsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active, created_at')
    .order('created_at', { ascending: true })

  const accounts: AccountRow[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    role: profile.role,
    isActive: profile.is_active,
    createdAt: profile.created_at,
  }))

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Sistem
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Manajemen Akun
        </h1>
        <p className="text-sm text-muted-text">
          Kelola akun admin &amp; owner: ganti peran dan status akses.
        </p>
      </div>

      <AccountsClient accounts={accounts} currentUserId={user.id} />
    </div>
  )
}
