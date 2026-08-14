import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'P1NTO KDS',
  description: 'Kitchen Display System',
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

  if (!profile || (profile.role !== 'admin' && profile.role !== 'kitchen')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 text-zinc-50">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl font-bold">Access Denied</h1>
          <p className="text-zinc-400">You do not have kitchen access permissions.</p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-amber-500 hover:underline">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    )
  }

  // KDS uses a dark, high-contrast theme optimized for operations
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500/30">
      {children}
    </div>
  )
}
