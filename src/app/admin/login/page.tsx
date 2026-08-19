import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Masuk Admin - Pinto Coffee',
}

export default async function AdminLoginPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // If already logged in, redirect to admin dashboard
  if (session) {
    redirect('/admin')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--coffee)_10%,transparent),transparent_60%)]"
      />

      <Card className="relative z-10 w-full max-w-sm border-primary/20 shadow-popover">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <span className="font-display text-2xl font-bold text-primary">P</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="font-display text-2xl">Pinto Admin</CardTitle>
            <CardDescription>Masukkan kredensial Anda untuk mengakses operasional.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
