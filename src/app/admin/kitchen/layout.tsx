import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { signOutAction } from '@/app/auth/signout/actions'

export const metadata: Metadata = {
  title: 'P1NTO KDS',
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

  if (!profile || (profile.role !== 'admin' && profile.role !== 'kitchen')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16140F] p-4 text-[#F7F5F0]">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="font-display text-2xl font-bold">Akses Ditolak</h1>
          <p className="text-[#A19B8F]">Anda tidak memiliki izin akses dapur.</p>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">Keluar</Button>
          </form>
        </div>
      </div>
    )
  }

  // KDS uses a dark, high-contrast theme optimized for operations
  return (
    <div className="min-h-screen bg-[#16140F] font-sans text-[#F7F5F0] selection:bg-[#C58B2A]/30">
      {children}
    </div>
  )
}
