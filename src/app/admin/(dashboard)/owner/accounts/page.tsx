import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  AccountsClient,
  type AccountRow,
} from '@/components/admin/owner/accounts-client'

export const metadata: Metadata = {
  title: 'Kelola Admin - Pinto Admin',
}

export default async function OwnerAccountsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .order('created_at', { ascending: true })

  const accounts: AccountRow[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role,
    isActive: profile.is_active,
    createdAt: profile.created_at,
  }))

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8">
      <div className="space-y-2">
        <p className="text-xs-plus font-semibold uppercase tracking-[0.16em] text-coffee">
          Manajemen
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Kelola Admin
        </h1>
        <p className="text-sm text-muted-text">
          Kelola akun yang digunakan untuk operasional P1NTO Kopi.
        </p>
      </div>

      <AccountsClient accounts={accounts} currentUserId={user.id} />
    </div>
  )
}