import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/app/auth/signout/actions'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/admin/login')
  }

  // Fetch the user's profile to get their role and full name
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // If they are logged in but have no profile (or RLS blocked it), break the loop
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Kesalahan Profil</h1>
          <p className="text-muted-foreground">
            Kami tidak dapat menemukan profil staf/admin Anda. Jika Anda baru saja membuat akun ini, pastikan profil Anda sudah dibuat di database.
          </p>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">Keluar</Button>
          </form>
        </div>
      </div>
    )
  }

  // Strictly enforce that only 'admin' or 'staff' can access the dashboard
  if (profile.role !== 'admin' && profile.role !== 'staff') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses dasbor admin.</p>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">Keluar</Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <AdminShell user={profile} role={profile.role}>
      {children}
    </AdminShell>
  )
}
