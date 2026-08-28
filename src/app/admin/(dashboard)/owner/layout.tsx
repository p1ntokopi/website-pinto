import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Area Owner - Pinto Admin',
}

/**
 * Server-side authorization for every owner route. Admin/staff can reach the
 * URL, but financial data is never rendered — and RLS + the RPC owner check
 * back this up at the database layer.
 */
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return (
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="rounded-sm border border-dashed border-border-custom px-6 py-16 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-muted-text/60" aria-hidden="true" />
          <h1 className="mt-3 font-display text-2xl font-bold text-ink">Akses Terbatas</h1>
          <p className="mt-1 text-sm text-muted-text">
            Halaman ini hanya tersedia untuk akun Owner.
          </p>
          <Button render={<Link href="/admin" />} variant="outline" size="sm" className="mt-6">
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
