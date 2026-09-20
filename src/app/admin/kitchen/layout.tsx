import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/app/auth/signout/actions'

export const metadata: Metadata = {
  title: 'Pinto KDS',
  description: 'Sistem Display Dapur',
}

export default async function KitchenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Mirrors KITCHEN_ROLES in roles.ts: admin, kitchen, and owner may all view
  // the kitchen display. Staff may not — which is also why the sidebar no
  // longer offers the link to staff.
  if (
    !profile ||
    (profile.role !== 'admin' &&
      profile.role !== 'kitchen' &&
      profile.role !== 'owner')
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kds-bg p-4 text-kds-text">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="font-display text-2xl font-bold">Akses Ditolak</h1>
          <p className="text-kds-muted">Anda tidak memiliki izin akses dapur.</p>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">Keluar</Button>
          </form>
        </div>
      </div>
    )
  }

  // KDS uses a dark, high-contrast theme optimized for operations
  return (
    <div className="min-h-screen bg-kds-bg font-sans text-kds-text selection:bg-warning/30">
      {children}
    </div>
  )
}
