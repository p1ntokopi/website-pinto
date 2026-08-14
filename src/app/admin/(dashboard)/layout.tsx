import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { Database } from '@/types/database.types'

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
          <h1 className="font-display text-2xl font-bold text-foreground">Profile Error</h1>
          <p className="text-muted-foreground">
            We could not find your staff/admin profile. If you just created this account, ensure your profile was created in the database.
          </p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-primary hover:underline">
              Sign Out
            </button>
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
          <h1 className="font-display text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access the admin dashboard.</p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-primary hover:underline">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      <AdminSidebar role={profile.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader user={profile} />
        <main className="flex-1 overflow-x-hidden p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
